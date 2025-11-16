import type { Env } from '~/types';
import { translateText } from '~/services/translation';

async function main() {
  const env = {
    DB: undefined as any,
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_WEBHOOK_SECRET: '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY,
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    GEMINI_PROJECT_ID: process.env.GEMINI_PROJECT_ID || 'gen-lang-client-0526946218',
    GEMINI_LOCATION: process.env.GEMINI_LOCATION || 'us-central1',
    ENVIRONMENT: 'development',
    LOG_LEVEL: 'info',
    BROADCAST_BATCH_SIZE: '25',
    BROADCAST_MAX_JOBS: '3',
    ENABLE_AI_MODERATION: 'true',
    ENABLE_TRANSLATION: 'true',
  } as Env;

  if (!env.GOOGLE_GEMINI_API_KEY) {
    console.error('✨ GOOGLE_GEMINI_API_KEY not set. Please source .dev.vars first.');
    process.exit(1);
  }

  const text = '這是一段要測試翻譯的文字。';
  console.log('Translating text:', text);

  const result = await translateText(text, 'en', 'zh-TW', false, env);
  console.log('Translation result:', result);
}

main().catch((error) => {
  console.error('Translation test failed:', error);
  process.exit(1);
});

