import { ParseTextBody, type AiParseResponse, type Meal } from '@fuellog/shared';
import { useMutation } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { api } from '../../lib/apiClient';

const MAX = 500;

export function AiTextForm({ date, meal, onResult }: { date: string; meal: Meal; onResult: (result: AiParseResponse) => void }) {
  const id = useId();
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const parse = useMutation({
    mutationFn: (body: { text: string; date: string; meal: Meal }) => api<AiParseResponse>('/ai/parse-text', { body }),
    onSuccess: (result) => {
      setText('');
      onResult(result);
    },
    onError: (err) => setError(err.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = ParseTextBody.safeParse({ text, date, meal });
    if (!parsed.success) return setError('Describe the meal in 2 to 500 characters.');
    setError(undefined);
    parse.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2 rounded-2xl border border-line p-3">
      <label htmlFor={id} className="label">Describe what you ate</label>
      <textarea id={id} className="input py-2" rows={3} maxLength={MAX} placeholder="2 rotis, dal, 1 bowl rice" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm tabular-nums text-muted">{text.length} / {MAX}</span>
        <button className="btn-primary" disabled={parse.isPending}>{parse.isPending ? 'Estimating…' : 'Estimate and log'}</button>
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
    </form>
  );
}
