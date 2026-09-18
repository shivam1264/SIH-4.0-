// ── Comprehensive Knowledge Base for All 9 Sidebar Pages ─────────────
// Supports instant bilingual (Hindi + English + Hinglish) answers for all sidebar pages.

export interface PageInfo {
  pageName: string;
  route: string;
  summaryEn: string;
  summaryHi: string;
  factsEn: string[];
  factsHi: string[];
  qa: Array<{
    keywords: string[];
    answerEn: string;
    answerHi: string;
  }>;
}

export const SIDEBAR_PAGES_KNOWLEDGE: Record<string, PageInfo> = {
  Dashboard: {
    pageName: 'Dashboard',
    route: '/dashboard',
    summaryEn: 'The Dashboard shows your learning progress: 74% average score, 88% personal best, 4 completed mock tests, 7 days daily streak, weak topics, and quick actions to launch exams or practice drills.',
    summaryHi: 'Dashboard par aapka 74% average score, 88% personal best score, 4 poore kiye gaye mock tests, 7 din ki streak, weak topics, aur practice shuru karne ke quick buttons dikh rahe hain.',
    factsEn: [
      'Average score is 74% across 4 mock tests.',
      'Personal best score is 88%.',
      'Daily practice streak is 7 days.',
      'Identified weak areas are Pipes & Cisterns and Indian History.',
      'Recommended action is to take the SSC CGL Reasoning mock test.',
      'Quick buttons are available for Mock Tests, Practice, Analytics, and Notifications.'
    ],
    factsHi: [
      'Aapka average score 74% hai.',
      'Aapka personal best score 88% hai.',
      'Aapki daily practice streak 7 din ki hai.',
      'Kamzor vishay Pipes and Cisterns aur Indian History hain.',
      'Aapko SSC Reasoning mock test dene ki salah di gayi hai.',
      'Mock tests, practice drills, aur analytics kholne ke quick buttons uplabdh hain.'
    ],
    qa: [
      {
        keywords: ['score', 'marks', 'average', 'number', 'mera score', 'kitna score'],
        answerEn: 'Your current average score is 74% and your personal best score is 88%.',
        answerHi: 'Aapka current average score 74% hai aur personal best score 88% hai.',
      },
      {
        keywords: ['test', 'kitne test', 'mock test', 'completed', 'kitne exam', 'total test'],
        answerEn: 'You have completed a total of 4 mock tests so far.',
        answerHi: 'Aapne abhi tak kul 4 mock tests poore kiye hain.',
      },
      {
        keywords: ['weak', 'weakness', 'kamjor', 'kamjori', 'sudharu', 'kisme kam'],
        answerEn: 'Your identified weak topics are Pipes and Cisterns and Indian History.',
        answerHi: 'Aapke weak topics Pipes and Cisterns aur Indian History hain, jinme practice ki zarurat hai.',
      },
      {
        keywords: ['streak', 'daily streak', 'lagatar', 'consistency'],
        answerEn: 'Your daily study streak is 7 days consecutive. Keep it up!',
        answerHi: 'Aapki daily streak 7 din ki hai. Shandar niyamitata!',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This Dashboard summarizes your 74% average score, 88% personal best, 7-day streak, weak topics, and quick actions to start tests or practice.',
        answerHi: 'Dashboard par aapka 74% average score, 88% personal best, 7 din ki streak, weak topics, aur practice shuru karne ke quick buttons dikh rahe hain.',
      },
    ],
  },

  ExamSelection: {
    pageName: 'Mock Tests',
    route: '/exams',
    summaryEn: 'The Mock Tests page features 4 national competitive exams: SSC CGL Reasoning (25 questions, 60 mins), Banking Quantitative Aptitude (35 questions, 45 mins), Railway RRB NTPC General Awareness (40 questions, 50 mins), and UPSC Civil Services CSAT (30 questions, 60 mins). Positive marks +2, negative marks -0.5.',
    summaryHi: 'Mock Tests page par 4 mukhya parikshayein uplabdh hain: SSC CGL Reasoning, Banking Quantitative Aptitude, Railway RRB NTPC, aur UPSC CSAT. Har sahi uttar par +2 marks aur galat par -0.5 negative marking hai.',
    factsEn: [
      '4 mock tests available: SSC Reasoning, Banking Quant, Railway NTPC, and UPSC CSAT.',
      'SSC Reasoning has 25 questions, 60 minutes duration.',
      'Banking Quant has 35 questions, 45 minutes duration.',
      'Railway NTPC has 40 questions, 50 minutes duration.',
      'UPSC CSAT has 30 questions, 60 minutes duration.',
      'Marking scheme: +2 for correct, -0.5 for wrong answers.',
      'Pre-exam calibration wizard is available for audio and microphone check.'
    ],
    factsHi: [
      '4 mock tests uplabdh hain: SSC Reasoning, Banking Quant, Railway NTPC, aur UPSC CSAT.',
      'SSC Reasoning me 25 sawal aur 60 minute ka samay hai.',
      'Banking Quant me 35 sawal aur 45 minute ka samay hai.',
      'Railway NTPC me 40 sawal aur 50 minute ka samay hai.',
      'UPSC CSAT me 30 sawal aur 60 minute ka samay hai.',
      'Marking scheme: Sahi par +2 marks aur galat par -0.5 negative marks.',
      'Pre-exam calibration wizard mic aur audio testing ke liye uplabdh hai.'
    ],
    qa: [
      {
        keywords: ['kitne test', 'kaun kaun', 'which exams', 'how many exams', 'kon se exam', 'available test'],
        answerEn: 'There are 4 live mock tests: SSC CGL Reasoning, Banking Quantitative Aptitude, Railway RRB NTPC, and UPSC CSAT.',
        answerHi: 'Yahan 4 mock tests uplabdh hain: SSC CGL Reasoning, Banking Quantitative Aptitude, Railway RRB NTPC, aur UPSC CSAT.',
      },
      {
        keywords: ['marking', 'negative marking', 'marks', 'kitne number', 'rules'],
        answerEn: 'Each correct answer gives plus 2 marks, and wrong answers have a negative marking deduction of 0.5 marks.',
        answerHi: 'Har sahi uttar par plus 2 marks milte hain aur galat uttar par 0.5 marks ki negative marking hoti hai.',
      },
      {
        keywords: ['duration', 'time', 'kitna time', 'samay', 'kitni der'],
        answerEn: 'Exam durations range from 45 minutes for Banking to 60 minutes for SSC and UPSC.',
        answerHi: 'Exam ka samay 45 se 60 minute ka hai. Banking ke liye 45 minute aur SSC va UPSC ke liye 60 minute milte hain.',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This page lets you select and start official mock tests for SSC, Banking, Railways, and UPSC with full accessibility and timing support.',
        answerHi: 'Is page par aap SSC, Banking, Railway aur UPSC ke live mock tests chun kar start kar sakte hain.',
      },
    ],
  },

  Practice: {
    pageName: 'AI Practice Drills',
    route: '/practice',
    summaryEn: 'AI Practice Drills provides topic-wise training with instant explanations and voice answering. Topics include Indian History, Pipes and Cisterns, Compound Interest, Blood Relations, and Mensuration.',
    summaryHi: 'AI Practice Drills me topic-wise abhyas kiya jata hai jisme instant hints, step-by-step solution aur aawaz se answer dene ki suvidha hai. Topics me History, Pipes and Cisterns, Compound Interest, Blood Relations, aur Mensuration shamil hain.',
    factsEn: [
      'Unlimited dynamic practice questions with immediate feedback.',
      'Key topics: Indian History, Pipes & Cisterns, Compound Interest, Blood Relations, Mensuration.',
      'Interactive voice controls: Say Option A/B/C/D, Read question, Hint, or Next.',
      'Provides full formula breakdown and audio descriptions for visual diagrams.'
    ],
    factsHi: [
      'Unlimited practice sawal aur turant solution.',
      'Mukhya topics: Indian History, Pipes and Cisterns, Compound Interest, Blood Relations, Mensuration.',
      'Aawaz se option chunein: Option A, B, C, D bol sakte hain.',
      'Har sawal ka formula aur audio explanation milta hai.'
    ],
    qa: [
      {
        keywords: ['topic', 'topics', 'kon se topic', 'kaun kaun se topic', 'subject'],
        answerEn: 'Available practice topics include Indian History, Pipes and Cisterns, Compound Interest, Blood Relations, and Mensuration.',
        answerHi: 'Practice ke liye Indian History, Pipes and Cisterns, Compound Interest, Blood Relations, aur Mensuration jaise topics uplabdh hain.',
      },
      {
        keywords: ['hint', 'madad', 'help', 'samjhao', 'explanation'],
        answerEn: 'You can say "explain" or "hint" during practice to hear step-by-step guidance without revealing the answer.',
        answerHi: 'Aap kisi bhi question me "explain" ya "hint" bol kar step-by-step guidance sun sakte hain.',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This screen is your AI Practice Drills arena for mastering specific weak topics with instant audio explanations and voice answering.',
        answerHi: 'Yeh AI Practice Drills screen hai jahan aap kisi bhi topic par sawal hal kar sakte hain aur aawaz se option select kar sakte hain.',
      },
    ],
  },

  StudyMaterials: {
    pageName: 'Study Materials',
    route: '/study-materials',
    summaryEn: 'Study Materials offers accessible revision notes, formula sheets, and audio summaries for Quantitative Aptitude, Indian Polity Constitution Articles, Logical Reasoning, and General Science.',
    summaryHi: 'Study Materials me sabhi subjects ke formula sheets, revision notes, aur Constitution Articles ke audio notes uplabdh hain.',
    factsEn: [
      'Comprehensive formula books for Quantitative Aptitude (Algebra, Geometry, Arithmetic).',
      'Constitution Articles summary covering Articles 1 to 395 and key amendments.',
      'Logical Reasoning puzzle tricks, syllogism cheatsheets, and seating arrangement guides.',
      'Built-in audio player to listen to notes read aloud.'
    ],
    factsHi: [
      'Quantitative Aptitude ke liye formula book uplabdh hai.',
      'Indian Polity ke mukhya Constitution Articles aur Amendments ke notes hain.',
      'Reasoning puzzles aur syllogism ke shortcuts uplabdh hain.',
      'Audio button se notes ko sunne ki suvidha hai.'
    ],
    qa: [
      {
        keywords: ['kya hai', 'notes', 'kitabein', 'material', 'what notes', 'materials'],
        answerEn: 'Study materials includes Quantitative Aptitude formula guides, Indian Polity articles, Logical Reasoning cheatsheets, and General Science notes.',
        answerHi: 'Yahan Maths ke formula guides, Indian Polity ke articles, Reasoning cheatsheets aur General Science notes uplabdh hain.',
      },
      {
        keywords: ['audio', 'listen', 'padh kar', 'sunao', 'sunna'],
        answerEn: 'Yes, every study material topic has an audio read-aloud option for complete accessibility.',
        answerHi: 'Haan, har study material ke sath audio sunne ka vikalp hai jisse aap bina screen dekhe sun sakte hain.',
      },
      {
        keywords: ['is page', 'kya likha', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This page provides accessible study notes and formula guides across all competitive exam subjects with audio playback.',
        answerHi: 'Is page par sabhi competitive exam subjects ke accessible revision notes aur formula guides uplabdh hain.',
      },
    ],
  },

  PreviousYearPapers: {
    pageName: 'Past Year Papers',
    route: '/pyqs',
    summaryEn: 'Past Year Papers contains official solved previous year question papers from SSC CGL 2023, IBPS PO 2023, RRB NTPC 2022, and UPSC CSE 2023 with verified answer keys and explanations.',
    summaryHi: 'Past Year Papers me SSC CGL 2023, IBPS PO 2023, RRB NTPC 2022, aur UPSC CSE 2023 ke solved question papers verified solutions ke sath uplabdh hain.',
    factsEn: [
      'Official solved papers from 2021 to 2023.',
      'Exams covered: SSC CGL Tier-1, IBPS PO Prelims, Railway RRB NTPC, and UPSC Prelims GS.',
      'Every paper includes verified answer keys and step-by-step solutions.',
      'You can practice in simulation mode or read paper solutions.'
    ],
    factsHi: [
      '2021 se 2023 tak ke official solved papers uplabdh hain.',
      'SSC CGL, IBPS PO, Railway NTPC, aur UPSC Prelims shamil hain.',
      'Har paper me official answer key aur detailed step-by-step solution hai.',
      'Aap simulation test mode me attempt kar sakte hain.'
    ],
    qa: [
      {
        keywords: ['kaun se paper', 'which papers', 'saal', 'years', 'kitne paper'],
        answerEn: 'Official solved papers are available for SSC CGL 2023, IBPS PO 2023, RRB NTPC 2022, and UPSC Civil Services 2023.',
        answerHi: 'Yahan SSC CGL 2023, IBPS PO 2023, RRB NTPC 2022, aur UPSC Civil Services 2023 ke official solved papers uplabdh hain.',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This page allows you to browse and practice authentic past year exam papers with official answer keys and explanations.',
        answerHi: 'Is page par aap pichle saalon ke official exam papers dekh sakte hain aur unke solutions padh ya sun sakte hain.',
      },
    ],
  },

  Performance: {
    pageName: 'Performance Analytics',
    route: '/performance',
    summaryEn: 'Performance Analytics reveals your 78% overall accuracy, 1.2 minutes average speed per question, 92nd percentile rank, strong performance in Logical Reasoning (86%), and improvement areas in Pipes & Cisterns (54%).',
    summaryHi: 'Performance Analytics me aapka 78% overall accuracy, 1.2 minute prati sawal speed, 92nd percentile rank, Reasoning me 86% mazboot pakad, aur Pipes and Cisterns me 54% sudhar ki zarurat dikhai gayi hai.',
    factsEn: [
      'Overall accuracy is 78%.',
      'Average time per question is 1.2 minutes.',
      'Current standing is in the 92nd percentile among candidates.',
      'Strongest subject: Logical Reasoning with 86% accuracy.',
      'Weakest topic: Pipes and Cisterns with 54% accuracy.',
      'Provides AI recommendations for score improvement.'
    ],
    factsHi: [
      'Overall accuracy 78% hai.',
      'Prati prashna ausat samay 1.2 minute hai.',
      'Aapka standing 92nd percentile par hai.',
      'Sabse strong subject Logical Reasoning hai (86% accuracy).',
      'Kamzor topic Pipes and Cisterns hai (54% accuracy).',
      'AI dwaara prastut ki gayi improvement recommendations uplabdh hain.'
    ],
    qa: [
      {
        keywords: ['accuracy', 'kitni accuracy', 'sahi pratishat', 'precision'],
        answerEn: 'Your overall accuracy is 78% across all attempted mock tests and practice sessions.',
        answerHi: 'Aapki overall accuracy 78% hai.',
      },
      {
        keywords: ['speed', 'time', 'samay', 'kitna time lagta', 'pace'],
        answerEn: 'Your average answering speed is 1.2 minutes per question.',
        answerHi: 'Aapki ausat speed 1.2 minute prati sawal hai.',
      },
      {
        keywords: ['percentile', 'rank', 'stithi', 'kahan hu'],
        answerEn: 'You are currently in the 92nd percentile among all active candidates.',
        answerHi: 'Aap abhi 92nd percentile par hain, jo ki ek shandar rank hai.',
      },
      {
        keywords: ['strong', 'accha', 'mazboot', 'best subject'],
        answerEn: 'Your strongest subject is Logical Reasoning with an impressive 86% accuracy.',
        answerHi: 'Aapka sabse mazboot vishay Logical Reasoning hai jisme aapki 86% accuracy hai.',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This screen gives you in-depth diagnostic analytics on your accuracy, speed, subject strengths, and weaknesses.',
        answerHi: 'Is page par aapki accuracy, speed, subject-wise performance, aur rank ka poora vishleshan diya gaya hai.',
      },
    ],
  },

  ExamHistory: {
    pageName: 'Exam History',
    route: '/history',
    summaryEn: 'Exam History lists your completed mock tests with dates, scores, time taken, and a Review Solutions button to analyze every question and explanation.',
    summaryHi: 'Exam History me aapke dwara diye gaye sabhi mock tests ki tarikh, prapt score, samay, aur Review Solutions ka vikalp uplabdh hai.',
    factsEn: [
      '4 historical mock test attempts recorded.',
      'Latest attempt: SSC CGL Tier-1 Reasoning, score 42/50 (84%), duration 48 minutes.',
      'Review Solutions button lets you view correct answers and detailed explanations for every question.',
      'Re-attempt feature allows you to retake any test to measure improvement.'
    ],
    factsHi: [
      '4 completed mock test attempts darj hain.',
      'Sabse latest test SSC Reasoning tha jisme aapne 42/50 (84%) score kiya aur 48 minute liye.',
      'Review Solutions button se aap har sawal ka sahi jawab aur detail solution dekh sakte hain.',
      'Re-attempt button se aap test dobara de sakte hain.'
    ],
    qa: [
      {
        keywords: ['latest test', 'aakhri test', 'last exam', 'recent attempt', 'kaisa raha'],
        answerEn: 'In your latest attempt on SSC Reasoning, you scored 42 out of 50 with 84% accuracy in 48 minutes.',
        answerHi: 'Aapne pichle SSC Reasoning test me 50 me se 42 marks score kiye the, 84% accuracy ke sath.',
      },
      {
        keywords: ['solution', 'answers', 'galat', 'review', 'kaise dekhu'],
        answerEn: 'Click or say "Review Solutions" on any attempt card to hear explanations for all questions.',
        answerHi: 'Aap kisi bhi test card par "Review Solutions" bol kar ya click karke har sawal ka solution dekh sakte hain.',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This page shows your past exam attempt history with scores, dates, and review buttons for all your tests.',
        answerHi: 'Is page par aapke sabhi purane exam attempts ke marks, tarikh aur question solutions darj hain.',
      },
    ],
  },

  Settings: {
    pageName: 'Accessibility Settings',
    route: '/settings',
    summaryEn: 'Accessibility Settings lets you customize 4 contrast themes (Default, Dark, High-Contrast Yellow, Sepia), 4 font sizes, voice speech speed (0.75x to 1.5x), and PwD extra time allowance (1.0x, 1.5x, 2.0x).',
    summaryHi: 'Accessibility Settings me aap 4 contrast themes, 4 font sizes, aawaz ki speed (0.75x se 1.5x), aur PwD extra time allowance (1.5x ya 2.0x) set kar sakte hain.',
    factsEn: [
      'Contrast themes: Default Light, Deep OLED Dark, High-Contrast Yellow on Black, and Soft Sepia.',
      'Font sizes: Default (16px), Large (18px), Extra Large (20px), and Huge (24px).',
      'Speech rate: Adjustable from 0.75x (slow) to 1.5x (fast).',
      'PwD Extra Time Multiplier: 1.0x (standard), 1.5x (time and a half), or 2.0x (double time) per government guidelines.',
      'Screen reader verbosity, dyslexia font, and keyboard shortcuts guide.'
    ],
    factsHi: [
      'Themes: Default, Dark, High-Contrast Yellow on Black, aur Sepia.',
      'Font sizes: Default, Large, Extra Large, aur Huge.',
      'Voice speed: 0.75x se 1.5x tak set kar sakte hain.',
      'PwD Extra Time: 1.0x, 1.5x, ya 2.0x extra exam time choose kar sakte hain.',
      'Dyslexia font aur keyboard shortcuts guide bhi uplabdh hai.'
    ],
    qa: [
      {
        keywords: ['theme', 'dark mode', 'high contrast', 'color', 'rang', 'contrast'],
        answerEn: 'You can choose between Default Light, Deep OLED Dark, High-Contrast Yellow on Black, and Soft Sepia themes.',
        answerHi: 'Aap Default Light, Deep Dark, High Contrast Yellow, ya Sepia themes me se chun sakte hain.',
      },
      {
        keywords: ['font', 'size', 'bada karo', 'akshar', 'text size'],
        answerEn: 'Font sizes available are Default 16px, Large 18px, Extra Large 20px, and Huge 24px.',
        answerHi: 'Font size me Default, Large, Extra Large aur Huge 24px ke vikalp uplabdh hain.',
      },
      {
        keywords: ['extra time', 'samay', 'pwd time', 'jyada time', 'compensatory time'],
        answerEn: 'PwD candidates can set compensatory extra time to 1.5x (time-and-a-half) or 2.0x (double time).',
        answerHi: 'PwD candidates ke liye 1.5x aur 2.0x extra time ka vikalp uplabdh hai.',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This page lets you personalize visual themes, font sizes, voice speech speed, and extra exam time for full accessibility.',
        answerHi: 'Is page par aap visual themes, font size, voice speed, aur extra exam time apni zaroorat ke anusaar set kar sakte hain.',
      },
    ],
  },

  Profile: {
    pageName: 'Candidate Profile',
    route: '/profile',
    summaryEn: 'Candidate Profile shows: Name: Shivam Maurya, Roll Number: SIGHT-2026-8891, Category: PwD (Visually Impaired / Low Vision), Preferred Scribe: Screen Reader & Voice Dictation, Target Exams: SSC CGL 2026 and Banking IBPS PO.',
    summaryHi: 'Profile par aapki jankari darj hai: Naam Shivam Maurya, Roll Number SIGHT-2026-8891, Category PwD (Visually Impaired), Target Exams SSC CGL aur IBPS PO.',
    factsEn: [
      'Candidate Name: Shivam Maurya.',
      'Roll Number / Registration ID: SIGHT-2026-8891.',
      'Disability Category: PwD (Visually Impaired / Low Vision).',
      'Scribe preference: Drishti AI Screen Reader & Voice Dictation enabled.',
      'Target examinations: SSC CGL 2026 and Banking IBPS PO 2026.',
      'Registered email: shivam.pwd@sightexam.gov.in.'
    ],
    factsHi: [
      'Candidate ka naam: Shivam Maurya.',
      'Roll Number: SIGHT-2026-8891.',
      'Category: PwD (Visually Impaired / Low Vision).',
      'Scribe preference: Screen Reader aur Voice Dictation enabled.',
      'Target exams: SSC CGL 2026 aur Banking IBPS PO.',
      'Registered email: shivam.pwd@sightexam.gov.in.'
    ],
    qa: [
      {
        keywords: ['naam', 'name', 'who am i', 'mera naam', 'candidate name'],
        answerEn: 'Your registered name is Shivam Maurya.',
        answerHi: 'Aapka registered naam Shivam Maurya hai.',
      },
      {
        keywords: ['roll number', 'id', 'registration', 'mera roll number', 'candidate id'],
        answerEn: 'Your candidate roll number is SIGHT-2026-8891.',
        answerHi: 'Aapka roll number SIGHT-2026-8891 hai.',
      },
      {
        keywords: ['category', 'pwd', 'disability', 'shreni'],
        answerEn: 'Your registered category is PwD Visually Impaired, with Screen Reader and Voice Assist enabled.',
        answerHi: 'Aapki category PwD Visually Impaired hai, aur Screen Reader suvidha enabled hai.',
      },
      {
        keywords: ['target exam', 'kiska exam', 'target', 'lakshya'],
        answerEn: 'Your target exams are SSC CGL 2026 and Banking IBPS PO 2026.',
        answerHi: 'Aapke target exams SSC CGL 2026 aur Banking IBPS PO 2026 hain.',
      },
      {
        keywords: ['is page', 'kya likha', 'kya hai', 'batao', 'what is on this page', 'about this page', 'overview'],
        answerEn: 'This page shows your candidate identification, roll number, PwD disability category, target exams, and contact information.',
        answerHi: 'Is page par aapka naam, roll number, PwD category, target exams, aur profile jankari darj hai.',
      },
    ],
  },
};

export function resolveLocalPageQuestion(pageName: string, question: string): string {
  const normPage = (pageName || 'Dashboard').toLowerCase().trim();
  const normQ = (question || '').toLowerCase().trim();

  // Detect if question is primarily Hindi / Hinglish
  const isHindi = /\b(kya|kaise|kitna|kitne|batao|hai|hain|kaun|kiska|kiske|mera|meri|yaha|yahan|sunao|dikhao|pariksha|sawal|prashna|shuru|karein|chahiye)\b/i.test(normQ) ||
                  /[\u0900-\u097F]/.test(normQ);

  // Match page info
  let info: PageInfo = SIDEBAR_PAGES_KNOWLEDGE.Dashboard;
  for (const [key, p] of Object.entries(SIDEBAR_PAGES_KNOWLEDGE)) {
    if (
      normPage.includes(key.toLowerCase()) ||
      normPage.includes(p.pageName.toLowerCase()) ||
      normPage.includes(p.route.replace('/', '').toLowerCase())
    ) {
      info = p;
      break;
    }
  }

  // Check specific Q&A items
  for (const item of info.qa) {
    const matched = item.keywords.some(kw => normQ.includes(kw.toLowerCase()));
    if (matched) {
      return isHindi ? item.answerHi : item.answerEn;
    }
  }

  // General "What is on this page / tell me about this screen"
  if (
    /\b(is\s+page|kya\s+likha|kya\s+hai|batao|samjhao|what\s+is\s+on\s+this|about\s+this|overview|summary)\b/i.test(normQ)
  ) {
    return isHindi ? info.summaryHi : info.summaryEn;
  }

  // Fallback response with page summary + guidance
  return isHindi
    ? `${info.summaryHi} Aap is page ke baare me kuch bhi pooch sakte hain.`
    : `${info.summaryEn} Feel free to ask any specific question about this screen.`;
}
