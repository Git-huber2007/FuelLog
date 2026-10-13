import { MUSCLE_LABELS, type MuscleGroup } from '@fuellog/shared';

type Shape = [x: number, y: number, width: number, height: number];

// Left-side shapes on a 120 × 240 canvas; each is mirrored to the right. Chest, core and back sit on the midline.
const LIMBS: Partial<Record<MuscleGroup, Shape>> = {
  shoulders: [22, 41, 17, 15],
  quads: [42, 120, 15, 50],
  hamstrings: [42, 120, 15, 50],
  calves: [44, 178, 12, 38],
};
const FRONT: Partial<Record<MuscleGroup, Shape[]>> = {
  chest: [[42, 45, 17, 18], [61, 45, 17, 18]],
  biceps: [[23, 58, 10, 26], [87, 58, 10, 26]],
  core: [[49, 66, 22, 38]],
};
const BACK: Partial<Record<MuscleGroup, Shape[]>> = {
  back: [[42, 45, 36, 36]],
  triceps: [[23, 58, 10, 26], [87, 58, 10, 26]],
  lowerback: [[48, 84, 24, 20]],
};
const ORDER: Record<'front' | 'back', MuscleGroup[]> = {
  front: ['shoulders', 'chest', 'core', 'biceps', 'quads', 'calves'],
  back: ['shoulders', 'back', 'lowerback', 'triceps', 'hamstrings', 'calves'],
};

const mirrored = ([x, y, w, h]: Shape): Shape[] => [[x, y, w, h], [120 - x - w, y, w, h]];
// The body outline, left side; arms and legs are capsules, mirrored like the muscles.
const BODY_LIMBS: Shape[] = [[21, 42, 14, 50], [19, 88, 11, 42], [40, 114, 19, 64], [43, 172, 14, 52]].flatMap((s) => mirrored(s as Shape));

export function MuscleFigure({ view, highlighted }: { view: 'front' | 'back'; highlighted: MuscleGroup[] }) {
  const own = view === 'front' ? FRONT : BACK;
  const worked = ORDER[view].filter((m) => highlighted.includes(m));
  return (
    <svg viewBox="0 0 120 240" className="h-44 w-auto" role="img"
      aria-label={`${view === 'front' ? 'Front' : 'Back'} of the body. ${worked.length ? `Working: ${worked.map((m) => MUSCLE_LABELS[m]).join(', ')}.` : 'Nothing highlighted.'}`}>
      <g className="fill-text/[0.08]">
        <ellipse cx="60" cy="17" rx="10.5" ry="12.5" />
        <rect x="55" y="27" width="10" height="10" rx="3" />
        <path d="M36 46C36 38 48 35 60 35s24 3 24 11l-4 46c-1 8-2 16 0 28H40c2-12 1-20 0-28Z" />
        {BODY_LIMBS.map(([x, y, width, height], i) => <rect key={i} x={x} y={y} width={width} height={height} rx={width / 2} />)}
        <ellipse cx="50" cy="227" rx="7" ry="3.5" />
        <ellipse cx="70" cy="227" rx="7" ry="3.5" />
      </g>
      {ORDER[view].map((muscle) =>
        (own[muscle] ?? mirrored(LIMBS[muscle]!)).map(([x, y, width, height], i) => (
          <rect key={`${muscle}-${i}`} x={x} y={y} width={width} height={height} rx={Math.min(9, width / 2, height / 2)}
            className={highlighted.includes(muscle) ? 'fill-accent drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]' : 'fill-text/[0.1]'} />
        )),
      )}
      <text x="60" y="239" textAnchor="middle" className="fill-muted text-[9px] font-medium uppercase tracking-[0.12em]">{view === 'front' ? 'Front' : 'Back'}</text>
    </svg>
  );
}
