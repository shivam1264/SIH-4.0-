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

// Add missing exams into store
let added = 0;
for (const fe of EXAMS) {
  const existing = store.exams.find((se: any) => se.id === fe.id);
  if (!existing) {
    store.exams.push(fe);
    added++;
    console.log(`Added exam: ${fe.id} - ${fe.title}`);
  }
}

if (added > 0) {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`Successfully synced ${added} exams to server/data/store.json`);
} else {
  console.log('All exams already exist in store.');
}
