import { useEffect, useState } from 'react';
import { resolvePhotoUrl } from './ExercisePhoto';

const FRAME_MS = 1100;

/**
 * A two-frame demo: the start and finish positions, cross-fading while it plays.
 * It starts paused, and the finish photo is only downloaded on first play, so a workout day costs half the data until asked.
 */
export function ExerciseDemo({ name, photos }: { name: string; photos: readonly [start: string, finish: string] }) {
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [finish, setFinish] = useState(false);
  const [attempt0, setAttempt0] = useState(0);
  const [attempt1, setAttempt1] = useState(0);
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

  function handlePhoto0Error() {
    if (attempt0 < 3) {
      setAttempt0((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  }

  function handlePhoto1Error() {
    if (attempt1 < 3) {
      setAttempt1((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return <div className="flex aspect-[2/1] items-center justify-center rounded-2xl bg-line px-4 text-center text-sm text-muted">Demo photo unavailable</div>;
  }
  return (
    <div className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-line">
      <img
        src={resolvePhotoUrl(photos[0], attempt0)}
        alt={`${name}: start position`}
        loading="lazy"
        onError={handlePhoto0Error}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {started && (
        <img
          src={resolvePhotoUrl(photos[1], attempt1)}
          alt={`${name}: finish position`}
          aria-hidden={!finish}
          onError={handlePhoto1Error}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${finish ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white" aria-live="off">{finish ? 'End position' : 'Start position'}</span>
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
