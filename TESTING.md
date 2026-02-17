# Testing Guide

This document provides comprehensive information about the testing setup and practices for the OneChat application.

## Overview

The OneChat application uses a multi-layered testing approach:

- **Unit Tests**: Jest for testing individual functions and components
- **E2E Tests**: Playwright for full application testing
- **API Tests**: Playwright for direct API endpoint testing
- **Performance Tests**: Custom performance monitoring with Playwright
- **Accessibility Tests**: Comprehensive a11y testing
- **Load Testing**: k6 for performance and load testing

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── core/              # Core functionality tests
│   │   ├── chat.spec.ts
│   │   ├── agents.spec.ts
│   │   ├── tools.spec.ts
│   │   ├── artifacts.spec.ts
│   │   └── streamlit.spec.ts
│   ├── integrations/      # Integration tests
│   │   ├── microsoft-auth.spec.ts
│   │   ├── email.spec.ts
│   │   ├── calendar.spec.ts
│   │   └── memory.spec.ts
│   ├── edge-cases/        # Edge case and error handling
│   │   ├── network-failures.spec.ts
│   │   ├── large-files.spec.ts
│   │   └── concurrent-operations.spec.ts
│   ├── helpers/           # Test utilities
│   │   ├── test-helpers.ts
│   │   ├── auth-helpers.ts
│   │   └── mock-data.ts
│   ├── global-setup.ts    # Global test setup
│   └── global-teardown.ts # Global test cleanup
├── api/                   # API endpoint tests
│   ├── turn-response.spec.ts
│   ├── microsoft.spec.ts
│   └── memories.spec.ts
├── performance/           # Performance tests
│   └── load-performance.spec.ts
└── accessibility/         # Accessibility tests
    └── a11y.spec.ts
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- All required environment variables (see `.env.example`)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install with dependencies (recommended)
npx playwright install --with-deps
```

## Running Tests

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run with headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/core/chat.spec.ts

# Run specific test suite
npx playwright test tests/e2e/core/

# Debug tests
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen
```

### API Tests

```bash
# Run API tests
npm run test:api

# Run specific API test
npx playwright test tests/api/turn-response.spec.ts
```

### Unit Tests

```bash
# Run unit tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### All Tests

```bash
# Run all tests (unit + E2E)
npm run test:all
```

## Test Configuration

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit
- **Viewports**: Desktop and mobile
- **Timeouts**: 60s test timeout, 10s expect timeout
- **Retries**: 2 on CI, 0 locally
- **Reporting**: HTML, JSON, JUnit

### Environment Variables

Set these in your environment or `.env` file:

```bash
# Required for API tests
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
APIPIE_API_KEY=your_apipie_key
MONGODB_URI=your_mongodb_uri

# Microsoft Graph (for integration tests)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Testing
NODE_ENV=test
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
```

## Test Categories

### Core Functionality Tests

Tests for essential application features:

- **Chat**: Message sending, receiving, streaming
- **Agents**: Creation, selection, configuration
- **Tools**: Web search, code interpreter, file search
- **Artifacts**: Creation, editing, downloading
- **Streamlit**: Deployment and interaction

### Integration Tests

Tests for external service integrations:

- **Microsoft Auth**: OAuth flow, token management
- **Email**: Full email client functionality
- **Calendar**: Event management, scheduling
- **Memory**: Storage, retrieval, extraction

### Edge Case Tests

Tests for error conditions and edge cases:

- **Network Failures**: Timeouts, connection loss, rate limiting
- **Large Files**: Upload, progress, size limits
- **Concurrent Operations**: Multiple simultaneous actions

### API Tests

Direct API endpoint testing:

- **Turn Response**: Chat completion API
- **Microsoft**: Graph API endpoints
- **Memories**: Memory management API

### Performance Tests

Application performance monitoring:

- **Load Times**: Page load, navigation
- **Memory Usage**: Heap size, leaks
- **API Response**: Latency, throughput
- **File Upload**: Speed, progress

### Accessibility Tests

Comprehensive a11y testing:

- **Keyboard Navigation**: Focus management, tab order
- **Screen Readers**: ARIA labels, semantic markup
- **Color Contrast**: Visual accessibility
- **Mobile**: Touch targets, responsive design

## Writing Tests

### Test Helpers

Use the provided test helpers for consistent testing:

```typescript
import { TestHelpers } from '../helpers/test-helpers';
import { AuthHelpers } from '../helpers/auth-helpers';

test.describe('My Test Suite', () => {
  let helpers: TestHelpers;
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    authHelpers = new AuthHelpers(page);
    
    await authHelpers.mockAuth();
    await helpers.navigateToHome();
  });

  test('should do something', async ({ page }) => {
    await helpers.sendMessage('Hello');
    await helpers.waitForResponse();
    
    const response = await helpers.getLastAssistantMessage();
    expect(response).toBeTruthy();
  });
});
```

### Mock Data

Use the mock data helpers for consistent test data:

```typescript
import { mockUsers, mockAgents, mockEmails } from '../helpers/mock-data';

test('should use mock data', async ({ page }) => {
  const testUser = mockUsers.testUser;
  const testAgent = mockAgents[0];
  
  // Use mock data in tests
});
```

### Best Practices

1. **Use descriptive test names**: "should do X when Y"
2. **Test one thing per test**: Keep tests focused
3. **Use page object pattern**: Organize interactions
4. **Mock external dependencies**: Use helpers for auth, APIs
5. **Clean up after tests**: Use proper teardown
6. **Use proper assertions**: Be specific about expectations
7. **Handle async properly**: Use waitFor for dynamic content

## CI/CD Integration

### GitHub Actions

The application includes comprehensive CI/CD workflows:

- **E2E Tests** (`.github/workflows/e2e-tests.yml`): Multi-browser, multi-viewport testing
- **Load Testing** (`.github/workflows/load-testing.yml`): Performance and stress testing

### Test Reports

- **HTML Reports**: Generated in `playwright-report/`
- **JSON Reports**: For CI integration
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On failure

### Artifacts

Test artifacts are uploaded to GitHub Actions:

- Playwright reports
- Test traces
- Screenshots and videos
- Performance metrics

## Performance Testing

### Load Testing with k6

```bash
# Run basic load test
k6 run --vus 10 --duration 30s script.js

# Run stress test
k6 run --vus 100 --duration 120s script.js

# Run spike test
k6 run --stages="10s:5,10s:50,10s:5" script.js
```

### Performance Monitoring

Tests include performance monitoring:

- Page load times
- API response times
- Memory usage
- File upload speeds
- Database query times

## Accessibility Testing

### Automated Tests

Accessibility tests cover:

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Color contrast
- Screen reader support
- Mobile accessibility

### Manual Testing

Complement automated tests with:

- Screen reader testing (NVDA, VoiceOver)
- Keyboard-only navigation
- High contrast mode
- Reduced motion preferences

## Debugging Tests

### Debug Mode

```bash
# Run with debug mode
npm run test:e2e:debug

# Or with Playwright directly
npx playwright test --debug
```

### VS Code Integration

Install the Playwright extension for VS Code:

- Test discovery
- Debugging
- Test runner
- Code generation

### Common Issues

1. **Flaky Tests**: Use proper waits and retries
2. **Timeout Issues**: Increase timeouts or optimize tests
3. **Browser Issues**: Update browsers or clear cache
4. **Network Issues**: Mock network calls or use stable connection

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use provided helpers and mock data
3. Add appropriate test data-testid attributes
4. Update documentation if needed
5. Run tests locally before submitting

## Test Data Management

### Mock Data Strategy

- Use realistic but fake data
- Keep data consistent across tests
- Update mock data when API changes
- Use factories for complex objects

### Test Isolation

- Each test should be independent
- Use proper setup and teardown
- Clean up created resources
- Avoid shared state between tests

## Coverage

### Target Coverage

- **Unit Tests**: 80%+ code coverage
- **E2E Tests**: Cover all user workflows
- **API Tests**: Cover all endpoints
- **Accessibility**: WCAG 2.1 AA compliance

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Troubleshooting

### Common Test Failures

1. **Element not found**: Check data-testid attributes
2. **Timeout errors**: Increase wait times or optimize
3. **Network errors**: Mock API calls properly
4. **Authentication failures**: Check mock auth setup

### Performance Issues

1. **Slow tests**: Optimize selectors and waits
2. **Memory leaks**: Check for proper cleanup
3. **Browser crashes**: Reduce test complexity

### Environment Issues

1. **Port conflicts**: Use different ports
2. **Dependency issues**: Clean install dependencies
3. **Browser issues**: Update Playwright browsers

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [k6 Documentation](https://k6.io/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Best Practices](https://testingjavascript.com/)
