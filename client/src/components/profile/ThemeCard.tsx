import { useState } from 'react';

const OPTIONS = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
] as const;
type Theme = (typeof OPTIONS)[number][0];

// public/theme.js reads the same 'theme' key on load; storage can be blocked, so every access is guarded.
function savedTheme(): Theme {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeCard() {
  const [theme, setTheme] = useState(savedTheme);

  function choose(t: Theme) {
    setTheme(t);
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    try {
      if (t === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', t);
    } catch {
      // Not saved: the choice lasts until the app is closed.
    }
  }

  return (
    <section className="card space-y-3" aria-labelledby="theme-title">
      <h2 id="theme-title" className="card-title">Appearance</h2>
      <div className="segmented" role="radiogroup" aria-labelledby="theme-title">
        {OPTIONS.map(([value, label]) => (
          <label key={value} className="segmented-option">
            <input type="radio" name="theme" className="sr-only" checked={theme === value} onChange={() => choose(value)} />
            {label}
          </label>
        ))}
      </div>
      <p className="text-sm text-muted">System follows your phone's light or dark setting.</p>
    </section>
  );
}
