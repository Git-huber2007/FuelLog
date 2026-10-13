import { todayISO } from '@fuellog/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

/** Downloads data as CSV or complete JSON. Fetched with the auth header, so the token never appears in a URL. */
export function ExportButton() {
  const toast = useToast();

  const downloadCsv = useMutation({
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

  const downloadJson = useMutation({
    mutationFn: () => api<Blob>('/export.json'),
    onSuccess: (json) => {
      const url = URL.createObjectURL(json);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fuellog-${todayISO()}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
    onError: (error) => toast(error.message, 'error'),
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" className="btn" disabled={downloadCsv.isPending} onClick={() => downloadCsv.mutate()}>
        {downloadCsv.isPending ? 'Preparing…' : 'Export CSV'}
      </button>
      <button type="button" className="btn" disabled={downloadJson.isPending} onClick={() => downloadJson.mutate()}>
        {downloadJson.isPending ? 'Preparing…' : 'Export JSON'}
      </button>
    </div>
  );
}
