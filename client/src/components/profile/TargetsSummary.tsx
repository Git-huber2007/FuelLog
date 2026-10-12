import { computeTargets, type TargetProfile } from '@fuellog/shared';

export function TargetsSummary({ profile }: { profile: TargetProfile }) {
  const base = computeTargets(profile);
  const gym = computeTargets(profile, 30);
  const rest = computeTargets(profile, -180);
  const rows: [string, string][] = [
    ['Gym day (Mon to Sat)', `${gym.kcal} kcal`],
    ['Rest day (Sun)', `${rest.kcal} kcal`],
    ['Base', `${base.kcal} kcal`],
    ['Protein', `${base.protein_g} g`],
    ['Carbs (gym day)', `${gym.carbs_g} g`],
    ['Fat', `${base.fat_g} g`],
    ['Fibre', `${base.fibre_g} g`],
    ['Water', `${(base.water_ml / 1000).toFixed(1)} L`],
  ];
  return (
    <section aria-label="Your daily targets">
      <h2 className="text-base">Your daily targets</h2>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {profile.kcal_adjust ? (
        <p className="mt-2 text-sm text-muted">Includes {profile.kcal_adjust > 0 ? '+' : ''}{profile.kcal_adjust} kcal from your weight trend.</p>
      ) : null}
    </section>
  );
}
