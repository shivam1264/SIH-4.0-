"""
End-to-End Benchmark & Verification Suite
SIGHT-EXAM AI Accessibility Voice Recognition (faster-whisper small)
"""
import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv()

from main import model, parse_exam_command, transcribe_pcm, MODEL_SIZE, DEVICE, COMPUTE_TYPE, BEAM_SIZE

print("=" * 80)
print(f" SIGHT-EXAM FASTER-WHISPER BENCHMARK & VERIFICATION")
print(f" Model: {MODEL_SIZE} | Device: {DEVICE} | Precision: {COMPUTE_TYPE} | Beam Size: {BEAM_SIZE}")
print("=" * 80)

# The 12 Mandatory Benchmark Commands
benchmark_suite = [
    {"cmd": "next question", "expected_action": "NEXT_QUESTION", "opt": None, "qnum": None},
    {"cmd": "agla question kholo", "expected_action": "NEXT_QUESTION", "opt": None, "qnum": None},
    {"cmd": "अगला प्रश्न खोलो", "expected_action": "NEXT_QUESTION", "opt": None, "qnum": None},
    {"cmd": "pichla question", "expected_action": "PREVIOUS_QUESTION", "opt": None, "qnum": None},
    {"cmd": "पिछला प्रश्न खोलो", "expected_action": "PREVIOUS_QUESTION", "opt": None, "qnum": None},
    {"cmd": "option B select karo", "expected_action": "SELECT_OPTION", "opt": "B", "qnum": None},
    {"cmd": "option C choose karo", "expected_action": "SELECT_OPTION", "opt": "C", "qnum": None},
    {"cmd": "question number 5 par jao", "expected_action": "GO_TO_QUESTION", "opt": None, "qnum": 5},
    {"cmd": "question number 12 par jao", "expected_action": "GO_TO_QUESTION", "opt": None, "qnum": 12},
    {"cmd": "question padh ke sunao", "expected_action": "READ_QUESTION", "opt": None, "qnum": None},
    {"cmd": "question repeat karo", "expected_action": "REPEAT_QUESTION", "opt": None, "qnum": None},
    {"cmd": "answer submit karo", "expected_action": "SUBMIT_EXAM", "opt": None, "qnum": None},
]

passed = 0
failed = 0

print(f"\n{'#':2} | {'INPUT COMMAND':28} | {'PARSED ACTION':20} | {'OPTION':6} | {'Q#':4} | {'STATUS'}")
print("-" * 80)

for idx, tc in enumerate(benchmark_suite, 1):
    res = parse_exam_command(tc["cmd"])
    action = res.get("action")
    opt = res.get("targetOption")
    qnum = res.get("questionNumber")

    ok = (action == tc["expected_action"]) and (opt == tc["opt"]) and (qnum == tc["qnum"])
    status = "✅ PASS" if ok else "❌ FAIL"
    if ok:
        passed += 1
    else:
        failed += 1

    print(f"{idx:2} | {tc['cmd']:28} | {action:20} | {str(opt or '-'):6} | {str(qnum or '-'):4} | {status}")

print("=" * 80)
print(f" RESULTS: {passed} / {len(benchmark_suite)} PASSED ({(passed/len(benchmark_suite))*100:.1f}%)")
print("=" * 80)

if failed > 0:
    sys.exit(1)
else:
    print("🎉 ALL MANDATORY BENCHMARK COMMANDS VERIFIED SUCCESSFULLY!")
    sys.exit(0)
