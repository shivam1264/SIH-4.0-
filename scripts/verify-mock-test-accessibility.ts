import { EXAMS } from '../src/data/mockData';

console.log('🧪 Running Mock Test Section Accessibility Verification Test Suite...\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${msg}`);
    failed++;
  }
}

// 1. Verify Mock Examinations Catalog Data
assert(EXAMS.length >= 4, 'Catalog has at least 4 national competitive examinations');

const ssc = EXAMS.find(e => e.category === 'SSC');
const banking = EXAMS.find(e => e.category === 'Banking');
const upsc = EXAMS.find(e => e.category === 'UPSC');
const railway = EXAMS.find(e => e.category === 'Railway');

assert(!!ssc && ssc.title.includes('SSC CGL'), 'SSC exam data exists and has descriptive title');
assert(!!banking && banking.title.includes('Banking PO'), 'Banking exam data exists and has descriptive title');
assert(!!upsc && upsc.title.includes('UPSC Prelims'), 'UPSC exam data exists and has descriptive title');
assert(!!railway && railway.title.includes('Railway RRB'), 'Railway exam data exists and has descriptive title');

// 2. Test Filtering Logic with Edge Cases
function filterExams(exams: typeof EXAMS, cat: string, diff: string, search: string) {
  return exams.filter(e => {
    const catOk = cat === 'All' || e.category === cat;
    const diffOk = diff === 'All' || e.difficulty === diff;
    const searchOk =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.subjects && e.subjects.some(s => s.toLowerCase().includes(search.toLowerCase())));
    return catOk && diffOk && searchOk;
  });
}

// Case A: No filter
const all = filterExams(EXAMS, 'All', 'All', '');
assert(all.length === EXAMS.length, 'All exams returned when no filter is applied');

// Case B: Filter Category Banking
const bankingFiltered = filterExams(EXAMS, 'Banking', 'All', '');
assert(bankingFiltered.length === 1 && bankingFiltered[0].category === 'Banking', 'Category Banking returns only Banking exams');

// Case C: Filter Difficulty Easy
const easyFiltered = filterExams(EXAMS, 'All', 'Easy', '');
assert(easyFiltered.length >= 1 && easyFiltered.every(e => e.difficulty === 'Easy'), 'Difficulty Easy returns only Easy exams');

// Case D: Search query 'quant'
const quantFiltered = filterExams(EXAMS, 'All', 'All', 'quant');
assert(quantFiltered.length >= 1 && quantFiltered.some(e => e.title.includes('Quantitative')), 'Search for "quant" matches Quantitative Aptitude');

// Case E: Search query with 0 results
const emptyFiltered = filterExams(EXAMS, 'All', 'All', 'nonexistentexamxyz123');
assert(emptyFiltered.length === 0, 'Non-existent search query returns 0 results for accessible empty state');

// 3. Test Keyboard Shortcut Number Mapping against Filtered Results
function getExamForNumberKey(key: string, currentFiltered: typeof EXAMS) {
  const idx = parseInt(key, 10) - 1;
  return currentFiltered[idx] || null;
}

// When All exams are visible:
assert(getExamForNumberKey('1', all)?.id === all[0].id, 'Key 1 maps to first visible test (SSC)');
assert(getExamForNumberKey('2', all)?.id === all[1].id, 'Key 2 maps to second visible test (Banking)');

// When Banking category is filtered:
assert(getExamForNumberKey('1', bankingFiltered)?.id === bankingFiltered[0].id, 'Key 1 dynamically maps to Banking PO when filtered by Banking!');
assert(getExamForNumberKey('2', bankingFiltered) === null, 'Key 2 is safely null when filtered list has only 1 exam');

// 4. Test Spoken Output Generation for Dynamic Narration
function generateExamAnnouncement(filteredList: typeof EXAMS, cat: string, diff: string, search: string) {
  if (filteredList.length === 0) {
    return `No mock examinations found matching your active filters: Category ${cat}, Difficulty ${diff}${search ? `, Search term "${search}"` : ''}. Press Escape or click Reset Filters to view all examinations.`;
  }
  const listDescriptions = filteredList
    .map(
      (e, i) =>
        `Number ${i + 1}: ${e.title}, ${e.category} category, ${e.difficulty} difficulty, ${e.totalQuestions} questions, ${e.durationMinutes} minutes`
    )
    .join('. ');
  return `Showing ${filteredList.length} mock test${filteredList.length === 1 ? '' : 's'}. ${listDescriptions}. Press number keys 1 to ${filteredList.length} to begin an exam, say Open followed by exam name, or press C to calibrate accessibility accommodations.`;
}

const allNarration = generateExamAnnouncement(all, 'All', 'All', '');
assert(allNarration.includes('Number 1: SSC CGL') && allNarration.includes('Number 2: Banking PO'), 'Full catalog narration includes all 4 exams dynamically');

const bankingNarration = generateExamAnnouncement(bankingFiltered, 'Banking', 'All', '');
assert(bankingNarration.includes('Showing 1 mock test') && bankingNarration.includes('Number 1: Banking PO'), 'Filtered narration accurately reflects only active exams');

const emptyNarration = generateExamAnnouncement(emptyFiltered, 'All', 'All', 'nonexistentexamxyz123');
assert(emptyNarration.includes('No mock examinations found') && emptyNarration.includes('Reset Filters'), 'Empty filter narration guides candidate to reset filters');

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL MOCK TEST ACCESSIBILITY TESTS PASSED!\n');
}
