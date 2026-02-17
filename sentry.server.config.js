import { initServerSentry } from '@/lib/sentry-server';

// Initialize Sentry on the server side
initServerSentry();

export const config = {
  // Sentry server configuration
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true,
  },
};
