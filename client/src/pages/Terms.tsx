import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
        <strong>Draft for review:</strong> This document is a draft prepared for site owner review and does not constitute formal legal advice.
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted">Last updated: October 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Use of the Service</h2>
        <p className="text-sm text-muted leading-relaxed">
          FuelLog is provided for personal health and fitness tracking. By registering or using the service, you agree to use it only for lawful purposes in accordance with these terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Not Medical Advice</h2>
        <p className="text-sm text-muted leading-relaxed">
          FuelLog does not provide medical, nutritional, diagnosis, or treatment advice. Calorie suggestions, macronutrient ratios, adaptive weight adjustments, and artificial intelligence estimates are for informational and self-tracking purposes only. Always consult a licensed healthcare professional before changing your diet or exercise routine.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Third-Party AI Services</h2>
        <p className="text-sm text-muted leading-relaxed">
          FuelLog integrates with Google&apos;s Gemini API to provide automated food text estimation, photo nutrition recognition, and weekly coaching summaries. While designed to provide reasonable approximations, AI-generated outputs may contain errors, inaccuracies, or variances from actual nutritional content.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Account Ownership, Data Export &amp; Termination</h2>
        <p className="text-sm text-muted leading-relaxed">
          You retain full ownership of all data you input into FuelLog. You may export your entire dataset in CSV or JSON format at any time. You may also permanently terminate and delete your account and all associated records directly via the Profile settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Service Availability and Modifications</h2>
        <p className="text-sm text-muted leading-relaxed">
          FuelLog is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We reserve the right to update, modify, or discontinue features of the application at any time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p className="text-sm text-muted leading-relaxed">
          For questions or notices regarding these terms, contact us at: <span className="font-mono font-medium text-text">CONTACT_EMAIL</span>.
        </p>
      </section>

      <footer className="pt-6 border-t border-line flex justify-between items-center text-sm">
        <Link to="/" className="text-primary hover:underline">← Back to FuelLog</Link>
        <Link to="/privacy" className="text-muted hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
