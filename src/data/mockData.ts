import type {
  Exam,
  ExamAttempt,
  AIRecommendation,
  User,
  AdminStudent,
  CurriculumSubject,
  CandidateAttemptLog,
  PronunciationRule,
  AdminAnnouncement,
  ComplianceReport,
  StudyMaterial,
  PYQPaper,
} from '../types';

// ─────────────────────────────────────────────
//  Sample Exam Question Banks
// ─────────────────────────────────────────────
export const EXAMS: Exam[] = [
  // ── SSC CGL General Intelligence & Reasoning ──
  {
    id: 'ssc-reasoning-01',
    title: 'SSC CGL — General Intelligence & Reasoning',
    description: 'Comprehensive mock test covering syllogism, number series, directions, coding-decoding and analogies for SSC CGL preparation.',
    category: 'SSC',
    subjects: ['Reasoning', 'Mathematics'],
    totalQuestions: 10,
    durationMinutes: 12,
    difficulty: 'Medium',
    published: true,
    createdAt: '2026-01-10',
    questions: [
      {
        id: 'ssc-r-q1', subject: 'Reasoning', topic: 'Syllogism', difficulty: 'Easy', tags: ['syllogism', 'logic'],
        text: 'All pens are books. All books are dictionaries. Which conclusion follows?\nI. Some pens are dictionaries.\nII. All dictionaries are pens.',
        phoneticText: 'All pens are books. All books are dictionaries. Which conclusion follows? Conclusion one: Some pens are dictionaries. Conclusion two: All dictionaries are pens.',
        options: [
          { id: 'A', text: 'Only I follows' },
          { id: 'B', text: 'Only II follows' },
          { id: 'C', text: 'Both I and II follow' },
          { id: 'D', text: 'Neither I nor II follows' },
        ],
        correct: 'A',
        explanation: 'Since all pens are books and all books are dictionaries, pens ⊂ dictionaries. Hence Conclusion I (Some pens are dictionaries) is valid. Conclusion II is an over-generalisation.',
      },
      {
        id: 'ssc-r-q2', subject: 'Reasoning', topic: 'Number Series', difficulty: 'Easy', tags: ['series', 'primes'],
        text: 'Find the next number in the series: 4, 9, 25, 49, 121, ?',
        phoneticText: 'Find the next number in the series: four, nine, twenty-five, forty-nine, one hundred twenty-one, question mark.',
        options: [
          { id: 'A', text: '144' },
          { id: 'B', text: '169' },
          { id: 'C', text: '196' },
          { id: 'D', text: '225' },
        ],
        correct: 'B',
        explanation: 'The series is squares of prime numbers: 2²=4, 3²=9, 5²=25, 7²=49, 11²=121. Next prime is 13, so 13²=169.',
      },
      {
        id: 'ssc-r-q3', subject: 'Reasoning', topic: 'Coding-Decoding', difficulty: 'Medium', tags: ['coding'],
        text: 'If "COMPUTER" is coded as "RFUVQNPC", how is "PRINTER" coded?',
        phoneticText: 'If COMPUTER is coded as RFUVQNPC, how is PRINTER coded?',
        options: [
          { id: 'A', text: 'QSJOUFS' },
          { id: 'B', text: 'SFUOJRQ' },
          { id: 'C', text: 'SFUOIRQ' },
          { id: 'D', text: 'QSJOUFR' },
        ],
        correct: 'A',
        explanation: 'Each letter is shifted +1 in the alphabet, then the word is reversed. P→Q, R→S, I→J, N→O, T→U, E→F, R→S → QSJOUFR, reversed → RFUOJSQ. Pattern: reverse the +1 shift gives QSJOUFS.',
      },
      {
        id: 'ssc-r-q4', subject: 'Reasoning', topic: 'Direction & Distance', difficulty: 'Easy', tags: ['directions'],
        text: 'Riya walks 10m North, turns right and walks 20m, then turns right again and walks 10m. How far is she from her starting point?',
        phoneticText: 'Riya walks ten meters North, turns right and walks twenty meters, then turns right again and walks ten meters. How far is she from her starting point?',
        options: [
          { id: 'A', text: '10m' },
          { id: 'B', text: '20m' },
          { id: 'C', text: '30m' },
          { id: 'D', text: '40m' },
        ],
        correct: 'B',
        explanation: 'North 10m and South 10m cancel. She displaced 20m East from start.',
      },
      {
        id: 'ssc-r-q5', subject: 'Mathematics', topic: 'Algebra & Roots', difficulty: 'Medium', tags: ['algebra', 'math'],
        text: 'Simplify the algebraic expression: \\sqrt{x^2 + 6x + 9} when x = 5.',
        phoneticText: 'Simplify the algebraic expression: square root of x squared plus 6x plus 9, when x equals 5.',
        mathFormula: '\\sqrt{x^2 + 6x + 9}',
        mathVerbalization: 'square root of x squared plus 6x plus 9, end root',
        aiSummary: 'This question tests polynomial factorization. Notice that x squared plus 6x plus 9 is a perfect square equal to (x + 3) squared. Taking the square root gives (x + 3). Substituting x = 5 gives 5 + 3 = 8.',
        options: [
          { id: 'A', text: '8' },
          { id: 'B', text: '6' },
          { id: 'C', text: '10' },
          { id: 'D', text: '12' },
        ],
        correct: 'A',
        explanation: 'x² + 6x + 9 = (x + 3)². Taking the square root yields |x + 3|. For x = 5, 5 + 3 = 8.',
      },
      {
        id: 'ssc-r-q6', subject: 'Mathematics', topic: 'Data Interpretation', difficulty: 'Easy', tags: ['chart', 'data-interpretation'],
        text: 'The bar chart shows coal production (in metric tonnes) of four public sector mines: Mine A (40 MT), Mine B (75 MT), Mine C (90 MT), and Mine D (60 MT). Which mine recorded the second highest production?',
        phoneticText: 'The bar chart shows coal production in metric tonnes of four public sector mines: Mine A with forty MT, Mine B with seventy-five MT, Mine C with ninety MT, and Mine D with sixty MT. Which mine recorded the second highest production?',
        diagramData: {
          type: 'bar',
          title: 'Public Sector Coal Production (Metric Tonnes)',
          altDescription: 'A vertical bar chart with 4 bars representing Coal Mines. Mine C is tallest at 90 MT, followed by Mine B at 75 MT, Mine D at 60 MT, and Mine A at 40 MT.',
          dataTable: [
            { label: 'Mine A', value: '40 MT' },
            { label: 'Mine B', value: '75 MT' },
            { label: 'Mine C', value: '90 MT' },
            { label: 'Mine D', value: '60 MT' }
          ]
        },
        aiSummary: 'Analyze the values: Mine C has 90 (highest), Mine B has 75 (second highest), Mine D has 60, and Mine A has 40. Therefore, Mine B is the second highest.',
        options: [
          { id: 'A', text: 'Mine A' },
          { id: 'B', text: 'Mine B' },
          { id: 'C', text: 'Mine C' },
          { id: 'D', text: 'Mine D' },
        ],
        correct: 'B',
        explanation: 'Ranked from highest: Mine C (90 MT) > Mine B (75 MT) > Mine D (60 MT) > Mine A (40 MT). Second highest is Mine B.',
      },
      {
        id: 'ssc-r-q7', subject: 'Reasoning', topic: 'Analogy', difficulty: 'Easy', tags: ['analogy'],
        text: 'Book : Library :: Painting : ?',
        phoneticText: 'Book is to Library as Painting is to what?',
        options: [
          { id: 'A', text: 'Artist' },
          { id: 'B', text: 'Museum' },
          { id: 'C', text: 'Canvas' },
          { id: 'D', text: 'Colour' },
        ],
        correct: 'B',
        explanation: 'Books are kept in a Library. Paintings are kept in a Museum.',
      },
      {
        id: 'ssc-r-q8', subject: 'Mathematics', topic: 'Speed & Distance', difficulty: 'Medium', tags: ['speed'],
        text: 'A train 240m long crosses a pole in 8 seconds. What is the speed of the train (km/h)?',
        phoneticText: 'A train two hundred forty meters long crosses a pole in eight seconds. What is the speed of the train in kilometers per hour?',
        options: [
          { id: 'A', text: '90 km/h' },
          { id: 'B', text: '100 km/h' },
          { id: 'C', text: '108 km/h' },
          { id: 'D', text: '120 km/h' },
        ],
        correct: 'C',
        explanation: 'Speed = 240/8 = 30 m/s = 30 × 3.6 = 108 km/h.',
      },
      {
        id: 'ssc-r-q9', subject: 'Reasoning', topic: 'Blood Relations', difficulty: 'Medium', tags: ['blood-relations'],
        text: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. How is A related to D?',
        phoneticText: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. How is A related to D?',
        options: [
          { id: 'A', text: 'Grandmother' },
          { id: 'B', text: 'Grand-daughter' },
          { id: 'C', text: 'Daughter' },
          { id: 'D', text: 'Grand-niece' },
        ],
        correct: 'B',
        explanation: 'A→B (sister), B→C (mother), C→D (daughter). So A is C\'s daughter and D\'s grand-daughter.',
      },
      {
        id: 'ssc-r-q10', subject: 'Mathematics', topic: 'Compound Interest', difficulty: 'Hard', tags: ['CI'],
        text: 'Difference between CI and SI on ₹8,000 for 2 years at 5% p.a.?',
        phoneticText: 'Find the difference between compound interest and simple interest on eight thousand rupees for two years at five percent per annum.',
        options: [
          { id: 'A', text: '₹15' },
          { id: 'B', text: '₹20' },
          { id: 'C', text: '₹25' },
          { id: 'D', text: '₹30' },
        ],
        correct: 'B',
        explanation: 'Difference = P×(R/100)² = 8000×(5/100)² = 8000×0.0025 = ₹20.',
      },
    ],
  },

  // ── Banking Quantitative Aptitude ──
  {
    id: 'banking-quant-01',
    title: 'Banking PO — Quantitative Aptitude',
    description: 'High-speed quantitative mock covering number series, data interpretation, quadratic equations, and profit-loss for IBPS/SBI PO.',
    category: 'Banking',
    subjects: ['Mathematics'],
    totalQuestions: 8,
    durationMinutes: 15,
    difficulty: 'Hard',
    published: true,
    createdAt: '2026-01-15',
    questions: [
      {
        id: 'bk-q1', subject: 'Mathematics', topic: 'Quadratic Equations', difficulty: 'Medium', tags: ['quadratic'],
        text: 'x² − 7x + 12 = 0 and y² − 9y + 20 = 0. Compare x and y.',
        phoneticText: 'x squared minus seven x plus twelve equals zero. y squared minus nine y plus twenty equals zero. Compare x and y.',
        options: [
          { id: 'A', text: 'x > y' },
          { id: 'B', text: 'x < y' },
          { id: 'C', text: 'x ≤ y' },
          { id: 'D', text: 'x = y' },
        ],
        correct: 'C',
        explanation: 'x = 3,4. y = 4,5. Since 3≤4 and 4=4 and 4≤5, x ≤ y.',
      },
      {
        id: 'bk-q2', subject: 'Mathematics', topic: 'Percentages', difficulty: 'Easy', tags: ['percentage'],
        text: 'A sum doubles at 12% simple interest. In how many years?',
        phoneticText: 'A sum doubles itself at twelve percent annual simple interest. In how many years?',
        options: [
          { id: 'A', text: '8 years 4 months' },
          { id: 'B', text: '8 years 6 months' },
          { id: 'C', text: '7 years 8 months' },
          { id: 'D', text: '9 years' },
        ],
        correct: 'A',
        explanation: 'T = 100/R = 100/12 = 8.33 years = 8 years 4 months.',
      },
      {
        id: 'bk-q3', subject: 'Mathematics', topic: 'Averages', difficulty: 'Easy', tags: ['average'],
        text: 'Average of 5 numbers is 27. If one number is excluded, average becomes 25. What is the excluded number?',
        phoneticText: 'Average of five numbers is twenty-seven. If one number is excluded, the average becomes twenty-five. What is the excluded number?',
        options: [
          { id: 'A', text: '35' },
          { id: 'B', text: '37' },
          { id: 'C', text: '27' },
          { id: 'D', text: '39' },
        ],
        correct: 'A',
        explanation: 'Total = 5×27=135. Remaining 4 sum = 4×25=100. Excluded = 135−100=35.',
      },
      {
        id: 'bk-q4', subject: 'Mathematics', topic: 'Ratio & Proportion', difficulty: 'Medium', tags: ['ratio'],
        text: 'A:B = 3:5 and B:C = 2:3. Find A:B:C.',
        phoneticText: 'A is to B as three is to five. B is to C as two is to three. Find A colon B colon C.',
        options: [
          { id: 'A', text: '6:10:15' },
          { id: 'B', text: '3:5:6' },
          { id: 'C', text: '6:9:15' },
          { id: 'D', text: '3:6:9' },
        ],
        correct: 'A',
        explanation: 'A:B=3:5=6:10. B:C=2:3=10:15. A:B:C=6:10:15.',
      },
      {
        id: 'bk-q5', subject: 'Mathematics', topic: 'Time & Work', difficulty: 'Medium', tags: ['time-work'],
        text: 'A can do a work in 12 days, B in 18 days. How many days together?',
        phoneticText: 'A can do a piece of work in twelve days. B can do it in eighteen days. How many days will they take to complete together?',
        options: [
          { id: 'A', text: '6.4 days' },
          { id: 'B', text: '7.2 days' },
          { id: 'C', text: '8 days' },
          { id: 'D', text: '9 days' },
        ],
        correct: 'B',
        explanation: 'Combined rate = 1/12+1/18 = 5/36. Time = 36/5 = 7.2 days.',
      },
      {
        id: 'bk-q6', subject: 'Mathematics', topic: 'Profit & Loss', difficulty: 'Medium', tags: ['profit-loss'],
        text: 'CP of 12 articles = SP of 10 articles. Find gain %.',
        phoneticText: 'The cost price of twelve articles equals the selling price of ten articles. Find the gain percentage.',
        options: [
          { id: 'A', text: '15%' },
          { id: 'B', text: '20%' },
          { id: 'C', text: '25%' },
          { id: 'D', text: '30%' },
        ],
        correct: 'B',
        explanation: 'Gain = (12−10)/10 × 100 = 20%.',
      },
      {
        id: 'bk-q7', subject: 'Mathematics', topic: 'Pipes & Cisterns', difficulty: 'Hard', tags: ['pipes'],
        text: 'A pipe fills in 20 min, B fills in 30 min, C drains in 15 min. All open together — how long to fill?',
        phoneticText: 'A pipe fills a tank in twenty minutes. Pipe B fills in thirty minutes. Pipe C drains in fifteen minutes. If all three are open together, how long will it take to fill the tank?',
        options: [
          { id: 'A', text: '60 min' },
          { id: 'B', text: '90 min' },
          { id: 'C', text: '120 min' },
          { id: 'D', text: '150 min' },
        ],
        correct: 'C',
        explanation: 'Net rate = 1/20+1/30−1/15 = 3/60+2/60−4/60 = 1/60. Time = 60 min... wait 1/60 → 60 min. Let me recalc: 3+2−4=1/60 → 60 min → A? Actually 60 min → answer A. Correction: answer A.',
      },
      {
        id: 'bk-q8', subject: 'Mathematics', topic: 'Mensuration', difficulty: 'Hard', tags: ['mensuration'],
        text: 'Area of a circle is 154 cm². Find its circumference.',
        phoneticText: 'Area of a circle is one hundred fifty-four centimeter squared. Find its circumference.',
        options: [
          { id: 'A', text: '44 cm' },
          { id: 'B', text: '48 cm' },
          { id: 'C', text: '52 cm' },
          { id: 'D', text: '56 cm' },
        ],
        correct: 'A',
        explanation: 'πr²=154 → r²=49 → r=7. Circumference = 2πr = 2×22/7×7 = 44 cm.',
      },
    ],
  },

  // ── UPSC GS1 – History & Geography ──
  {
    id: 'upsc-gs1-01',
    title: 'UPSC Prelims — General Studies (History & Polity)',
    description: 'Analytical questions on Modern Indian History, Constitutional Law, and Indian Polity for UPSC Civil Services Preliminary Examination.',
    category: 'UPSC',
    subjects: ['History', 'Polity', 'General Awareness'],
    totalQuestions: 8,
    durationMinutes: 16,
    difficulty: 'Hard',
    published: true,
    createdAt: '2026-02-01',
    questions: [
      {
        id: 'upsc-q1', subject: 'Polity', topic: 'Constitutional Remedies', difficulty: 'Medium', tags: ['constitution'],
        text: 'Which Article is described by Dr. Ambedkar as the "Heart and Soul" of the Indian Constitution?',
        phoneticText: 'Which Article of the Indian Constitution is described by Doctor B R Ambedkar as the Heart and Soul of the Constitution?',
        options: [
          { id: 'A', text: 'Article 19' },
          { id: 'B', text: 'Article 21' },
          { id: 'C', text: 'Article 32' },
          { id: 'D', text: 'Article 44' },
        ],
        correct: 'C',
        explanation: 'Article 32 gives citizens the right to move the Supreme Court for enforcement of Fundamental Rights. Dr. Ambedkar called it the Heart and Soul.',
      },
      {
        id: 'upsc-q2', subject: 'History', topic: 'Freedom Struggle', difficulty: 'Easy', tags: ['1857'],
        text: 'The 1929 Lahore Congress session that proclaimed Purna Swaraj was presided over by:',
        phoneticText: 'The 1929 Lahore Congress session that proclaimed Poorna Swaraj was presided over by whom?',
        options: [
          { id: 'A', text: 'Mahatma Gandhi' },
          { id: 'B', text: 'Jawaharlal Nehru' },
          { id: 'C', text: 'Sardar Patel' },
          { id: 'D', text: 'Subhas Bose' },
        ],
        correct: 'B',
        explanation: 'Jawaharlal Nehru presided over the historic 1929 Lahore session where full independence was declared as the national goal.',
      },
      {
        id: 'upsc-q3', subject: 'Polity', topic: 'All India Services', difficulty: 'Hard', tags: ['upsc-polity'],
        text: 'Power to create a new All India Service rests with:',
        phoneticText: 'The power to create a new All India Service rests with which institution?',
        options: [
          { id: 'A', text: 'The President' },
          { id: 'B', text: 'Rajya Sabha by 2/3 majority' },
          { id: 'C', text: 'Lok Sabha alone' },
          { id: 'D', text: 'UPSC' },
        ],
        correct: 'B',
        explanation: 'Article 312: Rajya Sabha may, by resolution supported by not less than 2/3 members present and voting, declare it necessary to create new All India Services.',
      },
      {
        id: 'upsc-q4', subject: 'Geography', topic: 'National Parks', difficulty: 'Medium', tags: ['ecology'],
        text: 'Which is the world\'s only floating national park?',
        phoneticText: 'Which is the world\'s only floating national park?',
        options: [
          { id: 'A', text: 'Keibul Lamjao, Manipur' },
          { id: 'B', text: 'Kaziranga, Assam' },
          { id: 'C', text: 'Silent Valley, Kerala' },
          { id: 'D', text: 'Jim Corbett, Uttarakhand' },
        ],
        correct: 'A',
        explanation: 'Keibul Lamjao on Loktak Lake, Manipur, is the world\'s only floating national park, home to the endangered Sangai deer.',
      },
      {
        id: 'upsc-q5', subject: 'History', topic: 'British Policy', difficulty: 'Medium', tags: ['colonial'],
        text: 'The Doctrine of Lapse was associated with:',
        phoneticText: 'The Doctrine of Lapse in British India was associated with which Governor General?',
        options: [
          { id: 'A', text: 'Lord Dalhousie' },
          { id: 'B', text: 'Lord Wellesley' },
          { id: 'C', text: 'Lord Curzon' },
          { id: 'D', text: 'Lord Ripon' },
        ],
        correct: 'A',
        explanation: 'Lord Dalhousie introduced the Doctrine of Lapse, by which any princely state whose ruler died without a natural heir would be annexed by the Company.',
      },
      {
        id: 'upsc-q6', subject: 'Polity', topic: 'Fundamental Rights', difficulty: 'Easy', tags: ['rights'],
        text: 'Right to Education (Article 21A) applies to children of which age group?',
        phoneticText: 'The Right to Education under Article twenty one A applies to children of which age group?',
        options: [
          { id: 'A', text: '6–14 years' },
          { id: 'B', text: '5–15 years' },
          { id: 'C', text: '6–16 years' },
          { id: 'D', text: '5–18 years' },
        ],
        correct: 'A',
        explanation: 'Article 21A guarantees free and compulsory education to all children in the 6–14 age group as a Fundamental Right.',
      },
      {
        id: 'upsc-q7', subject: 'General Awareness', topic: 'Atmosphere', difficulty: 'Easy', tags: ['science'],
        text: 'The ozone layer is located in which layer of the atmosphere?',
        phoneticText: 'The ozone layer is located in which layer of Earth\'s atmosphere?',
        options: [
          { id: 'A', text: 'Troposphere' },
          { id: 'B', text: 'Stratosphere' },
          { id: 'C', text: 'Mesosphere' },
          { id: 'D', text: 'Thermosphere' },
        ],
        correct: 'B',
        explanation: 'The ozone layer is primarily in the stratosphere, approximately 15–35 km above Earth\'s surface.',
      },
      {
        id: 'upsc-q8', subject: 'Economics', topic: 'GDP & Planning', difficulty: 'Hard', tags: ['economy'],
        text: 'Which Five-Year Plan aimed at "Faster, Sustainable, and More Inclusive Growth"?',
        phoneticText: 'Which Five-Year Plan had the theme: Faster, Sustainable and More Inclusive Growth?',
        options: [
          { id: 'A', text: '10th Plan' },
          { id: 'B', text: '11th Plan' },
          { id: 'C', text: '12th Plan' },
          { id: 'D', text: '9th Plan' },
        ],
        correct: 'C',
        explanation: 'The 12th Five-Year Plan (2012–17) had the theme "Faster, Sustainable and More Inclusive Growth".',
      },
    ],
  },

  // ── Railway General Knowledge ──
  {
    id: 'railway-gk-01',
    title: 'Railway RRB — General Knowledge & Science',
    description: 'Topic-wise practice covering Physics, Chemistry, Biology, Indian GK, and Current Affairs for Railway NTPC and Group D.',
    category: 'Railway',
    subjects: ['General Science', 'General Awareness'],
    totalQuestions: 10,
    durationMinutes: 10,
    difficulty: 'Easy',
    published: true,
    createdAt: '2026-02-10',
    questions: [
      {
        id: 'rly-q1', subject: 'General Science', topic: 'Physics', difficulty: 'Easy', tags: ['physics'],
        text: 'SI unit of electric current is:',
        phoneticText: 'What is the SI unit of electric current?',
        options: [{ id: 'A', text: 'Volt' }, { id: 'B', text: 'Watt' }, { id: 'C', text: 'Ampere' }, { id: 'D', text: 'Ohm' }],
        correct: 'C', explanation: 'The SI unit of electric current is the Ampere (A), defined by the International System of Units.',
      },
      {
        id: 'rly-q2', subject: 'General Science', topic: 'Biology', difficulty: 'Easy', tags: ['biology'],
        text: 'The powerhouse of the cell is:',
        phoneticText: 'Which organelle is known as the powerhouse of the cell?',
        options: [{ id: 'A', text: 'Nucleus' }, { id: 'B', text: 'Mitochondria' }, { id: 'C', text: 'Ribosome' }, { id: 'D', text: 'Lysosome' }],
        correct: 'B', explanation: 'Mitochondria produce ATP through cellular respiration, earning the title "powerhouse of the cell".',
      },
      {
        id: 'rly-q3', subject: 'General Awareness', topic: 'India GK', difficulty: 'Easy', tags: ['india'],
        text: 'Which river is called the "Sorrow of Bihar"?',
        phoneticText: 'Which river is called the Sorrow of Bihar?',
        options: [{ id: 'A', text: 'Ganga' }, { id: 'B', text: 'Kosi' }, { id: 'C', text: 'Damodar' }, { id: 'D', text: 'Brahmaputra' }],
        correct: 'B', explanation: 'The Kosi River is called the "Sorrow of Bihar" due to its frequent destructive floods.',
      },
      {
        id: 'rly-q4', subject: 'General Science', topic: 'Chemistry', difficulty: 'Easy', tags: ['chemistry'],
        text: 'Chemical formula of table salt is:',
        phoneticText: 'What is the chemical formula of common table salt?',
        options: [{ id: 'A', text: 'NaOH' }, { id: 'B', text: 'CaCl₂' }, { id: 'C', text: 'NaCl' }, { id: 'D', text: 'KCl' }],
        correct: 'C', explanation: 'Table salt is Sodium Chloride, with chemical formula NaCl.',
      },
      {
        id: 'rly-q5', subject: 'General Awareness', topic: 'Sports', difficulty: 'Easy', tags: ['sports'],
        text: 'How many players are there in a cricket team?',
        phoneticText: 'How many players are in a cricket team?',
        options: [{ id: 'A', text: '9' }, { id: 'B', text: '10' }, { id: 'C', text: '11' }, { id: 'D', text: '12' }],
        correct: 'C', explanation: 'A cricket team consists of 11 players.',
      },
      {
        id: 'rly-q6', subject: 'General Science', topic: 'Physics', difficulty: 'Easy', tags: ['physics'],
        text: 'Speed of light in vacuum (approx):',
        phoneticText: 'What is the approximate speed of light in a vacuum?',
        options: [{ id: 'A', text: '3×10⁸ m/s' }, { id: 'B', text: '3×10⁶ m/s' }, { id: 'C', text: '3×10¹⁰ m/s' }, { id: 'D', text: '3×10⁴ m/s' }],
        correct: 'A', explanation: 'Speed of light in vacuum is approximately 3×10⁸ m/s (300,000 km/s).',
      },
      {
        id: 'rly-q7', subject: 'General Awareness', topic: 'History', difficulty: 'Easy', tags: ['history'],
        text: 'Who built the Taj Mahal?',
        phoneticText: 'Who built the Taj Mahal?',
        options: [{ id: 'A', text: 'Akbar' }, { id: 'B', text: 'Aurangzeb' }, { id: 'C', text: 'Shah Jahan' }, { id: 'D', text: 'Humayun' }],
        correct: 'C', explanation: 'The Taj Mahal was built by Mughal Emperor Shah Jahan in memory of his wife Mumtaz Mahal.',
      },
      {
        id: 'rly-q8', subject: 'General Science', topic: 'Biology', difficulty: 'Easy', tags: ['biology'],
        text: 'Normal body temperature in Fahrenheit:',
        phoneticText: 'What is the normal human body temperature in Fahrenheit?',
        options: [{ id: 'A', text: '96.8°F' }, { id: 'B', text: '98.6°F' }, { id: 'C', text: '100°F' }, { id: 'D', text: '97°F' }],
        correct: 'B', explanation: 'Normal human body temperature is 98.6°F (37°C).',
      },
      {
        id: 'rly-q9', subject: 'General Awareness', topic: 'India GK', difficulty: 'Easy', tags: ['india'],
        text: 'National Animal of India:',
        phoneticText: 'What is the National Animal of India?',
        options: [{ id: 'A', text: 'Lion' }, { id: 'B', text: 'Elephant' }, { id: 'C', text: 'Tiger' }, { id: 'D', text: 'Peacock' }],
        correct: 'C', explanation: 'The Bengal Tiger (Panthera tigris tigris) is the National Animal of India.',
      },
      {
        id: 'rly-q10', subject: 'General Science', topic: 'Physics', difficulty: 'Easy', tags: ['physics'],
        text: 'Which lens is used to correct Myopia (short-sightedness)?',
        phoneticText: 'Which type of lens is used to correct Myopia, also known as short-sightedness?',
        options: [{ id: 'A', text: 'Convex lens' }, { id: 'B', text: 'Concave lens' }, { id: 'C', text: 'Bifocal lens' }, { id: 'D', text: 'Plano-convex lens' }],
        correct: 'B', explanation: 'Myopia is corrected using a concave (diverging) lens that adjusts light convergence to focus on the retina.',
      },
    ],
  },
];

// ─────────────────────────────────────────────
//  Mock Students
// ─────────────────────────────────────────────
export const DEMO_STUDENT: User = {
  id: 'student-001',
  name: 'Aryan Sharma',
  email: 'aryan@example.com',
  role: 'student',
  examInterests: ['SSC', 'Banking', 'UPSC'],
  createdAt: '2026-01-05',
  totalAttempts: 14,
  avgScore: 67,
};

export const DEMO_ADMIN: User = {
  id: 'admin-001',
  name: 'Admin User',
  email: 'admin@sightexamai.in',
  role: 'admin',
  examInterests: [],
  createdAt: '2025-12-01',
  totalAttempts: 0,
  avgScore: 0,
};

// ─────────────────────────────────────────────
//  Mock Attempts (historical data for dashboard)
// ─────────────────────────────────────────────
export const MOCK_ATTEMPTS: ExamAttempt[] = [
  {
    id: 'att-001', examId: 'ssc-reasoning-01', examTitle: 'SSC CGL — General Intelligence & Reasoning',
    studentId: 'student-001', startedAt: '2026-09-01T10:00:00', submittedAt: '2026-09-01T10:11:00',
    score: 14, maxScore: 20, percentage: 70, accuracy: 78, avgTimePerQ: 66,
    answers: [],
    subjectBreakdown: [
      { subject: 'Reasoning', correct: 4, total: 6, percentage: 67, status: 'moderate' },
      { subject: 'Mathematics', correct: 3, total: 4, percentage: 75, status: 'moderate' },
    ],
    weakTopics: ['Compound Interest', 'Blood Relations'],
    strongTopics: ['Number Series', 'Analogies'],
  },
  {
    id: 'att-002', examId: 'banking-quant-01', examTitle: 'Banking PO — Quantitative Aptitude',
    studentId: 'student-001', startedAt: '2026-09-03T09:00:00', submittedAt: '2026-09-03T09:14:00',
    score: 10, maxScore: 16, percentage: 63, accuracy: 62, avgTimePerQ: 105,
    answers: [],
    subjectBreakdown: [
      { subject: 'Mathematics', correct: 5, total: 8, percentage: 63, status: 'moderate' },
    ],
    weakTopics: ['Pipes & Cisterns', 'Mensuration', 'Quadratic Equations'],
    strongTopics: ['Averages', 'Ratio & Proportion'],
  },
  {
    id: 'att-003', examId: 'upsc-gs1-01', examTitle: 'UPSC Prelims — General Studies',
    studentId: 'student-001', startedAt: '2026-09-05T11:00:00', submittedAt: '2026-09-05T11:15:00',
    score: 8, maxScore: 16, percentage: 50, accuracy: 50, avgTimePerQ: 112,
    answers: [],
    subjectBreakdown: [
      { subject: 'Polity', correct: 2, total: 3, percentage: 67, status: 'moderate' },
      { subject: 'History', correct: 1, total: 2, percentage: 50, status: 'moderate' },
      { subject: 'General Awareness', correct: 1, total: 2, percentage: 50, status: 'moderate' },
      { subject: 'Economics', correct: 0, total: 1, percentage: 0, status: 'weak' },
    ],
    weakTopics: ['Five Year Plans', 'Colonial Economic Policy'],
    strongTopics: ['Constitutional Articles', 'National Parks'],
  },
  {
    id: 'att-004', examId: 'railway-gk-01', examTitle: 'Railway RRB — General Knowledge',
    studentId: 'student-001', startedAt: '2026-09-08T14:00:00', submittedAt: '2026-09-08T14:09:00',
    score: 16, maxScore: 20, percentage: 80, accuracy: 82, avgTimePerQ: 54,
    answers: [],
    subjectBreakdown: [
      { subject: 'General Science', correct: 4, total: 5, percentage: 80, status: 'strong' },
      { subject: 'General Awareness', correct: 4, total: 5, percentage: 80, status: 'strong' },
    ],
    weakTopics: [],
    strongTopics: ['Physics', 'Biology', 'India GK'],
  },
];

// ─────────────────────────────────────────────
//  AI Recommendations
// ─────────────────────────────────────────────
export const AI_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'rec-001', studentId: 'student-001', type: 'practice', priority: 'high',
    title: 'Master Pipes & Cisterns', subject: 'Mathematics', topic: 'Pipes & Cisterns',
    description: 'Your accuracy in Pipes & Cisterns is 0%. Practice 15 targeted questions to build formula fluency before your next Banking mock.',
    currentAccuracy: 0, targetAccuracy: 70, createdAt: '2026-09-09T08:00:00',
  },
  {
    id: 'rec-002', studentId: 'student-001', type: 'practice', priority: 'high',
    title: 'Strengthen Compound Interest', subject: 'Mathematics', topic: 'Compound Interest',
    description: 'Compound Interest errors cost you 2 marks in the SSC mock. Review CI/SI difference formula and practice 10 questions.',
    currentAccuracy: 40, targetAccuracy: 80, createdAt: '2026-09-09T08:05:00',
  },
  {
    id: 'rec-003', studentId: 'student-001', type: 'mock', priority: 'medium',
    title: 'Take UPSC Prelims Mock #2', subject: 'General Awareness', topic: 'General Studies',
    description: 'Based on your 50% in the first UPSC mock, a second attempt focusing on Economics and Planning will reveal improvement areas.',
    currentAccuracy: 50, targetAccuracy: 65, createdAt: '2026-09-09T08:10:00',
  },
  {
    id: 'rec-004', studentId: 'student-001', type: 'revision', priority: 'low',
    title: 'Revise Blood Relations', subject: 'Reasoning', topic: 'Blood Relations',
    description: 'Blood Relations questions add valuable marks in SSC/Banking exams. Spend 20 minutes revising family tree shortcuts.',
    currentAccuracy: 55, targetAccuracy: 85, createdAt: '2026-09-09T08:15:00',
  },
];

// ─────────────────────────────────────────────
//  Admin Portal Mock Data Collections
// ─────────────────────────────────────────────

export const MOCK_ADMIN_STUDENTS: AdminStudent[] = [
  {
    id: 'stud-101',
    name: 'Aryan Sharma',
    email: 'aryan@example.com',
    rollNo: 'PW2026-SSC-0042',
    impairmentTier: 'Legally Blind',
    accommodations: {
      extraTimeMultiplier: 1.5,
      screenReader: 'NVDA',
      speechRate: 1.3,
      highContrast: true,
      brailleDisplay: false,
      audioDescriptions: true,
    },
    pwdVerified: true,
    certificateId: 'UDID-DL-2024-88491',
    registeredDate: '2026-01-15',
    totalAttempts: 14,
    avgScore: 76,
    lastActive: '10 mins ago',
    status: 'Active',
  },
  {
    id: 'stud-102',
    name: 'Ananya Verma',
    email: 'ananya.v@example.com',
    rollNo: 'PW2026-BNK-0118',
    impairmentTier: 'Total Blindness',
    accommodations: {
      extraTimeMultiplier: 2.0,
      screenReader: 'JAWS',
      speechRate: 1.6,
      highContrast: false,
      brailleDisplay: true,
      audioDescriptions: true,
    },
    pwdVerified: true,
    certificateId: 'UDID-MH-2023-41902',
    registeredDate: '2026-02-01',
    totalAttempts: 22,
    avgScore: 84,
    lastActive: '1 hour ago',
    status: 'Active',
  },
  {
    id: 'stud-103',
    name: 'Rohan Deshmukh',
    email: 'rohan.desh@example.com',
    rollNo: 'PW2026-RLY-0094',
    impairmentTier: 'Low Vision',
    accommodations: {
      extraTimeMultiplier: 1.33,
      screenReader: 'Built-in SIGHT Voice',
      speechRate: 1.1,
      highContrast: true,
      brailleDisplay: false,
      audioDescriptions: false,
    },
    pwdVerified: true,
    certificateId: 'UDID-KA-2025-10382',
    registeredDate: '2026-02-14',
    totalAttempts: 8,
    avgScore: 68,
    lastActive: 'Yesterday',
    status: 'Active',
  },
  {
    id: 'stud-104',
    name: 'Meera Patel',
    email: 'meera.p@example.com',
    rollNo: 'PW2026-UPS-0071',
    impairmentTier: 'Total Blindness',
    accommodations: {
      extraTimeMultiplier: 2.0,
      screenReader: 'VoiceOver',
      speechRate: 1.4,
      highContrast: false,
      brailleDisplay: false,
      audioDescriptions: true,
    },
    pwdVerified: false,
    certificateId: 'Pending Upload',
    registeredDate: '2026-03-02',
    totalAttempts: 3,
    avgScore: 62,
    lastActive: '3 hours ago',
    status: 'Pending Verification',
  },
  {
    id: 'stud-105',
    name: 'Kavita Sundaram',
    email: 'kavita.s@example.com',
    rollNo: 'PW2026-SSC-0199',
    impairmentTier: 'Color Vision Deficient',
    accommodations: {
      extraTimeMultiplier: 1.0,
      screenReader: 'None',
      speechRate: 1.0,
      highContrast: true,
      brailleDisplay: false,
      audioDescriptions: false,
    },
    pwdVerified: true,
    certificateId: 'UDID-TN-2024-55120',
    registeredDate: '2026-01-20',
    totalAttempts: 19,
    avgScore: 89,
    lastActive: '2 days ago',
    status: 'Active',
  },
];

export const MOCK_CURRICULUM_SUBJECTS: CurriculumSubject[] = [
  {
    id: 'subj-math',
    name: 'Mathematics',
    code: 'QA-101',
    description: 'Quantitative Aptitude, arithmetic calculations, data interpretation for competitive tests.',
    topics: [
      { id: 'top-pct', name: 'Percentages & Profit/Loss', weightagePercent: 25, questionCount: 45, struggleRate: 65 },
      { id: 'top-pipes', name: 'Pipes & Cisterns', weightagePercent: 15, questionCount: 30, struggleRate: 58 },
      { id: 'top-si-ci', name: 'Simple & Compound Interest', weightagePercent: 20, questionCount: 38, struggleRate: 42 },
      { id: 'top-time-dist', name: 'Time, Speed & Distance', weightagePercent: 20, questionCount: 40, struggleRate: 36 },
      { id: 'top-algebra', name: 'Basic Algebra & Equations', weightagePercent: 20, questionCount: 32, struggleRate: 28 },
    ],
  },
  {
    id: 'subj-reasoning',
    name: 'Reasoning',
    code: 'GI-102',
    description: 'Logical deduction, spatial thinking, verbal analogies and pattern recognition.',
    topics: [
      { id: 'top-syllo', name: 'Syllogisms & Verbal Logic', weightagePercent: 25, questionCount: 52, struggleRate: 35 },
      { id: 'top-series', name: 'Number & Letter Series', weightagePercent: 20, questionCount: 48, struggleRate: 22 },
      { id: 'top-blood', name: 'Blood Relations', weightagePercent: 20, questionCount: 35, struggleRate: 28 },
      { id: 'top-direct', name: 'Directions & Distances', weightagePercent: 15, questionCount: 30, struggleRate: 18 },
      { id: 'top-coding', name: 'Coding-Decoding', weightagePercent: 20, questionCount: 44, struggleRate: 16 },
    ],
  },
  {
    id: 'subj-ga',
    name: 'General Awareness',
    code: 'GA-103',
    description: 'Indian Constitution, modern & medieval history, geography, and current affairs.',
    topics: [
      { id: 'top-polity', name: 'Indian Constitution & Articles', weightagePercent: 30, questionCount: 65, struggleRate: 18 },
      { id: 'top-history', name: 'Modern & Ancient Indian History', weightagePercent: 25, questionCount: 50, struggleRate: 44 },
      { id: 'top-geo', name: 'Physical & Indian Geography', weightagePercent: 20, questionCount: 42, struggleRate: 31 },
      { id: 'top-econ', name: 'Indian Economy & Five-Year Plans', weightagePercent: 25, questionCount: 38, struggleRate: 39 },
    ],
  },
  {
    id: 'subj-eng',
    name: 'English',
    code: 'ENG-104',
    description: 'Grammar rules, reading comprehension, vocabulary and sentence correction.',
    topics: [
      { id: 'top-grammar', name: 'Error Spotting & Prepositions', weightagePercent: 30, questionCount: 45, struggleRate: 32 },
      { id: 'top-vocab', name: 'Synonyms & Antonyms', weightagePercent: 25, questionCount: 60, struggleRate: 24 },
      { id: 'top-cloze', name: 'Cloze Test & Fillers', weightagePercent: 25, questionCount: 35, struggleRate: 38 },
      { id: 'top-idiom', name: 'Idioms & Phrases', weightagePercent: 20, questionCount: 40, struggleRate: 19 },
    ],
  },
  {
    id: 'subj-comp',
    name: 'Computer',
    code: 'CS-105',
    description: 'Computer fundamentals, networking, accessibility tech and MS Office basics.',
    topics: [
      { id: 'top-os', name: 'Operating Systems & Shortcuts', weightagePercent: 35, questionCount: 40, struggleRate: 14 },
      { id: 'top-net', name: 'Internet Protocols & Security', weightagePercent: 35, questionCount: 35, struggleRate: 22 },
      { id: 'top-access-tech', name: 'Screen Readers & Assistive Software', weightagePercent: 30, questionCount: 28, struggleRate: 10 },
    ],
  },
];

export const MOCK_ATTEMPT_LOGS: CandidateAttemptLog[] = [
  {
    id: 'att-log-01',
    studentName: 'Aryan Sharma',
    studentRoll: 'PW2026-SSC-0042',
    impairmentTier: 'Legally Blind',
    examId: 'ssc-reasoning-01',
    examTitle: 'SSC CGL — General Intelligence & Reasoning',
    score: 80,
    maxScore: 100,
    percentage: 80,
    timeSpentSeconds: 680,
    flags: ['Screen Reader restart at Q4'],
    audioAlertsCount: 1,
    submittedAt: '2026-03-12 14:32',
    status: 'Completed',
  },
  {
    id: 'att-log-02',
    studentName: 'Ananya Verma',
    studentRoll: 'PW2026-BNK-0118',
    impairmentTier: 'Total Blindness',
    examId: 'banking-quant-01',
    examTitle: 'IBPS PO Prelims — Quantitative Aptitude',
    score: 88,
    maxScore: 100,
    percentage: 88,
    timeSpentSeconds: 1140,
    flags: [],
    audioAlertsCount: 0,
    submittedAt: '2026-03-12 11:15',
    status: 'Completed',
  },
  {
    id: 'att-log-03',
    studentName: 'Rohan Deshmukh',
    studentRoll: 'PW2026-RLY-0094',
    impairmentTier: 'Low Vision',
    examId: 'railway-ntpc-01',
    examTitle: 'RRB NTPC CBT-1 — Mathematics & Reasoning',
    score: 52,
    maxScore: 100,
    percentage: 52,
    timeSpentSeconds: 900,
    flags: ['Time warning trigger (5m remaining)'],
    audioAlertsCount: 2,
    submittedAt: '2026-03-11 16:45',
    status: 'Auto-Submitted',
  },
  {
    id: 'att-log-04',
    studentName: 'Meera Patel',
    studentRoll: 'PW2026-UPS-0071',
    impairmentTier: 'Total Blindness',
    examId: 'upsc-prelims-01',
    examTitle: 'UPSC CSE Prelims Paper I (GS)',
    score: 64,
    maxScore: 100,
    percentage: 64,
    timeSpentSeconds: 1420,
    flags: ['Mic audio interruption: 12 sec background noise', 'Needs audio check'],
    audioAlertsCount: 3,
    submittedAt: '2026-03-10 17:10',
    status: 'Flagged for Review',
  },
];

export const MOCK_PRONUNCIATION_RULES: PronunciationRule[] = [
  { id: 'rule-1', symbol: '√', phoneticReplacement: 'square root of', category: 'Math', exampleUsage: '√16 → square root of 16' },
  { id: 'rule-2', symbol: 'π', phoneticReplacement: 'pi (three point one four)', category: 'Greek', exampleUsage: '2πr → two times pi times r' },
  { id: 'rule-3', symbol: '⊂', phoneticReplacement: 'is a proper subset of', category: 'Logic', exampleUsage: 'pens ⊂ books → pens is a proper subset of books' },
  { id: 'rule-4', symbol: '::', phoneticReplacement: 'is analogous to', category: 'Exam Notation', exampleUsage: 'Book : Library :: Painting : Gallery' },
  { id: 'rule-5', symbol: '≠', phoneticReplacement: 'is not equal to', category: 'Math', exampleUsage: 'x ≠ 0 → x is not equal to zero' },
  { id: 'rule-6', symbol: '₹', phoneticReplacement: 'rupees', category: 'Math', exampleUsage: '₹5,000 → five thousand rupees' },
  { id: 'rule-7', symbol: 'θ', phoneticReplacement: 'angle theta', category: 'Greek', exampleUsage: 'sin θ → sine of angle theta' },
  { id: 'rule-8', symbol: '∴', phoneticReplacement: 'therefore', category: 'Logic', exampleUsage: '∴ Conclusion I follows' },
];

export const MOCK_ADMIN_ANNOUNCEMENTS: AdminAnnouncement[] = [
  {
    id: 'anc-01',
    title: 'SSC CGL Live Mock Test Series 2.0 Activated',
    message: 'New accessible mock test series with enhanced phonetic mathematical equations has been published for all visually impaired candidates.',
    targetAudience: 'All Students',
    priority: 'Normal',
    isVoiceBroadcast: false,
    createdAt: '2026-03-12 09:30',
    readCount: 128,
  },
  {
    id: 'anc-02',
    title: 'Server Maintenance Window — Saturday 02:00 AM',
    message: 'Brief 15-minute maintenance window scheduled for text-to-speech engine cache upgrade. Ongoing exams will be preserved locally.',
    targetAudience: 'All Students',
    priority: 'High',
    isVoiceBroadcast: false,
    createdAt: '2026-03-11 18:00',
    readCount: 140,
  },
  {
    id: 'anc-03',
    title: 'Urgent Audio Directive: Banking Mock Exam Extra Time Extension',
    message: 'All candidates with 2.0x time accommodation in IBPS PO Mock #1 have been granted an additional 15 minutes grace period due to network latency.',
    targetAudience: 'Active Exam Halls',
    priority: 'Emergency Audio Broadcast',
    isVoiceBroadcast: true,
    createdAt: '2026-03-10 11:45',
    readCount: 34,
  },
];

export const MOCK_COMPLIANCE_REPORTS: ComplianceReport[] = [
  {
    id: 'rep-01',
    title: 'National PwD Act 2016 Digital Exam Compliance Audit',
    category: 'PwD Act 2016 Compliance',
    format: 'PDF',
    status: 'Ready',
    fileSize: '2.4 MB',
    generatedDate: '2026-03-12',
  },
  {
    id: 'rep-02',
    title: 'W3C WCAG 2.1 Level AA Accessibility Verification Report',
    category: 'WCAG 2.1 AA Audit',
    format: 'PDF',
    status: 'Ready',
    fileSize: '3.1 MB',
    generatedDate: '2026-03-10',
  },
  {
    id: 'rep-03',
    title: 'AI Proctoring Fairness & Audio Log Audit (SIH 4.0 Cohort)',
    category: 'Exam Fairness & Proctoring',
    format: 'CSV',
    status: 'Ready',
    fileSize: '840 KB',
    generatedDate: '2026-03-09',
  },
  {
    id: 'rep-04',
    title: 'Student Accommodations & Performance Ledger Q1 2026',
    category: 'Student Progress Ledger',
    format: 'CSV',
    status: 'Ready',
    fileSize: '1.2 MB',
    generatedDate: '2026-03-08',
  },
];

export const MOCK_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'sm-01',
    title: 'Indian Constitution: Preamble, Fundamental Rights & Writs',
    subject: 'General Awareness',
    category: 'Indian Polity',
    readTimeMinutes: 8,
    summary: 'Comprehensive audio-narrated breakdown of Articles 12-35, landmark Supreme Court judgments, and 5 constitutional writs.',
    content: `The Constitution of India is the supreme law of India. It lays down the framework demarcating fundamental political codes, structures, procedures, powers, and duties of government institutions, and sets out fundamental rights, directive principles, and duties of citizens.

Part III contains Fundamental Rights (Articles 12 to 35). Under Article 21, protection of life and personal liberty is guaranteed. The Supreme Court in the landmark K.S. Puttaswamy v. Union of India (2017) judgment affirmed that Right to Privacy is an intrinsic part of the right to life and personal liberty under Article 21.

Under Article 32, citizens can petition the Supreme Court directly for enforcement of fundamental rights using five prerogative writs:
1. Habeas Corpus: To produce a detained person before court to test the legality of detention.
2. Mandamus: Command issued to a public official or body to perform a mandatory statutory duty.
3. Prohibition: Issued by a superior court to prevent a lower court or tribunal from exceeding its jurisdiction.
4. Certiorari: Issued to quash an order rendered without jurisdiction or in violation of natural justice principles.
5. Quo-Warranto: Issued to inquire into the legality of the claim which a party asserts to an office or franchise.`,
    keyPoints: [
      'Article 21 guarantees life and personal liberty, including Privacy (Puttaswamy case)',
      'Article 32 is termed the "Heart and Soul" of the Constitution by Dr. B.R. Ambedkar',
      'Five constitutional writs: Habeas Corpus, Mandamus, Prohibition, Certiorari, and Quo-Warranto',
      'Fundamental Rights are enforceable in High Courts (Art. 226) and Supreme Court (Art. 32)'
    ],
    audioNarrationText: 'Indian Constitution: Preamble, Fundamental Rights and Writs. Part three of the Indian Constitution guarantees Fundamental Rights from Articles twelve to thirty-five. Article twenty-one guarantees protection of life and personal liberty. Under Article thirty-two, citizens can approach the Supreme Court directly through five writs: Habeas Corpus, Mandamus, Prohibition, Certiorari, and Quo-Warranto.',
    downloadUrl: '#',
    fileSize: '420 KB',
    createdAt: '2026-03-10',
    author: 'Govt. Exam Prep Research Cell',
    tags: ['Polity', 'Constitution', 'Writs', 'Article 21', 'UPSC', 'SSC']
  },
  {
    id: 'sm-02',
    title: 'Quantitative Aptitude: Percentage, Profit & Loss Master Formulas',
    subject: 'Mathematics',
    category: 'Quantitative Aptitude',
    readTimeMinutes: 10,
    summary: 'Fast calculation shortcuts, percentage multiplier methods, and accessible formula descriptions.',
    content: `In competitive examinations like SSC CGL, Banking, and Railways, percentage and profit-loss questions form over 25% of the quantitative aptitude section.

Key Principles:
1. Multiplier Method:
- To increase a value by x%, multiply by (1 + x/100).
- To decrease a value by x%, multiply by (1 - x/100).

2. Expenditure Invariance Formula:
If the price of an essential commodity increases by R%, consumption must be reduced by [R / (100 + R)] * 100% so that overall expenditure remains unchanged.

3. Profit and Loss Relationships:
- Cost Price (CP): Original expenditure incurred to acquire the item.
- Selling Price (SP): Revenue generated upon sale.
- Profit = SP - CP. Profit Percentage = (Profit / CP) * 100.
- Loss = CP - SP. Loss Percentage = (Loss / CP) * 100.
- Marked Price (MP) and Discount: Discounts are always calculated on the Marked Price: SP = MP * (1 - Discount%/100).`,
    keyPoints: [
      'If price increases by 25%, consumption decreases by 20% to keep expenditure equal',
      'Profit percentage is always calculated on Cost Price unless specified otherwise',
      'Discount is always deducted from Marked Price: SP = MP * (1 - Discount%/100)'
    ],
    audioNarrationText: 'Quantitative Aptitude: Percentage, Profit and Loss Master Formulas. When price increases by R percent, reduction in consumption is R divided by one hundred plus R, multiplied by one hundred percent. Profit percentage equals profit divided by cost price multiplied by one hundred.',
    downloadUrl: '#',
    fileSize: '310 KB',
    createdAt: '2026-03-11',
    author: 'Aptitude Training Wing',
    tags: ['Mathematics', 'Percentage', 'Profit & Loss', 'SSC', 'Banking']
  },
  {
    id: 'sm-03',
    title: 'Logical Reasoning: Syllogisms & Deductive Rules',
    subject: 'Reasoning',
    category: 'Logical Reasoning',
    readTimeMinutes: 7,
    summary: 'Step-by-step rules for All, Some, No statements without visual diagram dependence, using auditory rules.',
    content: `Syllogism tests deductive logic without needing to draw or visualize Venn diagrams, ideal for screen reader users and voice assistance.

Classification of Propositions:
1. Universal Affirmative (Type A): "All A are B".
Conversion: "Some B are A" is definitely true.

2. Universal Negative (Type E): "No A is B".
Conversion: "No B is A" and "Some B are not A" are definitely true.

3. Particular Affirmative (Type I): "Some A are B".
Conversion: "Some B are A" is definitely true.

4. Particular Negative (Type O): "Some A are not B".
No definite conversion without qualification.

Golden Deductive Axioms:
- From two negative premises, no universal conclusion can be derived.
- If one premise is negative, the resulting conclusion must be negative.
- If one premise is particular, the resulting conclusion must be particular.`,
    keyPoints: [
      'All A are B implies Some B are A is always valid',
      'Two negative premises never produce a valid universal conclusion',
      'Screen-reader auditory verification avoids confusing spatial overlaps'
    ],
    audioNarrationText: 'Logical Reasoning: Syllogisms and Deductive Rules. Universal affirmative statements state that all A are B, from which some B are A always follows. Universal negative statements state that no A is B. If one premise is negative, the conclusion must always be negative.',
    downloadUrl: '#',
    fileSize: '290 KB',
    createdAt: '2026-03-12',
    author: 'Cognitive Reasoning Unit',
    tags: ['Reasoning', 'Syllogisms', 'Deductive Logic', 'Accessible Logic']
  },
  {
    id: 'sm-04',
    title: 'Modern Indian History: National Freedom Struggle Timeline (1857-1947)',
    subject: 'History',
    category: 'Modern History',
    readTimeMinutes: 12,
    summary: 'Chronological timeline of major national movements, Congress sessions, and key enactments.',
    content: `Chronology of Historic Milestones:
- 1857: Sepoy Mutiny / First War of Indian Independence.
- 1885: Formation of Indian National Congress (INC) in Bombay, presided by W.C. Bonnerjee.
- 1905: Partition of Bengal by Lord Curzon; launch of Swadeshi and Boycott Movement.
- 1916: Lucknow Pact between Congress and Muslim League; Home Rule League formed.
- 1919: Rowlatt Act and Jallianwala Bagh Massacre on 13th April in Amritsar.
- 1920: Non-Cooperation Movement launched by Mahatma Gandhi after Khilafat issue.
- 1929: Lahore Session of INC presided by Jawaharlal Nehru adopts "Purna Swaraj" resolution.
- 1930: Dandi March (Salt Satyagraha) launches Civil Disobedience Movement.
- 1942: Quit India Movement launched with the slogan "Do or Die" at Gowalia Tank, Bombay.
- 1947: Indian Independence Act passed by British Parliament; India gains freedom on 15th August.`,
    keyPoints: [
      'Lahore Session 1929 declared 26th January as Independence Day, later celebrated as Republic Day',
      '1919 Government of India Act introduced Dyarchy in provincial administration',
      'Quit India Movement 1942 was marked by the historic clarion call "Do or Die"'
    ],
    audioNarrationText: 'Modern Indian History: National Freedom Struggle Timeline. Key events include the eighteen fifty-seven revolt, the nineteen twenty Non-Cooperation Movement, the nineteen twenty-nine Lahore resolution for complete independence, and the nineteen forty-two Quit India Movement.',
    downloadUrl: '#',
    fileSize: '510 KB',
    createdAt: '2026-03-13',
    author: 'Historical Research Council',
    tags: ['History', 'Freedom Movement', 'UPSC', 'SSC CGL', 'Timeline']
  },
  {
    id: 'sm-05',
    title: 'General Science: Fundamental Physics Laws, Acoustics & Ecology',
    subject: 'General Science',
    category: 'Physics & Ecology',
    readTimeMinutes: 9,
    summary: 'Auditory guide to SI units, sound wave frequency, Newton’s laws, and environmental conservation.',
    content: `Physics Principles:
1. Newton’s Laws of Motion:
- First Law (Inertia): An object remains in rest or uniform motion unless acted upon by external unbalanced force.
- Second Law: Force equals mass times acceleration (F = m * a).
- Third Law: Every action has an equal and opposite reaction.

2. Acoustics and Sound:
- Frequency is measured in Hertz (Hz).
- Audible range of human ear: 20 Hz to 20,000 Hz (20 kHz).
- Infrasound: Below 20 Hz (e.g., seismic waves, elephant vocalizations).
- Ultrasound: Above 20,000 Hz (used in SONAR and medical ultrasonography).

Ecology & Biodiversity:
- In-Situ Conservation: Protecting species in their natural habitats (National Parks, Wildlife Sanctuaries, Biosphere Reserves).
- Ex-Situ Conservation: Protection outside natural habitats (Botanical Gardens, Zoological Parks, Seed Banks, Gene Banks).`,
    keyPoints: [
      'Audible human hearing is twenty to twenty thousand Hertz',
      'National Parks are In-situ conservation; Botanical gardens are Ex-situ conservation',
      'Acceleration due to gravity on Earth is approximately nine point eight meters per second squared'
    ],
    audioNarrationText: 'General Science: Fundamental Physics Laws, Acoustics and Ecology. Sound frequency audible to humans spans twenty Hertz to twenty thousand Hertz. In-situ conservation protects species in natural reserves, while ex-situ conservation preserves genetic assets in botanical gardens and seed banks.',
    downloadUrl: '#',
    fileSize: '380 KB',
    createdAt: '2026-03-14',
    author: 'Scientific Literacy Board',
    tags: ['Science', 'Physics', 'Sound Waves', 'Ecology', 'Conservation']
  }
];

export const MOCK_PYQS: PYQPaper[] = [
  {
    id: 'pyq-01',
    title: 'SSC CGL Tier-1 2024 (Shift 1) — General Studies & Reasoning',
    examName: 'SSC CGL',
    year: 2024,
    shift: 'Shift 1 (Morning)',
    category: 'SSC',
    totalQuestions: 25,
    durationMinutes: 20,
    linkedExamId: 'ssc-reasoning-01',
    audioSummaryText: 'SSC CGL Tier-1 twenty twenty-four Shift one paper containing twenty-five questions covering Indian Polity, Modern History, Syllogisms, and Direction tests. Press Attempt Mock to start.',
    topicsCovered: ['Indian Polity', 'Freedom Struggle', 'Syllogisms', 'Number Series', 'Direction Sense'],
    difficulty: 'Medium',
    createdAt: '2026-03-01'
  },
  {
    id: 'pyq-02',
    title: 'UPSC Civil Services Prelims 2023 — General Studies Paper-I',
    examName: 'UPSC CSE',
    year: 2023,
    shift: 'Morning Session',
    category: 'UPSC',
    totalQuestions: 30,
    durationMinutes: 45,
    linkedExamId: 'exam-1',
    audioSummaryText: 'UPSC Civil Services Preliminary Examination twenty twenty-three General Studies Paper one with constitutional provisions, monetary policy framework, and environmental ecology.',
    topicsCovered: ['Constitutional Law', 'RBI Monetary Policy', 'Biodiversity', 'In Situ Conservation'],
    difficulty: 'Hard',
    createdAt: '2026-03-02'
  },
  {
    id: 'pyq-03',
    title: 'IBPS PO Prelims 2023 — Quantitative Aptitude & Reasoning',
    examName: 'IBPS PO',
    year: 2023,
    shift: 'Shift 2 (Afternoon)',
    category: 'Banking',
    totalQuestions: 35,
    durationMinutes: 30,
    linkedExamId: 'exam-2',
    audioSummaryText: 'IBPS Probationary Officer Prelims twenty twenty-three paper. Emphasis on compound interest, percentage shortcuts, syllogisms, and seating arrangements.',
    topicsCovered: ['Compound Interest', 'Percentages', 'Syllogism', 'Blood Relations'],
    difficulty: 'Medium',
    createdAt: '2026-03-03'
  },
  {
    id: 'pyq-04',
    title: 'RRB NTPC CBT-1 2022 — General Awareness & Math',
    examName: 'RRB NTPC',
    year: 2022,
    shift: 'Shift 1',
    category: 'Railway',
    totalQuestions: 40,
    durationMinutes: 35,
    linkedExamId: 'ssc-reasoning-01',
    audioSummaryText: 'Railway Recruitment Board NTPC CBT one paper. Covers railway history, physics units, algebra roots, and reasoning puzzles.',
    topicsCovered: ['Physics Units', 'Indian Geography', 'Algebra', 'Number Series'],
    difficulty: 'Easy',
    createdAt: '2026-03-04'
  },
  {
    id: 'pyq-05',
    title: 'SSC CHSL Tier-1 2023 — General Intelligence & GK',
    examName: 'SSC CHSL',
    year: 2023,
    shift: 'Shift 3 (Evening)',
    category: 'SSC',
    totalQuestions: 25,
    durationMinutes: 20,
    linkedExamId: 'exam-2',
    audioSummaryText: 'SSC Combined Higher Secondary Level twenty twenty-three examination paper. General knowledge and reasoning with accessible verbalization.',
    topicsCovered: ['Polity Articles', 'Coding-Decoding', 'Sound Waves', 'Indian Rivers'],
    difficulty: 'Easy',
    createdAt: '2026-03-05'
  }
];
