import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

// Add missing keys
if (!translations.fortune) translations.fortune = {} as any;
const f = translations.fortune as any;

f.menuTitle = 'AI 算命';
f.currentProfile = '當前檔案';
f.selectOption = '請選擇功能：';
f.daily = '今日運勢';
f.deep = '深度批命';
f.manageProfiles = '管理檔案';
f.onboarding = {
  askName: '請輸入您的名字（或暱稱）：',
  askGender: '請選擇性別：',
  askDate: '請輸入出生日期 (YYYY-MM-DD)：',
  askTime: '請輸入出生時間 (HH:mm)，若不確定請點擊下方按鈕：',
  askCity: '請選擇您的出生城市：'
};
f.unknownTime = '我不確定出生時間';
f.profileCreated = '✅ 命理檔案已建立！';
f.noProfile = '⚠️ 尚未建立檔案';
f.generating = '🔮 AI 正在計算您的運勢，請稍候...';
f.dailyTitle = '今日運勢';
f.deepTitle = '深度命理分析';
f.loading = {
  astronomy: '正在校對行星位置...',
  bazi: '正在排布八字命盤...',
  analysis: '正在進行交叉分析...',
  generating: 'AI 生成報告中...'
};
f.quotaExceeded = '⚠️ 您的算命配額已用完！';
f.subscribe = '訂閱每日運勢';
f.unsubscribe = '取消訂閱';
f.subscribed = '✅ 已訂閱每日運勢推送';
f.unsubscribed = '🔕 已取消訂閱';
f.dailyPush = '📅 今日運勢已送達！';
f.dailyPushBody = '{name}，您的專屬日運已準備就緒。';
f.dailyPushBtn = '👇 點擊查看';

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Force updated zh-TW.ts with all fortune keys');

