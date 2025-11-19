#!/usr/bin/env tsx

/**
 * Local Development with Wrangler Dev + Polling
 * 
 * This script combines Wrangler's local D1 database with Telegram polling.
 * It provides a complete local development environment.
 * 
 * Usage:
 *   pnpm tsx scripts/dev-with-local-db.ts
 */

import { spawn } from 'child_process';
import { routeUpdate } from '../src/router';
import type { Env } from '../src/types';

// Load environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment');
  console.error('💡 Make sure .dev.vars file exists with TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  🤖 XunNi Bot - Local Dev with D1 Database           ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log('⚠️  This mode requires Wrangler to be running separately.');
console.log('📝 Please run in another terminal:');
console.log('   wrangler dev --local --persist\n');
console.log('⏳ Waiting 5 seconds for you to start Wrangler...\n');

// Wait for user to start Wrangler
await new Promise(resolve => setTimeout(resolve, 5000));

console.log('🚀 Starting polling mode...\n');
console.log('💡 If you see database errors, make sure Wrangler is running!\n');
console.log('─────────────────────────────────────────────────────────\n');

// Note: This is a simplified version
// In a real implementation, you would need to connect to Wrangler's local D1
console.log('❌ Error: This mode is not fully implemented yet.');
console.log('');
console.log('💡 For now, please use one of these options:');
console.log('');
console.log('Option 1: Wait for Cloudflare to recover');
console.log('   Then deploy to staging: pnpm deploy:staging');
console.log('');
console.log('Option 2: Test bot logic without database');
console.log('   Use: pnpm dev:polling');
console.log('   Note: Database operations will fail');
console.log('');
console.log('Option 3: Deploy to Cloudflare Staging now');
console.log('   Try: pnpm deploy:staging');
console.log('   (Cloudflare might be working now)');
console.log('');

process.exit(1);

