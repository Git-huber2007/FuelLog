import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type Kind = 'info' | 'error';
type Show = (message: string, kind?: Kind) => void;

interface ToastItem {
  message: string;
  kind: Kind;
  id: number;
}

const ToastContext = createContext<Show>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const { pathname } = useLocation();

  const show = useCallback<Show>((message, kind = 'info') => {
    setIsExiting(false);
    setToast({ message, kind, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    setIsExiting(false);
    const displayMs = toast.kind === 'error' ? 6000 : 3500;
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, displayMs);
    const removeTimer = window.setTimeout(() => {
      setToast(null);
      setIsExiting(false);
    }, displayMs + 250);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [toast?.id, toast?.kind]);

  const hasTabBar = pathname === '/' || pathname === '/workout' || pathname === '/progress' || pathname === '/profile';

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className={`pointer-events-none fixed inset-x-0 ${
          hasTabBar ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(1.5rem+env(safe-area-inset-bottom))]'
        } z-50 flex justify-center px-4`}
      >
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            kind={toast.kind}
            isExiting={isExiting}
          />
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function Toast({ message, kind, isExiting = false }: { message: string; kind: Kind; isExiting?: boolean }) {
  const isError = kind === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`max-w-[480px] rounded-xl border bg-card px-4 py-3 text-sm shadow-xl transition-all duration-200 ${
        isExiting ? 'opacity-0 translate-y-2' : 'toast-in'
      } ${
        isError ? 'border-danger/60 text-danger bg-danger/10' : 'border-line text-text'
      }`}
    >
      {message}
    </div>
  );
}
