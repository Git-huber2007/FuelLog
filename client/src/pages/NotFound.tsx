import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-4xl">Page not found</h1>
      <p className="text-muted">That address does not lead anywhere in FuelLog.</p>
      <Link to="/" className="btn-primary">Go to Today</Link>
    </main>
  );
}
