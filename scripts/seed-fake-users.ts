/**
 * Seed Fake Users for Staging Testing
 * 
 * ⚠️ WARNING: This script is for STAGING ONLY!
 * These fake users MUST be deleted before deploying to production.
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';

// Fake user data
const FAKE_USERS = [
  {
    telegram_id: '9999999001',
    username: 'fake_user_alice',
    first_name: 'Alice',
    nickname: '愛麗絲',
    gender: 'female',
    birthday: '1995-03-15',
    age: 29,
    zodiac_sign: 'Pisces',
    mbti_result: 'INFP',
    mbti_source: 'manual',
    city: '台北',
    bio: '喜歡閱讀和旅行的女生 📚✈️',
    interests: '閱讀,旅行,咖啡',
    language_pref: 'zh-TW',
  },
  {
    telegram_id: '9999999002',
    username: 'fake_user_bob',
    first_name: 'Bob',
    nickname: '小明',
    gender: 'male',
    birthday: '1992-07-20',
    age: 32,
    zodiac_sign: 'Cancer',
    mbti_result: 'ENTP',
    mbti_source: 'test',
    city: '台中',
    bio: '科技愛好者，喜歡探索新事物 💻🚀',
    interests: '科技,音樂,運動',
    language_pref: 'zh-TW',
  },
  {
    telegram_id: '9999999003',
    username: 'fake_user_charlie',
    first_name: 'Charlie',
    nickname: '查理',
    gender: 'male',
    birthday: '1998-11-05',
    age: 26,
    zodiac_sign: 'Scorpio',
    mbti_result: 'ISTJ',
    mbti_source: 'manual',
    city: '高雄',
    bio: '喜歡美食和電影的上班族 🍜🎬',
    interests: '美食,電影,攝影',
    language_pref: 'zh-TW',
  },
];

async function seedFakeUsers() {
  console.log('🌱 Seeding fake users to Staging...');
  console.log('='.repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Total users to seed: ${FAKE_USERS.length}`);
  console.log('='.repeat(80));

  for (const user of FAKE_USERS) {
    try {
      const response = await fetch(`${WORKER_URL}/api/dev/seed-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        console.log(`✅ Seeded user: ${user.nickname} (${user.telegram_id})`);
      } else {
        console.log(`❌ Failed to seed user: ${user.nickname} - ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error seeding user ${user.nickname}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Fake users seeded!');
  console.log('='.repeat(80));
  console.log('\n⚠️  REMINDER: Delete these users before deploying to production!');
  console.log('   Run: pnpm tsx scripts/delete-fake-users.ts');
}

seedFakeUsers();

