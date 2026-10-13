import { useEffect, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CalorieRing } from '../components/today/CalorieRing';
import { MacroBars } from '../components/today/MacroBars';
import { MuscleFigure } from '../components/workout/MuscleFigure';
import { useSession } from '../hooks/useSession';

// The figures shown in the product previews. They are examples, labelled as such on the page.
const SAMPLE_TARGETS = { kcal: 2460, protein_g: 150, carbs_g: 290, fat_g: 75, fibre_g: 30, water_ml: 2600 };
const SAMPLE_EATEN = { kcal: 1286, protein_g: 113, carbs_g: 132, fat_g: 31, fibre_g: 15 };
const TREND = [73.6, 73.8, 73.7, 74.0, 74.1, 74.0, 74.3, 74.4, 74.3, 74.6, 74.8, 74.7, 75.0];

const STEPS: [title: string, detail: string][] = [
  ['Tell it about you', 'Five details and a training level. FuelLog works out your calories, protein, carbs and fat, and suggests a weekly program.'],
  ['Log as you go', 'Tap a recent food, scan a barcode, or describe the meal. In the gym, type the weight and reps; each set saves itself.'],
  ['Let it adjust', 'Weigh in when you can. Once a week FuelLog compares your trend with your goal and offers a small change to your calories.'],
];

/** Fades and lifts each `.reveal` element into place the first time it scrolls into view. */
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const Arrow = () => (
  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-px">
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17 17 7M9 7h8v8" /></svg>
  </span>
);

const Cta = ({ children }: { children: ReactNode }) => (
  <Link to="/signup" className="btn-primary group min-h-[52px] gap-3 pl-6 pr-1.5">{children}<Arrow /></Link>
);

/** A feature tile in the bento grid: a product preview above a short claim. */
function Tile({ className = '', eyebrow, title, detail, children }: { className?: string; eyebrow: string; title: string; detail: string; children?: ReactNode }) {
  return (
    <li className={`reveal bezel flex ${className}`}>
      <div className="card flex w-full flex-col justify-between gap-8 rounded-[1.75rem] p-6 md:p-8">
        {children && <div aria-hidden className="pointer-events-none select-none">{children}</div>}
        <div>
          <p className="card-title text-accent">{eyebrow}</p>
          <h3 className="mt-2 text-2xl leading-tight md:text-[1.75rem]">{title}</h3>
          <p className="mt-2 text-muted">{detail}</p>
        </div>
      </div>
    </li>
  );
}

const Sparkline = () => {
  const min = Math.min(...TREND);
  const span = Math.max(...TREND) - min;
  const points = TREND.map((v, i) => `${(i / (TREND.length - 1)) * 300},${70 - ((v - min) / span) * 60}`).join(' ');
  return (
    <svg viewBox="0 0 300 80" className="w-full">
      <polygon points={`0,80 ${points} 300,80`} className="fill-accent/10" />
      <polyline points={points} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export default function Landing() {
  const { session, loading } = useSession();
  useReveal();
  useEffect(() => {
    document.title = 'FuelLog · Calorie, macro and gym tracker';
  }, []);
  if (!loading && session) return <Navigate to="/" replace />;

  return (
    <div className="relative overflow-x-clip">
      {/* Two fixed-size glows behind the hero. Absolutely placed and inert, so scrolling never repaints them. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[56rem]"
        style={{ background: 'radial-gradient(48rem 30rem at 18% 8%, rgb(var(--accent) / 0.22), transparent 70%), radial-gradient(40rem 28rem at 92% 30%, rgb(var(--carbs) / 0.14), transparent 70%)' }} />

      <header className="sticky top-0 z-20 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <nav aria-label="Main" className="glass mx-auto flex min-h-[56px] max-w-[1200px] items-center justify-between gap-2 rounded-full py-1.5 pl-4 pr-1.5">
          <Link to="/welcome" className="flex min-h-[44px] items-center gap-2.5 font-semibold">
            <img src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8 rounded-[0.625rem]" />
            FuelLog
          </Link>
          <div className="flex items-center gap-1">
            <a href="#features" className="hidden min-h-[44px] items-center rounded-full px-4 text-sm text-muted transition-colors hover:text-text sm:inline-flex">Features</a>
            <a href="#how" className="hidden min-h-[44px] items-center rounded-full px-4 text-sm text-muted transition-colors hover:text-text sm:inline-flex">How it works</a>
            <Link to="/login" className="inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium transition-colors hover:text-accent">Sign in</Link>
            <Link to="/signup" className="btn-primary px-5 text-sm">Get started</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero: the pitch on the left, three real pieces of the product stacked on the right. */}
        <section className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 pb-24 pt-16 md:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-32">
          <div className="stagger">
            <p className="eyebrow">Calories · Macros · Training</p>
            <h1 className="display mt-6">Eat for your goal. Train with a plan.</h1>
            <p className="mt-6 max-w-[34rem] text-lg text-muted md:text-xl">
              FuelLog sets your calorie and macro targets, gives you a weekly gym program, and keeps both honest as your weight changes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Cta>Create your account</Cta>
              <Link to="/login" className="btn min-h-[52px] px-6">Sign in</Link>
            </div>
            <p className="mt-5 text-sm text-muted">No ads. Your data is visible only to you.</p>
          </div>

          <div aria-hidden className="relative mx-auto w-full max-w-[460px] select-none lg:mr-0">
            <div className="reveal bezel lg:-rotate-2">
              <div className="card rounded-[1.75rem]">
                <p className="card-title">Today</p>
                <div className="mt-4 flex items-center gap-5">
                  <CalorieRing eaten={SAMPLE_EATEN.kcal} target={SAMPLE_TARGETS.kcal} />
                  <MacroBars totals={SAMPLE_EATEN} targets={SAMPLE_TARGETS} />
                </div>
              </div>
            </div>
            <div className="reveal card relative z-10 -mt-6 ml-auto w-[90%] p-3 sm:w-[78%] lg:-mr-6 lg:rotate-2" style={{ transitionDelay: '120ms' }}>
              <img src="/exercises/mon-bench-press-0.jpg" alt="" width={600} height={400} className="aspect-[2/1] w-full rounded-2xl object-cover" />
              <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
                <div>
                  <p className="font-semibold">Bench press</p>
                  <p className="text-sm text-muted">Last time 57.5 kg × 10</p>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent">Add 2.5 kg today</span>
              </div>
            </div>
            <div className="reveal card relative z-10 -mt-4 w-[62%] lg:-ml-6 lg:-rotate-1" style={{ transitionDelay: '240ms' }}>
              <p className="card-title">Weight · 7-day average</p>
              <p className="stat mt-2">75.0<span className="stat-unit">kg</span></p>
              <div className="mt-3"><Sparkline /></div>
            </div>
            <p className="mt-4 text-center text-xs text-muted">Example figures</p>
          </div>
        </section>

        <section aria-label="FuelLog in numbers" className="border-y border-line">
          <dl className="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-8 px-5 py-10 md:grid-cols-4">
            {([['873', 'exercises with photo demos'], ['3', 'weekly programs by level'], ['5', 'ways to log a meal'], ['0', 'ads or trackers']] as const).map(([value, label], i) => (
              <div key={label} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-4xl font-semibold tabular-nums tracking-[-0.04em] md:text-5xl">{value}</dd>
                <dd className="mt-1.5 text-sm text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="features" className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-24 md:py-32">
          <div className="reveal max-w-[40rem]">
            <p className="eyebrow">What you get</p>
            <h2 className="display-2 mt-5">Everything a new lifter needs, and nothing to wade through.</h2>
          </div>
          <ul className="mt-12 grid gap-4 md:grid-cols-6">
            <Tile className="md:col-span-4" eyebrow="Food" title="Log a meal in a few seconds"
              detail="Recent foods and saved meals are one tap. Scan a barcode, search the list, or describe what you ate and let the AI estimate it.">
              <div className="flex flex-wrap gap-2">
                {['Whey protein shake', 'Paneer, 100 g', 'Roti', 'Banana', 'Usual breakfast · 420 kcal'].map((name) => <span key={name} className="chip">{name}</span>)}
              </div>
              <div className="input mt-3 flex items-center text-muted">2 eggs, toast and a glass of milk</div>
            </Tile>
            <Tile className="md:col-span-2" eyebrow="Targets" title="Numbers that fit you"
              detail="Calories and macros from your body data and goal, re-tuned weekly from your weight trend.">
              <div className="flex justify-center"><CalorieRing eaten={SAMPLE_EATEN.kcal} target={SAMPLE_TARGETS.kcal} /></div>
            </Tile>
            <Tile className="md:col-span-2" eyebrow="Training" title="A plan for the week"
              detail="Three programs, from three full-body days to a six-day split. Each exercise shows what you lifted last time.">
              <div className="flex justify-center gap-6 rounded-2xl bg-bg py-4">
                <MuscleFigure view="front" highlighted={['chest', 'shoulders', 'biceps']} />
                <MuscleFigure view="back" highlighted={['back', 'triceps']} />
              </div>
            </Tile>
            <Tile className="md:col-span-4" eyebrow="Progress" title="See it working"
              detail="Weight trend, weekly averages, measurements, calories burned, steps and private progress photos, with a CSV export of everything.">
              <div className="grid grid-cols-3 gap-2">
                {([['Avg calories', '2,455'], ['Workouts', '4'], ['Avg steps', '7,840']] as const).map(([label, value]) => (
                  <div key={label} className="tile">
                    <p className="tile-label">{label}</p>
                    <p className="tile-value">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3"><Sparkline /></div>
            </Tile>
          </ul>
        </section>

        <section id="how" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-24 md:py-32">
            <div className="reveal max-w-[40rem]">
              <p className="eyebrow">How it works</p>
              <h2 className="display-2 mt-5">Set up once. Then it is a minute a day.</h2>
            </div>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map(([title, detail], i) => (
                <li key={title} className="reveal border-t border-line pt-6" style={{ transitionDelay: `${i * 100}ms` }}>
                  <p className="text-sm font-medium tabular-nums text-accent">0{i + 1}</p>
                  <h3 className="mt-3 text-xl">{title}</h3>
                  <p className="mt-2 text-muted">{detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-24 md:pb-32">
          <div className="reveal bezel">
            <div className="card relative overflow-hidden rounded-[1.75rem] px-6 py-16 text-center md:py-24">
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(36rem 20rem at 50% 0%, rgb(var(--accent) / 0.18), transparent 70%)' }} />
              <h2 className="display-2 relative mx-auto max-w-[36rem]">Start with today&apos;s breakfast.</h2>
              <p className="relative mx-auto mt-4 max-w-[30rem] text-lg text-muted">Create an account, answer five questions, and your targets and first workout are ready.</p>
              <div className="relative mt-9 flex justify-center"><Cta>Create your account</Cta></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2.5 font-semibold text-text">
            <img src="/icon-192.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
            FuelLog
          </p>
          <p>Estimates only, not medical advice.</p>
          <p className="flex flex-wrap gap-5 items-center">
            <Link to="/privacy" className="link inline-flex min-h-[44px] items-center">Privacy</Link>
            <Link to="/terms" className="link inline-flex min-h-[44px] items-center">Terms</Link>
            <Link to="/login" className="link inline-flex min-h-[44px] items-center">Sign in</Link>
            <Link to="/signup" className="link inline-flex min-h-[44px] items-center">Create an account</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
