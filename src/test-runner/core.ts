/**
 * Core Test Runner Infrastructure
 *
 * Features:
 * 1. Automatic Retries with Exponential Backoff
 * 2. Strict Timeouts (AbortController)
 * 3. Structured Logging & Error Context
 */

import { performance } from 'perf_hooks';

export interface TestContext {
  baseUrl: string;
  token?: string; // Optional Admin/User Token
  env: 'local' | 'staging' | 'production';
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: any;
  context?: any; // Extra debug info (response body, headers, etc.)
  retries?: number;
}

export class TestFailure extends Error {
  public context: any;

  constructor(message: string, context?: any) {
    super(message);
    this.name = 'TestFailure';
    this.context = context;
  }
}

/**
 * A robust fetcher with timeout and retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 5000,
  backoffMs = 500
): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);

      // Treat 5xx errors as retryable network issues, but 4xx as logic errors (don't retry usually, unless specified)
      // For smoke tests, usually we only retry on network failures or 503s.
      if (response.status >= 500 && attempt < retries) {
        throw new Error(`Server Error ${response.status}`);
      }

      return response;
    } catch (error: any) {
      clearTimeout(id);
      lastError = error;

      const isAbort = error.name === 'AbortError';
      const errorMessage = isAbort ? `Timeout after ${timeoutMs}ms` : error.message;

      if (attempt < retries) {
        // console.warn(`⚠️  Attempt ${attempt + 1} failed: ${errorMessage}. Retrying in ${backoffMs}ms...`);
        await new Promise((r) => setTimeout(r, backoffMs));
        backoffMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Base class for a Test Suite
 */
export abstract class TestSuite {
  abstract name: string;

  // Each suite must implement run(), returning a list of results
  abstract run(context: TestContext): Promise<TestResult[]>;

  // Helper to run a single test case safely
  protected async runTest(testName: string, fn: () => Promise<void>): Promise<TestResult> {
    const start = performance.now();
    try {
      await fn();
      return {
        name: testName,
        passed: true,
        duration: performance.now() - start,
      };
    } catch (error: any) {
      return {
        name: testName,
        passed: false,
        duration: performance.now() - start,
        error: error.message,
        context: error.context,
      };
    }
  }
}
