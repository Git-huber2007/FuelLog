import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

const FEATURES: [title: string, detail: string][] = [
  ['Log food in seconds', 'Recent foods, saved meals, barcode scan, or just type what you ate.'],
  ['Targets that adapt', 'Calories and macros from your body data, re-tuned weekly from your weight trend.'],
  ['A plan for the gym', 'A Monday-to-Saturday split with photo demos, plus 870 extra exercises and cardio.'],
  ['See your progress', 'Weight trend, weekly summary, measurements and private progress photos.'],
];

/**
 * The frame around sign in, sign up and password reset.
 * Phone: the pitch, the form, then what you get. Large screens: pitch and features on the left, the form on the right.
 */
export function AuthPage({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} · FuelLog`;
    headingRef.current?.focus();
  }, [title]);

  return (
    <main className="stagger mx-auto grid min-h-dvh w-full max-w-[520px] content-center gap-8 px-4 py-10 lg:max-w-[1080px] lg:grid-cols-2 lg:gap-x-20 lg:px-8">
      <header className="lg:self-end">
        <Link to="/welcome" className="inline-flex items-center gap-2.5 text-lg font-semibold">
          <img src="/icon-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
          FuelLog
        </Link>
        <p className="eyebrow mt-8">Calories · Macros · Training</p>
        <p className="display mt-5">Eat for your goal. Train with a plan.</p>
        <p className="mt-4 text-lg text-muted">A calorie, macro and gym tracker built for people who have just started lifting.</p>
      </header>

      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
        <div className="bezel">
          <section className="card rounded-[1.75rem] p-6" aria-labelledby="auth-title">
            <h1 ref={headingRef} id="auth-title" tabIndex={-1} className="mb-5 text-2xl outline-none">{title}</h1>
            {children}
          </section>
        </div>
        <div className="mt-4 space-y-1 text-center text-sm text-muted">{footer}</div>
      </div>

      <section aria-label="What you get" className="lg:self-start">
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(([name, detail]) => (
            <li key={name} className="rounded-3xl border border-line p-4">
              <p className="font-medium">{name}</p>
              <p className="mt-1 text-sm text-muted">{detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted">Estimates only, not medical advice.</p>
      </section>
    </main>
  );
}

export const authLink = 'inline-flex min-h-[44px] items-center font-medium text-accent underline underline-offset-4';
