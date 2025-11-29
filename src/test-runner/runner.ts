/**
 * Parallel Execution Manager
 *
 * Manages the execution of multiple Test Suites in parallel with concurrency limits.
 */

import { performance } from 'perf_hooks';
import { TestSuite, TestResult, TestContext } from './core';

export class TestRunner {
  private suites: TestSuite[] = [];
  private concurrency: number;
  private context: TestContext;

  constructor(context: TestContext, concurrency = 3) {
    this.context = context;
    this.concurrency = concurrency;
  }

  addSuite(suite: TestSuite) {
    this.suites.push(suite);
  }

  async runAll(): Promise<boolean> {
    const startTotal = performance.now();
    console.log(
      `🚀 Starting Smoke Tests with concurrency ${this.concurrency} on ${this.context.env}...`
    );

    const allResults: Record<string, TestResult[]> = {};
    let hasFailure = false;

    // Group execution (Simple chunking for now)
    for (let i = 0; i < this.suites.length; i += this.concurrency) {
      const chunk = this.suites.slice(i, i + this.concurrency);

      const chunkPromises = chunk.map(async (suite) => {
        console.log(`▶️  [${suite.name}] Starting...`);
        try {
          const results = await suite.run(this.context);
          allResults[suite.name] = results;

          const failed = results.filter((r) => !r.passed);
          if (failed.length > 0) hasFailure = true;

          const symbol = failed.length === 0 ? '✅' : '❌';
          console.log(
            `${symbol} [${suite.name}] Finished (${results.length} tests, ${failed.length} failed)`
          );

          // Print failures immediately for debugging
          failed.forEach((f) => {
            console.error(`   🛑 ${f.name}: ${f.error}`);
            if (f.context)
              console.error('      Context:', JSON.stringify(f.context).slice(0, 200) + '...');
          });
        } catch (e: any) {
          console.error(`🔥 [${suite.name}] Suite Crashed: ${e.message}`);
          hasFailure = true;
          allResults[suite.name] = [
            {
              name: 'Suite Execution',
              passed: false,
              duration: 0,
              error: `Suite Crashed: ${e.message}`,
            },
          ];
        }
      });

      // Wait for this chunk to finish
      await Promise.all(chunkPromises);
    }

    const duration = ((performance.now() - startTotal) / 1000).toFixed(2);
    console.log(`\n🏁 All Tests Completed in ${duration}s`);

    // Generate Report here (Step 3)
    // generateReport(allResults);

    return !hasFailure;
  }
}
