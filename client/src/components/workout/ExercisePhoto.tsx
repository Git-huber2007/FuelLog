import { useState } from 'react';

// CDNs that serve the public-domain free-exercise-db photos.
// If jsDelivr is blocked by ISP DNS or adblockers, fall back to GitHub Raw or Statically.
const FALLBACK_ENGINES: Array<(url: string) => string> = [
  (url) =>
    url.includes('cdn.jsdelivr.net/gh/')
      ? url.replace('https://cdn.jsdelivr.net/gh/', 'https://raw.githubusercontent.com/').replace('@', '/')
      : url,
  (url) => url.replace('https://cdn.jsdelivr.net/', 'https://cdn.statically.io/'),
];

let globalUseFallback = false;

export function resolvePhotoUrl(url: string, attempt: number): string {
  if (attempt === 0) return url;
  const engine = FALLBACK_ENGINES[attempt - 1];
  return engine ? engine(url) : url;
}

interface Props {
  src: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
}

/**
 * Exercise photo with multi-CDN fallback. If jsDelivr fails (e.g. ISP or extension block),
 * it seamlessly switches to raw.githubusercontent.com or statically CDN, and finally
 * falls back to an accessible SVG exercise placeholder icon instead of a broken image icon.
 */
export function ExercisePhoto({ src, alt = '', className = '', loading = 'lazy', width, height }: Props) {
  const isCdn = src.startsWith('https://');
  const [attempt, setAttempt] = useState(() => (isCdn && globalUseFallback ? 1 : 0));
  const [failed, setFailed] = useState(false);

  const currentSrc = isCdn ? resolvePhotoUrl(src, attempt) : src;

  function handleError() {
    if (!isCdn) {
      setFailed(true);
      return;
    }
    globalUseFallback = true;
    if (attempt < FALLBACK_ENGINES.length) {
      setAttempt((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-line/60 text-muted ${className}`}
        aria-hidden="true"
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-muted/70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      width={width}
      height={height}
      crossOrigin="anonymous"
      onError={handleError}
      className={className}
    />
  );
}
