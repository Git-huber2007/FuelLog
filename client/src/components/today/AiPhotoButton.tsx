import type { AiParseResponse, Meal } from '@fuellog/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { blobToBase64, shrinkImage } from '../../lib/shrinkImage';
import { useToast } from '../ui/Toast';

/** A plate or a nutrition label. The photo is shrunk to 1024 px and re-encoded in the browser before it is sent. */
export function AiPhotoButton({ date, meal, onResult }: { date: string; meal: Meal; onResult: (result: AiParseResponse) => void }) {
  const toast = useToast();
  const parse = useMutation({
    mutationFn: async (file: File) => {
      const imageBase64 = await blobToBase64(await shrinkImage(file, 1024));
      return api<AiParseResponse>('/ai/parse-photo', { body: { imageBase64, mimeType: 'image/jpeg', date, meal } });
    },
    onSuccess: onResult,
    onError: (error) => toast(error.message, 'error'),
  });

  return (
    <label className={`btn cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${parse.isPending ? 'opacity-50' : ''}`}>
      {parse.isPending ? 'Reading photo…' : 'Photo of meal or label'}
      <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={parse.isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // so choosing the same photo again still fires
          if (file) parse.mutate(file);
        }} />
    </label>
  );
}
