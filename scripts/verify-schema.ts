import { execSync } from 'child_process';

// Simple script to verify DB schema changes locally
const verifySchema = () => {
  console.log('🔍 Verifying Database Schema...');
  let hasError = false;

  const checks = [
    { table: 'users', column: 'allow_matching' },
    { table: 'fortune_history', column: 'profile_snapshot' },
    { table: 'fortune_history', column: 'target_user_id' },
  ];

  for (const check of checks) {
    try {
      // PRAGMA table_info returns a list of columns. We grep the output for the column name.
      const cmd = `pnpm wrangler d1 execute DB --local --command "PRAGMA table_info(${check.table})"`;
      const output = execSync(cmd).toString();
      
      if (output.includes(check.column)) {
         console.log(`✅ ${check.table}.${check.column} found.`);
      } else {
         console.error(`❌ ${check.table}.${check.column} NOT FOUND in schema.`);
         console.error('Output:', output);
         hasError = true;
      }
    } catch (e) {
      console.error(`❌ Failed to query table ${check.table}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('🚨 Schema verification FAILED.');
    process.exit(1);
  } else {
    console.log('✨ Schema verification PASSED.');
  }
};

verifySchema();

