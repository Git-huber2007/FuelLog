import type { Advice, ProfileResponse } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

/** The weekly adaptive adjustment. Nothing changes unless the user accepts it. */
export function AdviceCard({ advice }: { advice: Advice }) {
  const qc = useQueryClient();
  const toast = useToast();
  const apply = useMutation({
    mutationFn: () => api<ProfileResponse>('/profile/adjustment', { method: 'POST' }),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data);
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['day'] });
      toast('Calorie target updated.');
    },
    onError: (error) => toast(error.message, 'error'),
  });

  return (
    <section className="card space-y-3" aria-labelledby="advice-title">
      <h2 id="advice-title" className="card-title">Target tuning</h2>
      <p>{advice.message}</p>
      {advice.status === 'adjust' && (
        <button type="button" className="btn-primary w-full" disabled={apply.isPending} onClick={() => apply.mutate()}>
          {apply.isPending ? 'Applying…' : `Apply ${advice.delta > 0 ? '+' : '−'}${Math.abs(advice.delta)} kcal a day`}
        </button>
      )}
    </section>
  );
}
