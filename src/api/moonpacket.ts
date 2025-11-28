import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { MoonPacketService } from '~/services/moonpacket';
import { verifySignature } from '~/utils/security';

export async function handleMoonPacketCheck(request: Request, env: Env): Promise<Response> {
  try {
    // 1. Headers Check
    const apiKey = request.headers.get('X-API-KEY');
    const timestamp = request.headers.get('X-API-TIMESTAMP');
    const nonce = request.headers.get('X-API-NONCE');
    const signature = request.headers.get('X-API-SIGNATURE');

    if (!apiKey || !timestamp || !nonce || !signature) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Headers' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. API Key Check
    if (apiKey !== env.MOONPACKET_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Signature Verification
    // For GET request, body is considered empty object {} for signature calculation per doc
    const body = {}; 
    const isValid = await verifySignature(env.MOONPACKET_API_SECRET || '', body, timestamp, nonce, signature);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Parse Query Parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    // 5. Initialize Service
    const db = createDatabaseClient(env.DB);
    const service = new MoonPacketService(db, env);

    // 6. Handle Logic based on user_id presence
    if (userId) {
      // Mode B: Get User Status (Runtime)
      const profile = await service.getUserProfile(userId);
      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Mode A: Get Rules (Configuration)
      const rules = await service.getRules();
      return new Response(JSON.stringify(rules), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('[API] MoonPacket Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
