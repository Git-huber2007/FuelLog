import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-4">
      <div className="bezel w-full max-w-[480px]">
        <div className="card space-y-4 rounded-md p-8 text-center">
          <img src="/icon-192.png" alt="" width={48} height={48} className="mx-auto h-12 w-12 rounded-xl" />
          <h1 className="display text-3xl">Page not found</h1>
          <p className="text-muted">That address does not lead anywhere in FuelLog.</p>
          <div className="pt-2">
            <Link to="/" className="btn-primary inline-flex">Go to Today</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
