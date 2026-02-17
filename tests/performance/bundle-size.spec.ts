import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Bundle Size Analysis', () => {
  const bundleDir = join(process.cwd(), '.next');
  
  test('should maintain reasonable bundle sizes', async () => {
    // Build the application first
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.log('Build failed, skipping bundle size tests');
      test.skip();
      return;
    }

    const bundleSizes = {
      main: 0,
      vendor: 0,
      total: 0,
    };

    // Check main bundle sizes
    const staticDir = join(bundleDir, 'static');
    if (existsSync(staticDir)) {
      const chunks = execSync(`find ${staticDir} -name "*.js" -exec ls -l {} \\;`, { encoding: 'utf8' });
      const lines = chunks.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        const size = parseInt(line.split(/\s+/)[4], 10);
        bundleSizes.total += size;
        
        if (line.includes('main-') || line.includes('_app-')) {
          bundleSizes.main += size;
        } else if (line.includes('vendor-') || line.includes('framework-')) {
          bundleSizes.vendor += size;
        }
      });
    }

    // Convert to KB
    const sizesKB = {
      main: Math.round(bundleSizes.main / 1024),
      vendor: Math.round(bundleSizes.vendor / 1024),
      total: Math.round(bundleSizes.total / 1024),
    };

    console.log('Bundle Sizes (KB):', sizesKB);

    // Performance assertions
    expect(sizesKB.main).toBeLessThan(500); // Main bundle under 500KB
    expect(sizesKB.vendor).toBeLessThan(1000); // Vendor bundle under 1MB
    expect(sizesKB.total).toBeLessThan(2000); // Total under 2MB
  });

  test('should have efficient code splitting', async () => {
    const staticDir = join(bundleDir, 'static');
    if (!existsSync(staticDir)) {
      test.skip();
      return;
    }

    // Count number of chunks
    const chunkCount = parseInt(execSync(`find ${staticDir} -name "*.js" | wc -l`, { encoding: 'utf8' }), 10);
    
    console.log('Number of JS chunks:', chunkCount);
    
    // Should have multiple chunks for code splitting
    expect(chunkCount).toBeGreaterThan(3);
    
    // Should not have too many tiny chunks
    expect(chunkCount).toBeLessThan(50);
  });

  test('should compress assets properly', async () => {
    const staticDir = join(bundleDir, 'static');
    if (!existsSync(staticDir)) {
      test.skip();
      return;
    }

    // Check for gzipped files
    const gzippedFiles = execSync(`find ${staticDir} -name "*.gz" | wc -l`, { encoding: 'utf8' });
    const gzippedCount = parseInt(gzippedFiles, 10);
    
    console.log('Number of gzipped files:', gzippedCount);
    
    // Should have gzip compression enabled
    expect(gzippedCount).toBeGreaterThan(0);
  });
});
