// Sentry utility functions for OneChat
// NOTE: Sentry.init() is handled by:
//   - instrumentation-client.ts (browser)
//   - sentry.server.config.ts (Node.js server)
//   - sentry.edge.config.ts (edge runtime)
// Do NOT call Sentry.init() here to avoid duplicate initialization.

import * as Sentry from '@sentry/nextjs';

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// No-op kept for backward compatibility if anything still imports it
export const initSentry = () => {};

// Get user context from local storage or session
export const getUserContext = () => {
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
  Sentry.withScope((scope) => {
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
