import type { ReactNode } from 'react';

const FEATURES: [title: string, detail: string][] = [
  ['Log food in seconds', 'Recent foods, saved meals, barcode scan, or just type what you ate.'],
  ['Targets that adapt', 'Calories and macros from your body data, re-tuned weekly from your weight trend.'],
  ['A plan for the gym', 'A Monday-to-Saturday split with photo demos, plus 870 extra exercises and cardio.'],
  ['See your progress', 'Weight trend, weekly summary, measurements and private progress photos.'],
];

/** The frame around sign in, sign up and password reset: what FuelLog is, the form, then what you get. */
export function AuthPage({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center gap-6 px-4 py-8">
      <header>
        <p className="flex items-center gap-2 text-lg font-semibold text-accent">
          <img src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
          FuelLog
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">Eat for your goal. Train with a plan.</p>
        <p className="mt-1 text-muted">A calorie, macro and gym tracker built for people who have just started lifting.</p>
      </header>

      <section className="card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="mb-4 text-xl">{title}</h1>
        {children}
      </section>
      <div className="space-y-2 text-center text-sm text-muted">{footer}</div>

      <section aria-label="What you get">
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(([name, detail]) => (
            <li key={name} className="rounded-2xl border border-line p-3">
              <p className="font-medium">{name}</p>
              <p className="mt-0.5 text-sm text-muted">{detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-sm text-muted">Estimates only, not medical advice.</p>
      </section>
    </main>
  );
}

export const authLink = 'inline-flex min-h-[44px] items-center font-medium text-accent underline';
