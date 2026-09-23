import { EXAMS } from '../src/data/mockData';
import fs from 'fs';
import path from 'path';

const storePath = path.resolve(process.cwd(), 'server/data/store.json');
const rawStore = fs.readFileSync(storePath, 'utf8');
const store = JSON.parse(rawStore);

console.log('Current store exams count:', store.exams.length);
console.log('Current store exam IDs:', store.exams.map((e: any) => e.id));

console.log('Frontend EXAMS count:', EXAMS.length);
console.log('Frontend EXAMS IDs:', EXAMS.map((e: any) => e.id));

// Upsert exams from frontend EXAMS into store.exams
let updatedCount = 0;
for (const fe of EXAMS) {
  const existingIdx = store.exams.findIndex((se: any) => se.id === fe.id);
  if (existingIdx >= 0) {
    store.exams[existingIdx] = { ...store.exams[existingIdx], ...fe };
    updatedCount++;
    console.log(`Updated exam: ${fe.id} (${fe.questions.length} questions)`);
  } else {
    store.exams.push(fe);
    updatedCount++;
    console.log(`Added new exam: ${fe.id} (${fe.questions.length} questions)`);
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log(`Successfully synced ${updatedCount} exams to server/data/store.json`);
