import { todayISO } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useSession';
import { api } from '../../lib/apiClient';
import { shrinkImage } from '../../lib/shrinkImage';
import { PHOTO_BUCKET, supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';

/** Re-encodes the photo in the browser (which strips location data), uploads it to the user's private folder, then records it. */
export function PhotoUploadButton() {
  const qc = useQueryClient();
  const toast = useToast();
  const { session } = useSession();
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const storage_path = `${session!.user.id}/${crypto.randomUUID()}.jpg`;
      const blob = await shrinkImage(file, 1600);
      const bucket = supabase.storage.from(PHOTO_BUCKET);
      const stored = await bucket.upload(storage_path, blob, { contentType: 'image/jpeg' });
      if (stored.error) throw new Error('The photo could not be uploaded. Try again.');
      try {
        await api('/photos', { body: { log_date: todayISO(), storage_path } });
      } catch (error) {
        await bucket.remove([storage_path]); // do not leave a file nothing points to
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photos'] });
      toast('Photo added.');
    },
    onError: (error) => toast(error.message, 'error'),
  });

  return (
    <label className={`btn w-full cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${upload.isPending ? 'opacity-50' : ''}`}>
      {upload.isPending ? 'Uploading…' : 'Add a progress photo'}
      <input type="file" accept="image/*" className="sr-only" disabled={upload.isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) upload.mutate(file);
        }} />
    </label>
  );
}
