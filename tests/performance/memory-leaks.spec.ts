import { test, expect } from '@playwright/test';

test.describe('Memory Leak Detection', () => {
  test('should not leak memory during navigation', async ({ page }) => {
    await page.goto('/');
    
    // Enable memory monitoring
    const memorySnapshots: number[] = [];
    
    // Take initial memory snapshot
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    memorySnapshots.push(initialMemory);
    
    // Perform multiple navigation cycles
    const routes = ['/', '/email', '/calendar'];
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Simulate user interaction
        await page.click('body');
        await page.waitForTimeout(100);
        
        // Take memory snapshot
        const memory = await page.evaluate(() => {
          return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
        });
        memorySnapshots.push(memory);
      }
    }
    
    // Force garbage collection if available
    try {
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
    } catch (e) {
      // GC not available, continue
    }
    
    // Final memory snapshot
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    memorySnapshots.push(finalMemory);
    
    // Analyze memory growth
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthMB = memoryGrowth / (1024 * 1024);
    
    console.log('Memory Snapshots:', memorySnapshots.map(m => Math.round(m / 1024 / 1024) + 'MB'));
    console.log('Memory Growth:', memoryGrowthMB.toFixed(2) + 'MB');
    
    // Memory growth should be reasonable
    expect(memoryGrowthMB).toBeLessThan(20); // Less than 20MB growth
    
    // Memory should not grow continuously
    const lastThreeSnapshots = memorySnapshots.slice(-3);
    const recentGrowth = lastThreeSnapshots[2] - lastThreeSnapshots[0];
    const recentGrowthMB = recentGrowth / (1024 * 1024);
    expect(recentGrowthMB).toBeLessThan(5); // Less than 5MB recent growth
  });

  test('should not leak memory during chat interactions', async ({ page }) => {
    await page.goto('/');
    
    const memorySnapshots: number[] = [];
    
    // Initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    memorySnapshots.push(initialMemory);
    
    // Simulate extensive chat usage
    for (let i = 0; i < 50; i++) {
      await page.fill('[data-testid="chat-input"]', `Test message ${i}: This is a longer message to test memory usage during extended chat sessions with substantial content.`);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(200);
      
      // Take memory snapshot every 10 messages
      if (i % 10 === 0) {
        const memory = await page.evaluate(() => {
          return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
        });
        memorySnapshots.push(memory);
      }
    }
    
    // Final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    memorySnapshots.push(finalMemory);
    
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthMB = memoryGrowth / (1024 * 1024);
    
    console.log('Chat Memory Snapshots:', memorySnapshots.map(m => Math.round(m / 1024 / 1024) + 'MB'));
    console.log('Chat Memory Growth:', memoryGrowthMB.toFixed(2) + 'MB');
    
    // Memory growth should be proportional to content
    expect(memoryGrowthMB).toBeLessThan(30); // Less than 30MB for 50 messages
  });

  test('should clean up event listeners properly', async ({ page }) => {
    await page.goto('/');
    
    // Monitor active event listeners
    const initialListeners = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let totalListeners = 0;
      elements.forEach(el => {
        // This is a rough estimation - actual listener counting is complex
        const events = (el as any)._eventListeners;
        if (events) {
          totalListeners += Object.keys(events).length;
        }
      });
      return totalListeners;
    });
    
    // Perform multiple component mount/unmount cycles
    for (let i = 0; i < 20; i++) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Simulate component interactions
      await page.click('[data-testid="chat-input"]');
      await page.waitForTimeout(100);
      
      // Navigate away and back
      await page.goto('/email');
      await page.waitForLoadState('networkidle');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }
    
    // Check final listener count
    const finalListeners = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let totalListeners = 0;
      elements.forEach(el => {
        const events = (el as any)._eventListeners;
        if (events) {
          totalListeners += Object.keys(events).length;
        }
      });
      return totalListeners;
    });
    
    console.log('Initial Listeners:', initialListeners);
    console.log('Final Listeners:', finalListeners);
    
    // Listener count should not grow excessively
    const listenerGrowth = finalListeners - initialListeners;
    expect(listenerGrowth).toBeLessThan(100); // Reasonable listener growth
  });
});
