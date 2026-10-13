import { useState } from 'react';

/**
 * Extracts exercise key and frame filename from /api/exercises/:key/:frame or CDN URLs.
 * Returns null for local built-in split photos (/exercises/mon-bench-press-0.jpg).
 */
export function parseExercisePath(url: string): { key: string; frame: string } | null {
  const match = url.match(/\/exercises\/([^/]+)\/([01]\.jpg)/);
  if (match) return { key: match[1], frame: match[2] };
  return null;
}

/**
 * Resolves exercise photo URL across 4 tiers:
 * Tier 0: Same-origin API proxy (/api/exercises/:key/:frame) - bypasses ISP/adblock DNS filtering.
 * Tier 1: GitHub Raw (raw.githubusercontent.com)
 * Tier 2: Statically CDN (cdn.statically.io)
 * Tier 3: jsDelivr CDN (cdn.jsdelivr.net)
 */
export function resolvePhotoUrl(url: string, attempt: number): string {
  if (attempt === 0) return url;
  const parsed = parseExercisePath(url);
  if (!parsed) return url;
  const { key, frame } = parsed;

  if (attempt === 1) {
    return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/${key}/${frame}`;
  }
  if (attempt === 2) {
    return `https://cdn.statically.io/gh/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/${key}/${frame}`;
  }
  if (attempt === 3) {
    return `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/${key}/${frame}`;
  }
  return url;
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
 * Exercise photo with multi-tier fallback. It starts with the same-origin API proxy,
 * then falls back across GitHub Raw, Statically, and jsDelivr, before rendering
 * an accessible SVG exercise icon if completely offline.
 */
export function ExercisePhoto({ src, alt = '', className = '', loading = 'lazy', width, height }: Props) {
  const parsed = parseExercisePath(src);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const currentSrc = resolvePhotoUrl(src, attempt);

  function handleError() {
    if (!parsed) {
      setFailed(true);
      return;
    }
    if (attempt < 3) {
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
      onError={handleError}
      className={className}
    />
  );
}
