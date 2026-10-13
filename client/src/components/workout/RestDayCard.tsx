import { Link } from 'react-router-dom';

export function RestDayCard({ programName, delta, sunday }: { programName?: string; delta?: number; sunday?: boolean }) {
  const lower = delta !== undefined ? delta < 0 : sunday;
  const amount = delta !== undefined ? Math.abs(delta) : 180;
  return (
    <section className="card space-y-2" aria-labelledby="rest-title">
      <h2 id="rest-title" className="text-xl">Rest day</h2>
      {programName && (
        <p className="text-sm text-muted">
          <span>{programName}</span> · <Link to="/profile" className="link">Change</Link>
        </p>
      )}
      <p className="text-muted">No lifting planned today. Recovery is where the muscle gets built.</p>
      <ul className="list-dot space-y-1">
        <li>Walk for 20 to 30 minutes</li>
        <li>Stretch what feels tight</li>
        <li>Eat your protein</li>
      </ul>
      {lower && <p className="text-sm text-muted">Your calorie target is {amount} kcal lower today.</p>}
    </section>
  );
}
