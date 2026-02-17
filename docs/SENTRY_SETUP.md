# Sentry Error Monitoring Setup Guide

This guide covers the complete Sentry integration for OneChat application error monitoring and performance tracking.

## 🎯 Overview

Sentry provides:
- **Real-time Error Monitoring** - Automatic error capture and alerting
- **Performance Monitoring** - Track slow operations and bottlenecks
- **User Feedback** - Collect user reports with context
- **Release Tracking** - Monitor errors by version
- **Session Replay** - See what users experienced before errors

## 🚀 Quick Setup

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new organization
4. Create a new project (select "Next.js")

### 2. Get Your DSN

From your Sentry project settings:
1. Go to Settings → Client Keys (DSN)
2. Copy your DSN URL
3. Note your organization slug and project slug

### 3. Configure Environment Variables

Add to your `.env.local`:

```bash
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 4. Install Dependencies

```bash
npm install @sentry/nextjs @sentry/tracing
```

### 5. Initialize Sentry

Sentry is automatically initialized through:
- `lib/sentry.ts` - Client-side configuration
- `lib/sentry-server.ts` - Server-side configuration
- `app/layout.tsx` - Error boundary wrapper

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Client-side DSN |
| `SENTRY_DSN` | Yes | Server-side DSN |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | No | Environment (development/staging/production) |
| `SENTRY_ORG` | No | Organization slug |
| `SENTRY_PROJECT` | No | Project slug |
| `NEXT_PUBLIC_APP_VERSION` | No | Application version |

### Sampling Rates

Configure in `lib/sentry.ts`:

```typescript
tracesSampleRate: 1.0, // 100% for development
replaysSessionSampleRate: 0.1, // 10% of sessions
replaysOnErrorSampleRate: 1.0, // 100% of error sessions
```

## 📊 Features

### 1. Automatic Error Capture

- JavaScript errors
- Unhandled promise rejections
- Network failures
- Component crashes (via Error Boundary)
- API route errors

### 2. Performance Monitoring

- Page load times
- API response times
- Database query performance
- Memory usage tracking
- Core Web Vitals

### 3. User Context

- User identification
- Session tracking
- Custom tags and context
- Device and browser information

### 4. Error Filtering

Ignore specific errors:
```typescript
ignoreErrors: [
  'Non-Error promise rejection captured',
  'Network request failed',
  'ResizeObserver loop limit exceeded',
]
```

### 5. Data Sanitization

Automatic filtering of:
- API keys and secrets
- Passwords and tokens
- PII (Personally Identifiable Information)
- Sensitive headers

## 🛠️ Usage Examples

### Manual Error Reporting

```typescript
import { reportError, reportMessage } from '@/lib/sentry';

// Report an error with context
reportError(new Error('Custom error'), {
  component: 'ChatComponent',
  action: 'sendMessage',
  userId: 'user-123',
});

// Report a message
reportMessage('User performed important action', 'info');
```

### Performance Tracking

```typescript
import { startTransaction, addBreadcrumb } from '@/lib/sentry';

// Start a transaction
const transaction = startTransaction('chat-operation', 'user-action');

// Add breadcrumbs
addBreadcrumb({
  message: 'User sent message',
  category: 'user',
  level: 'info',
  data: { messageLength: 150 },
});

// Finish transaction
transaction.finish();
```

### User Feedback

```typescript
import { captureUserFeedback } from '@/lib/sentry';

captureUserFeedback({
  email: 'user@example.com',
  name: 'John Doe',
  comments: 'The app crashed when I tried to upload a file',
  associatedEventId: 'error-event-id',
});
```

### Setting User Context

```typescript
import { identifyUser, clearUser } from '@/lib/sentry';

// Identify user
identifyUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe',
});

// Clear user context
clearUser();
```

## 🔍 Testing Sentry Integration

### Run Sentry Tests

```bash
# Run Sentry integration tests
npm run test:sentry

# Run all tests including Sentry
npm run test:complete
```

### Test Error Reporting

```javascript
// In browser console
throw new Error('Test error for Sentry');

// Test user feedback
window.Sentry.captureUserFeedback({
  email: 'test@example.com',
  comments: 'Test feedback',
});
```

### Verify Setup

1. Open your Sentry dashboard
2. Go to Issues tab
3. Trigger an error in your app
4. Check if it appears in Sentry within 30 seconds

## 📈 Monitoring Dashboards

### Key Metrics to Monitor

1. **Error Rate** - Percentage of requests with errors
2. **Performance** - Page load and API response times
3. **User Impact** - Number of users affected by errors
4. **Release Health** - Error rates by version
5. **Geographic Distribution** - Errors by region

### Setting Up Alerts

1. Go to Settings → Alerts
2. Create alert rules for:
   - High error rate (>5%)
   - Performance degradation (>2s load time)
   - New error introduction
   - Critical error spikes

## 🚀 Production Deployment

### Build-time Configuration

```bash
# Build with Sentry
npm run build

# Sentry will automatically upload source maps
# and create releases
```

### Environment-specific Settings

**Development:**
```bash
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
tracesSampleRate=1.0
```

**Staging:**
```bash
NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging
tracesSampleRate=0.5
```

**Production:**
```bash
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
tracesSampleRate=0.1
```

### Source Maps

Source maps are automatically uploaded during build. To disable:

```javascript
// sentry.client.config.js / sentry.server.config.js
export const config = {
  sentry: {
    hideSourceMaps: true,
  },
};
```

## 🔧 Advanced Configuration

### Custom Transport

```typescript
// Custom transport for debugging
const transport = makeFetchTransport({
  url: 'https://your-custom-endpoint.com/api/envelope',
});

Sentry.init({
  transport,
  // ... other config
});
```

### Before Send Hook

```typescript
beforeSend(event, hint) {
  // Custom filtering logic
  if (event.exception) {
    const error = hint.originalException;
    if (error instanceof CustomError) {
      event.level = 'warning';
    }
  }
  return event;
}
```

### Custom Integrations

```typescript
import { Integrations } from '@sentry/tracing';

Sentry.init({
  integrations: [
    new Integrations.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV5Instrumentation(
        React.useHistory,
        React.useLocation,
        React.matchPath,
      ),
    }),
  ],
});
```

## 🛡️ Security Considerations

### Data Privacy

- All sensitive data is automatically filtered
- Source maps are stored securely
- PII is redacted by default
- GDPR compliant data handling

### Access Control

1. Use role-based access in Sentry
2. Enable IP filtering for sensitive environments
3. Use separate projects for different environments
4. Regularly rotate DSN keys

### Rate Limits

Monitor and adjust:
- Error submission rates
- Transaction sampling
- Replay recording limits
- API quota usage

## 🔍 Troubleshooting

### Common Issues

1. **Errors not appearing**
   - Check DSN configuration
   - Verify environment variables
   - Check network connectivity

2. **Source maps not working**
   - Ensure `.map` files are uploaded
   - Check build configuration
   - Verify release naming

3. **High noise/false positives**
   - Adjust ignoreErrors list
   - Fine-tune sampling rates
   - Add custom filters

4. **Performance impact**
   - Reduce sampling rates
   - Optimize beforeSend hook
   - Monitor bundle size

### Debug Mode

Enable debug logging:
```typescript
Sentry.init({
  debug: true,
  // ... other config
});
```

### Local Development

Test Sentry locally:
```bash
# Use development DSN
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development

# Check browser console for Sentry logs
# Verify errors appear in dev dashboard
```

## 📋 Best Practices

1. **Version Tracking** - Always update `NEXT_PUBLIC_APP_VERSION` on releases
2. **Context Enrichment** - Add relevant context to all error reports
3. **Sampling** - Use appropriate sampling rates for production
4. **Alerting** - Set up meaningful alerts for your team
5. **Documentation** - Document custom error types and handling
6. **Review** - Regularly review and clean up error patterns
7. **Testing** - Include Sentry in your test suite

## 🎯 Next Steps

1. Set up your Sentry account and configure DSN
2. Test error reporting in development
3. Configure appropriate sampling rates
4. Set up alerts for your team
5. Monitor performance in production
6. Regularly review and optimize error handling

This comprehensive Sentry setup ensures you have complete visibility into your OneChat application's health and performance in production.
