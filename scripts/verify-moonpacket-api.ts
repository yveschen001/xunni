/**
 * Verify MoonPacket API
 * 
 * Usage:
 *   pnpm tsx scripts/verify-moonpacket-api.ts [local|staging|prod] [user_id]
 */

import { RulesResponse, UserProfileResponse } from '../src/domain/moonpacket';

const ENV = process.argv[2] || 'staging';
const USER_ID = process.argv[3] || '123456789';

// Configuration
const CONFIG = {
  local: {
    url: 'http://127.0.0.1:8787',
    token: 'HvQ/2z53aaqfuOyfAxqsnq1YpQWwZuPdxFWDmbXaTKM='
  },
  staging: {
    url: 'https://xunni-bot-staging.yves221.workers.dev',
    token: 'HvQ/2z53aaqfuOyfAxqsnq1YpQWwZuPdxFWDmbXaTKM='
  },
  prod: {
    url: 'https://xunni-bot.yves221.workers.dev',
    token: 'HvQ/2z53aaqfuOyfAxqsnq1YpQWwZuPdxFWDmbXaTKM='
  }
};

const target = CONFIG[ENV as keyof typeof CONFIG];
if (!target) {
  console.error(`Invalid environment: ${ENV}`);
  process.exit(1);
}

console.log(`🚀 Verifying MoonPacket API on ${ENV} (${target.url})...`);

async function verifyRules() {
  console.log('\n1️⃣  Testing Mode A: Get Rules (No user_id)...');
  try {
    const res = await fetch(`${target.url}/api/moonpacket/check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${target.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status !== 200) {
      throw new Error(`Status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as RulesResponse;
    console.log('✅ Status 200 OK');
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Response data is not an array');
    }

    const rule = data.data.find(r => r.id === 'official_channel_fan');
    if (rule) {
      console.log('✅ Found "official_channel_fan" rule');
    } else {
      console.warn('⚠️  "official_channel_fan" rule not found');
    }

    console.log(`✅ Returned ${data.data.length} rules`);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

async function verifyUserProfile() {
  console.log(`\n2️⃣  Testing Mode B: Get User Profile (user_id=${USER_ID})...`);
  try {
    const res = await fetch(`${target.url}/api/moonpacket/check?user_id=${USER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${target.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status !== 200) {
      throw new Error(`Status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as UserProfileResponse;
    console.log('✅ Status 200 OK');

    const profile = data.data;
    if (!profile) {
      throw new Error('Response data.data is missing');
    }

    // Validate new fields
    const checks = [
      { key: 'invite_count_total', type: 'number' },
      { key: 'is_channel_member', type: 'boolean' },
      { key: 'profile_completeness', type: 'number' },
      { key: 'messages_sent_24h', type: 'number' }
    ];

    for (const check of checks) {
      if (typeof profile[check.key] !== check.type) {
        throw new Error(`Field '${check.key}' is missing or wrong type (expected ${check.type}, got ${typeof profile[check.key]})`);
      }
    }

    console.log('✅ New fields present and valid:');
    console.log(`   - is_channel_member: ${profile.is_channel_member}`);
    console.log(`   - profile_completeness: ${profile.profile_completeness}`);
    console.log(`   - messages_sent_24h: ${profile.messages_sent_24h}`);
    console.log(`   - invite_count_total: ${profile.invite_count_total}`);

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

async function main() {
  await verifyRules();
  await verifyUserProfile();
  console.log('\n✨ All verifications passed!');
}

main().catch(console.error);

