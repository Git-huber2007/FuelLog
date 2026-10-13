import { MUSCLE_LABELS, type MuscleGroup } from '@fuellog/shared';

type Shape = [x: number, y: number, width: number, height: number];

const LIMBS: Partial<Record<MuscleGroup, Shape>> = {
  shoulders: [22, 41, 17, 15],
  quads: [42, 120, 15, 50],
  hamstrings: [42, 120, 15, 50],
  calves: [44, 178, 12, 38],
};

const CHEST_PATHS = [
  'M42 46 C42 44 57 44 58 45 L58 61 C58 63 50 64 43 61 C41 58 41 51 42 46 Z',
  'M78 46 C78 44 63 44 62 45 L62 61 C62 63 70 64 77 61 C79 58 79 51 78 46 Z',
];

const FRONT_CORE: Shape = [49, 66, 22, 38];
const BACK_SHAPES: Partial<Record<MuscleGroup, Shape[]>> = {
  back: [[42, 45, 36, 36]],
  lowerback: [[48, 84, 24, 20]],
};

const ORDER: Record<'front' | 'back', MuscleGroup[]> = {
  front: ['shoulders', 'chest', 'core', 'biceps', 'quads', 'calves'],
  back: ['shoulders', 'back', 'lowerback', 'triceps', 'hamstrings', 'calves'],
};

const mirrored = ([x, y, w, h]: Shape): Shape[] => [[x, y, w, h], [120 - x - w, y, w, h]];

export function MuscleFigure({ view, highlighted }: { view: 'front' | 'back'; highlighted: MuscleGroup[] }) {
  const worked = ORDER[view].filter((m) => highlighted.includes(m));

  return (
    <figure className="flex flex-col items-center">
      <svg
        viewBox="0 0 120 234"
        className="h-44 w-auto"
        role="img"
        aria-label={`${view === 'front' ? 'Front' : 'Back'} of the body. ${
          worked.length ? `Working: ${worked.map((m) => MUSCLE_LABELS[m]).join(', ')}.` : 'Nothing highlighted.'
        }`}
      >
        {/* Clean silhouette */}
        <g className="fill-text/[0.08]">
          <ellipse cx="60" cy="17" rx="10.5" ry="12.5" />
          <rect x="55" y="27" width="10" height="10" rx="3" />
          <path d="M36 46C36 38 48 35 60 35s24 3 24 11l-4 46c-1 8-2 16 0 28H40c2-12 1-20 0-28Z" />
          {/* Angled arms: ~8 degrees away from torso */}
          <g transform="rotate(-8 28 42)">
            <rect x="21" y="42" width="14" height="50" rx="7" />
            <rect x="19" y="88" width="11" height="42" rx="5.5" />
          </g>
          <g transform="rotate(8 92 42)">
            <rect x="85" y="42" width="14" height="50" rx="7" />
            <rect x="90" y="88" width="11" height="42" rx="5.5" />
          </g>
          {/* Legs & feet */}
          <rect x="40" y="114" width="19" height="64" rx="9.5" />
          <rect x="61" y="114" width="19" height="64" rx="9.5" />
          <rect x="43" y="172" width="14" height="52" rx="7" />
          <rect x="63" y="172" width="14" height="52" rx="7" />
          <ellipse cx="50" cy="227" rx="7" ry="3.5" />
          <ellipse cx="70" cy="227" rx="7" ry="3.5" />
        </g>

        {/* Worked muscles only: drawn over the clean silhouette, glow on dark theme only */}
        {highlighted.includes('shoulders') && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            <rect x="22" y="41" width="17" height="15" rx="7.5" />
            <rect x="81" y="41" width="17" height="15" rx="7.5" />
          </g>
        )}

        {view === 'front' && highlighted.includes('chest') && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            {CHEST_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        )}

        {view === 'front' && highlighted.includes('core') && (
          <rect
            x={FRONT_CORE[0]}
            y={FRONT_CORE[1]}
            width={FRONT_CORE[2]}
            height={FRONT_CORE[3]}
            rx="9"
            className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]"
          />
        )}

        {view === 'front' && highlighted.includes('biceps') && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            <g transform="rotate(-8 28 42)">
              <rect x="23" y="58" width="10" height="26" rx="5" />
            </g>
            <g transform="rotate(8 92 42)">
              <rect x="87" y="58" width="10" height="26" rx="5" />
            </g>
          </g>
        )}

        {view === 'back' && highlighted.includes('back') && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            {BACK_SHAPES.back!.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="9" />
            ))}
          </g>
        )}

        {view === 'back' && highlighted.includes('lowerback') && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            {BACK_SHAPES.lowerback!.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="9" />
            ))}
          </g>
        )}

        {view === 'back' && highlighted.includes('triceps') && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            <g transform="rotate(-8 28 42)">
              <rect x="23" y="58" width="10" height="26" rx="5" />
            </g>
            <g transform="rotate(8 92 42)">
              <rect x="87" y="58" width="10" height="26" rx="5" />
            </g>
          </g>
        )}

        {((view === 'front' && highlighted.includes('quads')) || (view === 'back' && highlighted.includes('hamstrings'))) && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            {mirrored(LIMBS[view === 'front' ? 'quads' : 'hamstrings']!).map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="7.5" />
            ))}
          </g>
        )}

        {highlighted.includes('calves') && (
          <g className="fill-accent dark:drop-shadow-[0_0_6px_rgb(var(--accent)/0.55)]">
            {mirrored(LIMBS.calves!).map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="6" />
            ))}
          </g>
        )}
      </svg>
      <figcaption className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {view === 'front' ? 'Front' : 'Back'}
      </figcaption>
    </figure>
  );
}
