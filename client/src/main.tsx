import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { SessionProvider } from './hooks/useSession';
import { ApiError } from './lib/apiClient';
import { reportClientError } from './lib/reportClientError';
import '@fontsource-variable/archivo/wdth.css';
import './index.css';

registerSW({ immediate: true });

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportClientError(event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failures, error) => {
        if (failures >= 3) return false;
        if (error instanceof ApiError) {
          if (error.status >= 400 && error.status < 500) return false;
          return error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504;
        }
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      retry: false,
    },
  },
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <SessionProvider>
              <App />
            </SessionProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
