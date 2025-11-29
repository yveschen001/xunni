import type { Env } from '~/types';
import { AdminLogService } from '~/services/admin_log';

/**
 * Check health of external services
 * Triggered by Cron Job
 */
export async function checkExternalServices(env: Env): Promise<void> {
  const adminLog = new AdminLogService(env);
  const status: Record<string, 'ok' | 'failed' | 'skipped'> = {};
  const errors: string[] = [];

  // 1. Check OpenAI
  try {
    // Simple models list check
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    status['OpenAI'] = 'ok';
  } catch (e) {
    status['OpenAI'] = 'failed';
    errors.push(`OpenAI: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Check Database (D1)
  try {
    await env.DB.prepare('SELECT 1').first();
    status['Database'] = 'ok';
  } catch (e) {
    status['Database'] = 'failed';
    errors.push(`D1: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Check Telegram Bot API (getMe)
  try {
    const apiRoot = env.TELEGRAM_API_ROOT || 'https://api.telegram.org';
    const res = await fetch(`${apiRoot}/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    status['Telegram'] = 'ok';
  } catch (e) {
    status['Telegram'] = 'failed';
    errors.push(`Telegram: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 4. Check MoonPacket API (if configured)
  if (env.MOONPACKET_API_KEY) {
    try {
      // Just check if variable is set, maybe a simple ping if API supports it.
      // Assuming ok if key exists for now, or skip if no known endpoint.
      status['MoonPacket'] = 'skipped'; 
    } catch (e) {
      // ...
    }
  }

  // Report only if failures exist
  if (errors.length > 0) {
    console.error('[Monitoring] Health check failed:', status);
    // Use logError for throttling
    await adminLog.logError(new Error('External Service Health Check Failed'), {
      errors,
      status
    });
  } else {
    // console.log('[Monitoring] Health check passed');
  }
}

