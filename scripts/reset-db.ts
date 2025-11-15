/**
 * Reset Database Script
 * 
 * ⚠️ WARNING: This script will DELETE ALL DATA in the database!
 * Only use in development/staging environment.
 * 
 * Usage:
 *   pnpm reset-db
 */

import { execSync } from 'child_process';

const STAGING_DB = 'xunni-db';

console.log('🚨 DATABASE RESET SCRIPT');
console.log('='.repeat(50));
console.log('⚠️  WARNING: This will DELETE ALL DATA!');
console.log('='.repeat(50));

// Confirm before proceeding
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question('Type "RESET" to confirm: ', (answer: string) => {
  if (answer !== 'RESET') {
    console.log('❌ Reset cancelled.');
    readline.close();
    process.exit(0);
  }

  console.log('\n🗑️  Deleting all data...\n');

  try {
    // List of tables to clear
    const tables = [
      'conversation_messages',
      'bottle_chat_history',
      'conversations',
      'bottles',
      'daily_usage',
      'reports',
      'bans',
      'user_blocks',
      'mbti_test_progress',
      'payments',
      'users',
    ];

    // Delete data from each table
    for (const table of tables) {
      console.log(`  Clearing ${table}...`);
      try {
        execSync(
          `wrangler d1 execute ${STAGING_DB} --remote --command "DELETE FROM ${table};"`,
          { stdio: 'inherit' }
        );
      } catch (error) {
        console.log(`  ⚠️  ${table} might not exist or already empty`);
      }
    }

    console.log('\n✅ Database reset complete!');
    console.log('\n💡 You can now test from scratch.');
    
  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    process.exit(1);
  }

  readline.close();
});

