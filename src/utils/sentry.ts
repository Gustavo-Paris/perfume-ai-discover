import * as Sentry from '@sentry/react';

const isValidSentryDsn = (dsn: string): boolean => {
  // Sentry DSN format: https://[key]@[orgid].ingest.sentry.io/[projectid]
  const sentryDsnPattern = /^https:\/\/[a-f0-9]+@[a-f0-9]+\.ingest\.sentry\.io\/\d+$/;
  return sentryDsnPattern.test(dsn);
};

export const initSentry = (dsn: string) => {
  try {
    if (!dsn || !isValidSentryDsn(dsn)) {
      console.warn('Invalid Sentry DSN format, skipping Sentry initialization');
      return false;
    }

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    
    console.log('Sentry initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return false;
  }
};

export { Sentry };