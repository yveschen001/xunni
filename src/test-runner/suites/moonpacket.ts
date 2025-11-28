
/**
 * MoonPacket API Integration Test Suite
 * 
 * Verifies the MoonPacket v2.3 API implementation.
 * Covers:
 * 1. HMAC Signature Verification (Security)
 * 2. Mode A: Rule Configuration (GET /check)
 * 3. Mode B: User Status (GET /check?user_id=...)
 * 4. Data Type Validation
 */

import { TestSuite, TestResult, TestFailure, TestContext, fetchWithRetry } from '../core';
import { createHmac, randomBytes } from 'node:crypto';

export class MoonPacketSuite extends TestSuite {
  name = 'MoonPacket Integration';

  async run(context: TestContext): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const userId = '396943893'; // Use Super Admin ID for stable testing
    
    // Check if secrets are available (Environment Check)
    // Note: In local/staging, we might need to assume a known secret or skip strict auth if not configured
    // For smoke tests, we assume correct env vars are set.
    
    // Since we don't have access to the SERVER'S secret in the client test runner easily 
    // (unless we are running on the same machine with same .env),
    // we might face issues generating valid signatures if we don't know the secret expected by the server.
    
    // WORKAROUND: For Staging/Prod Smoke Tests, we typically need a "Test Key/Secret" pair.
    // For now, let's assume the context provides or we use the known dev secret.
    const TEST_SECRET = 'your_secret_here'; // Should come from context or config
    const TEST_KEY = 'HvQ/2z53aaqfuOyfAxqsnq1YpQWwZuPdxFWDmbXaTKM=';

    // 1. Test Mode A (Get Rules)
    results.push(await this.runTest('Mode A: Get Rules', async () => {
      const headers = this.generateHeaders({}, TEST_KEY, TEST_SECRET);
      const url = `${context.baseUrl}/api/moonpacket/check`;
      
      const res = await fetchWithRetry(url, { headers });
      if (res.status !== 200) throw new TestFailure(`Status ${res.status}`, await res.text());
      
      const json = await res.json() as any;
      if (!json.data || Array.isArray(json.data)) throw new TestFailure('Invalid response structure (data should be object)');
      if (!json.data.level?.gte) throw new TestFailure('Missing "level.gte" rule');
    }));

    // 2. Test Mode B (Get User Profile)
    results.push(await this.runTest('Mode B: Get User Profile', async () => {
      const headers = this.generateHeaders({}, TEST_KEY, TEST_SECRET);
      const url = `${context.baseUrl}/api/moonpacket/check?user_id=${userId}`;
      
      const res = await fetchWithRetry(url, { headers });
      if (res.status !== 200) throw new TestFailure(`Status ${res.status}`, await res.text());
      
      const json = await res.json() as any;
      if (!json.data) throw new TestFailure('Missing data object');
      
      // Validate key fields
      const requiredFields = ['level', 'is_vip', 'ads_watched_24h', 'messages_sent_24h'];
      const missing = requiredFields.filter(f => typeof json.data[f] === 'undefined');
      
      if (missing.length > 0) throw new TestFailure(`Missing fields: ${missing.join(', ')}`, json.data);
    }));

    // 3. Test Invalid Signature (Security)
    results.push(await this.runTest('Security: Reject Invalid Signature', async () => {
      const headers = this.generateHeaders({}, TEST_KEY, 'WRONG_SECRET');
      const url = `${context.baseUrl}/api/moonpacket/check`;
      
      const res = await fetchWithRetry(url, { headers });
      if (res.status !== 401) throw new TestFailure(`Expected 401, got ${res.status}`);
    }));

    return results;
  }

  private generateHeaders(body: object, key: string, secret: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(8).toString('hex');
    const payload = JSON.stringify(body) + timestamp + nonce;
    const signature = createHmac('sha256', secret).update(payload).digest('hex');

    return {
      'Content-Type': 'application/json',
      'X-API-KEY': key,
      'X-API-TIMESTAMP': timestamp,
      'X-API-NONCE': nonce,
      'X-API-SIGNATURE': signature
    };
  }
}

