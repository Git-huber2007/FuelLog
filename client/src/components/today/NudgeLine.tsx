export function NudgeLine({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="rounded-xl bg-bg px-3 py-2 text-sm">{text}</p>;
}
