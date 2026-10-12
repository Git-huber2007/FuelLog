import { todayISO } from '@fuellog/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

/** Downloads every day's totals as CSV. Fetched with the auth header, so the token never appears in a URL. */
export function ExportButton() {
  const toast = useToast();
  const download = useMutation({
    mutationFn: () => api<Blob>('/export.csv'),
    onSuccess: (csv) => {
      const url = URL.createObjectURL(csv);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fuellog-${todayISO()}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000); // revoking at once cancels the download in Safari
    },
    onError: (error) => toast(error.message, 'error'),
  });
  return (
    <button type="button" className="btn w-full" disabled={download.isPending} onClick={() => download.mutate()}>
      {download.isPending ? 'Preparing…' : 'Export all days as CSV'}
    </button>
  );
}
