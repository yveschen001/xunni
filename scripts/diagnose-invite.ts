/**
 * Diagnose Invite Issue
 * 
 * Check invite data in database to diagnose why invite count is not updating
 */

import { createDatabaseClient } from '../src/db/client';

// Mock environment for database access
const mockEnv = {
  DB: null as any, // Will be set from command line args
  ENVIRONMENT: 'staging',
};

async function diagnoseInvite(inviterTelegramId: string, inviteeTelegramId: string) {
  console.log('\n🔍 診斷邀請數據\n');
  console.log('=' .repeat(80));
  console.log(`邀請者 ID: ${inviterTelegramId}`);
  console.log(`被邀請者 ID: ${inviteeTelegramId}`);
  console.log('=' .repeat(80));

  const db = createDatabaseClient(mockEnv as any);

  // Check inviter user data
  console.log('\n📋 1. 檢查邀請者用戶數據：');
  try {
    const inviter = await db.d1.prepare(
      'SELECT telegram_id, nickname, successful_invites, invite_code, invited_by FROM users WHERE telegram_id = ?'
    ).bind(inviterTelegramId).first();

    if (inviter) {
      console.log('   ✅ 邀請者存在');
      console.log(`   - 暱稱：${inviter.nickname}`);
      console.log(`   - 邀請碼：${inviter.invite_code}`);
      console.log(`   - 成功邀請數：${inviter.successful_invites || 0}`);
      console.log(`   - 被誰邀請：${inviter.invited_by || '無'}`);
    } else {
      console.log('   ❌ 邀請者不存在');
      return;
    }
  } catch (error) {
    console.log('   ❌ 查詢失敗：', error);
    return;
  }

  // Check invitee user data
  console.log('\n📋 2. 檢查被邀請者用戶數據：');
  try {
    const invitee = await db.d1.prepare(
      'SELECT telegram_id, nickname, invited_by, onboarding_step FROM users WHERE telegram_id = ?'
    ).bind(inviteeTelegramId).first();

    if (invitee) {
      console.log('   ✅ 被邀請者存在');
      console.log(`   - 暱稱：${invitee.nickname}`);
      console.log(`   - 被誰邀請：${invitee.invited_by || '無'}`);
      console.log(`   - 註冊狀態：${invitee.onboarding_step}`);
      
      if (invitee.invited_by !== inviterTelegramId) {
        console.log(`   ⚠️ 警告：被邀請者的 invited_by (${invitee.invited_by}) 與邀請者 ID (${inviterTelegramId}) 不匹配！`);
      }
    } else {
      console.log('   ❌ 被邀請者不存在');
      return;
    }
  } catch (error) {
    console.log('   ❌ 查詢失敗：', error);
    return;
  }

  // Check invite record
  console.log('\n📋 3. 檢查邀請記錄：');
  try {
    const invite = await db.d1.prepare(
      'SELECT * FROM invites WHERE inviter_telegram_id = ? AND invitee_telegram_id = ?'
    ).bind(inviterTelegramId, inviteeTelegramId).first();

    if (invite) {
      console.log('   ✅ 邀請記錄存在');
      console.log(`   - 邀請碼：${invite.invite_code}`);
      console.log(`   - 狀態：${invite.status}`);
      console.log(`   - 創建時間：${invite.created_at}`);
      console.log(`   - 激活時間：${invite.activated_at || '未激活'}`);
      
      if (invite.status !== 'activated') {
        console.log(`   ⚠️ 警告：邀請狀態為 "${invite.status}"，應該是 "activated"！`);
      }
    } else {
      console.log('   ❌ 邀請記錄不存在');
      console.log('   💡 這可能是問題所在！');
    }
  } catch (error) {
    console.log('   ❌ 查詢失敗：', error);
  }

  // Check all invites for inviter
  console.log('\n📋 4. 檢查邀請者的所有邀請記錄：');
  try {
    const allInvites = await db.d1.prepare(
      'SELECT * FROM invites WHERE inviter_telegram_id = ? ORDER BY created_at DESC'
    ).bind(inviterTelegramId).all();

    if (allInvites.results && allInvites.results.length > 0) {
      console.log(`   ✅ 找到 ${allInvites.results.length} 條邀請記錄`);
      allInvites.results.forEach((inv: any, idx: number) => {
        console.log(`   ${idx + 1}. 被邀請者: ${inv.invitee_telegram_id}`);
        console.log(`      狀態: ${inv.status}`);
        console.log(`      創建: ${inv.created_at}`);
        console.log(`      激活: ${inv.activated_at || '未激活'}`);
      });
    } else {
      console.log('   ❌ 沒有找到任何邀請記錄');
    }
  } catch (error) {
    console.log('   ❌ 查詢失敗：', error);
  }

  // Check if invitee has thrown any bottles
  console.log('\n📋 5. 檢查被邀請者是否丟過瓶子：');
  try {
    const bottleCount = await db.d1.prepare(
      'SELECT COUNT(*) as count FROM bottles WHERE owner_telegram_id = ?'
    ).bind(inviteeTelegramId).first();

    if (bottleCount && bottleCount.count > 0) {
      console.log(`   ✅ 被邀請者已丟 ${bottleCount.count} 個瓶子`);
    } else {
      console.log('   ❌ 被邀請者還沒有丟過瓶子');
      console.log('   💡 邀請只有在被邀請者丟第一個瓶子時才會激活！');
    }
  } catch (error) {
    console.log('   ❌ 查詢失敗：', error);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 診斷總結\n');
  console.log('請檢查以上輸出，特別注意：');
  console.log('1. 邀請記錄是否存在');
  console.log('2. 邀請狀態是否為 "activated"');
  console.log('3. 被邀請者的 invited_by 是否正確');
  console.log('4. 被邀請者是否已經丟過瓶子');
  console.log('5. 邀請者的 successful_invites 數字');
  console.log('=' .repeat(80));
}

// Get telegram IDs from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('\n❌ 使用方法：');
  console.error('   pnpm tsx scripts/diagnose-invite.ts <邀請者ID> <被邀請者ID>');
  console.error('\n例如：');
  console.error('   pnpm tsx scripts/diagnose-invite.ts 123456789 987654321\n');
  process.exit(1);
}

const inviterTelegramId = args[0];
const inviteeTelegramId = args[1];

// Note: This script needs to be run with proper database binding
console.log('\n⚠️ 注意：此腳本需要直接訪問數據庫');
console.log('請使用 wrangler d1 execute 或在 worker 環境中運行\n');

diagnoseInvite(inviterTelegramId, inviteeTelegramId)
  .then(() => {
    console.log('\n✅ 診斷完成\n');
  })
  .catch((error) => {
    console.error('\n❌ 診斷失敗：', error);
    process.exit(1);
  });

