import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Kind = 'info' | 'error';
type Show = (message: string, kind?: Kind) => void;

const ToastContext = createContext<Show>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: Kind; id: number } | null>(null);
  const show = useCallback<Show>((message, kind = 'info') => setToast({ message, kind, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.kind === 'error' ? 6000 : 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
        {toast && <Toast message={toast.message} kind={toast.kind} />}
      </div>
    </ToastContext.Provider>
  );
}

export function Toast({ message, kind }: { message: string; kind: Kind }) {
  return (
    <p className={`toast-in max-w-[480px] rounded-xl border bg-card px-4 py-3 text-sm shadow-lg ${kind === 'error' ? 'border-protein text-protein' : 'border-line text-text'}`}>
      {message}
    </p>
  );
}
