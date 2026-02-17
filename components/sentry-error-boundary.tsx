'use client';

import React from 'react';

// Placeholder for Sentry integration
// Install with: npm install @sentry/nextjs

interface SentryUserFeedback {
  email?: string;
  name?: string;
  comments: string;
  associatedEventId?: string;
}

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// Real Sentry implementation - dynamic import to prevent SSR issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Sentry = typeof window !== 'undefined' ? require('@sentry/nextjs') : null;

// Helper functions
const reportError = (error: Error, context?: Record<string, any>) => {
  if (Sentry) {
    Sentry.withScope((scope: any) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  } else {
    console.error('Error reported:', error, context);
  }
};

const captureUserFeedback = (feedback: SentryUserFeedback) => {
  if (Sentry) {
    Sentry.captureFeedback({
      name: feedback.name || 'Anonymous User',
      email: feedback.email,
      message: feedback.comments,
      associatedEventId: feedback.associatedEventId,
    });
  } else {
    console.log('User feedback:', feedback);
  }
};

interface SentryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  showFeedback: boolean;
}

interface SentryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class SentryErrorBoundary extends React.Component<SentryErrorBoundaryProps, SentryErrorBoundaryState> {
  private errorBoundaryName = 'OneChatErrorBoundary';

  constructor(props: SentryErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      showFeedback: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<SentryErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Get the Sentry event ID if available
    const eventId = Sentry ? Sentry.captureException(error) : `local-${Date.now()}`;

    this.setState({
      error,
      errorId: eventId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to our custom error reporting
    reportError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.errorBoundaryName,
      errorId: eventId,
    });
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      showFeedback: false,
    });
  };

  handleFeedback = () => {
    this.setState({ showFeedback: true });
  };

  submitFeedback = (feedback: {
    name?: string;
    email?: string;
    comments: string;
  }) => {
    if (this.state.errorId) {
      captureUserFeedback({
        ...feedback,
        associatedEventId: this.state.errorId,
      });
    }
    this.setState({ showFeedback: false });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} reset={this.reset} />;
      }

      // Default error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 m-4">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;re sorry, but something unexpected happened. Our team has been notified and is working on a fix.
              </p>

              {/* Error ID for reference */}
              {this.state.errorId && (
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Error ID: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{this.state.errorId}</code>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.reset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={this.handleFeedback}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Send Feedback
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 px-4 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>

            {/* Feedback Form */}
            {this.state.showFeedback && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Tell us what happened
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    this.submitFeedback({
                      name: formData.get('name') as string,
                      email: formData.get('email') as string,
                      comments: formData.get('comments') as string,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      What were you doing when this happened?
                    </label>
                    <textarea
                      name="comments"
                      id="comments"
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Please describe what you were doing..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Send Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => this.setState({ showFeedback: false })}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for manual error reporting
export const useSentryError = () => {
  const reportErrorWithBoundary = React.useCallback((error: Error, context?: Record<string, any>) => {
    reportError(error, {
      ...context,
      reportedFrom: 'useSentryError hook',
    });
  }, []);

  const reportMessageWithBoundary = React.useCallback((message: string, level: SeverityLevel = 'info') => {
    if (Sentry) {
      Sentry.captureMessage(message, level);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }, []);

  const addBreadcrumbWithBoundary = React.useCallback((breadcrumb: {
    message: string;
    category?: string;
    level?: SeverityLevel;
    data?: Record<string, any>;
  }) => {
    if (Sentry) {
      Sentry.addBreadcrumb(breadcrumb);
    } else {
      console.log(`[Breadcrumb] ${breadcrumb.category || 'general'}: ${breadcrumb.message}`, breadcrumb.data);
    }
  }, []);

  return {
    reportError: reportErrorWithBoundary,
    reportMessage: reportMessageWithBoundary,
    addBreadcrumb: addBreadcrumbWithBoundary,
  };
};

export default SentryErrorBoundary;
