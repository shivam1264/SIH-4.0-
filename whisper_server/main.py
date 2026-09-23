"""
Whisper Voice Recognition Server — High-Accuracy Hindi + Hinglish Edition
SIGHT-EXAM AI Accessibility Platform
FastAPI + faster-whisper + WebSocket + Deterministic Command Parser
"""

import asyncio
import base64
import io
import json
import logging
import os
import re
import socket
import time
import wave
from typing import Dict, Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
from faster_whisper import WhisperModel

from dotenv import load_dotenv

# Load environment configurations
load_dotenv()

# ── Force IPv4 to prevent Windows IPv6 timeout on HuggingFace download ──
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_only

# Store downloaded model locally
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ── Automatically locate and register NVIDIA CUDA/cuBLAS/cuDNN DLLs on Windows ──
import sys
try:
    site_pkg_nvidia = os.path.abspath(os.path.join(os.path.dirname(sys.executable), '..', 'Lib', 'site-packages', 'nvidia'))
    if os.path.exists(site_pkg_nvidia):
        for root, dirs, files in os.walk(site_pkg_nvidia):
            if any(f.endswith('.dll') for f in files):
                try:
                    os.add_dll_directory(os.path.abspath(root))
                except Exception:
                    pass
                os.environ['PATH'] = os.path.abspath(root) + os.path.pathsep + os.environ.get('PATH', '')
except Exception:
    pass


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("whisper_server")

app = FastAPI(title="SIGHT-EXAM Whisper Voice Recognition Server — Hindi + Hinglish")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── GPU / CUDA Auto-detection & Adaptive Hardware Configuration ──
has_cuda = False
try:
    import ctranslate2
    has_cuda = ctranslate2.get_cuda_device_count() > 0
except Exception as e:
    logger.debug(f"CUDA detection notice: {e}")

requested_device = os.environ.get("WHISPER_DEVICE", "").strip().lower()
if requested_device == "cuda" and has_cuda:
    DEVICE = "cuda"
    logger.info("⚡ NVIDIA GPU detected! Activating CUDA acceleration.")
elif has_cuda and not requested_device:
    DEVICE = "cuda"
    logger.info("⚡ NVIDIA GPU detected! Activating CUDA acceleration.")
else:
    DEVICE = "cpu"
    if requested_device == "cuda" and not has_cuda:
        logger.warning("⚠️ CUDA requested in .env but no compatible NVIDIA GPU detected on this system. Safely falling back to CPU mode.")

# Model selection with Friend-Laptop protection (CPU / low storage)
requested_model = os.environ.get("WHISPER_MODEL", "small").strip()
if DEVICE == "cpu" and requested_model in ["large", "large-v1", "large-v2", "large-v3"]:
    large_cache = os.path.join(MODEL_DIR, f"models--Systran--faster-whisper-{requested_model}")
    if not os.path.exists(large_cache):
        logger.info(f"💡 CPU-only laptop detected. Automatically selecting 'small' model (244 MB) optimized for friend's CPU execution.")
        MODEL_SIZE = "small"
    else:
        MODEL_SIZE = requested_model
else:
    MODEL_SIZE = requested_model

if DEVICE == "cuda":
    COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8_float16").strip()
else:
    COMPUTE_TYPE = "int8"  # int8 provides 3x faster inference and ultra-low RAM usage on CPU

BEAM_SIZE = int(os.environ.get("WHISPER_BEAM_SIZE", "3"))

logger.info(f"Loading faster-whisper '{MODEL_SIZE}' (device={DEVICE}, compute_type={COMPUTE_TYPE}, beam_size={BEAM_SIZE}, cache={MODEL_DIR})...")
model = WhisperModel(
    MODEL_SIZE,
    device=DEVICE,
    compute_type=COMPUTE_TYPE,
    download_root=MODEL_DIR,
)
logger.info(f"✅ Whisper '{MODEL_SIZE}' model successfully loaded and ready for Hindi + Hinglish!")

# ── Bilingual Domain Prompt (Concise to prevent decoder hallucination) ──
INITIAL_PROMPT = (
    "SIGHT-EXAM AI voice examination and practice assistant. Candidate speech commands in English, Hindi, and Hinglish. "
    "Option A, Option B, Option C, Option D, "
    "ऑप्शन ए, ऑप्शन बी, ऑप्शन सी, ऑप्शन डी, पहला ऑप्शन, दूसरा ऑप्शन, तीसरा ऑप्शन, चौथा ऑप्शन, "
    "Next question, Previous question, agla sawal, pichla sawal, अगला सवाल, पिछला सवाल, "
    "Submit exam, confirm submit, cancel submit, सबमिट करो, जमा करो, हाँ, नहीं, Yes, No, Cancel, "
    "Read question, repeat question, time remaining, kitna samay bacha hai, clear answer, flag question, "
    "Dashboard, Practice, Mock Tests, Results, Settings, formula, diagram, Drishti."
)

SAMPLE_RATE = 16000
MIN_SAMPLES = int(SAMPLE_RATE * 0.18)  # 0.18s minimum to capture quick short commands like 'B', 'C', 'no', 'yes'


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """
    Safely adjust gain so speech is normalized to ~0.88 peak without amplifying ambient noise floor.
    """
    if len(audio) == 0:
        return audio
    peak = float(np.max(np.abs(audio)))
    rms = float(np.sqrt(np.mean(audio ** 2)))
    if peak < 0.015 or rms < 0.0035:
        # Near zero ambient noise floor: do NOT amplify!
        return audio
    gain = min(0.88 / max(peak, 0.001), 3.5)
    return audio * gain


# ── Deterministic Exam Command Parser ──────────────────────────────

HINDI_DIGITS = {
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
    'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
    'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
    'pehla': 1, 'dusra': 2, 'doosra': 2, 'teesra': 3, 'tisra': 3,
    'chautha': 4, 'paanch': 5, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'gyarah': 11, 'barah': 12
}

def parse_exam_command(raw_transcript: str) -> Dict[str, Any]:
    """
    Deterministic rule-based exam command parser.
    Converts Hindi, Hinglish, and English voice transcriptions into structured exam actions.
    Does NOT require calling an LLM.
    """
    if not raw_transcript:
        return {"action": "UNKNOWN", "targetOption": None, "questionNumber": None, "confidence": 0.0}

    t = raw_transcript.strip().lower()
    # Normalize punctuation
    t_clean = re.sub(r"['`]", "", t)
    t_clean = re.sub(r"[.!?;:\-_\"~|।/\\()]", " ", t_clean)
    t_clean = re.sub(r"\s+", " ", t_clean).strip()

    # 1. NEXT QUESTION
    # e.g., "next question", "agla question kholo", "अगला प्रश्न खोलो", "अगला सवाल", "aage badho"
    if re.search(
        r"\b(next\s+question|agla\s+question|agla\s+sawal|agla\s+prashna|next\s+sawal|aage\s+badho|aage\s+chalo|aage\s+jao|skip\s+question)\b",
        t_clean,
        re.I
    ) or re.search(r"(अगला\s*(प्रश्न|सवाल|क्वेश्चन)?|आगे\s*(बढ़ो|चलो|जाओ))", raw_transcript):
        if not re.search(r"\b(option|vikalp|विकल्प|[abcd])\b", t_clean, re.I):
            return {
                "action": "NEXT_QUESTION",
                "targetOption": None,
                "questionNumber": None,
                "confidence": 0.96,
                "label": "Next Question"
            }

    # 2. PREVIOUS QUESTION
    # e.g., "pichla question", "पिछला प्रश्न खोलो", "previous question", "pichla sawal", "piche jao"
    if re.search(
        r"\b(previous\s+question|pichla\s+question|pichla\s+sawal|pichla\s+prashna|prev\s+question|peeche\s+jao|piche\s+chalo|piche\s+aao|pick\s+the\s+question)\b",
        t_clean,
        re.I
    ) or re.search(r"(पिछला\s*(प्रश्न|सवाल|क्वेश्चन)?|पीछे\s*(जाओ|चलो|आओ))", raw_transcript):
        if not re.search(r"\b(option|vikalp|विकल्प|[abcd])\b", t_clean, re.I):
            return {
                "action": "PREVIOUS_QUESTION",
                "targetOption": None,
                "questionNumber": None,
                "confidence": 0.96,
                "label": "Previous Question"
            }

    # 3. SELECT OPTION (A, B, C, D)
    # e.g., "option B select karo", "option C choose karo", "option B tick karo", "chautha option chuno", "B wala"
    opt_match = None

    # First check Hindi/English ordinals explicitly
    if re.search(r"\b(pehla|pahla|first|पहला)\b", t_clean, re.I):
        opt_match = 'A'
    elif re.search(r"\b(dusra|doosra|second|दूसरा)\b", t_clean, re.I):
        opt_match = 'B'
    elif re.search(r"\b(teesra|tisra|third|तीसरा)\b", t_clean, re.I):
        opt_match = 'C'
    elif re.search(r"\b(chautha|fourth|चौथा)\b", t_clean, re.I):
        opt_match = 'D'

    if not opt_match:
        opt_sub = re.search(r"\b(?:option|opt|विकल्प|ऑप्शन)\s*([a-d1-4]|ए|बी|सी|डी|bee|see|dee)\b", t_clean, re.I) or \
                  re.search(r"\b([a-d1-4]|ए|बी|सी|डी|bee|see|dee)\s*(?:option|opt|विकल्प|ऑप्शन)\b", t_clean, re.I) or \
                  re.search(r"\b(?:select|choose|pick|chuno|lagao|tick)\s*(?:option\s*)?([a-d1-4]|ए|बी|सी|डी|bee|see|dee)\b", t_clean, re.I) or \
                  re.search(r"\b([a-d]|bee|see|dee)\s*(?:select|choose|tick|karo|chuno|lagao|dabao|wala)\b", t_clean, re.I)

        if opt_sub:
            raw_opt = opt_sub.group(1).lower()
            if raw_opt in ['a', '1', 'ए']: opt_match = 'A'
            elif raw_opt in ['b', '2', 'बी', 'bee', 'be']: opt_match = 'B'
            elif raw_opt in ['c', '3', 'सी', 'see', 'sea', 'si']: opt_match = 'C'
            elif raw_opt in ['d', '4', 'डी', 'dee', 'di']: opt_match = 'D'

    # Direct bare option check (e.g., "option b", "option c")
    if not opt_match:
        bare_opt = re.search(r"^option\s*([a-d])$", t_clean, re.I)
        if bare_opt:
            opt_match = bare_opt.group(1).upper()

    if opt_match:
        return {
            "action": "SELECT_OPTION",
            "targetOption": opt_match,
            "questionNumber": None,
            "confidence": 0.98,
            "label": f"Option {opt_match}"
        }


    # 4. GO TO QUESTION NUMBER
    # e.g., "question number 5 par jao", "question number 12 par jao", "sawal number 7", "प्रश्न संख्या 5"
    q_num_match = re.search(r"\b(?:question|sawal|prashna|q|number|no)\s*(?:number|no\.?)?\s*(\d+)\b", t_clean, re.I) or \
                  re.search(r"(?:प्रश्न|सवाल)\s*(?:संख्या|नंबर)?\s*(\d+)", raw_transcript)
    if q_num_match:
        num = int(q_num_match.group(1))
        if 1 <= num <= 200:
            return {
                "action": "GO_TO_QUESTION",
                "targetOption": None,
                "questionNumber": num,
                "confidence": 0.97,
                "label": f"Go to Question {num}"
            }

    # Check written Hindi number words
    for word, num in HINDI_DIGITS.items():
        if re.search(rf"\b(?:question|sawal|prashna|प्रश्न|सवाल)\s*(?:number|no|संख्या)?\s*{word}\b", t_clean, re.I):
            return {
                "action": "GO_TO_QUESTION",
                "targetOption": None,
                "questionNumber": num,
                "confidence": 0.95,
                "label": f"Go to Question {num}"
            }

    # 5. REPEAT QUESTION
    # e.g., "question repeat karo", "sawal repeat karo", "dobara padho", "phir se padho", "प्रश्न दोहराएं"
    if re.search(r"\b(repeat\s+(?:the\s+)?question|question\s+repeat|sawal\s+repeat|dobara\s+padho|phir\s+se\s+padho|repeat\s+karo)\b", t_clean, re.I) or \
       re.search(r"(दोबारा\s*(पढ़ो|सुनाओ|बोलो)|फिर\s*से\s*(पढ़ो|सुनाओ)|प्रश्न\s*दोहरा)", raw_transcript):
        return {
            "action": "REPEAT_QUESTION",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.96,
            "label": "Repeat Question"
        }

    # 6. READ QUESTION
    # e.g., "question padh ke sunao", "question padho", "sawal padho", "read question", "read the question", "प्रश्न पढ़ो"
    if re.search(r"\b(read\s+(?:the\s+)?question|question\s+padh\s*(?:ke\s*)?sunao|question\s+padho|sawal\s+padho|sawal\s+sunao|padh\s+ke\s+sunao)\b", t_clean, re.I) or \
       re.search(r"(प्रश्न\s*(पढ़ो|सुनाओ|पढ़कर\s*सुनाओ)|सवाल\s*(पढ़ो|सुनाओ))", raw_transcript):
        return {
            "action": "READ_QUESTION",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.96,
            "label": "Read Question"
        }

    # 7. SUBMIT EXAM (Requires Confirmation for Safety)
    # e.g., "answer submit karo", "exam submit karo", "paper jama karo", "submit the exam"
    if re.search(r"\b(submit\s+(?:the\s+)?(?:exam|test|paper|answer)|answer\s+submit|exam\s+submit|paper\s+jama|jama\s+karo|finish\s+exam)\b", t_clean, re.I) or \
       re.search(r"(सबमिट\s*(करो|कर\s*दो)|जमा\s*करो|परीक्षा\s*समाप्त)", raw_transcript):
        return {
            "action": "SUBMIT_EXAM",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "requiresConfirmation": True,
            "label": "Submit Exam"
        }

    # 8. START EXAM
    # e.g., "start exam", "exam shuru karo", "test start karo", "shuru karo exam"
    if re.search(r"\b(start\s+(?:the\s+)?(?:mock\s+)?(?:exam|test)|(?:exam|test|mock)\s+shuru(?:\s*karo)?|shuru\s+karo\s+(?:exam|test|pariksha))\b", t_clean, re.I) or \
       re.search(r"(परीक्षा\s*शुरू|टेस्ट\s*शुरू)", raw_transcript):
        return {
            "action": "START_EXAM",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.96,
            "label": "Start Exam"
        }

    # 9. PAUSE EXAM
    # e.g., "pause exam", "exam roko", "pause test"
    if re.search(r"\b(pause\s+(?:the\s+)?(?:exam|test)|exam\s+roko|test\s+roko)\b", t_clean, re.I) or \
       re.search(r"(परीक्षा\s*रोको|टेस्ट\s*रोको)", raw_transcript):
        return {
            "action": "PAUSE_EXAM",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.95,
            "label": "Pause Exam"
        }

    # 10. SCROLL DOWN
    if re.search(r"\b(scroll\s+down|neeche\s+scroll|niche\s+scroll|scroll\s+neeche|scroll\s+niche|page\s+down|neeche\s+jao|niche\s+jao|neeche\s+karo|niche\s+karo|नीचे\s*स्क्रॉल|नीचे\s*करो|नीचे\s*जाओ)\b", t_clean, re.I) or \
       re.search(r"(नीचे\s*स्क्रॉल|नीचे\s*करो|नीचे\s*जाओ)", raw_transcript):
        return {
            "action": "SCROLL_DOWN",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Scroll Down"
        }

    # 11. SCROLL UP
    if re.search(r"\b(scroll\s+up|upar\s+scroll|oopar\s+scroll|scroll\s+upar|scroll\s+oopar|page\s+up|upar\s+jao|oopar\s+jao|upar\s+karo|oopar\s+karo|ऊपर\s*स्क्रॉल|ऊपर\s*करो|ऊपर\s*जाओ)\b", t_clean, re.I) or \
       re.search(r"(ऊपर\s*स्क्रॉल|ऊपर\s*करो|ऊपर\s*जाओ)", raw_transcript):
        return {
            "action": "SCROLL_UP",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Scroll Up"
        }

    # 12. SCROLL TO TOP / BOTTOM
    if re.search(r"\b(scroll\s+to\s+top|go\s+to\s+top|top\s+par\s+jao|top\s+par|sabse\s+upar|सबसे\s*ऊपर|टॉप\s*पर)\b", t_clean, re.I):
        return {
            "action": "SCROLL_TOP",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Scroll to Top"
        }
    if re.search(r"\b(scroll\s+to\s+bottom|go\s+to\s+bottom|bottom\s+par\s+jao|bottom\s+par|sabse\s+neeche|sabse\s+niche|सबसे\s*नीचे|बॉटम\s*पर)\b", t_clean, re.I):
        return {
            "action": "SCROLL_BOTTOM",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Scroll to Bottom"
        }

    # 13. AUTO SCROLL START / STOP
    if re.search(r"\b(start\s+auto\s*scroll|auto\s*scroll\s+shuru|ऑटो\s*स्क्रॉल)\b", t_clean, re.I) and not re.search(r"\b(stop|roko|band)\b", t_clean, re.I):
        return {
            "action": "AUTO_SCROLL_START",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Auto Scroll Start"
        }
    if re.search(r"\b(stop\s+auto\s*scroll|stop\s+scroll|scroll\s+roko|scroll\s+band|ऑटो\s*स्क्रॉल\s*बंद)\b", t_clean, re.I):
        return {
            "action": "AUTO_SCROLL_STOP",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Auto Scroll Stop"
        }

    # 14. STOP SPEAKING / READING
    if re.search(r"^(?:stop|ruko|ruk\s*jao|chup|pause|cancel|shant|quiet|रुको|रुक\s*जाओ|चुप|शांत)$", t_clean, re.I) or \
       re.search(r"\b(stop\s+speaking|stop\s+reading|chup\s+ho\s+jao|chup\s+raho|shant\s+ho\s+jao|stop\s+audio)\b", t_clean, re.I):
        return {
            "action": "STOP_SPEAKING",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Stop Speaking"
        }

    # 15. READ NOTIFICATIONS
    if re.search(r"\b(read\s+(?:the\s+|all\s+|my\s+|unread\s+|latest\s+)?notifications?|read\s+notification\s+box|read\s+(?:the\s+)?notifications?\s+in\s+(?:the\s+)?(?:notification\s+)?box|notifications?\s+padho|notifications?\s+sunao|notifications?\s+batao|box\s+(?:me|ke)\s+notifications?\s+padho|नोटिफिकेशन\s*(?:पढ़ो|सुनाओ|बताओ))\b", t_clean, re.I):
        notif_idx = None
        idx_match = re.search(r"\b(?:notification\s+(\d+)|(?:first|1st|pehla|ek)\s+notification)\b", t_clean, re.I)
        if idx_match:
            if idx_match.group(1):
                notif_idx = int(idx_match.group(1))
            else:
                notif_idx = 1
        elif re.search(r"\b(?:second|2nd|dusra|do)\s+notification\b", t_clean, re.I):
            notif_idx = 2
        return {
            "action": "READ_NOTIFICATIONS",
            "targetOption": None,
            "questionNumber": None,
            "notificationIndex": notif_idx,
            "confidence": 0.98,
            "label": "Read Notifications"
        }

    # 16. OPEN NOTIFICATIONS
    if re.search(r"\b(open\s+(?:the\s+|my\s+)?notifications?|open\s+notification\s+box|show\s+(?:the\s+|my\s+)?notifications?|view\s+(?:the\s+|my\s+)?notifications?|check\s+(?:the\s+|my\s+)?notifications?|notifications?\s+kholo|notification\s+box|नोटिफिकेशन\s*खोलो)\b", t_clean, re.I) or \
       re.match(r"^(?:notifications?|notification\s+box)$", t_clean, re.I):
        return {
            "action": "OPEN_NOTIFICATIONS",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Open Notifications"
        }

    # 17. CLOSE NOTIFICATIONS
    if re.search(r"\b(close\s+(?:the\s+|my\s+)?notifications?|close\s+notification\s+box|hide\s+(?:the\s+|my\s+)?notifications?|notifications?\s+band\s+karo|नोटिफिकेशन\s*बंद\s*करो)\b", t_clean, re.I):
        return {
            "action": "CLOSE_NOTIFICATIONS",
            "targetOption": None,
            "questionNumber": None,
            "confidence": 0.98,
            "label": "Close Notifications"
        }

    return {
        "action": "UNKNOWN",
        "targetOption": None,
        "questionNumber": None,
        "confidence": 0.0,
        "label": raw_transcript
    }


def transcribe_pcm(pcm_bytes: bytes) -> Dict[str, Any]:
    """
    Convert raw Int16 PCM → float32 → faster-whisper transcript + parsed command.
    """
    t0 = time.time()
    try:
        int16 = np.frombuffer(pcm_bytes, dtype=np.int16)
        if len(int16) < MIN_SAMPLES:
            return {"transcript": "", "command": None}

        # Float32 in [-1, 1]
        audio = int16.astype(np.float32) / 32768.0

        # Pre-ASR RMS energy gate: drop ambient noise floor / breathing immediately
        rms = float(np.sqrt(np.mean(audio ** 2)))
        peak = float(np.max(np.abs(audio)))
        if rms < 0.0035 or peak < 0.015:
            return {"transcript": "", "command": None}

        # Gain normalization with weak-signal protection
        audio = normalize_audio(audio)

        # ── Whisper Transcription with VAD & Bilingual Prompt ─────
        # Adaptive thresholds: short utterances (< 1.5s) get relaxed logprob to catch quick single-word commands
        is_short_utterance = len(audio) < int(SAMPLE_RATE * 1.5)
        max_no_speech = 0.70 if is_short_utterance else 0.55
        min_avg_logprob = -1.45 if is_short_utterance else -1.15

        try:
            segments, info = model.transcribe(
                audio,
                language=None,
                task="transcribe",
                initial_prompt=INITIAL_PROMPT,
                beam_size=BEAM_SIZE,
                best_of=BEAM_SIZE,
                temperature=0.0,
                repetition_penalty=1.15,
                condition_on_previous_text=False,
                no_speech_threshold=0.55,
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=250,
                    speech_pad_ms=200,
                )
            )

            valid_segments = []
            for seg in segments:
                # Reject noise / low confidence hallucinations
                if getattr(seg, 'no_speech_prob', 0) > max_no_speech:
                    continue
                if getattr(seg, 'avg_logprob', 0) < min_avg_logprob:
                    continue
                if seg.text and seg.text.strip():
                    valid_segments.append(seg.text.strip())

            # Related Indian regional languages (Hindi, Urdu, Marathi, etc.) are treated as valid bilingual speech
            bilingual_valid_languages = {'en', 'hi', 'ur', 'mr', 'ne', 'pa', 'gu', 'bn'}
            if info.language not in bilingual_valid_languages:
                logger.info(f"[Whisper] Detected unsupported foreign language '{info.language}'. Re-transcribing in bilingual mode...")
                segments, info = model.transcribe(
                    audio,
                    language='en',
                    task="transcribe",
                    initial_prompt=INITIAL_PROMPT,
                    beam_size=BEAM_SIZE,
                    temperature=0.0,
                    condition_on_previous_text=False,
                    vad_filter=True,
                    vad_parameters=dict(
                        min_silence_duration_ms=250,
                        speech_pad_ms=200,
                    )
                )
                valid_segments = []
                for seg in segments:
                    if getattr(seg, 'no_speech_prob', 0) > max_no_speech or getattr(seg, 'avg_logprob', 0) < min_avg_logprob:
                        continue
                    if seg.text and seg.text.strip():
                        valid_segments.append(seg.text.strip())

            text = " ".join(valid_segments).strip()
        except (ValueError, TypeError):
            # VAD filtered all audio (silence / ambient noise)
            return {"transcript": "", "command": None}

        text = _clean_transcript(text)
        elapsed = time.time() - t0

        if not text:
            return {"transcript": "", "command": None}

        # Deterministic Exam Command Classification
        cmd = parse_exam_command(text)

        logger.info(f"[Whisper] ({elapsed:.2f}s, lang={info.language}:{info.language_probability:.2f}) → '{text}' [Action: {cmd.get('action')}]")
        return {"transcript": text, "command": cmd}

    except Exception as exc:
        logger.error(f"Transcription error: {exc}", exc_info=True)
        return {"transcript": "", "command": None}


def _clean_transcript(text: str) -> str:
    """Filter out common Whisper silence/noise hallucinations."""
    if not text:
        return ""

    low = text.lower().strip()

    # Reject single characters or standalone punctuation
    if len(low) <= 1 or re.match(r'^[.,!?;:\-_~।\s]+$', low):
        return ""

    # Repeated token artifacts (e.g. "you you you", "ha ha ha")
    if re.search(r'\b(\w+)(?:[\s,]+\1){2,}\b', text, flags=re.IGNORECASE):
        return ""

    noise_phrases = [
        "thank you", "thanks for watching", "subscribe", "like and subscribe",
        "www.", ".com", "subtitles by", "transcribed by", "[music]", "[applause]",
        "♪", "[ music ]", "[ silence ]", "amara.org", "opensubtitles",
        "bye", "bye bye", "goodbye", "you", "so", "yeah", "oh", "um", "uh",
        "धन्यवाद", "बहुत बहुत धन्यवाद", "देखने के लिए धन्यवाद", "कृपया सब्सक्राइब करें",
        "लाइक करें", "सब्सक्राइब करें", "अलविदा", "नमस्ते"
    ]
    for phrase in noise_phrases:
        if low == phrase or low.startswith(phrase + " ") or low.endswith(" " + phrase):
            return ""

    return text.strip()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "compute_type": COMPUTE_TYPE,
        "beam_size": BEAM_SIZE
    }


def extract_pcm_from_audio_bytes(data: bytes) -> bytes:
    """Extract raw Int16 PCM bytes from WAV, WebM, or raw PCM payload."""
    if not data:
        return b""
    if data.startswith(b"RIFF") and len(data) > 44:
        try:
            with wave.open(io.BytesIO(data), "rb") as wf:
                frames = wf.readframes(wf.getnframes())
                channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                if channels == 1 and sampwidth == 2:
                    return frames
                if sampwidth == 2:
                    arr = np.frombuffer(frames, dtype=np.int16)
                    if channels > 1:
                        arr = arr.reshape(-1, channels).mean(axis=1).astype(np.int16)
                    return arr.tobytes()
        except Exception as e:
            logger.debug(f"Wave parse fallback: {e}")
            return data[44:]
    return data


@app.post("/transcribe")
async def transcribe_endpoint(request: Request):
    """
    HTTP POST endpoint for failover and single-utterance speech-to-text.
    Accepts:
      - Multipart form-data with file='...'
      - Raw audio binary in request body (WAV or Int16 PCM)
      - JSON body { "audio": "<base64_encoded_pcm_or_wav>" }
    Returns standardized failover response:
      {
         "success": True,
         "text": "agla question kholo",
         "provider": "local",
         "command": { "action": "NEXT_QUESTION", ... },
         "model": MODEL_SIZE,
         "device": DEVICE
      }
    """
    try:
        content_type = request.headers.get("content-type", "").lower()
        audio_bytes = b""

        if "multipart/form-data" in content_type:
            form = await request.form()
            for key in ["file", "audio"]:
                if key in form:
                    upload = form[key]
                    if hasattr(upload, "read"):
                        audio_bytes = await upload.read()
                        break
        elif "application/json" in content_type:
            body = await request.json()
            b64 = body.get("audio") or body.get("file") or ""
            if b64:
                if "," in b64:
                    b64 = b64.split(",", 1)[1]
                audio_bytes = base64.b64decode(b64)
        else:
            audio_bytes = await request.body()

        if not audio_bytes:
            return JSONResponse(
                status_code=400,
                content={"success": False, "text": "", "provider": "local", "error": "No audio data received"}
            )

        pcm_bytes = extract_pcm_from_audio_bytes(audio_bytes)
        result = await asyncio.get_event_loop().run_in_executor(
            None, transcribe_pcm, pcm_bytes
        )

        transcript = result.get("transcript", "").strip()
        command = result.get("command")

        logger.info(f"[STT] Provider: Local faster-whisper | Status: SUCCESS | Transcript: '{transcript}'")
        return {
            "success": True,
            "text": transcript,
            "provider": "local",
            "command": command,
            "model": MODEL_SIZE,
            "device": DEVICE
        }
    except Exception as exc:
        logger.error(f"[STT] Local faster-whisper error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "text": "", "provider": "local", "error": str(exc)}
        )



@app.websocket("/ws/voice")
async def voice_websocket(ws: WebSocket):
    """
    WebSocket endpoint for real-time high-accuracy Hindi + Hinglish voice recognition.
    Receives: Raw Int16 PCM audio at 16kHz mono.
    Sends:    JSON { "transcript": "...", "command": { "action": "...", ... } }
    """
    await ws.accept()
    logger.info("🎙️ Client connected to Whisper voice WebSocket")

    pcm_buffer = bytearray()
    max_safety_bytes = int(SAMPLE_RATE * 8.0 * 2)

    try:
        while True:
            try:
                data = await asyncio.wait_for(ws.receive(), timeout=30.0)
            except asyncio.TimeoutError:
                continue

            if "bytes" in data and data["bytes"]:
                pcm_buffer.extend(data["bytes"])

                if len(pcm_buffer) >= max_safety_bytes:
                    buf_copy = bytes(pcm_buffer)
                    pcm_buffer.clear()
                    result = await asyncio.get_event_loop().run_in_executor(
                        None, transcribe_pcm, buf_copy
                    )
                    if result.get("transcript"):
                        await ws.send_json(result)

            elif "text" in data and data.get("text"):
                cmd = data["text"].strip().upper()

                if cmd == "FLUSH" and len(pcm_buffer) >= MIN_SAMPLES * 2:
                    buf_copy = bytes(pcm_buffer)
                    pcm_buffer.clear()
                    result = await asyncio.get_event_loop().run_in_executor(
                        None, transcribe_pcm, buf_copy
                    )
                    if result.get("transcript"):
                        await ws.send_json(result)

                elif cmd == "CLEAR":
                    pcm_buffer.clear()

    except WebSocketDisconnect:
        logger.info("🔌 Client disconnected from Whisper voice WebSocket")
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("WHISPER_HOST", "0.0.0.0")
    port = int(os.environ.get("WHISPER_PORT", "8765"))
    logger.info(f"Starting SIGHT-EXAM Whisper Server on {host}:{port}...")
    uvicorn.run(app, host=host, port=port, log_level="info")
