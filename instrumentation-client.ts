// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Skip Sentry entirely in development — @sentry/nextjs is incompatible with
// Turbopack (breaks middleware resolution) and adds heavy compilation overhead.
import * as Sentry from "@sentry/nextjs";

if (process.env.NODE_ENV !== "development") {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",

      // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
      tracesSampleRate: 1,

      // Capture Replay for 10% of all sessions, plus 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Enable logs to be sent to Sentry
      enableLogs: true,

      // Enable sending user PII (Personally Identifiable Information)
      sendDefaultPii: true,

      // Ignore specific errors that are not actionable
      ignoreErrors: [
        "Non-Error promise rejection captured",
        "Network request failed",
        "Request aborted",
        "ResizeObserver loop limit exceeded",
      ],

      // Add custom tags
      initialScope: {
        tags: {
          component: "onechat",
          version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        },
      },
    });
  } else {
    console.warn("Sentry DSN not found. Client-side error monitoring disabled.");
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
