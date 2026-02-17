import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');
  
  // Optional: Clean up test data
  // await cleanupTestData();
  
  // Optional: Clean up test files
  // await cleanupTestFiles();
  
  console.log('✅ E2E test teardown completed');
}

export default globalTeardown;
