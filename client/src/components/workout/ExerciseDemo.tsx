import { useEffect, useState } from 'react';

const FRAME_MS = 1100;

/**
 * A two-frame demo: the start and finish positions, cross-fading while it plays.
 * It starts paused, and the finish photo is only downloaded on first play, so a workout day costs half the data until asked.
 */
export function ExerciseDemo({ name, photos }: { name: string; photos: readonly [start: string, finish: string] }) {
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [finish, setFinish] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setFinish((f) => !f), FRAME_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  function toggle() {
    if (!playing) {
      setStarted(true);
      setFinish(true);
    }
    setPlaying(!playing);
  }

  if (failed) {
    return <div className="flex aspect-[3/2] items-center justify-center rounded-xl bg-line px-4 text-center text-sm text-muted">Demo photo unavailable</div>;
  }
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-line">
      <img src={photos[0]} alt={`${name}: start position`} loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      {started && (
        <img src={photos[1]} alt={`${name}: finish position`} aria-hidden={!finish} onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${finish ? 'opacity-100' : 'opacity-0'}`} />
      )}
      <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white" aria-live="off">{finish ? 'Finish' : 'Start'}</span>
      <button type="button" onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} demo of ${name}`}
        className="pressable absolute bottom-2 right-2 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-black/70 px-4 text-sm font-semibold text-white">
        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current" aria-hidden>
          {/* the play triangle sits 1px right of centre, where it looks centred */}
          {playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M3 1l8 5-8 5z" />}
        </svg>
        {playing ? 'Pause' : 'Demo'}
      </button>
    </div>
  );
}
