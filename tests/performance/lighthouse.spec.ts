import { test, expect } from '@playwright/test';

test.describe('Performance Audits (Manual Lighthouse)', () => {
  test('should meet performance thresholds on main page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      const navigation = performance.navigation;
      
      // Core Web Vitals
      let lcp = 0;
      let cls = 0;
      let tbt = 0;
      
      // Get LCP
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.log('LCP measurement failed:', e);
        }
        
        // Get CLS
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            cls = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.log('CLS measurement failed:', e);
        }
        
        // Get TBT (simplified calculation)
        try {
          let tbtValue = 0;
          const tbtObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                tbtValue += entry.duration - 50;
              }
            }
            tbt = tbtValue;
          });
          tbtObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          console.log('TBT measurement failed:', e);
        }
      }
      
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: lcp,
        cumulativeLayoutShift: cls,
        totalBlockingTime: tbt,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
      };
    });
    
    // Get paint timings
    const paintMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const paintObserver = new PerformanceObserver((list) => {
          const paintEntries = list.getEntries();
          const result: any = {};
          
          paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
              result.firstPaint = entry.startTime;
            }
            if (entry.name === 'first-contentful-paint') {
              result.firstContentfulPaint = entry.startTime;
            }
          });
          
          resolve(result);
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    Object.assign(metrics, paintMetrics);
    
    // Calculate performance score (simplified Lighthouse simulation)
    let performanceScore = 100;
    
    // Deduct points for slow load times
    if (metrics.loadTime > 3000) performanceScore -= 20;
    else if (metrics.loadTime > 2000) performanceScore -= 10;
    
    // Deduct points for slow FCP
    if (metrics.firstContentfulPaint > 2500) performanceScore -= 15;
    else if (metrics.firstContentfulPaint > 1800) performanceScore -= 8;
    
    // Deduct points for high CLS
    if (metrics.cumulativeLayoutShift > 0.25) performanceScore -= 20;
    else if (metrics.cumulativeLayoutShift > 0.1) performanceScore -= 10;
    
    // Deduct points for high TBT
    if (metrics.totalBlockingTime > 300) performanceScore -= 15;
    else if (metrics.totalBlockingTime > 200) performanceScore -= 8;
    
    performanceScore = Math.max(0, Math.min(100, performanceScore));
    
    console.log('Performance Metrics:', metrics);
    console.log('Calculated Performance Score:', performanceScore);
    
    // Performance assertions
    expect(metrics.loadTime).toBeLessThan(5000); // Page should load in under 5 seconds
    expect(metrics.domContentLoaded).toBeLessThan(3000); // DOM should be ready in under 3 seconds
    
    if (metrics.firstContentfulPaint > 0) {
      expect(metrics.firstContentfulPaint).toBeLessThan(2500); // First paint in under 2.5 seconds
    }
    
    expect(metrics.cumulativeLayoutShift).toBeLessThan(0.25); // CLS should be low
    expect(metrics.totalBlockingTime).toBeLessThan(300); // TBT should be low
    expect(performanceScore).toBeGreaterThan(70); // Performance score should be reasonable
  });

  test('should meet performance thresholds on email page', async ({ page }) => {
    await page.goto('/email');
    await page.waitForLoadState('networkidle');
    
    // Collect key metrics
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
      };
    });
    
    console.log('Email Page Metrics:', metrics);
    
    // Performance assertions (slightly more lenient for complex pages)
    expect(metrics.loadTime).toBeLessThan(8000); // Under 8 seconds for email page
    expect(metrics.domContentLoaded).toBeLessThan(5000); // Under 5 seconds
  });

  test('should meet performance thresholds on calendar page', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Collect key metrics
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0,
      };
    });
    
    console.log('Calendar Page Metrics:', metrics);
    
    // Performance assertions (slightly more lenient for complex pages)
    expect(metrics.loadTime).toBeLessThan(8000); // Under 8 seconds for calendar page
    expect(metrics.domContentLoaded).toBeLessThan(5000); // Under 5 seconds
  });

  test('should handle performance with large content', async ({ page }) => {
    // Navigate to main page
    await page.goto('/');
    
    // Simulate large chat history
    await page.evaluate(() => {
      const chatContainer = document.querySelector('[data-testid="chat-messages"]');
      if (chatContainer) {
        for (let i = 0; i < 100; i++) {
          const message = document.createElement('div');
          message.innerHTML = `
            <div class="message">
              <div class="content">This is a long message ${i} with substantial content to test performance with large amounts of text that need to be rendered efficiently by the browser without causing layout thrashing or excessive reflows.</div>
            </div>
          `;
          chatContainer.appendChild(message);
        }
      }
    });
    
    // Wait for content to render
    await page.waitForTimeout(1000);
    
    // Test performance with large content
    const startTime = Date.now();
    await page.evaluate(() => {
      const chatContainer = document.querySelector('[data-testid="chat-messages"]');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should remain fast even with large content
    expect(scrollTime).toBeLessThan(500);
    
    console.log('Scroll Time with large content:', scrollTime);
  });
});
