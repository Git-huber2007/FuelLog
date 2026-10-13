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
      <div className="mx-auto max-w-[520px] p-6 text-center">
        <h1 className="text-xl">Something broke on this screen</h1>
        <p className="mt-2 text-muted">Your data is safe. Reload to carry on.</p>
        <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
