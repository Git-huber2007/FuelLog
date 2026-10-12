import type { ReactNode } from 'react';

export function AuthPage({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-semibold text-accent">FuelLog</p>
        <h1 className="text-2xl">{title}</h1>
      </div>
      <div className="card">{children}</div>
      <div className="space-y-2 text-center text-sm text-muted">{footer}</div>
    </main>
  );
}

export const authLink = 'inline-flex min-h-[44px] items-center font-medium text-accent underline';
