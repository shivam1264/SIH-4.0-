"""
Whisper Model Downloader with Retry Logic
Run this once to download the model before starting the server
"""
import os
import sys
import time
import socket

# Force IPv4 to avoid Windows IPv6 timeout
_orig = socket.getaddrinfo
def _ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return _orig(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4

def log(msg):
    """Safe print that works on Windows cp1252 terminal."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode('ascii', errors='replace').decode('ascii'))

def download_with_retry(model_size="small", max_retries=5):
    log(f"\n{'='*50}")
    log(f"  Downloading Whisper '{model_size}' model...")
    log(f"{'='*50}\n")

    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    os.makedirs(model_dir, exist_ok=True)
    log(f"Model will be saved to: {model_dir}\n")

    for attempt in range(1, max_retries + 1):
        try:
            log(f"[Attempt {attempt}/{max_retries}] Connecting to HuggingFace (IPv4)...")
            from faster_whisper import WhisperModel

            log(f"[Attempt {attempt}] Downloading model files (please wait 2-5 min)...")
            model = WhisperModel(
                model_size,
                device="cpu",
                compute_type="int8",
                download_root=model_dir,
            )
            log(f"\n[SUCCESS] Model '{model_size}' downloaded!")
            log(f"[OK] Saved to: {model_dir}")
            log("[OK] You can now run start_server.bat")
            return True

        except Exception as e:
            err_msg = str(e)[:200]
            log(f"\n[FAILED] Attempt {attempt}: {err_msg}")

            if "IPv4" in err_msg or "getaddrinfo" in err_msg:
                log("[INFO] Network error - will retry with delay...")

            if attempt < max_retries:
                wait = min(10 * attempt, 30)
                log(f"[WAIT] Retrying in {wait} seconds...")
                time.sleep(wait)
            else:
                log(f"\n[ERROR] All {max_retries} attempts failed.")
                log("\nManual fix options:")
                log("  1. Check internet connection")
                log("  2. Disable VPN if active")
                log("  3. Try smaller model: python download_model.py tiny")
                log("  4. Manual download from:")
                log("     https://huggingface.co/Systran/faster-whisper-small/tree/main")
                return False


if __name__ == "__main__":
    size = sys.argv[1] if len(sys.argv) > 1 else "small"
    success = download_with_retry(size)
    sys.exit(0 if success else 1)
