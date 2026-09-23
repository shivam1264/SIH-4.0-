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
    totalQuestions: 15,
    durationMinutes: 15,
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
        aiSummary: 'This question tests algebraic simplification and polynomial square root concepts.',
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
        aiSummary: 'This question tests interpretation of the provided bar chart showing annual copper production across 4 mines.',
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
      {
        id: 'ssc-r-q11', subject: 'Reasoning', topic: 'Venn Diagrams', difficulty: 'Easy', tags: ['venn-diagram', 'logic'],
        text: 'Which of the following statements best represents the logical relationship among: Musicians, Instrumentalists, and Pianists?',
        phoneticText: 'Which statement best represents the logical relationship among Musicians, Instrumentalists, and Pianists?',
        diagramData: {
          type: 'bar',
          title: 'Concentric Venn Classification',
          altDescription: 'Three concentric sets where all Pianists are Instrumentalists, and all Instrumentalists are Musicians.',
          dataTable: [
            { label: 'Pianists', value: 'Subset of Instrumentalists' },
            { label: 'Instrumentalists', value: 'Subset of Musicians' }
          ]
        },
        options: [
          { id: 'A', text: 'All Pianists are Instrumentalists, and all Instrumentalists are Musicians' },
          { id: 'B', text: 'Some Pianists are Musicians, but none are Instrumentalists' },
          { id: 'C', text: 'Musicians and Pianists are completely disjoint sets' },
          { id: 'D', text: 'Instrumentalists include Musicians but exclude Pianists' },
        ],
        correct: 'A',
        explanation: 'Every pianist is an instrumentalist, and every instrumentalist is a musician. Thus, all Pianists ⊂ Instrumentalists ⊂ Musicians.',
      },
      {
        id: 'ssc-r-q12', subject: 'Mathematics', topic: 'Trigonometry', difficulty: 'Medium', tags: ['trigonometry', 'math'],
        text: 'Evaluate the trigonometric identity: \\sin^2(30^\\circ) + \\cos^2(30^\\circ)',
        phoneticText: 'Evaluate the expression: sine squared of thirty degrees plus cosine squared of thirty degrees.',
        mathFormula: '\\sin^2(30^\\circ) + \\cos^2(30^\\circ) = 1',
        mathVerbalization: 'sine squared of thirty degrees plus cosine squared of thirty degrees equals 1',
        options: [
          { id: 'A', text: '0.5' },
          { id: 'B', text: '1' },
          { id: 'C', text: '1.5' },
          { id: 'D', text: '2' },
        ],
        correct: 'B',
        explanation: 'By the fundamental Pythagorean trigonometric identity, sin²θ + cos²θ = 1 for any angle θ.',
      },
      {
        id: 'ssc-r-q13', subject: 'Reasoning', topic: 'Order & Ranking', difficulty: 'Medium', tags: ['ranking'],
        text: 'In a class of 45 students, Rohan is ranked 18th from the top. What is his rank from the bottom?',
        phoneticText: 'In a class of forty-five students, Rohan is ranked eighteenth from the top. What is his rank from the bottom?',
        options: [
          { id: 'A', text: '27th' },
          { id: 'B', text: '28th' },
          { id: 'C', text: '29th' },
          { id: 'D', text: '30th' },
        ],
        correct: 'B',
        explanation: 'Total = Top rank + Bottom rank - 1. Therefore, Bottom rank = 45 - 18 + 1 = 28th.',
      },
      {
        id: 'ssc-r-q14', subject: 'Mathematics', topic: 'LCM & HCF', difficulty: 'Easy', tags: ['numbers'],
        text: 'The HCF of two numbers is 11 and their LCM is 693. If one of the numbers is 77, find the other.',
        phoneticText: 'The highest common factor of two numbers is eleven and their least common multiple is six hundred ninety-three. If one number is seventy-seven, find the other number.',
        options: [
          { id: 'A', text: '88' },
          { id: 'B', text: '99' },
          { id: 'C', text: '101' },
          { id: 'D', text: '110' },
        ],
        correct: 'B',
        explanation: 'Product of two numbers = HCF × LCM. Other number = (11 × 693) / 77 = 693 / 7 = 99.',
      },
      {
        id: 'ssc-r-q15', subject: 'Reasoning', topic: 'Seating Arrangement', difficulty: 'Hard', tags: ['arrangement'],
        text: 'Five friends P, Q, R, S, and T are seated in a row facing North. S is between T and Q. Q is to the immediate left of R. P is to the immediate left of T. Who is seated in the exact middle?',
        phoneticText: 'Five friends P, Q, R, S, and T are seated in a row facing North. S is between T and Q. Q is to the immediate left of R. P is to the immediate left of T. Who is seated in the exact middle?',
        options: [
          { id: 'A', text: 'P' },
          { id: 'B', text: 'T' },
          { id: 'C', text: 'S' },
          { id: 'D', text: 'Q' },
        ],
        correct: 'C',
        explanation: 'From left to right the seating sequence is P - T - S - Q - R. S occupies the 3rd (middle) position.',
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
    totalQuestions: 15,
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
      {
        id: 'bk-q9', subject: 'Mathematics', topic: 'Approximation & Simplification', difficulty: 'Easy', tags: ['simplification'],
        text: 'Find the approximate value of: 39.98% of 450.02 + 59.95% of 249.89',
        phoneticText: 'Find the approximate value of: thirty-nine point ninety-eight percent of four hundred fifty point zero two, plus fifty-nine point ninety-five percent of two hundred forty-nine point eighty-nine.',
        options: [
          { id: 'A', text: '310' },
          { id: 'B', text: '330' },
          { id: 'C', text: '350' },
          { id: 'D', text: '370' },
        ],
        correct: 'B',
        explanation: 'Approximation: (40% of 450) + (60% of 250) = 180 + 150 = 330.',
      },
      {
        id: 'bk-q10', subject: 'Mathematics', topic: 'Missing Number Series', difficulty: 'Medium', tags: ['series'],
        text: 'Find the missing number in the sequence: 7, 14, 42, 168, ?',
        phoneticText: 'Find the missing number in the sequence: seven, fourteen, forty-two, one hundred sixty-eight, question mark.',
        options: [
          { id: 'A', text: '672' },
          { id: 'B', text: '720' },
          { id: 'C', text: '840' },
          { id: 'D', text: '910' },
        ],
        correct: 'C',
        explanation: 'Multiplication pattern: 7 × 2 = 14, 14 × 3 = 42, 42 × 4 = 168, 168 × 5 = 840.',
      },
      {
        id: 'bk-q11', subject: 'Mathematics', topic: 'Boats & Streams', difficulty: 'Hard', tags: ['speed-distance'],
        text: 'A boat covers 24 km upstream and 36 km downstream in 6 hours. If the speed of the stream is 2 km/h, find the speed of the boat in still water.',
        phoneticText: 'A boat covers twenty-four kilometers upstream and thirty-six kilometers downstream in six hours. If the speed of the stream is two kilometers per hour, find the speed of the boat in still water.',
        options: [
          { id: 'A', text: '8 km/h' },
          { id: 'B', text: '10 km/h' },
          { id: 'C', text: '12 km/h' },
          { id: 'D', text: '14 km/h' },
        ],
        correct: 'B',
        explanation: '24/(v - 2) + 36/(v + 2) = 6. For v = 10 km/h: 24/8 + 36/12 = 3 + 3 = 6 hours.',
      },
      {
        id: 'bk-q12', subject: 'Mathematics', topic: 'Partnership', difficulty: 'Medium', tags: ['partnership'],
        text: 'A and B invest ₹12,000 and ₹18,000 respectively in a business. After 1 year, the total profit is ₹5,000. What is A\'s share of profit?',
        phoneticText: 'A and B invest twelve thousand rupees and eighteen thousand rupees respectively in a business. After one year, the total profit is five thousand rupees. What is A\'s share of profit?',
        options: [
          { id: 'A', text: '₹2,000' },
          { id: 'B', text: '₹2,500' },
          { id: 'C', text: '₹3,000' },
          { id: 'D', text: '₹3,500' },
        ],
        correct: 'A',
        explanation: 'Investment ratio = 12000 : 18000 = 2 : 3. A\'s share = (2/5) × 5000 = ₹2,000.',
      },
      {
        id: 'bk-q13', subject: 'Mathematics', topic: 'Probability', difficulty: 'Medium', tags: ['probability'],
        text: 'A bag contains 4 red balls and 6 blue balls. If two balls are drawn at random without replacement, what is the probability that both are red?',
        phoneticText: 'A bag contains four red balls and six blue balls. If two balls are drawn at random without replacement, what is the probability that both are red?',
        options: [
          { id: 'A', text: '2/15' },
          { id: 'B', text: '1/5' },
          { id: 'C', text: '4/15' },
          { id: 'D', text: '1/3' },
        ],
        correct: 'A',
        explanation: 'Probability = (4/10) × (3/9) = (2/5) × (1/3) = 2/15.',
      },
      {
        id: 'bk-q14', subject: 'Mathematics', topic: 'Mixtures & Alligation', difficulty: 'Hard', tags: ['alligation'],
        text: 'In what ratio must tea worth ₹60 per kg be mixed with tea worth ₹65 per kg so that the mixture is worth ₹62.50 per kg?',
        phoneticText: 'In what ratio must tea worth sixty rupees per kilogram be mixed with tea worth sixty-five rupees per kilogram so that the resulting mixture is worth sixty-two point fifty rupees per kilogram?',
        options: [
          { id: 'A', text: '1 : 1' },
          { id: 'B', text: '2 : 3' },
          { id: 'C', text: '3 : 2' },
          { id: 'D', text: '3 : 4' },
        ],
        correct: 'A',
        explanation: 'By Alligation: (65 - 62.5) : (62.5 - 60) = 2.5 : 2.5 = 1 : 1.',
      },
      {
        id: 'bk-q15', subject: 'Mathematics', topic: 'Data Interpretation', difficulty: 'Medium', tags: ['chart', 'data-interpretation'],
        text: 'A bank processed retail loans over four quarters: Q1 (₹120 Cr), Q2 (₹160 Cr), Q3 (₹200 Cr), and Q4 (₹240 Cr). What was the percentage increase in loan disbursal from Q1 to Q4?',
        phoneticText: 'A bank processed retail loans over four quarters: Q1 with one hundred twenty Crore, Q2 with one hundred sixty Crore, Q3 with two hundred Crore, and Q4 with two hundred forty Crore. What was the percentage increase in loan disbursal from Q1 to Q4?',
        diagramData: {
          type: 'bar',
          title: 'Quarterly Retail Loan Disbursals (in ₹ Crores)',
          altDescription: 'Bar chart showing loan values increasing from Q1 at 120 Crore to Q4 at 240 Crore.',
          dataTable: [
            { label: 'Q1', value: '₹120 Cr' },
            { label: 'Q2', value: '₹160 Cr' },
            { label: 'Q3', value: '₹200 Cr' },
            { label: 'Q4', value: '₹240 Cr' }
          ]
        },
        options: [
          { id: 'A', text: '50%' },
          { id: 'B', text: '80%' },
          { id: 'C', text: '100%' },
          { id: 'D', text: '120%' },
        ],
        correct: 'C',
        explanation: 'Percentage increase = ((240 - 120) / 120) × 100% = 100%.',
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
    totalQuestions: 15,
    durationMinutes: 15,
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
      {
        id: 'upsc-q9', subject: 'Polity', topic: 'Preamble & Amendments', difficulty: 'Medium', tags: ['preamble'],
        text: 'The terms "Socialist", "Secular", and "Integrity" were added to the Preamble of the Indian Constitution through which Amendment Act?',
        phoneticText: 'The terms Socialist, Secular, and Integrity were added to the Preamble of the Indian Constitution through which Amendment Act?',
        options: [
          { id: 'A', text: '42nd Constitutional Amendment Act, 1976' },
          { id: 'B', text: '44th Constitutional Amendment Act, 1978' },
          { id: 'C', text: '73rd Constitutional Amendment Act, 1992' },
          { id: 'D', text: '86th Constitutional Amendment Act, 2002' },
        ],
        correct: 'A',
        explanation: 'The 42nd Constitutional Amendment Act of 1976 enacted during the Emergency added the terms Socialist, Secular, and Integrity to the Preamble.',
      },
      {
        id: 'upsc-q10', subject: 'Geography', topic: 'River Drainage Systems', difficulty: 'Medium', tags: ['rivers'],
        text: 'Which of the following Indian rivers flows westward through a linear rift valley between the Vindhya and Satpura ranges?',
        phoneticText: 'Which of the following Indian rivers flows westward through a linear rift valley between the Vindhya and Satpura ranges?',
        options: [
          { id: 'A', text: 'Mahanadi' },
          { id: 'B', text: 'Narmada' },
          { id: 'C', text: 'Krishna' },
          { id: 'D', text: 'Godavari' },
        ],
        correct: 'B',
        explanation: 'The Narmada River originates in Amarkantak and flows west through a distinct fault rift valley between Vindhyas and Satpuras into the Arabian Sea.',
      },
      {
        id: 'upsc-q11', subject: 'History', topic: 'Ancient India & Art', difficulty: 'Hard', tags: ['ancient-history'],
        text: 'The monolithic rock-cut Kailash Temple at Ellora (Cave 16) was excavated under the patronage of which ruling dynasty?',
        phoneticText: 'The monolithic rock-cut Kailash Temple at Ellora was excavated under the patronage of which ruling dynasty?',
        options: [
          { id: 'A', text: 'Chalukya Dynasty' },
          { id: 'B', text: 'Rashtrakuta Dynasty' },
          { id: 'C', text: 'Pallava Dynasty' },
          { id: 'D', text: 'Chola Dynasty' },
        ],
        correct: 'B',
        explanation: 'Rashtrakuta King Krishna I (8th century CE) commissioned the monolithic rock-cut Kailash temple at Ellora Caves.',
      },
      {
        id: 'upsc-q12', subject: 'Environment', topic: 'Biodiversity Hotspots', difficulty: 'Medium', tags: ['biodiversity'],
        text: 'Which of the following biogeographical regions is officially recognized as one of the global Biodiversity Hotspots in India?',
        phoneticText: 'Which of the following biogeographical regions is officially recognized as one of the global Biodiversity Hotspots in India?',
        options: [
          { id: 'A', text: 'Aravalli Range' },
          { id: 'B', text: 'Western Ghats' },
          { id: 'C', text: 'Thar Desert' },
          { id: 'D', text: 'Chota Nagpur Plateau' },
        ],
        correct: 'B',
        explanation: 'India features four recognized global biodiversity hotspots: Western Ghats, Himalayas, Indo-Burma, and Sundaland.',
      },
      {
        id: 'upsc-q13', subject: 'Polity', topic: 'Executive Powers', difficulty: 'Hard', tags: ['executive'],
        text: 'Under Article 72 of the Constitution, the pardoning power of the President of India differs from that of a Governor because the President alone can:',
        phoneticText: 'Under Article seventy-two of the Constitution, how does the pardoning power of the President of India differ from that of a Governor?',
        options: [
          { id: 'A', text: 'Pardon sentences awarded by a Court Martial' },
          { id: 'B', text: 'Suspend a death sentence' },
          { id: 'C', text: 'Grant remission on state laws' },
          { id: 'D', text: 'Commute life imprisonment' },
        ],
        correct: 'A',
        explanation: 'Only the President has constitutional jurisdiction to grant pardon in sentences awarded by military Court Martials, and in all capital punishment cases.',
      },
      {
        id: 'upsc-q14', subject: 'Economics', topic: 'Fiscal Policy & Deficits', difficulty: 'Hard', tags: ['economics'],
        text: 'Primary Deficit in the Union Budget is calculated as:',
        phoneticText: 'In the Union Budget of India, how is the Primary Deficit calculated?',
        options: [
          { id: 'A', text: 'Fiscal Deficit minus Interest Payments' },
          { id: 'B', text: 'Revenue Deficit minus Capital Expenditure' },
          { id: 'C', text: 'Total Expenditure minus Total Receipts' },
          { id: 'D', text: 'Monetized Deficit minus External Debt' },
        ],
        correct: 'A',
        explanation: 'Primary Deficit = Fiscal Deficit - Interest Payments. It reveals government borrowing needs net of previous debt service liabilities.',
      },
      {
        id: 'upsc-q15', subject: 'General Awareness', topic: 'Space Science', difficulty: 'Medium', tags: ['science'],
        text: 'India\'s solar observatory spacecraft placed in a halo orbit around the Sun-Earth Lagrangian Point L1 is named:',
        phoneticText: 'What is the name of India\'s dedicated solar observatory spacecraft placed at the Sun-Earth Lagrangian Point L1?',
        options: [
          { id: 'A', text: 'Chandrayaan-3' },
          { id: 'B', text: 'Aditya-L1' },
          { id: 'C', text: 'AstroSat-2' },
          { id: 'D', text: 'XPoSat' },
        ],
        correct: 'B',
        explanation: 'Aditya-L1 is ISRO\'s dedicated observatory stationed at the Sun-Earth Lagrangian point L1 (1.5 million km from Earth) to monitor solar activity uninterrupted.',
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
    totalQuestions: 15,
    durationMinutes: 15,
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
      {
        id: 'rly-q11', subject: 'General Science', topic: 'Chemistry', difficulty: 'Easy', tags: ['chemistry'],
        text: 'What is the pH value of pure distilled water at 25°C?',
        phoneticText: 'What is the pH value of pure distilled water at twenty-five degrees Celsius?',
        options: [{ id: 'A', text: '5' }, { id: 'B', text: '7' }, { id: 'C', text: '9' }, { id: 'D', text: '14' }],
        correct: 'B', explanation: 'Pure neutral water has a pH of 7 at 25°C.',
      },
      {
        id: 'rly-q12', subject: 'General Awareness', topic: 'Indian Railways', difficulty: 'Easy', tags: ['railway'],
        text: 'The first passenger train in India ran between Bombay and Thane in which year?',
        phoneticText: 'In which year did the first passenger train in India run between Bombay and Thane?',
        options: [{ id: 'A', text: '1848' }, { id: 'B', text: '1853' }, { id: 'C', text: '1857' }, { id: 'D', text: '1861' }],
        correct: 'B', explanation: 'India\'s first passenger train operated on 16th April 1853 between Bori Bunder (Bombay) and Thane over 34 km.',
      },
      {
        id: 'rly-q13', subject: 'General Science', topic: 'Physics', difficulty: 'Easy', tags: ['physics'],
        text: 'Newton\'s First Law of Motion is also popularly known as the Law of:',
        phoneticText: 'Newton\'s First Law of Motion is also known as what law?',
        options: [{ id: 'A', text: 'Inertia' }, { id: 'B', text: 'Momentum' }, { id: 'C', text: 'Acceleration' }, { id: 'D', text: 'Gravitation' }],
        correct: 'A', explanation: 'Newton\'s first law describes an object\'s resistance to changes in motion, known as the Law of Inertia.',
      },
      {
        id: 'rly-q14', subject: 'General Science', topic: 'Biology & Vitamins', difficulty: 'Easy', tags: ['biology'],
        text: 'Deficiency of Vitamin C leads to which nutritional disease?',
        phoneticText: 'Deficiency of Vitamin C leads to which nutritional disease?',
        options: [{ id: 'A', text: 'Rickets' }, { id: 'B', text: 'Scurvy' }, { id: 'C', text: 'Beriberi' }, { id: 'D', text: 'Night Blindness' }],
        correct: 'B', explanation: 'Scurvy is caused by Vitamin C deficiency. Vitamin D deficiency causes rickets, B1 causes beriberi, and Vitamin A causes night blindness.',
      },
      {
        id: 'rly-q15', subject: 'General Awareness', topic: 'Indian Constitution', difficulty: 'Easy', tags: ['polity'],
        text: 'Who is known as the Father of the Indian Constitution?',
        phoneticText: 'Who is recognized as the Father of the Indian Constitution?',
        options: [{ id: 'A', text: 'Mahatma Gandhi' }, { id: 'B', text: 'Dr. B.R. Ambedkar' }, { id: 'C', text: 'Dr. Rajendra Prasad' }, { id: 'D', text: 'Sardar Vallabhbhai Patel' }],
        correct: 'B', explanation: 'Dr. Bhimrao Ramji Ambedkar, Chairman of the Drafting Committee, is revered as the Father of the Indian Constitution.',
      },
    ],
  },

  // ── Defence NDA & CDS ──
  {
    id: 'defence-nda-01',
    title: 'Defence NDA & CDS — General Ability & English',
    description: 'Comprehensive mock covering English vocabulary, General Knowledge, Physics, and Defence awareness for NDA and CDS entrance exams.',
    category: 'Defence',
    subjects: ['English', 'Physics', 'General Knowledge'],
    totalQuestions: 15,
    durationMinutes: 15,
    difficulty: 'Medium',
    published: true,
    createdAt: '2026-02-15',
    questions: [
      {
        id: 'def-q1', subject: 'English', topic: 'Antonyms', difficulty: 'Easy', tags: ['vocabulary'],
        text: 'Choose the exact antonym for the word: TRANSPARENT',
        phoneticText: 'Choose the exact antonym for the word: TRANSPARENT.',
        options: [{ id: 'A', text: 'Opaque' }, { id: 'B', text: 'Clear' }, { id: 'C', text: 'Lucid' }, { id: 'D', text: 'Limpid' }],
        correct: 'A', explanation: 'Transparent means allowing light to pass through clearly. Its opposite is Opaque.',
      },
      {
        id: 'def-q2', subject: 'English', topic: 'Prepositions', difficulty: 'Medium', tags: ['grammar'],
        text: 'The battalion commander was confident _____ capturing the strategic outpost.',
        phoneticText: 'The battalion commander was confident blank capturing the strategic outpost.',
        options: [{ id: 'A', text: 'at' }, { id: 'B', text: 'of' }, { id: 'C', text: 'in' }, { id: 'D', text: 'with' }],
        correct: 'B', explanation: 'The adjective confident is followed by the preposition "of" when referring to outcomes.',
      },
      {
        id: 'def-q3', subject: 'Physics', topic: 'Gravitation', difficulty: 'Medium', tags: ['physics'],
        text: 'Escape velocity from the surface of Earth is approximately:',
        phoneticText: 'What is the approximate escape velocity from the surface of the Earth?',
        options: [{ id: 'A', text: '9.8 km/s' }, { id: 'B', text: '11.2 km/s' }, { id: 'C', text: '15.4 km/s' }, { id: 'D', text: '22.4 km/s' }],
        correct: 'B', explanation: 'Escape velocity v_e = √(2gR) ≈ 11.2 km/s on Earth\'s surface.',
      },
      {
        id: 'def-q4', subject: 'Physics', topic: 'Atomic Structure', difficulty: 'Easy', tags: ['physics'],
        text: 'Which subatomic particle has no electrical charge?',
        phoneticText: 'Which subatomic particle has no electrical charge?',
        options: [{ id: 'A', text: 'Proton' }, { id: 'B', text: 'Electron' }, { id: 'C', text: 'Neutron' }, { id: 'D', text: 'Positron' }],
        correct: 'C', explanation: 'Neutrons are electrically neutral nucleons discovered by James Chadwick in 1932.',
      },
      {
        id: 'def-q5', subject: 'General Knowledge', topic: 'Defence Academies', difficulty: 'Easy', tags: ['defence'],
        text: 'The premier tri-service training institute, National Defence Academy (NDA), is situated at:',
        phoneticText: 'The National Defence Academy, N D A, is situated at which location?',
        options: [{ id: 'A', text: 'Dehradun' }, { id: 'B', text: 'Khadakwasla, Pune' }, { id: 'C', text: 'Wellington' }, { id: 'D', text: 'Dundigal, Hyderabad' }],
        correct: 'B', explanation: 'NDA is located at Khadakwasla near Pune, Maharashtra.',
      },
      {
        id: 'def-q6', subject: 'General Knowledge', topic: 'Constitutional Defence', difficulty: 'Easy', tags: ['polity'],
        text: 'Who is the Supreme Commander of the Indian Armed Forces?',
        phoneticText: 'Who is the Supreme Commander of the Indian Armed Forces?',
        options: [{ id: 'A', text: 'The Prime Minister of India' }, { id: 'B', text: 'The Minister of Defence' }, { id: 'C', text: 'The President of India' }, { id: 'D', text: 'Chief of Defence Staff' }],
        correct: 'C', explanation: 'Under Article 53(2) of the Indian Constitution, the Supreme Command of the Defence Forces is vested in the President.',
      },
      {
        id: 'def-q7', subject: 'English', topic: 'Idioms & Phrases', difficulty: 'Medium', tags: ['idioms'],
        text: 'What does the idiom "To beat around the bush" mean?',
        phoneticText: 'What does the idiom To beat around the bush mean?',
        options: [{ id: 'A', text: 'To search meticulously' }, { id: 'B', text: 'To avoid talking about what is important' }, { id: 'C', text: 'To conquer an enemy position' }, { id: 'D', text: 'To act hastily' }],
        correct: 'B', explanation: 'Beating around the bush means discussing matters without getting to the core issue.',
      },
      {
        id: 'def-q8', subject: 'Physics', topic: 'Wave Optics & Sound', difficulty: 'Easy', tags: ['waves'],
        text: 'Sound waves cannot propagate through which of the following media?',
        phoneticText: 'Sound waves cannot propagate through which of the following media?',
        options: [{ id: 'A', text: 'Water' }, { id: 'B', text: 'Solid steel' }, { id: 'C', text: 'Vacuum' }, { id: 'D', text: 'Humid air' }],
        correct: 'C', explanation: 'Sound is a mechanical longitudinal wave requiring a material medium; it cannot travel through a vacuum.',
      },
      {
        id: 'def-q9', subject: 'General Knowledge', topic: 'Indigenous Defence Tech', difficulty: 'Easy', tags: ['defence'],
        text: 'India\'s indigenous single-engine multirole Light Combat Aircraft (LCA) developed by HAL is named:',
        phoneticText: 'India\'s indigenous Light Combat Aircraft developed by H A L is named what?',
        options: [{ id: 'A', text: 'Tejas' }, { id: 'B', text: 'Rafale' }, { id: 'C', text: 'Su-30MKI' }, { id: 'D', text: 'Mirage 2000' }],
        correct: 'A', explanation: 'LCA Tejas is designed by ADA and manufactured by Hindustan Aeronautics Limited (HAL).',
      },
      {
        id: 'def-q10', subject: 'Physics', topic: 'Optics & Submarines', difficulty: 'Medium', tags: ['optics'],
        text: 'A naval submarine periscope operates primarily using two plane mirrors inclined at an angle of:',
        phoneticText: 'A naval submarine periscope operates using two plane mirrors inclined at what angle?',
        options: [{ id: 'A', text: '30°' }, { id: 'B', text: '45°' }, { id: 'C', text: '60°' }, { id: 'D', text: '90°' }],
        correct: 'B', explanation: 'Periscopes use two plane mirrors or prisms mounted parallel at 45° to the axis to reflect images downward and forward.',
      },
      {
        id: 'def-q11', subject: 'General Knowledge', topic: 'Military History', difficulty: 'Easy', tags: ['history'],
        text: 'The historic Battle of Plassey which laid the foundation of British East India Company rule took place in:',
        phoneticText: 'The historic Battle of Plassey took place in which year?',
        options: [{ id: 'A', text: '1757' }, { id: 'B', text: '1764' }, { id: 'C', text: '1857' }, { id: 'D', text: '1761' }],
        correct: 'A', explanation: 'The Battle of Plassey was fought on 23 June 1757 between Robert Clive and Siraj-ud-Daulah.',
      },
      {
        id: 'def-q12', subject: 'English', topic: 'Spotting Errors', difficulty: 'Medium', tags: ['grammar'],
        text: 'Identify the error: "Neither the squad leader (A) / nor the cadets (B) / was present for parade (C) / No error (D)"',
        phoneticText: 'Identify the error: Neither the squad leader nor the cadets was present for parade.',
        options: [{ id: 'A', text: 'Neither the squad leader' }, { id: 'B', text: 'nor the cadets' }, { id: 'C', text: 'was present for parade' }, { id: 'D', text: 'No error' }],
        correct: 'C', explanation: 'When subjects are connected by neither...nor, the verb agrees with the nearer subject ("cadets" is plural -> "were present").',
      },
      {
        id: 'def-q13', subject: 'Physics', topic: 'Current Electricity', difficulty: 'Easy', tags: ['electricity'],
        text: 'According to Ohm\'s Law, the relationship between voltage V, current I, and resistance R is:',
        phoneticText: 'According to Ohm\'s Law, what is the mathematical formula connecting voltage V, current I, and resistance R?',
        mathFormula: 'V = I \\times R',
        mathVerbalization: 'voltage V equals current I multiplied by resistance R',
        options: [{ id: 'A', text: 'V = I × R' }, { id: 'B', text: 'V = I / R' }, { id: 'C', text: 'V = R / I' }, { id: 'D', text: 'V = I² × R' }],
        correct: 'A', explanation: 'Ohm\'s Law states V = I × R at constant temperature.',
      },
      {
        id: 'def-q14', subject: 'General Knowledge', topic: 'Strategic Geography', difficulty: 'Medium', tags: ['geography'],
        text: 'The Siachen Glacier, the world\'s highest battlefield, is located in which mountain range?',
        phoneticText: 'The Siachen Glacier is located in which mountain range?',
        options: [{ id: 'A', text: 'Pir Panjal' }, { id: 'B', text: 'Karakoram Range' }, { id: 'C', text: 'Zanskar Range' }, { id: 'D', text: 'Dhauladhar Range' }],
        correct: 'B', explanation: 'Siachen Glacier is situated in the eastern Karakoram range in the Himalayas, just northeast of Point NJ9842.',
      },
      {
        id: 'def-q15', subject: 'General Knowledge', topic: 'Honours & Awards', difficulty: 'Easy', tags: ['defence'],
        text: 'What is India\'s highest military decoration awarded for valor in the presence of the enemy?',
        phoneticText: 'What is India\'s highest military decoration awarded for valor in the presence of the enemy?',
        options: [{ id: 'A', text: 'Param Vir Chakra' }, { id: 'B', text: 'Maha Vir Chakra' }, { id: 'C', text: 'Ashoka Chakra' }, { id: 'D', text: 'Kirti Chakra' }],
        correct: 'A', explanation: 'The Param Vir Chakra (PVC) is India\'s highest wartime gallantry award.',
      },
    ],
  },

  // ── State PSC ──
  {
    id: 'state-psc-01',
    title: 'State PSC — General Studies & Administrative Aptitude',
    description: 'Comprehensive state civil services mock test covering Panchayati Raj, Indian Economy, Geography, Environment, and Administrative Decision Making.',
    category: 'State PSC',
    subjects: ['Polity', 'Geography', 'Economics', 'Environment'],
    totalQuestions: 15,
    durationMinutes: 15,
    difficulty: 'Medium',
    published: true,
    createdAt: '2026-02-20',
    questions: [
      {
        id: 'psc-q1', subject: 'Polity', topic: 'Local Governance', difficulty: 'Easy', tags: ['panchayat'],
        text: 'Which Constitutional Amendment Act accorded constitutional status to Panchayati Raj Institutions in India?',
        phoneticText: 'Which Constitutional Amendment Act accorded constitutional status to Panchayati Raj Institutions in India?',
        options: [{ id: 'A', text: '73rd Amendment Act, 1992' }, { id: 'B', text: '74th Amendment Act, 1992' }, { id: 'C', text: '42nd Amendment Act, 1976' }, { id: 'D', text: '44th Amendment Act, 1978' }],
        correct: 'A', explanation: 'The 73rd Amendment Act of 1992 added Part IX and the 11th Schedule to the Constitution for Panchayati Raj.',
      },
      {
        id: 'psc-q2', subject: 'Geography', topic: 'Soils of India', difficulty: 'Easy', tags: ['soils'],
        text: 'Regur soil is the traditional Indian term for which type of soil?',
        phoneticText: 'Regur soil is the traditional Indian term for which type of soil?',
        options: [{ id: 'A', text: 'Red Soil' }, { id: 'B', text: 'Black Cotton Soil' }, { id: 'C', text: 'Laterite Soil' }, { id: 'D', text: 'Alluvial Soil' }],
        correct: 'B', explanation: 'Regur soil is another name for Black Cotton Soil, ideal for cotton cultivation across the Deccan Plateau.',
      },
      {
        id: 'psc-q3', subject: 'Polity', topic: 'State Executive', difficulty: 'Medium', tags: ['ordinance'],
        text: 'Under which Article of the Constitution can a Governor promulgate an Ordinance when the State Legislative Assembly is in recess?',
        phoneticText: 'Under which Article of the Constitution can a State Governor promulgate an Ordinance?',
        options: [{ id: 'A', text: 'Article 123' }, { id: 'B', text: 'Article 213' }, { id: 'C', text: 'Article 356' }, { id: 'D', text: 'Article 163' }],
        correct: 'B', explanation: 'Article 213 empowers the Governor to issue ordinances during recess of legislature, while Article 123 applies to the President.',
      },
      {
        id: 'psc-q4', subject: 'Economics', topic: 'National Planning', difficulty: 'Easy', tags: ['niti-aayog'],
        text: 'NITI Aayog (National Institution for Transforming India) officially replaced the Planning Commission on:',
        phoneticText: 'NITI Aayog officially replaced the Planning Commission in which year?',
        options: [{ id: 'A', text: '1 January 2014' }, { id: 'B', text: '1 January 2015' }, { id: 'C', text: '15 August 2015' }, { id: 'D', text: '1 April 2016' }],
        correct: 'B', explanation: 'NITI Aayog was formed via a Cabinet resolution on 1 January 2015.',
      },
      {
        id: 'psc-q5', subject: 'Environment', topic: 'Wetlands Conservation', difficulty: 'Easy', tags: ['ramsar'],
        text: 'The international Ramsar Convention signed in 1971 is specifically dedicated to the conservation of:',
        phoneticText: 'The international Ramsar Convention is specifically dedicated to the conservation of what?',
        options: [{ id: 'A', text: 'Tropical Rainforests' }, { id: 'B', text: 'Wetlands of International Importance' }, { id: 'C', text: 'Coral Reefs' }, { id: 'D', text: 'Ozone Layer' }],
        correct: 'B', explanation: 'The Ramsar Convention is an intergovernmental treaty for the conservation and wise use of wetlands.',
      },
      {
        id: 'psc-q6', subject: 'Polity', topic: 'Center-State Financial Relations', difficulty: 'Medium', tags: ['finance-commission'],
        text: 'Under which Article of the Constitution does the President constitute the Finance Commission every five years?',
        phoneticText: 'Under which Article of the Constitution does the President constitute the Finance Commission?',
        options: [{ id: 'A', text: 'Article 280' }, { id: 'B', text: 'Article 300' }, { id: 'C', text: 'Article 324' }, { id: 'D', text: 'Article 112' }],
        correct: 'A', explanation: 'Article 280 requires the President to constitute a Finance Commission to recommend tax devolution.',
      },
      {
        id: 'psc-q7', subject: 'Geography', topic: 'Mineral Resources', difficulty: 'Easy', tags: ['minerals'],
        text: 'Khetri in the Jhunjhunu district of Rajasthan is famous across India for the mining of:',
        phoneticText: 'Khetri in Rajasthan is famous for the mining of which mineral?',
        options: [{ id: 'A', text: 'Iron ore' }, { id: 'B', text: 'Copper' }, { id: 'C', text: 'Bauxite' }, { id: 'D', text: 'Mica' }],
        correct: 'B', explanation: 'Khetri Copper Complex is renowned since the Harappan civilization for extensive copper reserves.',
      },
      {
        id: 'psc-q8', subject: 'History', topic: 'Socio-Religious Movements', difficulty: 'Easy', tags: ['renaissance'],
        text: 'Who founded the Arya Samaj in Bombay in 1875 with the motto "Go Back to the Vedas"?',
        phoneticText: 'Who founded the Arya Samaj in eighteen seventy-five with the motto Go Back to the Vedas?',
        options: [{ id: 'A', text: 'Swami Vivekananda' }, { id: 'B', text: 'Swami Dayananda Saraswati' }, { id: 'C', text: 'Raja Ram Mohan Roy' }, { id: 'D', text: 'Ishwar Chandra Vidyasagar' }],
        correct: 'B', explanation: 'Swami Dayananda Saraswati founded the Arya Samaj in 1875 promoting Vedic principles.',
      },
      {
        id: 'psc-q9', subject: 'Economics', topic: 'Agricultural Credit', difficulty: 'Easy', tags: ['nabard'],
        text: 'Which apex institution provides refinancing and supervision for agriculture and rural development credit in India?',
        phoneticText: 'Which apex institution provides refinancing for agriculture and rural development credit in India?',
        options: [{ id: 'A', text: 'SIDBI' }, { id: 'B', text: 'NABARD' }, { id: 'C', text: 'EXIM Bank' }, { id: 'D', text: 'NHB' }],
        correct: 'B', explanation: 'NABARD (National Bank for Agriculture and Rural Development) was established in 1982.',
      },
      {
        id: 'psc-q10', subject: 'Environment', topic: 'Wildlife Protection', difficulty: 'Easy', tags: ['wildlife'],
        text: 'Project Tiger, the flagship wildlife conservation initiative in India, was launched in which year?',
        phoneticText: 'Project Tiger was launched in India in which year?',
        options: [{ id: 'A', text: '1970' }, { id: 'B', text: '1973' }, { id: 'C', text: '1980' }, { id: 'D', text: '1992' }],
        correct: 'B', explanation: 'Project Tiger was launched on 1 April 1973 from Jim Corbett National Park.',
      },
      {
        id: 'psc-q11', subject: 'Polity', topic: 'Judiciary & Writs', difficulty: 'Medium', tags: ['high-court'],
        text: 'A High Court in India issues prerogative writs for enforcement of Fundamental Rights as well as legal rights under:',
        phoneticText: 'Under which Article can an Indian High Court issue prerogative writs?',
        options: [{ id: 'A', text: 'Article 32' }, { id: 'B', text: 'Article 226' }, { id: 'C', text: 'Article 136' }, { id: 'D', text: 'Article 143' }],
        correct: 'B', explanation: 'Article 226 gives High Courts wider writ jurisdiction covering both fundamental and ordinary legal rights.',
      },
      {
        id: 'psc-q12', subject: 'Geography', topic: 'Indian Climatology', difficulty: 'Easy', tags: ['monsoon'],
        text: 'The Southwest monsoon typically makes its initial landfall on the Indian mainland over which state?',
        phoneticText: 'The Southwest monsoon makes its initial landfall over which Indian state?',
        options: [{ id: 'A', text: 'Tamil Nadu' }, { id: 'B', text: 'Kerala' }, { id: 'C', text: 'Maharashtra' }, { id: 'D', text: 'Goa' }],
        correct: 'B', explanation: 'The Southwest monsoon normally strikes the Kerala coast around 1st June each year.',
      },
      {
        id: 'psc-q13', subject: 'Economics', topic: 'Statistical Indices', difficulty: 'Medium', tags: ['inflation'],
        text: 'The Consumer Price Index (CPI) numbers for inflation monitoring in India are compiled and published monthly by:',
        phoneticText: 'The Consumer Price Index numbers in India are compiled and published by which agency?',
        options: [{ id: 'A', text: 'Reserve Bank of India' }, { id: 'B', text: 'National Statistical Office (NSO)' }, { id: 'C', text: 'Department of Economic Affairs' }, { id: 'D', text: 'NITI Aayog' }],
        correct: 'B', explanation: 'The NSO in the Ministry of Statistics and Programme Implementation (MoSPI) releases the All-India CPI monthly.',
      },
      {
        id: 'psc-q14', subject: 'Geography', topic: 'Mental Ability & Distance', difficulty: 'Easy', tags: ['aptitude'],
        text: 'A district surveyor travels 3 km East and then 4 km North. What is the straight-line displacement from start?',
        phoneticText: 'A district surveyor travels three kilometers East and then four kilometers North. What is the straight-line displacement from start?',
        options: [{ id: 'A', text: '5 km' }, { id: 'B', text: '7 km' }, { id: 'C', text: '6 km' }, { id: 'D', text: '8 km' }],
        correct: 'A', explanation: 'By the Pythagorean theorem: √(3² + 4²) = √(9 + 16) = √25 = 5 km.',
      },
      {
        id: 'psc-q15', subject: 'Polity', topic: 'Good Governance & Transparency', difficulty: 'Easy', tags: ['rti'],
        text: 'The historic Right to Information (RTI) Act was passed by the Parliament of India in which year?',
        phoneticText: 'The Right to Information, RTI Act, was enacted by the Parliament of India in which year?',
        options: [{ id: 'A', text: '2002' }, { id: 'B', text: '2005' }, { id: 'C', text: '2008' }, { id: 'D', text: '2010' }],
        correct: 'B', explanation: 'The Right to Information Act came into full force on 12 October 2005.',
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
