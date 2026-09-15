/**
 * Excel & CSV Question Parser and Sample Template Generator
 * Supports .xlsx, .xls, and .csv files with intelligent column mapping,
 * row validation, and screen-reader narration generation for SightExam AI.
 */
import * as XLSX from 'xlsx';

export interface ParsedQuestionRow {
  rowNumber: number;
  q: string;
  options: [string, string, string, string];
  correct: number; // 0, 1, 2, 3
  correctLetter: 'A' | 'B' | 'C' | 'D';
  topic: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation: string;
  phoneticAudioPreview: string;
  isValid: boolean;
  errors: string[];
}

export interface ParseExcelResult {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  totalRows: number;
  validQuestions: ParsedQuestionRow[];
  invalidRows: ParsedQuestionRow[];
}

/**
 * Normalizes header keys to lowercase alphanumeric for robust matching
 */
function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse an Excel (.xlsx / .xls) or CSV file into validated question objects
 */
export async function parseQuestionsExcelFile(
  file: File,
  options?: { defaultTopic?: string; defaultSubject?: string; defaultDifficulty?: 'Easy' | 'Medium' | 'Hard' }
): Promise<ParseExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded file does not contain any sheets.');
  }

  // Use the first non-instructions sheet if multiple sheets exist
  let targetSheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    if (!name.toLowerCase().includes('instruction') && !name.toLowerCase().includes('guide')) {
      targetSheetName = name;
      break;
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const validQuestions: ParsedQuestionRow[] = [];
  const invalidRows: ParsedQuestionRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 for 1-based index including header row
    const normalizedRow: Record<string, any> = {};

    // Map all keys in this row to normalized keys
    Object.keys(row).forEach(originalKey => {
      const norm = normalizeKey(originalKey);
      normalizedRow[norm] = String(row[originalKey] ?? '').trim();
    });

    // Skip completely empty rows
    const hasAnyContent = Object.values(normalizedRow).some(v => v !== '');
    if (!hasAnyContent) return;

    const errors: string[] = [];

    // 1. Question text mapping
    const qText =
      normalizedRow['question'] ||
      normalizedRow['questiontext'] ||
      normalizedRow['q'] ||
      normalizedRow['statement'] ||
      normalizedRow['prompt'] ||
      normalizedRow['questiontitle'] ||
      normalizedRow['text'] ||
      '';

    if (!qText) {
      errors.push('Question text is missing');
    }

    // 2. Options mapping
    const optA =
      normalizedRow['optiona'] ||
      normalizedRow['opta'] ||
      normalizedRow['option1'] ||
      normalizedRow['opt1'] ||
      normalizedRow['a'] ||
      '';

    const optB =
      normalizedRow['optionb'] ||
      normalizedRow['optb'] ||
      normalizedRow['option2'] ||
      normalizedRow['opt2'] ||
      normalizedRow['b'] ||
      '';

    const optC =
      normalizedRow['optionc'] ||
      normalizedRow['optc'] ||
      normalizedRow['option3'] ||
      normalizedRow['opt3'] ||
      normalizedRow['c'] ||
      '';

    const optD =
      normalizedRow['optiond'] ||
      normalizedRow['optd'] ||
      normalizedRow['option4'] ||
      normalizedRow['opt4'] ||
      normalizedRow['d'] ||
      '';

    if (!optA) errors.push('Option A is missing');
    if (!optB) errors.push('Option B is missing');

    const finalOptions: [string, string, string, string] = [
      optA || 'Option A',
      optB || 'Option B',
      optC || 'None of the above',
      optD || 'All of the above',
    ];

    // 3. Correct Answer mapping
    const rawCorrect =
      normalizedRow['correctanswer'] ||
      normalizedRow['correctoption'] ||
      normalizedRow['correct'] ||
      normalizedRow['answer'] ||
      normalizedRow['ans'] ||
      normalizedRow['correctans'] ||
      normalizedRow['key'] ||
      '';

    let correctIndex = 0;
    let correctLetter: 'A' | 'B' | 'C' | 'D' = 'A';

    if (!rawCorrect) {
      errors.push('Correct answer key (A/B/C/D) is missing');
    } else {
      const cleanAns = String(rawCorrect).trim().toUpperCase();
      if (cleanAns === 'A' || cleanAns === '1') {
        correctIndex = 0;
        correctLetter = 'A';
      } else if (cleanAns === 'B' || cleanAns === '2') {
        correctIndex = 1;
        correctLetter = 'B';
      } else if (cleanAns === 'C' || cleanAns === '3') {
        correctIndex = 2;
        correctLetter = 'C';
      } else if (cleanAns === 'D' || cleanAns === '4') {
        correctIndex = 3;
        correctLetter = 'D';
      } else {
        // Try matching text with one of the options
        const matchIdx = finalOptions.findIndex(o => o.toLowerCase() === cleanAns.toLowerCase());
        if (matchIdx >= 0) {
          correctIndex = matchIdx;
          correctLetter = (['A', 'B', 'C', 'D'][matchIdx] as 'A' | 'B' | 'C' | 'D');
        } else {
          errors.push(`Invalid answer "${rawCorrect}". Expected A, B, C, D, or 1-4.`);
        }
      }
    }

    // 4. Topic & Subject
    const topic =
      normalizedRow['topic'] ||
      normalizedRow['chapter'] ||
      normalizedRow['subtopic'] ||
      options?.defaultTopic ||
      'General Studies';

    const subject =
      normalizedRow['subject'] ||
      normalizedRow['category'] ||
      options?.defaultSubject ||
      'General Awareness';

    // 5. Difficulty
    const rawDiff = (normalizedRow['difficulty'] || normalizedRow['level'] || options?.defaultDifficulty || 'Medium').toLowerCase();
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (rawDiff.includes('easy')) difficulty = 'Easy';
    else if (rawDiff.includes('hard') || rawDiff.includes('diff')) difficulty = 'Hard';

    // 6. Explanation
    const explanation =
      normalizedRow['explanation'] ||
      normalizedRow['solution'] ||
      normalizedRow['rationale'] ||
      normalizedRow['hint'] ||
      `Standard verified solution. Correct option is ${correctLetter}: ${finalOptions[correctIndex]}.`;

    // 7. Screen-reader audio narration preview
    const customNarration =
      normalizedRow['phoneticaudiotext'] ||
      normalizedRow['audionarration'] ||
      normalizedRow['phonetic'] ||
      normalizedRow['speechtext'] ||
      '';

    const phoneticAudioPreview =
      customNarration ||
      `Question: ${qText}. Option A: ${finalOptions[0]}. Option B: ${finalOptions[1]}. Option C: ${finalOptions[2]}. Option D: ${finalOptions[3]}. Correct is Option ${correctLetter}: ${finalOptions[correctIndex]}.`;

    const parsedRow: ParsedQuestionRow = {
      rowNumber,
      q: qText,
      options: finalOptions,
      correct: correctIndex,
      correctLetter,
      topic,
      subject,
      difficulty,
      explanation,
      phoneticAudioPreview,
      isValid: errors.length === 0,
      errors,
    };

    if (parsedRow.isValid) {
      validQuestions.push(parsedRow);
    } else {
      invalidRows.push(parsedRow);
    }
  });

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    selectedSheet: targetSheetName,
    totalRows: validQuestions.length + invalidRows.length,
    validQuestions,
    invalidRows,
  };
}

/**
 * Generates and triggers download of a standardized .xlsx template with sample questions and instructions
 */
export function downloadSampleExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sample Questions
  const sampleData = [
    {
      'Question': 'Which Article of the Constitution of India provides for the Right to Equality before Law?',
      'Option A': 'Article 14',
      'Option B': 'Article 19',
      'Option C': 'Article 21',
      'Option D': 'Article 32',
      'Correct Answer': 'A',
      'Subject': 'Polity',
      'Topic': 'Fundamental Rights',
      'Difficulty': 'Easy',
      'Explanation': 'Article 14 states that the State shall not deny to any person equality before the law or equal protection of the laws within the territory of India.',
      'Phonetic Audio Text': 'Question: Which Article of the Constitution of India provides for the Right to Equality before Law? Option A: Article 14. Option B: Article 19. Option C: Article 21. Option D: Article 32. The correct answer is Option A: Article 14.',
    },
    {
      'Question': 'In a row of 40 students, Rahul is 12th from the left end. What is his position from the right end?',
      'Option A': '27th',
      'Option B': '28th',
      'Option C': '29th',
      'Option D': '30th',
      'Correct Answer': 'C',
      'Subject': 'Reasoning',
      'Topic': 'Ranking and Order',
      'Difficulty': 'Medium',
      'Explanation': 'Position from right = Total students - Position from left + 1 = 40 - 12 + 1 = 29th.',
      'Phonetic Audio Text': 'In a row of 40 students, Rahul is 12th from the left end. What is his position from the right end? Option C: 29th.',
    },
    {
      'Question': 'If 15 men can complete a project in 20 days, how many days will 25 men take to complete the same work?',
      'Option A': '10 days',
      'Option B': '12 days',
      'Option C': '15 days',
      'Option D': '16 days',
      'Correct Answer': 'B',
      'Subject': 'Mathematics',
      'Topic': 'Time and Work',
      'Difficulty': 'Medium',
      'Explanation': 'Total work = 15 men * 20 days = 300 man-days. Days for 25 men = 300 / 25 = 12 days.',
      'Phonetic Audio Text': 'If 15 men can complete a project in 20 days, how many days will 25 men take to complete the same work? The answer is Option B: 12 days.',
    },
    {
      'Question': 'Which gas is released during photosynthesis by green plants?',
      'Option A': 'Carbon Dioxide',
      'Option B': 'Nitrogen',
      'Option C': 'Oxygen',
      'Option D': 'Hydrogen',
      'Correct Answer': 'C',
      'Subject': 'General Science',
      'Topic': 'Plant Biology',
      'Difficulty': 'Easy',
      'Explanation': 'During photosynthesis, green plants use sunlight, water, and CO2 to produce glucose and release Oxygen as a byproduct.',
      'Phonetic Audio Text': 'Which gas is released during photosynthesis by green plants? Option C: Oxygen.',
    },
    {
      'Question': 'Who was the first Governor-General of independent India?',
      'Option A': 'C. Rajagopalachari',
      'Option B': 'Lord Mountbatten',
      'Option C': 'Dr. Rajendra Prasad',
      'Option D': 'Jawaharlal Nehru',
      'Correct Answer': 'B',
      'Subject': 'History',
      'Topic': 'Modern Indian History',
      'Difficulty': 'Hard',
      'Explanation': 'Lord Mountbatten served as the first Governor-General of independent India (August 1947 to June 1948). C. Rajagopalachari was the first Indian Governor-General.',
      'Phonetic Audio Text': 'Who was the first Governor-General of independent India? Option B: Lord Mountbatten.',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 45 }, // Question
    { wch: 22 }, // Option A
    { wch: 22 }, // Option B
    { wch: 22 }, // Option C
    { wch: 22 }, // Option D
    { wch: 15 }, // Correct Answer
    { wch: 16 }, // Subject
    { wch: 24 }, // Topic
    { wch: 12 }, // Difficulty
    { wch: 45 }, // Explanation
    { wch: 45 }, // Phonetic Audio Text
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Questions');

  // Sheet 2: Guidelines & Instructions
  const instructionsData = [
    { 'Column Name': 'Question', 'Required?': 'YES', 'Permitted Values': 'Text', 'Description': 'The full text of the question.' },
    { 'Column Name': 'Option A', 'Required?': 'YES', 'Permitted Values': 'Text', 'Description': 'First multiple choice option.' },
    { 'Column Name': 'Option B', 'Required?': 'YES', 'Permitted Values': 'Text', 'Description': 'Second multiple choice option.' },
    { 'Column Name': 'Option C', 'Required?': 'OPTIONAL', 'Permitted Values': 'Text', 'Description': 'Third option (defaults to "None of the above" if omitted).' },
    { 'Column Name': 'Option D', 'Required?': 'OPTIONAL', 'Permitted Values': 'Text', 'Description': 'Fourth option (defaults to "All of the above" if omitted).' },
    { 'Column Name': 'Correct Answer', 'Required?': 'YES', 'Permitted Values': 'A, B, C, or D (or 1, 2, 3, 4)', 'Description': 'Which option is correct.' },
    { 'Column Name': 'Subject', 'Required?': 'OPTIONAL', 'Permitted Values': 'Polity, Reasoning, Mathematics, General Science, etc.', 'Description': 'Main curriculum subject.' },
    { 'Column Name': 'Topic', 'Required?': 'OPTIONAL', 'Permitted Values': 'Text (e.g., Fundamental Rights)', 'Description': 'Specific chapter or topic for analytics.' },
    { 'Column Name': 'Difficulty', 'Required?': 'OPTIONAL', 'Permitted Values': 'Easy, Medium, Hard', 'Description': 'Question difficulty level (defaults to Medium).' },
    { 'Column Name': 'Explanation', 'Required?': 'OPTIONAL', 'Permitted Values': 'Text', 'Description': 'Detailed solution explaining the answer.' },
    { 'Column Name': 'Phonetic Audio Text', 'Required?': 'OPTIONAL', 'Permitted Values': 'Text', 'Description': 'Screen-reader friendly text with phonetic pronunciation. Auto-generated if left blank.' },
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  XLSX.writeFile(wb, 'SightExam_Question_Bank_Template.xlsx');
}

/**
 * Generates and triggers download of a standardized .csv template
 */
export function downloadSampleCsvTemplate() {
  const csvContent =
    'Question,Option A,Option B,Option C,Option D,Correct Answer,Subject,Topic,Difficulty,Explanation,Phonetic Audio Text\n' +
    '"Which Article of the Constitution of India provides for Equality before Law?","Article 14","Article 19","Article 21","Article 32","A","Polity","Fundamental Rights","Easy","Article 14 guarantees equality before the law.","Question: Which Article provides for Equality before Law? Option A: Article 14."\n' +
    '"In a row of 40 students Rahul is 12th from left. What is his position from right?","27th","28th","29th","30th","C","Reasoning","Ranking","Medium","Position = 40 - 12 + 1 = 29th","Rahul position is Option C: 29th."\n' +
    '"Which gas is released during photosynthesis?","Carbon Dioxide","Nitrogen","Oxygen","Hydrogen","C","General Science","Biology","Easy","Oxygen is released as a byproduct.","Oxygen is released. Option C."\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'SightExam_Question_Bank_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
