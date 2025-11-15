/**
 * Vitest Setup File
 * 
 * Global test configuration and setup.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup before all tests
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Cleanup after each test
afterEach(() => {
  // Reset any global state if needed
});

// Cleanup after all tests
afterAll(() => {
  console.log('✅ Test suite completed');
});

// Mock environment variables for testing
process.env.TELEGRAM_BOT_TOKEN = 'test_bot_token';
process.env.OPENAI_API_KEY = 'test_openai_key';

