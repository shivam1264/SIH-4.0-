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
# Use 'base' by default for 3x faster CPU execution (~1.2s vs ~5.5s)
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
logger.info(f"Loading Whisper model: '{MODEL_SIZE}' (local cache: {MODEL_DIR}) ...")
model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type="int8",
    download_root=MODEL_DIR,   # ← cache locally, no re-download on restart
)
logger.info(f"✅ Whisper '{MODEL_SIZE}' model loaded and ready!")


# ── Voice Command Context Prompt ────────────────────────────────────
# Concise domain prompt guides Whisper without causing token repetition
INITIAL_PROMPT = (
    "Open mock test, start exam, dashboard, practice drills, results, performance, settings. "
    "Next question, previous question, read question, repeat question, flag question. "
    "Select option A, option B, option C, option D, change my answer to B, clear answer. "
    "Submit exam, confirm, yes, cancel, no, agla sawal, pichla sawal, sawal padho."
)

SAMPLE_RATE     = 16000
MIN_SAMPLES     = int(SAMPLE_RATE * 0.25)  # 0.25s minimum for rapid commands like 'yes', 'no', 'B'


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """
    Safely adjust gain so quiet speech is boosted without amplifying noise floor or distorting.
    Caps multiplier to 2.5x max to avoid square-wave clipping and noise floor amplification.
    """
    peak = np.max(np.abs(audio))
    if peak < 0.030:
        # Near silence or pure background noise — do not amplify
        return audio
    # Bring speech cleanly to optimal ~0.80 level with capped multiplier
    gain = min(0.80 / peak, 2.5)
    return audio * gain


def transcribe_pcm(pcm_bytes: bytes) -> str:
    """
    Convert raw Int16 PCM → float32 → Whisper transcript.
    Ultra-fast greedy decoding without server-side VAD filtering (client already handled VAD).
    """
    import time
    t0 = time.time()
    try:
        int16 = np.frombuffer(pcm_bytes, dtype=np.int16)
        if len(int16) < MIN_SAMPLES:
            return ""

        # Float32 in [-1, 1]
        audio = int16.astype(np.float32) / 32768.0

        # Safe dynamic gain normalization
        audio = normalize_audio(audio)

        # ── Whisper transcription ──────────────────────────────────
        # beam_size=1 (greedy) is 4-5x faster on CPU than beam_size=5
        # vad_filter=False avoids "ValueError: max() arg is an empty sequence" on short words
        segments, info = model.transcribe(
            audio,
            language="en",                  # English default with initial_prompt domain guidance
            task="transcribe",
            initial_prompt=INITIAL_PROMPT,  # guides Whisper to expected exam vocabulary
            beam_size=1,                    # ultra-fast greedy decoding
            best_of=1,
            temperature=0.0,
            repetition_penalty=1.2,          # prevent repetitive token loops in background noise
            condition_on_previous_text=False, # prevent hallucinations from previous turn
            no_speech_threshold=0.6,
            log_prob_threshold=-1.0,
            compression_ratio_threshold=2.2,
            vad_filter=False,               # Client VAD already handled segmentation; prevents empty-sequence crashes
        )

        try:
            text = " ".join(seg.text for seg in segments).strip()
        except (ValueError, TypeError):
            return ""

        # Post-process: clean up common Whisper artifacts in noisy transcripts
        text = _clean_transcript(text)

        elapsed = time.time() - t0
        if text:
            logger.info(f"[Whisper] ({elapsed:.2f}s) → '{text}'")
        return text

    except Exception as exc:
        logger.error(f"Transcription error: {exc}")
        return ""


def _clean_transcript(text: str) -> str:
    """Remove Whisper hallucination patterns common in noisy environments."""
    if not text:
        return ""

    import re

    # If any word repeats 3 or more times consecutively (noise hallucination e.g. "test test test")
    if re.search(r'\b(\w+)(?:[\s,]+\1){2,}\b', text, flags=re.IGNORECASE):
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
