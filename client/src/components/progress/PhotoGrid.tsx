import { formatDayLabel, todayISO, type Photo } from '@fuellog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { EmptyState, ErrorState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';

export function PhotoGrid() {
  const qc = useQueryClient();
  const toast = useToast();
  // Signed URLs last 60 minutes, so refetch well before they expire.
  const photos = useQuery({ queryKey: ['photos'], queryFn: () => api<Photo[]>('/photos'), staleTime: 30 * 60_000 });
  const remove = useMutation({
    mutationFn: (id: string) => api<void>(`/photos/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos'] }),
    onError: (error) => toast(error.message, 'error'),
  });

  if (photos.isPending) return <p className="text-sm text-muted" role="status">Loading photos…</p>;
  if (photos.isError) return <ErrorState error={photos.error} onRetry={() => photos.refetch()} />;
  if (!photos.data.length) {
    return <EmptyState title="No progress photos yet" hint="Add one below, same spot and same light each week. Only you can see them." />;
  }
  const today = todayISO();
  return (
    <ul className="grid grid-cols-2 gap-3">
      {photos.data.map((photo) => (
        <li key={photo.id}>
          <figure>
            {photo.url
              ? <img src={photo.url} alt={`Progress photo from ${photo.log_date}`} loading="lazy" className="aspect-[3/4] w-full rounded-xl bg-line object-cover" />
              : <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-line p-2 text-center text-sm text-muted">Photo unavailable</div>}
            <figcaption className="mt-1 flex items-center justify-between gap-2 text-sm text-muted">
              {formatDayLabel(photo.log_date, today)}
              <button type="button" className="btn px-3 text-sm" disabled={remove.isPending} aria-label={`Delete photo from ${photo.log_date}`}
                onClick={() => remove.mutate(photo.id)}>Delete</button>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
