/**
 * Delete Fake Users from Staging
 * 
 * ⚠️ IMPORTANT: Run this before deploying to production!
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';

async function deleteFakeUsers() {
  console.log('🗑️  Deleting fake users from Staging...');
  console.log('='.repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch(`${WORKER_URL}/api/dev/delete-fake-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Deleted ${result.deleted} fake users`);
    } else {
      console.log(`❌ Failed to delete fake users: ${response.status}`);
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Done!');
  console.log('='.repeat(80));
}

deleteFakeUsers();

