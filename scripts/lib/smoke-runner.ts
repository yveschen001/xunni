import { createHmac, randomBytes } from 'node:crypto';
import { spawn } from 'child_process';

// Configuration Types
export interface TestConfig {
  name: string;
  timeout?: number; // ms
  retries?: number;
  skip?: boolean;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  params?: Record<string, string>;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: any;
}

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export class SmokeTestRunner {
  private baseUrl: string;
  private defaultTimeout: number;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor(baseUrl: string, defaultTimeout: number = 10000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Run a group of tests in parallel
   */
  async runGroup(name: string, tests: Array<() => Promise<void>>): Promise<void> {
    console.log(`\n${COLORS.blue}📦 Group: ${name}${COLORS.reset}`);
    const start = Date.now();
    
    // Execute all tests in the group concurrently
    const promises = tests.map(test => test().catch(e => e)); // Catch locally to prevent Promise.all from rejecting early
    await Promise.all(promises);

    console.log(`${COLORS.gray}   Group finished in ${Date.now() - start}ms${COLORS.reset}`);
  }

  /**
   * Define and run a single test case
   */
  async test(name: string, fn: () => Promise<void>, config: TestConfig = { name: '' }): Promise<void> {
    if (config.skip) {
      console.log(`${COLORS.yellow}   ○ Skipped: ${name}${COLORS.reset}`);
      this.results.push({ name, status: 'skipped', duration: 0 });
      return;
    }

    const start = Date.now();
    const timeout = config.timeout || this.defaultTimeout;
    const retries = config.retries || 0;

    let attempt = 0;
    let lastError: any;

    while (attempt <= retries) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Test timed out after ${timeout}ms`)), timeout)
        );

        // Race the test against the timeout
        await Promise.race([fn(), timeoutPromise]);

        const duration = Date.now() - start;
        console.log(`${COLORS.green}   ✓ Passed: ${name} (${duration}ms)${COLORS.reset}`);
        this.results.push({ name, status: 'passed', duration });
        return;

      } catch (error: any) {
        lastError = error;
        attempt++;
        if (attempt <= retries) {
          console.log(`${COLORS.yellow}   ↻ Retry ${attempt}/${retries}: ${name} (${error.message})${COLORS.reset}`);
        }
      }
    }

    // If we get here, all retries failed
    const duration = Date.now() - start;
    console.error(`${COLORS.red}   ✕ Failed: ${name} (${duration}ms)${COLORS.reset}`);
    console.error(`${COLORS.gray}     Error: ${lastError?.message}${COLORS.reset}`);
    if (lastError?.cause) {
        console.error(`${COLORS.gray}     Cause: ${JSON.stringify(lastError.cause)}${COLORS.reset}`);
    }
    this.results.push({ name, status: 'failed', duration, error: lastError });
  }

  /**
   * Helper to make HTTP requests with timeout and better error handling
   */
  async fetch(path: string, options: RequestOptions = {}): Promise<Response> {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);
    
    // Add query params
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const timeout = options.timeout || this.defaultTimeout;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error: any) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${path} timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Helper to execute a shell command (e.g., for static checks)
   */
  async exec(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { stdio: 'inherit', shell: true });
      
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command "${command} ${args.join(' ')}" failed with code ${code}`));
      });

      proc.on('error', (err) => reject(err));
    });
  }

  /**
   * Generate HMAC headers for MoonPacket API
   */
  generateMoonPacketHeaders(secret: string, body: object = {}): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(8).toString('hex');
    const payload = JSON.stringify(body) + timestamp + nonce;
    const signature = createHmac('sha256', secret).update(payload).digest('hex');

    return {
      'Content-Type': 'application/json',
      'X-API-TIMESTAMP': timestamp,
      'X-API-NONCE': nonce,
      'X-API-SIGNATURE': signature
    };
  }

  /**
   * Generate and print the final report
   */
  report(): boolean {
    const passed = this.results.filter(r => r.status === 'passed');
    const failed = this.results.filter(r => r.status === 'failed');
    const skipped = this.results.filter(r => r.status === 'skipped');
    const totalDuration = this.results.reduce((acc, r) => acc + r.duration, 0);

    console.log(`\n${COLORS.cyan}========================================${COLORS.reset}`);
    console.log(`${COLORS.cyan}   Smoke Test Summary${COLORS.reset}`);
    console.log(`${COLORS.cyan}========================================${COLORS.reset}`);
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`${COLORS.green}Passed:      ${passed.length}${COLORS.reset}`);
    console.log(`${COLORS.red}Failed:      ${failed.length}${COLORS.reset}`);
    console.log(`${COLORS.yellow}Skipped:     ${skipped.length}${COLORS.reset}`);
    console.log(`Duration:    ${(totalDuration / 1000).toFixed(2)}s (cumulative)`);

    if (failed.length > 0) {
      console.log(`\n${COLORS.red}Failed Tests Details:${COLORS.reset}`);
      failed.forEach(f => {
        console.log(`- ${f.name}: ${f.error?.message}`);
      });
      return false; // Return false to indicate failure
    }

    return true; // Return true for success
  }
}

