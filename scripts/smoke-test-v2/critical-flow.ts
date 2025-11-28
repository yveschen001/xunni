import { SmartRunner } from './runner';

export async function runCriticalFlows(runner: SmartRunner, baseUrl: string) {
  // 1. Health Check
  await runner.runSuite('critical', 'Health Check', async () => {
    // Assuming root or /health endpoint exists, or just checking connectivity
    // If no explicit health endpoint, we might check /api/moonpacket/check (Mode A) as a proxy for worker being up
    const res = await fetch(`${baseUrl}/api/moonpacket/check`, { 
        method: 'GET',
        headers: {
            'X-API-KEY': 'mock-key', // Just to trigger 401/403 or 200, checking connectivity
            // Not providing valid signature, so expect 401, but connection should succeed
        }
    });
    
    // If we get 502/503/522, it's a failure. 401/200/404 means worker is responding.
    if (res.status >= 500) {
        throw new Error(`Health check failed with status ${res.status}`);
    }
  });
}

