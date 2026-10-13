import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
        <strong>Draft for review:</strong> This document is a draft prepared for site owner review and does not constitute formal legal advice.
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted">Last updated: October 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. What Information We Collect and Store</h2>
        <p className="text-sm text-muted leading-relaxed">
          FuelLog stores the health, fitness, and nutrition data you voluntarily enter:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>Account credentials (your email address and authenticated user ID managed securely via Supabase Auth).</li>
          <li>Physical profile data: sex, age, height, weight, activity goals, and program split preferences.</li>
          <li>Nutrition records: logged meals, custom foods created, saved meal templates, and daily calorie/macro snapshots.</li>
          <li>Health check-ins: daily water intake, sleep duration, creatine, protein shake consumption, and daily step counts.</li>
          <li>Fitness records: workout sets, weights lifted, reps, and cardio distances/duration.</li>
          <li>Optional progress photos: stored privately in an isolated Supabase storage bucket under your personal folder.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Third-Party AI Data Processing (Google Gemini)</h2>
        <p className="text-sm text-muted leading-relaxed">
          When you use optional AI features—specifically text meal parsing, food photo estimation, or weekly coach insights—your meal text description, uploaded food photo, or anonymized weekly workout and nutrition summary is sent to Google&apos;s Gemini API to compute nutritional estimates and advice.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          The API key resides solely on the server environment. Google receives only the data needed to perform the analysis for that specific request.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Estimates Only, Not Medical Advice</h2>
        <p className="text-sm text-muted leading-relaxed">
          All calculated calorie targets, macronutrient breakdowns, progress trends, and AI-generated nutrition estimates are mathematical approximations intended for general fitness planning. They do not constitute medical, dietetic, or nutritional advice. Consult a qualified medical practitioner before beginning any new diet or training regimen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. How to Export Your Data</h2>
        <p className="text-sm text-muted leading-relaxed">
          You own your data completely. At any time, you can download a full export directly from the Progress or Profile tab:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li><strong>CSV Export:</strong> Daily aggregated totals of calories, macros, steps, sleep, and weights.</li>
          <li><strong>JSON Export:</strong> A complete, raw export of all records including profile, every logged food, saved meals, workout sets, and secure links to progress photos.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Data Retention and Account Deletion</h2>
        <p className="text-sm text-muted leading-relaxed">
          Your data is retained only as long as you maintain an active account. You can delete your account at any time via the Profile screen:
        </p>
        <p className="text-sm text-muted leading-relaxed">
          Account deletion immediately purges all stored files in your progress photo storage bucket and executes a database cascade deleting your user account and all associated tables permanently. No residual copies are retained.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p className="text-sm text-muted leading-relaxed">
          For privacy questions, corrections, or data inquiries, contact us at: <span className="font-mono font-medium text-foreground">CONTACT_EMAIL</span>.
        </p>
      </section>

      <footer className="pt-6 border-t border-line flex justify-between items-center text-sm">
        <Link to="/" className="text-primary hover:underline">← Back to FuelLog</Link>
        <Link to="/terms" className="text-muted hover:underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
