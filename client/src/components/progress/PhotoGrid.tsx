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

  if (photos.isPending) {
    return (
      <div role="status" aria-label="Loading photos" className="grid grid-cols-2 gap-3">
        <div className="aspect-[3/4] w-full rounded-2xl bg-line/20 animate-pulse" />
        <div className="aspect-[3/4] w-full rounded-2xl bg-line/20 animate-pulse" />
      </div>
    );
  }
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
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-line">
              {photo.url ? (
                <img src={photo.url} alt={`Progress photo from ${photo.log_date}`} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-sm text-muted">Photo unavailable</div>
              )}
              <button
                type="button"
                className="icon-btn absolute right-2 top-2 bg-black/40 text-white backdrop-blur hover:bg-danger hover:text-white"
                disabled={remove.isPending}
                aria-label={`Delete photo from ${photo.log_date}`}
                onClick={() => remove.mutate(photo.id)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <figcaption className="mt-1 text-sm text-muted">
              {formatDayLabel(photo.log_date, today)}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
