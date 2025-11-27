import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { MoonPacketService } from '~/services/moonpacket';

export async function handleMoonPacketCheck(request: Request, env: Env): Promise<Response> {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Bearer Token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    if (token !== env.MOONPACKET_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse Query Parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    // 3. Initialize Service
    const db = createDatabaseClient(env.DB);
    const service = new MoonPacketService(db, env);

    // 4. Handle Logic based on user_id presence
    if (userId) {
      // Mode B: Get User Status
      const profile = await service.getUserProfile(userId);
      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Mode A: Get Rules
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

