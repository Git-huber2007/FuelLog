import { computeTargets, type TargetProfile } from '@fuellog/shared';

export function TargetsSummary({ profile }: { profile: TargetProfile }) {
  const base = computeTargets(profile);
  const gym = computeTargets(profile, 30);
  const rest = computeTargets(profile, -180);

  return (
    <section aria-label="Your daily targets" className="space-y-3">
      <h2 className="card-title">Your daily targets</h2>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="stat">{base.kcal}<span className="stat-unit">kcal / day</span></p>
          <p className="mt-1 text-xs text-muted">Gym day: {gym.kcal} kcal · Rest day: {rest.kcal} kcal</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="tile p-2.5 text-center">
          <p className="tile-label">Protein</p>
          <p className="tile-value text-base">{base.protein_g}g</p>
        </div>
        <div className="tile p-2.5 text-center">
          <p className="tile-label">Carbs</p>
          <p className="tile-value text-base">{gym.carbs_g}g</p>
        </div>
        <div className="tile p-2.5 text-center">
          <p className="tile-label">Fat</p>
          <p className="tile-value text-base">{base.fat_g}g</p>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted pt-0.5">
        <span>Fibre: {base.fibre_g}g</span>
        <span>Water: {(base.water_ml / 1000).toFixed(1)} L</span>
      </div>
      {profile.kcal_adjust ? (
        <p className="text-xs text-muted">Includes {profile.kcal_adjust > 0 ? '+' : ''}{profile.kcal_adjust} kcal from your weight trend.</p>
      ) : null}
    </section>
  );
}

