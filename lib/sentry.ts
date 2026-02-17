// Placeholder for Sentry integration
// Install with: npm install @sentry/nextjs @sentry/tracing

interface SentryEvent {
  exception?: {
    values?: Array<{
      stacktrace?: {
        frames?: Array<{
          filename?: string;
        }>;
      };
    }>;
  };
  tags?: Record<string, string>;
  contexts?: Record<string, any>;
  request?: {
    headers?: Record<string, string>;
  };
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

interface SentryHint {
  originalException?: Error;
}

interface SentryScope {
  setContext: (key: string, context: any) => void;
  setTag: (key: string, value: string) => void;
  setUser: (user: any) => void;
  setTransactionName: (name: string) => void;
}

interface SentryTransaction {
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: any) => void;
}

interface SentryUserFeedback {
  email?: string;
  name?: string;
  comments: string;
  associatedEventId?: string;
}

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// Real Sentry implementation
import * as Sentry from '@sentry/nextjs';
import { Replay } from '@sentry/replay';

// Sentry configuration for OneChat
export const initSentry = () => {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';
  
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Performance monitoring - BrowserTracing is included by default in v8
    integrations: [
      new Replay({
        // Additional SDK configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Before sending events, add custom context
    beforeSend: (event: any, hint: any) => {
      // Add user context if available
      const userContext = getUserContext();
      if (userContext) {
        event.user = { ...event.user, ...userContext };
      }
      
      // Filter out sensitive information
      if (event.exception) {
        event.exception.values?.forEach((exception: any) => {
          if (exception.stacktrace) {
            exception.stacktrace.frames?.forEach((frame: any) => {
              // Remove sensitive data from stack traces
              if (frame.filename && frame.filename.includes('api-key')) {
                frame.filename = '[FILTERED]';
              }
            });
          }
        });
      }
      
      // Add custom tags for better filtering
      event.tags = {
        ...event.tags,
        component: 'onechat',
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      };
      
      return event;
    },
    
    // Custom context and breadcrumbs
    attachStacktrace: true,
    debug: SENTRY_ENVIRONMENT !== 'production',
    
    // Ignore specific errors that are not actionable
    ignoreErrors: [
      // Random browser extensions
      'Non-Error promise rejection captured',
      // Network errors that are expected
      'Network request failed',
      'Request aborted',
      // ResizeObserver loop limit exceeded
      'ResizeObserver loop limit exceeded',
    ],
    
    // Deny URLs that should not be sent to Sentry
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      // Local files
      /^file:\/\//i,
      // Third-party scripts
      /analytics\.com/i,
      /googletagmanager\.com/i,
    ],
  });
};

// Get user context from local storage or session
const getUserContext = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id || user.email || 'anonymous',
        email: user.email,
        username: user.name || user.email,
      };
    }
  } catch (error) {
    console.warn('Failed to get user context for Sentry:', error);
  }
  
  return null;
};

// Custom error reporting functions
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope: SentryScope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    
    scope.setTag('custom_report', 'true');
    Sentry.captureException(error);
  });
};

export const reportMessage = (message: string, level: SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Performance monitoring - startTransaction is deprecated in v8
export const startTransaction = (name: string, op: string = 'navigation') => {
  console.warn('startTransaction is deprecated in Sentry v8. Use manual spans instead.');
  return null as any;
};

export const setTransactionName = (name: string) => {
  Sentry.getCurrentScope().setTransactionName(name);
};

// User feedback
export const captureUserFeedback = (feedback: {
  email?: string;
  name?: string;
  comments: string;
  associatedEventId?: string;
}) => {
  // Convert to Sentry v8 format - use message instead of comments
  Sentry.captureFeedback({
    name: feedback.name || 'Anonymous User',
    email: feedback.email,
    message: feedback.comments,
    associatedEventId: feedback.associatedEventId,
  });
};

// Breadcrumbs for user actions
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: SeverityLevel;
  data?: Record<string, any>;
}) => {
  Sentry.addBreadcrumb(breadcrumb);
};

// Session tracking
export const identifyUser = (user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) => {
  Sentry.setUser(user);
};

export const clearUser = () => {
  Sentry.setUser(null);
};

// Feature flag integration
export const setFeatureFlag = (flag: string, value: boolean) => {
  Sentry.setContext('features', { [flag]: value });
};

// Release health - setRelease is deprecated in v8, use init() parameter instead
export const setRelease = (release: string) => {
  // Note: In v8, release should be set during init()
  console.warn('setRelease is deprecated in Sentry v8. Set release during init() instead.');
};

export const setEnvironment = (environment: string) => {
  // Note: In v8, environment should be set during init()
  console.warn('setEnvironment is deprecated in Sentry v8. Set environment during init() instead.');
};

// Error boundaries helper
export const handleReactError = (error: Error, errorInfo: any) => {
  reportError(error, {
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  });
};

// API error reporting
export const reportApiError = (error: any, endpoint: string, method: string, statusCode?: number) => {
  reportError(new Error(`API Error: ${endpoint}`), {
    endpoint,
    method,
    statusCode,
    response: error,
    type: 'api_error',
  });
};

// Performance monitoring for API calls
export const trackApiPerformance = (endpoint: string, method: string, duration: number, statusCode?: number) => {
  addBreadcrumb({
    message: `API ${method} ${endpoint}`,
    category: 'api',
    level: statusCode && statusCode >= 400 ? 'error' : 'info',
    data: {
      endpoint,
      method,
      duration,
      statusCode,
    },
  });
};

// Chat-specific error reporting
export const reportChatError = (error: Error, context: {
  messageLength?: number;
  hasAttachments?: boolean;
  model?: string;
  temperature?: number;
}) => {
  reportError(error, {
    ...context,
    type: 'chat_error',
  });
};

// File upload error reporting
export const reportUploadError = (error: Error, context: {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}) => {
  reportError(error, {
    ...context,
    type: 'upload_error',
  });
};

// Voice mode error reporting
export const reportVoiceError = (error: Error, context: {
  duration?: number;
  audioFormat?: string;
  hasPermission?: boolean;
}) => {
  reportError(error, {
    ...context,
    type: 'voice_error',
  });
};

// Memory and performance reporting
export const reportPerformanceIssue = (context: {
  memoryUsage?: number;
  bundleSize?: number;
  loadTime?: number;
  renderTime?: number;
}) => {
  reportMessage('Performance issue detected', 'warning');
  Sentry.setContext('performance', context);
};

export default Sentry;
