import { Component, type ReactNode } from 'react';
import { reportClientError } from '../../lib/reportClientError';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    reportClientError(error);
  }


  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-dvh w-full items-center justify-center p-4">
        <div className="bezel w-full max-w-[480px]">
          <div className="card space-y-4 rounded-[1.75rem] p-8 text-center">
            <img src="/icon-192.png" alt="" width={48} height={48} className="mx-auto h-12 w-12 rounded-xl" />
            <h1 className="display text-3xl">Something broke</h1>
            <p className="text-muted">Your data is safe. Reload to carry on.</p>
            <div className="pt-2">
              <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
