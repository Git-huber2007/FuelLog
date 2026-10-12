import type { FoodLog } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateLogs } from '../../hooks/useDay';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

export function CopyYesterdayButton({ date }: { date: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const copy = useMutation({
    mutationFn: () => api<FoodLog[]>(`/days/${date}/copy-previous`, { method: 'POST' }),
    onSuccess: (rows) => {
      invalidateLogs(qc, date);
      toast(`Copied ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'} from the day before.`);
    },
    onError: (error) => toast(error.message, 'error'),
  });
  return (
    <button type="button" className="btn w-full" disabled={copy.isPending} onClick={() => copy.mutate()}>
      {copy.isPending ? 'Copying…' : 'Copy the previous day'}
    </button>
  );
}
