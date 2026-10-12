import type { CoachResponse } from '@fuellog/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';

/** The weekly AI review, generated only when the user asks for it. */
export function CoachCard() {
  const coach = useMutation({ mutationFn: () => api<CoachResponse>('/ai/weekly-coach', { method: 'POST' }) });
  const review = coach.data;
  return (
    <section className="card space-y-3" aria-labelledby="coach-title">
      <h2 id="coach-title" className="text-base">Weekly coach</h2>
      {review ? (
        <div className="space-y-3">
          <p className="font-semibold">{review.headline}</p>
          {review.wins.length > 0 && (
            <div>
              <h3 className="text-sm text-muted">Went well</h3>
              <ul className="list-disc pl-5">{review.wins.map((win) => <li key={win}>{win}</li>)}</ul>
            </div>
          )}
          {review.improve.length > 0 && (
            <div>
              <h3 className="text-sm text-muted">To improve</h3>
              <ul className="list-disc space-y-1 pl-5">
                {review.improve.map((point) => <li key={point.issue}>{point.issue} <span className="text-muted">{point.action}</span></li>)}
              </ul>
            </div>
          )}
          <p><span className="text-sm text-muted">Focus for next week: </span>{review.next_week_focus}</p>
          <p className="text-sm text-muted">Estimates only, not medical advice.</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Get a short review of your last 7 days of food, training, sleep and weight, with one focus for next week.</p>
      )}
      {coach.isError && <p role="alert" className="field-error">{coach.error.message}</p>}
      <button type="button" className="btn w-full" disabled={coach.isPending} onClick={() => coach.mutate()}>
        {coach.isPending ? 'Reviewing your week…' : review ? 'Review again' : 'Review my week'}
      </button>
    </section>
  );
}
