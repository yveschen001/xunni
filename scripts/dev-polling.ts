/**
 * Local Development with Polling
 * 
 * This script runs the bot locally using Telegram's getUpdates API (polling mode)
 * instead of webhooks. Perfect for local development when you can't deploy to Cloudflare.
 * 
 * Usage:
 *   pnpm dev:polling
 * 
 * Features:
 *   - Uses Wrangler's local D1 database
 *   - Polls Telegram for updates
 *   - Full local development environment
 *   - Hot reload with code changes
 */

import { routeUpdate } from '../src/router';
import type { Env } from '../src/types';

// Load environment variables from .dev.vars
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment');
  console.error('💡 Make sure .dev.vars file exists with TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

// Create mock Env object for local development
// Note: DB will need to be set up separately with Wrangler
function createMockEnv(): Env {
  return {
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY || '',
    GEMINI_PROJECT_ID: process.env.GEMINI_PROJECT_ID || '',
    GEMINI_LOCATION: process.env.GEMINI_LOCATION || 'us-central1',
    GEMINI_MODELS: process.env.GEMINI_MODELS || 'gemini-2.0-flash-exp',
    ENVIRONMENT: 'development',
    LOG_LEVEL: 'debug',
    BROADCAST_BATCH_SIZE: '25',
    BROADCAST_MAX_JOBS: '3',
    
    // Mock D1 Database
    // In real usage, this would be provided by Wrangler
    DB: null as any,
  } as Env;
}

let offset = 0;

/**
 * Fetch updates from Telegram
 */
async function getUpdates() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    return data.result;
  } catch (error) {
    console.error('❌ Error fetching updates:', error);
    return [];
  }
}

/**
 * Process a single update
 */
async function processUpdate(update: any, env: Env) {
  try {
    console.log(`\n📨 Processing update ${update.update_id}`);
    
    // Show a summary of the update
    if (update.message) {
      const msg = update.message;
      const from = msg.from;
      const text = msg.text || msg.caption || '[non-text message]';
      console.log(`   From: ${from.first_name} (@${from.username || 'no-username'})`);
      console.log(`   Text: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    } else if (update.callback_query) {
      const cb = update.callback_query;
      console.log(`   Callback: ${cb.data}`);
      console.log(`   From: ${cb.from.first_name}`);
    }
    
    // Process the update using the router
    await routeUpdate(update, env);
    
    console.log(`✅ Update processed successfully`);
    
    // Update offset to acknowledge this update
    offset = update.update_id + 1;
  } catch (error) {
    console.error('❌ Error processing update:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    // Still update offset to avoid getting stuck
    offset = update.update_id + 1;
  }
}

/**
 * Delete webhook to enable polling
 */
async function deleteWebhook() {
  try {
    console.log('🔧 Removing webhook to enable polling...');
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`
    );
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook removed successfully');
    } else {
      console.warn('⚠️  Failed to remove webhook:', data.description);
    }
  } catch (error) {
    console.error('❌ Error removing webhook:', error);
  }
}

/**
 * Main polling loop
 */
async function startPolling() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🤖 XunNi Bot - Local Development (Polling Mode)     ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log('📍 Environment: development');
  console.log('🔑 Bot Token: ' + TELEGRAM_BOT_TOKEN.substring(0, 20) + '...');
  console.log('🗄️  Database: Mock (no persistence)');
  console.log('🔄 Mode: Long Polling (30s timeout)');
  console.log('⚠️  Note: Database operations will fail - use for testing bot logic only\n');
  
  // Create mock environment
  const env = createMockEnv();
  
  // Remove webhook first
  await deleteWebhook();
  
  console.log('🚀 Starting to poll for updates...');
  console.log('💡 Send a message to your bot to test!\n');
  console.log('─────────────────────────────────────────────────────────\n');
  
  let updateCount = 0;
  
  while (true) {
    try {
      const updates = await getUpdates();
      
      if (updates.length > 0) {
        updateCount += updates.length;
        console.log(`\n📬 Received ${updates.length} update(s) (Total: ${updateCount})`);
        
        for (const update of updates) {
          await processUpdate(update, env);
        }
        
        console.log('\n─────────────────────────────────────────────────────────');
      }
      
      // Small delay between polls
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error in polling loop:', error);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

// Start the bot
startPolling().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

