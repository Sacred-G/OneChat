# Performance Testing Guide

This guide covers the comprehensive performance testing setup for the OneChat application.

## Overview

The performance testing suite includes:
- **Load Performance Tests** - Page load times, memory usage, navigation performance
- **Lighthouse Audits** - Automated performance, accessibility, and SEO audits
- **Load Testing** - Concurrent user simulation with Artillery
- **Bundle Size Analysis** - JavaScript bundle size monitoring
- **Memory Leak Detection** - Memory usage monitoring and leak detection
- **Network Performance** - API response times, offline handling, network conditions
- **Performance Regression Detection** - Automated regression testing
- **Performance Dashboard** - Comprehensive reporting and insights

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Performance Tests

```bash
npm run test:performance:all
```

### Run Specific Test Categories

```bash
# Core performance tests
npm run test:performance

# Load testing with Artillery
npm run test:performance:load

# Lighthouse audits
npm run test:performance:lighthouse

# Memory leak detection
npm run test:performance:memory

# Bundle size analysis
npm run test:performance:bundle

# Network performance tests
npm run test:performance:network
```

## Test Categories

### 1. Load Performance Tests (`tests/performance/load-performance.spec.ts`)

Tests core page loading performance metrics:

- **Page Load Time**: Full page load under 5 seconds
- **DOM Content Loaded**: DOM ready under 3 seconds
- **First Contentful Paint**: First paint under 2 seconds
- **Concurrent Loading**: Multiple pages loading efficiently
- **Memory Usage**: Memory growth monitoring during extended use
- **Large Chat History**: Performance with extensive chat content
- **File Upload Performance**: Upload speed and efficiency

#### Running Load Tests

```bash
npx playwright test tests/performance/load-performance.spec.ts
```

### 2. Lighthouse Performance Audits (`tests/performance/lighthouse.spec.ts`)

Automated Lighthouse audits for:

- **Performance Score**: Minimum 80/100
- **Accessibility**: Minimum 90/100
- **Best Practices**: Minimum 80/100
- **SEO**: Minimum 80/100

#### Prerequisites

Install playwright-lighthouse:

```bash
npm install --save-dev playwright-lighthouse
```

#### Running Lighthouse Tests

```bash
npx playwright test tests/performance/lighthouse.spec.ts
```

### 3. Load Testing with Artillery

Simulates multiple concurrent users:

- **Warm-up Phase**: 5 users for 60 seconds
- **Load Test**: 10 users for 120 seconds
- **Stress Test**: 20 users for 60 seconds
- **Cool-down**: 5 users for 60 seconds

#### Scenarios Tested

- Main page loading
- API endpoint performance (`/api/turn_response`)
- Navigation between pages
- Memory API calls
- File upload simulation

#### Running Load Tests

```bash
# Start the application first
npm run dev &

# Run load tests
npm run test:performance:load

# Or with Artillery directly
artillery run artillery-config.yml
```

### 4. Bundle Size Analysis (`tests/performance/bundle-size.spec.ts`)

Monitors JavaScript bundle sizes:

- **Main Bundle**: Under 500KB
- **Vendor Bundle**: Under 1MB
- **Total Bundle Size**: Under 2MB
- **Code Splitting**: Efficient chunk distribution
- **Compression**: Gzip compression enabled

#### Running Bundle Analysis

```bash
npx playwright test tests/performance/bundle-size.spec.ts

# Or with bundlesize directly
npm run build
npx bundlesize
```

### 5. Memory Leak Detection (`tests/performance/memory-leaks.spec.ts`)

Detects memory leaks and excessive memory usage:

- **Navigation Memory**: Memory growth during page navigation
- **Chat Memory**: Memory usage during extended chat sessions
- **Event Listener Cleanup**: Proper event listener management

#### Running Memory Tests

```bash
npx playwright test tests/performance/memory-leaks.spec.ts
```

### 6. Network Performance Tests (`tests/performance/network-performance.spec.ts`)

Tests network-related performance:

- **Slow Network**: Performance under 3G conditions
- **Offline Handling**: Graceful offline behavior
- **API Optimization**: Request optimization and caching
- **Concurrent Requests**: Efficient handling of parallel API calls
- **Request Debouncing**: Proper debouncing of user input

#### Running Network Tests

```bash
npx playwright test tests/performance/network-performance.spec.ts
```

### 7. Performance Regression Detection (`tests/performance/performance-regression.spec.ts`)

Automated regression testing:

- **Baseline Establishment**: Creates performance baseline
- **Regression Detection**: Identifies performance regressions (>20% change)
- **Trend Analysis**: Tracks performance over time
- **Consistency Checks**: Ensures consistent performance

#### Running Regression Tests

```bash
npx playwright test tests/performance/performance-regression.spec.ts
```

### 8. Performance Dashboard (`tests/performance/performance-dashboard.spec.ts`)

Comprehensive reporting and insights:

- **Core Web Vitals**: LCP, CLS, TBT monitoring
- **Network Metrics**: Request counts, transfer sizes
- **Performance Scores**: Overall performance scoring
- **Trend Analysis**: Historical performance data
- **Automated Insights**: Performance recommendations

#### Running Dashboard Tests

```bash
npx playwright test tests/performance/performance-dashboard.spec.ts
```

## Configuration

### Artillery Configuration (`artillery-config.yml`)

Customize load testing parameters:

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    # Add more phases as needed
```

### Lighthouse Configuration (`lighthouserc.js`)

Configure Lighthouse CI settings:

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
      },
    },
  },
};
```

### Bundle Size Configuration (`.bundlesize.json`)

Set size limits for different bundles:

```json
{
  "files": [
    {
      "path": ".next/static/chunks/pages/_app-*.js",
      "maxSize": "200kb",
      "compression": "gzip"
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions

Performance tests run automatically on:
- **Push to main/develop**: Full performance suite
- **Pull Requests**: Performance regression detection
- **Daily Schedule**: Comprehensive performance monitoring

### Performance Test Results

Results are stored in:
- `test-results/performance-reports.json` - Historical performance data
- `test-results/performance-baseline.json` - Performance baseline
- `test-results/performance-insights.json` - Automated insights
- `playwright-report/` - Detailed test reports

## Performance Targets

### Core Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Page Load Time | < 3s | < 5s |
| First Contentful Paint | < 1.5s | < 2s |
| Largest Contentful Paint | < 2.5s | < 4s |
| Cumulative Layout Shift | < 0.1 | < 0.25 |
| Total Blocking Time | < 200ms | < 300ms |
| Memory Growth | < 20MB | < 50MB |

### Bundle Sizes

| Bundle | Max Size (gzipped) |
|--------|-------------------|
| Main App | 200KB |
| Page Components | 150KB |
| Framework | 45KB |
| CSS | 15KB |

### API Performance

| Endpoint | Target | Critical |
|----------|--------|----------|
| `/api/turn_response` | < 2s | < 5s |
| `/api/memories` | < 300ms | < 1s |
| `/api/upload` | < 3s | < 10s |

## Troubleshooting

### Common Issues

1. **Tests Fail on CI**
   - Ensure sufficient memory allocation
   - Check for race conditions in test setup
   - Verify build completes successfully

2. **Load Test Failures**
   - Ensure dev server is running
   - Check port conflicts
   - Verify API endpoints are accessible

3. **Memory Test Failures**
   - Enable garbage collection in Chrome flags
   - Check for actual memory leaks vs. normal growth
   - Consider test environment limitations

4. **Bundle Size Failures**
   - Check for new dependencies increasing bundle size
   - Verify code splitting is working
   - Review tree shaking configuration

### Performance Optimization Tips

1. **Images**: Optimize and compress images
2. **Code Splitting**: Implement dynamic imports for large components
3. **Caching**: Add proper caching headers for static assets
4. **Database**: Optimize database queries and add indexes
5. **API**: Implement request debouncing and caching
6. **Bundle Analysis**: Use webpack-bundle-analyzer to identify large dependencies

## Monitoring

### Local Monitoring

```bash
# Watch performance during development
npm run perf:profile

# Analyze bundle composition
npm run perf:analyze
```

### Production Monitoring

Set up monitoring for:
- Core Web Vitals (Real User Monitoring)
- API response times
- Error rates
- Bundle sizes in production

## Contributing

When adding new features:

1. Run performance tests before and after changes
2. Update performance targets if needed
3. Add performance tests for new critical paths
4. Document any performance implications

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse Performance Audits](https://developers.google.com/web/tools/lighthouse)
- [Playwright Performance Testing](https://playwright.dev/docs/test-performance)
- [Artillery Load Testing](https://artillery.io/docs/)
- [Core Web Vitals](https://web.dev/vitals/)
