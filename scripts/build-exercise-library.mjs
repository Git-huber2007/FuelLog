/* global console, fetch, process */
// Regenerates shared/src/exerciseLibrary.json from free-exercise-db dist/exercises.json
// Run with: node scripts/build-exercise-library.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_PATH = path.resolve(__dirname, '../shared/src/exerciseLibrary.json');

const SOURCE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/dist/exercises.json';

const MUSCLE_MAP = {
  abdominals: 'Core',
  hamstrings: 'Hamstrings',
  adductors: 'Glutes and hips',
  quadriceps: 'Quads',
  biceps: 'Biceps',
  shoulders: 'Shoulders',
  chest: 'Chest',
  'middle back': 'Back',
  calves: 'Calves',
  glutes: 'Glutes and hips',
  'lower back': 'Lower back',
  lats: 'Back',
  triceps: 'Triceps',
  traps: 'Back',
  forearms: 'Forearms',
  neck: 'Neck',
  abductors: 'Glutes and hips',
};

const CATEGORY_MAP = {
  strength: 'strength',
  stretching: 'stretching',
  plyometrics: 'plyometrics',
  strongman: 'strength',
  powerlifting: 'strength',
  cardio: 'cardio',
  'olympic weightlifting': 'strength',
};

async function main() {
  console.log(`Fetching free-exercise-db exercises from ${SOURCE_URL}...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch exercises: ${res.status} ${res.statusText}`);
  }
  const db = await res.json();

  // Filter to exercises that have demo images (873 entries)
  const withImages = db.filter((x) => x.images && x.images.length > 0);

  // Sort by name matching current library sort order
  withImages.sort((a, b) => a.name.localeCompare(b.name));

  const rows = withImages.map((e) => {
    const primaryMuscle = e.primaryMuscles?.[0] ?? '';
    const muscle = MUSCLE_MAP[primaryMuscle] ?? 'Other';
    const type = CATEGORY_MAP[e.category] ?? 'strength';
    const equipment = e.equipment ?? null;
    return [e.id, e.name, e.level, type, muscle, equipment];
  });

  const content = '[\n' + rows.map((r) => JSON.stringify(r)).join(',\n') + '\n]\n';
  fs.writeFileSync(TARGET_PATH, content, 'utf8');
  console.log(`Wrote ${rows.length} exercises with equipment to ${TARGET_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
