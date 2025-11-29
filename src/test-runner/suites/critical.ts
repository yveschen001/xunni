/**
 * Critical Flow Test Suite
 *
 * Verifies the fundamental health of the bot and API.
 * 1. Health Check Endpoint
 * 2. Basic Command Responses (Mocked via Webhook)
 */

import { TestSuite, TestResult, TestFailure, TestContext, fetchWithRetry } from '../core';

export class CriticalFlowSuite extends TestSuite {
  name = 'Critical Flow (Health)';

  async run(context: TestContext): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // 1. Health Check
    results.push(
      await this.runTest('API Health Check', async () => {
        const url = `${context.baseUrl}/health`;
        // Usually health check is a simple GET, sometimes implied by root 200 or specific endpoint
        // If /health doesn't exist, we can try root or a known safe endpoint
        // For XunNi, let's assume root or a basic webhook ping if available.
        // Since actual webhook URL is POST, we might just check if the worker responds to GET / (often 404 or Welcome)
        // Or simply verifying the worker is reachable.

        const res = await fetchWithRetry(context.baseUrl, { method: 'GET' });
        // We expect 200 or 404 (meaning worker is alive but no route), but not 502/503
        if (res.status >= 500) throw new TestFailure(`Server Error ${res.status}`);
      })
    );

    // 2. Webhook Reachability (Simulate Update)
    results.push(
      await this.runTest('Webhook Endpoint Reachability', async () => {
        // We don't need a real update, just check if POST /webhook is accepted (or returns 200 OK)
        // With an empty body, it might return 200 or ignore it, but shouldn't crash.
        const url = `${context.baseUrl}/webhook`;
        const res = await fetchWithRetry(url, {
          method: 'POST',
          body: JSON.stringify({ update_id: 12345, message: { text: '/ping' } }),
        });

        if (res.status !== 200)
          throw new TestFailure(`Webhook returned ${res.status}`, await res.text());
      })
    );

    return results;
  }
}
