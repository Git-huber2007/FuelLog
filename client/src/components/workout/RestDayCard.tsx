export function RestDayCard({ sunday }: { sunday: boolean }) {
  return (
    <section className="card space-y-2" aria-labelledby="rest-title">
      <h2 id="rest-title" className="text-xl">Rest day</h2>
      <p className="text-muted">No lifting planned today. Recovery is where the muscle gets built.</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Walk for 20 to 30 minutes</li>
        <li>Stretch what feels tight</li>
        <li>Eat your protein</li>
      </ul>
      {/* The calorie target only drops on Sunday, whichever program is chosen. */}
      {sunday && <p className="text-sm text-muted">Your calorie target is 180 kcal lower today.</p>}
    </section>
  );
}
