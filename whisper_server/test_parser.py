import sys
sys.stdout.reconfigure(encoding='utf-8')
from main import parse_exam_command

test_phrases = [
    'next question',
    'agla question kholo',
    'अगला प्रश्न खोलो',
    'pichla question',
    'पिछला प्रश्न खोलो',
    'option B select karo',
    'option C choose karo',
    'question number 5 par jao',
    'question number 12 par jao',
    'question padh ke sunao',
    'question repeat karo',
    'answer submit karo',
    'अगला सवाल',
    'पिछला सवाल',
    'option A tick karo',
    'chautha option chuno',
    'question 7 pe jao',
    'exam submit karo',
    'start exam',
    'pause exam'
]

print(f"{'INPUT':30} | {'ACTION':20} | {'OPTION':8} | {'Q_NUM':8}")
print("-" * 75)
for p in test_phrases:
    res = parse_exam_command(p)
    act = res.get('action') or ''
    opt = str(res.get('targetOption') or '-')
    qnum = str(res.get('questionNumber') or '-')
    print(f"{p:30} | {act:20} | {opt:8} | {qnum:8}")
