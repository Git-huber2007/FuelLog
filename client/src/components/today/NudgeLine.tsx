export function NudgeLine({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="rounded-2xl bg-bg px-4 py-3 text-sm">{text}</p>;
}
