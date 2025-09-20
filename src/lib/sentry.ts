import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    // Removido console.log para evitar poluição no console
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    debug: import.meta.env.MODE === 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('AbortError') ||
            error.message.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
      }
      return event;
    },
  });
};

export { Sentry };
