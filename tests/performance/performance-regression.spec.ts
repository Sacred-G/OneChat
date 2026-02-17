import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface PerformanceBaseline {
  timestamp: number;
  metrics: {
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    memoryUsage: number;
    bundleSize: number;
  };
}

test.describe('Performance Regression Detection', () => {
  const baselinePath = join(process.cwd(), 'test-results', 'performance-baseline.json');
  const resultsDir = join(process.cwd(), 'test-results');
  
  // Ensure results directory exists
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  function loadBaseline(): PerformanceBaseline | null {
    if (!existsSync(baselinePath)) {
      return null;
    }
    try {
      const content = readFileSync(baselinePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.log('Failed to load baseline:', error);
      return null;
    }
  }

  function saveBaseline(metrics: PerformanceBaseline['metrics']) {
    const baseline: PerformanceBaseline = {
      timestamp: Date.now(),
      metrics,
    };
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
    console.log('Performance baseline saved:', baselinePath);
  }

  function compareWithBaseline(current: PerformanceBaseline['metrics'], baseline: PerformanceBaseline) {
    const results: { [key: string]: { current: number; baseline: number; change: number; status: string } } = {};
    
    Object.keys(current).forEach(key => {
      const currentValue = current[key as keyof typeof current];
      const baselineValue = baseline.metrics[key as keyof typeof baseline.metrics];
      const change = ((currentValue - baselineValue) / baselineValue) * 100;
      
      let status = 'PASS';
      if (Math.abs(change) > 20) {
        status = 'FAIL';
      } else if (Math.abs(change) > 10) {
        status = 'WARN';
      }
      
      results[key] = {
        current: currentValue,
        baseline: baselineValue,
        change: Math.round(change * 100) / 100,
        status,
      };
    });
    
    return results;
  }

  test('should establish performance baseline', async ({ page }) => {
    const baseline = loadBaseline();
    
    if (!baseline) {
      console.log('No baseline found. Establishing new baseline...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstContentfulPaint: 0, // Will be measured separately
          memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
          bundleSize: 0, // Will be calculated separately
        };
      });
      
      // Measure First Contentful Paint
      const fcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
              if (fcpEntry) {
                resolve(fcpEntry.startTime);
                observer.disconnect();
              }
            });
            observer.observe({ entryTypes: ['paint'] });
            
            // Timeout after 5 seconds
            setTimeout(() => resolve(0), 5000);
          } else {
            resolve(0);
          }
        });
      });
      
      metrics.firstContentfulPaint = fcp;
      
      // Estimate bundle size (simplified)
      metrics.bundleSize = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.reduce((total, script) => {
          const src = (script as HTMLScriptElement).src;
          if (src.includes('/_next/static/chunks/')) {
            return total + 100000; // Estimated 100KB per chunk
          }
          return total;
        }, 0);
      });
      
      saveBaseline(metrics);
      console.log('Baseline metrics:', metrics);
      
      // Skip comparison for baseline establishment
      test.skip();
      return;
    }
    
    console.log('Baseline found. Running comparison tests...');
  });

  test('should not regress in performance metrics', async ({ page }) => {
    const baseline = loadBaseline();
    
    if (!baseline) {
      test.skip();
      return;
    }
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const currentMetrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstContentfulPaint: 0,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
        bundleSize: 0,
      };
    });
    
    // Measure First Contentful Paint
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              resolve(fcpEntry.startTime);
              observer.disconnect();
            }
          });
          observer.observe({ entryTypes: ['paint'] });
          setTimeout(() => resolve(0), 5000);
        } else {
          resolve(0);
        }
      });
    });
    
    currentMetrics.firstContentfulPaint = fcp;
    
    // Estimate bundle size
    currentMetrics.bundleSize = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.reduce((total, script) => {
        const src = (script as HTMLScriptElement).src;
        if (src.includes('/_next/static/chunks/')) {
          return total + 100000;
        }
        return total;
      }, 0);
    });
    
    const comparison = compareWithBaseline(currentMetrics, baseline);
    
    console.log('Performance Comparison:');
    Object.entries(comparison).forEach(([metric, result]) => {
      console.log(`${metric}: ${result.current}ms vs ${result.baseline}ms (${result.change}% ${result.status})`);
    });
    
    // Assert no significant regressions
    Object.values(comparison).forEach(result => {
      if (result.status === 'FAIL') {
        throw new Error(`Performance regression detected: ${result.change}% change`);
      }
    });
    
    // Warn about potential issues
    const warnings = Object.entries(comparison).filter(([_, result]) => result.status === 'WARN');
    if (warnings.length > 0) {
      console.log('Performance warnings detected:');
      warnings.forEach(([metric, result]) => {
        console.log(`  ${metric}: ${result.change}% change`);
      });
    }
  });

  test('should track performance trends over time', async ({ page }) => {
    const baseline = loadBaseline();
    
    if (!baseline) {
      test.skip();
      return;
    }
    
    // Load multiple pages to test consistency
    const measurements: PerformanceBaseline['metrics'][] = [];
    
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstContentfulPaint: 0,
          memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
          bundleSize: 0,
        };
      });
      
      measurements.push(metrics);
      await page.waitForTimeout(1000); // Wait between measurements
    }
    
    // Calculate averages and standard deviations
    const averages = {
      loadTime: measurements.reduce((sum, m) => sum + m.loadTime, 0) / measurements.length,
      domContentLoaded: measurements.reduce((sum, m) => sum + m.domContentLoaded, 0) / measurements.length,
      firstContentfulPaint: measurements.reduce((sum, m) => sum + m.firstContentfulPaint, 0) / measurements.length,
      memoryUsage: measurements.reduce((sum, m) => sum + m.memoryUsage, 0) / measurements.length,
      bundleSize: measurements.reduce((sum, m) => sum + m.bundleSize, 0) / measurements.length,
    };
    
    console.log('Performance averages over 5 runs:', averages);
    
    // Check consistency (standard deviation should be low)
    const stdDevs = {
      loadTime: Math.sqrt(measurements.reduce((sum, m) => sum + Math.pow(m.loadTime - averages.loadTime, 2), 0) / measurements.length),
      domContentLoaded: Math.sqrt(measurements.reduce((sum, m) => sum + Math.pow(m.domContentLoaded - averages.domContentLoaded, 2), 0) / measurements.length),
    };
    
    console.log('Performance standard deviations:', stdDevs);
    
    // Performance should be consistent
    expect(stdDevs.loadTime).toBeLessThan(1000); // Load time variance under 1 second
    expect(stdDevs.domContentLoaded).toBeLessThan(500); // DOM load variance under 500ms
  });
});
