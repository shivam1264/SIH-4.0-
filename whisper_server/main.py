"""
Whisper Voice Recognition Server — Noise-Robust Edition
Optimized for hackathon/demo environments with background noise
FastAPI + faster-whisper + WebSocket
"""

import asyncio
import logging
import os
import socket

# ── Force IPv4 to prevent Windows IPv6 timeout on HuggingFace download ──
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_only

# Store downloaded model locally (no re-download on restart)
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger("whisper_server")

app = FastAPI(title="Whisper Voice Recognition Server — Noise Robust")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Whisper Model ──────────────────────────────────────────────────
MODEL_SIZE = "small"
logger.info(f"Loading Whisper model: '{MODEL_SIZE}' (local cache: {MODEL_DIR}) ...")
model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type="int8",
    download_root=MODEL_DIR,   # ← cache locally, no re-download on restart
)
logger.info("✅ Whisper model loaded and ready!")


# ── Voice Command & Q&A Prompt ──────────────────────────────────────
# Giving Whisper context about expected commands → much higher accuracy in noise and soft speech
INITIAL_PROMPT = (
    "Start the exam, begin exam, start, shuru karo, "
    "dashboard, exams, mock test, practice, performance, "
    "profile, results, settings, score, accuracy, summary, weak topic, "
    "open ssc, open banking, open upsc, open railway, option A, option B, option C, option D, "
    "select A, select B, select C, select D, choice A, choice B, choice C, choice D, "
    "next question, previous question, submit exam, flag question, read question, repeat, cancel. "
    "Hindi: kitna score hai, kitne marks, weak topic kya hai, agla sawal, pichla sawal, "
    "pehla option, dusra option, teesra option, chautha option, uttar, shuru karo, dobara padho, "
    "madad, chup ho jao, solutions dikhao, haan, nahi, samay kitna bacha hai, khatam karo."
)

SAMPLE_RATE     = 16000
MIN_SAMPLES     = int(SAMPLE_RATE * 0.35)  # 0.35s minimum for commands like 'yes', 'option A', 'start'


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """
    Safely adjust gain so quiet speech is boosted without amplifying noise floor or distorting.
    Caps multiplier to 4.0x max to avoid square-wave clipping.
    """
    peak = np.max(np.abs(audio))
    if peak < 0.015:
        # Near silence or pure background noise — do not amplify
        return audio
    # Bring speech cleanly to optimal ~0.85 level with capped multiplier
    gain = min(0.85 / peak, 4.0)
    return audio * gain


def transcribe_pcm(pcm_bytes: bytes) -> str:
    """
    Convert raw Int16 PCM → float32 → Whisper transcript.
    Processes full utterances sent after natural speech pauses.
    """
    try:
        int16 = np.frombuffer(pcm_bytes, dtype=np.int16)
        if len(int16) < MIN_SAMPLES:
            return ""

        # Float32 in [-1, 1]
        audio = int16.astype(np.float32) / 32768.0

        # Safe dynamic gain normalization (preserves audio clarity without clipping)
        audio = normalize_audio(audio)

        # ── Whisper transcription ──────────────────────────────────
        segments, info = model.transcribe(
            audio,
            language=None,                  # auto-detect Hindi / English
            task="transcribe",
            initial_prompt=INITIAL_PROMPT,  # guides Whisper to expected exam vocabulary
            beam_size=5,                    # beam search for highest accuracy
            best_of=5,                      # evaluate top 5 candidates
            temperature=0.0,                # deterministic, greedy best decoding
            condition_on_previous_text=False, # prevent hallucinations from previous turn
            no_speech_threshold=0.6,
            log_prob_threshold=-1.0,
            compression_ratio_threshold=2.4,
            vad_filter=True,                # Neural Silero VAD trims leading/trailing silence
            vad_parameters=dict(
                threshold=0.35,             # balanced speech sensitivity
                min_speech_duration_ms=100,
                min_silence_duration_ms=200,
                speech_pad_ms=300,
                max_speech_duration_s=15,
            ),
        )

        try:
            text = " ".join(seg.text for seg in segments).strip()
        except (ValueError, TypeError):
            return ""

        # Post-process: clean up common Whisper artifacts in noisy transcripts
        text = _clean_transcript(text)

        if text:
            logger.info(f"[Whisper] lang={info.language} → '{text}'")
        return text

    except Exception as exc:
        logger.error(f"Transcription error: {exc}")
        return ""


def _clean_transcript(text: str) -> str:
    """Remove Whisper hallucination patterns common in noisy environments."""
    if not text:
        return ""

    # Whisper often hallucinates these in noise/silence
    noise_phrases = [
        "thank you", "thanks for watching", "subscribe", "like and subscribe",
        "www.", ".com", "subtitles by", "transcribed by", "[music]", "[applause]",
        "♪", "[ music ]", "[ silence ]",
    ]

    low = text.lower()
    for phrase in noise_phrases:
        if phrase in low:
            return ""

    # Too short (likely noise artifact)
    if len(text.strip()) < 1:
        return ""

    return text.strip()


@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE}


@app.websocket("/ws/voice")
async def voice_websocket(ws: WebSocket):
    """
    WebSocket endpoint for real-time noise-robust voice recognition.

    Receives: Raw Int16 PCM at 16kHz mono (from browser ScriptProcessorNode)
    Sends:    JSON { "transcript": "..." }
    """
    await ws.accept()
    logger.info("🎙️  Client connected")

    pcm_buffer = bytearray()
    # Safety cap: only force transcribe if continuous audio exceeds 8 seconds without pause
    max_safety_bytes = int(SAMPLE_RATE * 8.0 * 2)

    try:
        while True:
            try:
                data = await asyncio.wait_for(ws.receive(), timeout=30.0)
            except asyncio.TimeoutError:
                continue

            if "bytes" in data and data["bytes"]:
                pcm_buffer.extend(data["bytes"])

                # Only auto-flush if continuous speaking reaches safety limit (8s)
                if len(pcm_buffer) >= max_safety_bytes:
                    buf_copy = bytes(pcm_buffer)
                    pcm_buffer.clear()

                    transcript = await asyncio.get_event_loop().run_in_executor(
                        None, transcribe_pcm, buf_copy
                    )
                    if transcript:
                        await ws.send_json({"transcript": transcript})

            elif "text" in data and data.get("text"):
                cmd = data["text"].strip().upper()

                # FLUSH is sent by client VAD when user pauses speaking (natural sentence boundary)
                if cmd == "FLUSH" and len(pcm_buffer) >= MIN_SAMPLES * 2:
                    buf_copy = bytes(pcm_buffer)
                    pcm_buffer.clear()
                    transcript = await asyncio.get_event_loop().run_in_executor(
                        None, transcribe_pcm, buf_copy
                    )
                    if transcript:
                        await ws.send_json({"transcript": transcript})

                elif cmd == "CLEAR":
                    pcm_buffer.clear()

    except WebSocketDisconnect:
        logger.info("🔌  Client disconnected")
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="info")
