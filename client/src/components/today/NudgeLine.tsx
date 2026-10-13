export function NudgeLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="flex items-start gap-3 rounded-2xl bg-accent/10 px-4 py-3 text-sm">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2" />
      </svg>
      <span>{text}</span>
    </p>
  );
}
