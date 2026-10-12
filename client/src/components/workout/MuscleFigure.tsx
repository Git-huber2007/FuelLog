import { MUSCLE_LABELS, type MuscleGroup } from '@fuellog/shared';

type Shape = [x: number, y: number, width: number, height: number];

// Left-side shapes on a 120 × 240 canvas; each is mirrored to the right. Chest, core and back sit on the midline.
const LIMBS: Partial<Record<MuscleGroup, Shape>> = {
  shoulders: [26, 44, 18, 16],
  quads: [42, 122, 16, 52],
  hamstrings: [42, 122, 16, 52],
  calves: [43, 182, 13, 42],
};
const FRONT: Partial<Record<MuscleGroup, Shape[]>> = {
  chest: [[43, 48, 16, 20], [61, 48, 16, 20]],
  biceps: [[24, 62, 12, 28], [84, 62, 12, 28]],
  core: [[46, 72, 28, 40]],
};
const BACK: Partial<Record<MuscleGroup, Shape[]>> = {
  back: [[43, 48, 34, 36]],
  triceps: [[24, 62, 12, 28], [84, 62, 12, 28]],
  lowerback: [[47, 88, 26, 24]],
};
const ORDER: Record<'front' | 'back', MuscleGroup[]> = {
  front: ['shoulders', 'chest', 'core', 'biceps', 'quads', 'calves'],
  back: ['shoulders', 'back', 'lowerback', 'triceps', 'hamstrings', 'calves'],
};

const mirrored = ([x, y, w, h]: Shape): Shape[] => [[x, y, w, h], [120 - x - w, y, w, h]];

export function MuscleFigure({ view, highlighted }: { view: 'front' | 'back'; highlighted: MuscleGroup[] }) {
  const own = view === 'front' ? FRONT : BACK;
  const worked = ORDER[view].filter((m) => highlighted.includes(m));
  return (
    <svg viewBox="0 0 120 240" className="h-56 w-auto" role="img"
      aria-label={`${view === 'front' ? 'Front' : 'Back'} of the body. ${worked.length ? `Working: ${worked.map((m) => MUSCLE_LABELS[m]).join(', ')}.` : 'Nothing highlighted.'}`}>
      {/* Silhouette: head, neck, torso, forearms, hips */}
      <g className="fill-line">
        <circle cx="60" cy="20" r="14" />
        <rect x="54" y="32" width="12" height="12" />
        <rect x="40" y="44" width="40" height="72" rx="8" />
        <rect x="23" y="92" width="11" height="34" rx="5" />
        <rect x="86" y="92" width="11" height="34" rx="5" />
        <rect x="42" y="110" width="36" height="16" rx="6" />
      </g>
      {ORDER[view].map((muscle) =>
        (own[muscle] ?? mirrored(LIMBS[muscle]!)).map(([x, y, width, height], i) => (
          <rect key={`${muscle}-${i}`} x={x} y={y} width={width} height={height} rx="6" strokeWidth="1.5"
            className={`stroke-card ${highlighted.includes(muscle) ? 'fill-accent' : 'fill-muted/30'}`} />
        )),
      )}
      <text x="60" y="236" textAnchor="middle" className="fill-muted text-[10px]">{view === 'front' ? 'Front' : 'Back'}</text>
    </svg>
  );
}
