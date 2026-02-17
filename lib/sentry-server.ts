// Placeholder for Sentry server integration
// Install with: npm install @sentry/nextjs

import { NextApiRequest, NextApiResponse } from 'next';

interface SentryEvent {
  contexts?: Record<string, any>;
  request?: {
    headers?: Record<string, string>;
    url?: string;
    method?: string;
    body?: any;
    query?: any;
  };
  tags?: Record<string, string>;
}

interface SentryHint {
  originalException?: Error;
}

interface SentryScope {
  setContext: (key: string, context: any) => void;
  setTag: (key: string, value: string) => void;
  setUser: (user: any) => void;
}

interface SentryTransaction {
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: any) => void;
}

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// Real Sentry implementation
import * as Sentry from '@sentry/node';

const SentryInstance = Sentry;

// Server-side Sentry configuration
export const initServerSentry = () => {
  const SENTRY_DSN = process.env.SENTRY_DSN;
  const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';
  
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Server-side error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    
    // Performance monitoring
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Server-side specific settings
    autoSessionTracking: true,
    
    // Before sending events, add server context
    beforeSend: (event: any, hint: any) => {
      // Add server context
      event.contexts = {
        ...event.contexts,
        server: {
          name: process.env.VERCEL_ENV || 'unknown',
          region: process.env.VERCEL_REGION || 'unknown',
          nodeVersion: process.version,
        },
      };
      
      // Filter sensitive information
      if (event.request?.headers) {
        // Remove sensitive headers
        const { authorization, cookie, ...safeHeaders } = event.request.headers;
        event.request.headers = safeHeaders;
      }
      
      // Add custom tags
      event.tags = {
        ...event.tags,
        component: 'onechat-server',
        runtime: 'nodejs',
      };
      
      return event;
    },
    
    // Ignore specific server errors
    ignoreErrors: [
      // Expected API errors
      'Request aborted',
      'socket hang up',
      'ECONNRESET',
      // Development errors
      'NEXT_NOT_FOUND',
    ],
    
    debug: SENTRY_ENVIRONMENT !== 'production',
  });
};

// API route wrapper for error handling
export const withSentry = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Add request context to Sentry
      Sentry.getCurrentScope().setContext('api_request', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      });
      
      Sentry.getCurrentScope().setTag('api_endpoint', req.url || 'unknown');
      Sentry.getCurrentScope().setTag('http_method', req.method || 'unknown');
      
      // Add user context if available
      const userId = req.headers['x-user-id'] as string;
      if (userId) {
        Sentry.setUser({ id: userId });
      }
      
      await handler(req, res);
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Capture error with additional context
      Sentry.withScope((scope: SentryScope) => {
        scope.setContext('api_error', {
          method: req.method,
          url: req.url,
          body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
          query: req.query,
          headers: sanitizeHeaders(req.headers),
        });
        
        scope.setTag('api_error', 'true');
        Sentry.captureException(error);
      });
      
      // Don't send the actual error to the client in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      res.status(500).json({
        error: isDevelopment ? error?.message : 'Internal server error',
        ...(isDevelopment && { stack: error?.stack }),
      });
    }
  };
};

// Helper functions for data sanitization
const sanitizeRequestBody = (body: any) => {
  if (!body) return undefined;
  
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
  const sanitized = { ...body };
  
  const sanitizeValue = (obj: any, path: string = ''): any => {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeValue(item, `${path}[${index}]`));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase()) ||
          currentPath.toLowerCase().includes(field.toLowerCase())
        )) {
          result[key] = '[FILTERED]';
        } else {
          result[key] = sanitizeValue(value, currentPath);
        }
      }
      return result;
    }
    
    return obj;
  };
  
  return sanitizeValue(sanitized);
};

const sanitizeHeaders = (headers: any) => {
  if (!headers) return undefined;
  
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.some(header => 
      key.toLowerCase().includes(header.toLowerCase())
    )) {
      sanitized[key] = '[FILTERED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Database error reporting
export const reportDatabaseError = (error: Error, context: {
  operation: string;
  collection?: string;
  query?: any;
  duration?: number;
}) => {
  Sentry.withScope((scope: SentryScope) => {
    scope.setContext('database_error', context);
    scope.setTag('error_type', 'database');
    Sentry.captureException(error);
  });
};

// Authentication error reporting
export const reportAuthError = (error: Error, context: {
  operation: string;
  userId?: string;
  provider?: string;
}) => {
  Sentry.withScope((scope: SentryScope) => {
    scope.setContext('auth_error', context);
    scope.setTag('error_type', 'auth');
    Sentry.captureException(error);
  });
};

// External service error reporting
export const reportExternalServiceError = (error: Error, context: {
  service: string;
  operation: string;
  endpoint?: string;
  statusCode?: number;
  responseTime?: number;
}) => {
  Sentry.withScope((scope: SentryScope) => {
    scope.setContext('external_service_error', context);
    scope.setTag('error_type', 'external_service');
    scope.setTag('service_name', context.service);
    Sentry.captureException(error);
  });
};

// API error reporting
export const reportApiError = (error: Error, endpoint: string, method: string, statusCode?: number) => {
  Sentry.withScope((scope: SentryScope) => {
    scope.setContext('api_error', {
      endpoint,
      method,
      statusCode,
      type: 'api_error',
    });
    scope.setTag('error_type', 'api');
    Sentry.captureException(error);
  });
};

// Performance monitoring for API calls - startTransaction is deprecated in v8
export const startApiTransaction = (operation: string, endpoint: string) => {
  console.warn('startApiTransaction is deprecated in Sentry v8. Use manual spans instead.');
  return {
    finish: () => {},
    setTag: () => {},
    setData: () => {},
  } as SentryTransaction;
};

// Memory usage reporting
export const reportMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  
  Sentry.setContext('memory_usage', {
    rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
  });
  
  // Alert if memory usage is high
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) { // 500MB threshold
    Sentry.captureMessage('High memory usage detected', 'warning');
  }
};

// Request context middleware
export const addRequestContext = (req: NextApiRequest) => {
  Sentry.getCurrentScope().setContext('request', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: sanitizeHeaders(req.headers),
  });
  
  Sentry.getCurrentScope().setUser({
    id: req.headers['x-user-id'] as string,
    ip: req.headers['x-forwarded-for'] as string,
  });
};

// Custom error classes for better categorization
export class OneChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'OneChatError';
  }
}

export class DatabaseError extends OneChatError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', context);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends OneChatError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', context);
    this.name = 'AuthenticationError';
  }
}

export class ExternalServiceError extends OneChatError {
  constructor(message: string, public service: string, context?: Record<string, any>) {
    super(message, 'EXTERNAL_SERVICE_ERROR', { service, ...context });
    this.name = 'ExternalServiceError';
  }
}

export class ValidationError extends OneChatError {
  constructor(message: string, public field?: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', { field, ...context });
    this.name = 'ValidationError';
  }
}

// API route wrapper for error handling (Next.js App Router)
export const withSentryAppRouter = (
  handler: (request: Request) => Promise<Response>
) => {
  return async (request: Request) => {
    const transaction = startApiTransaction(request.method, request.url);
    
    try {
      // Add request context to Sentry
      Sentry.getCurrentScope().setContext('api_request', {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
      });
      
      Sentry.getCurrentScope().setTag('api_endpoint', request.url || 'unknown');
      Sentry.getCurrentScope().setTag('http_method', request.method || 'unknown');
      
      const response = await handler(request);
      return response;
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Capture error with additional context
      Sentry.withScope((scope: SentryScope) => {
        scope.setContext('api_error', {
          method: request.method,
          url: request.url,
          type: 'api_error',
        });
        
        scope.setTag('api_error', 'true');
        Sentry.captureException(error);
      });
      
      // Don't send the actual error to the client in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      return new Response(
        JSON.stringify({
          error: isDevelopment ? error?.message : 'Internal server error',
          ...(isDevelopment && { stack: error?.stack }),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    } finally {
      transaction.finish();
    }
  };
};

export default Sentry;
