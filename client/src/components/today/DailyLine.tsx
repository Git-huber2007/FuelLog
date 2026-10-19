// FuelLog's own lines, so nothing is put in a real person's mouth.
const LINES = [
  'Small meals logged beat perfect meals forgotten.',
  'Protein first, then everything else.',
  'Show up today. Progress is a stack of ordinary days.',
  'One more rep than last time is a win.',
  'The scale moves slowly. Your habits move it.',
  'Water, sleep, protein. Get the basics right.',
  'A missed day is not a lost week. Log the next meal.',
  'Strength is built on boring sets done well.',
  'Eat like you want to train tomorrow.',
  'Rest days are part of the program.',
  'Good form today, heavier weight later.',
  'You do not need motivation. You need the next set.',
  'Every logged day teaches your target something.',
  'Slow progress is still progress.',
];

/** One line per calendar day, the same all day. */
export function DailyLine({ date }: { date: string }) {
  const day = Math.floor(Date.parse(`${date}T00:00Z`) / 86_400_000);
  return <p className="px-1 text-sm text-muted">{LINES[day % LINES.length]}</p>;
}
