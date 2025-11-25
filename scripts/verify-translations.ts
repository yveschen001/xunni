/**
 * 验证翻译是否正确加载
 * 测试：zh-CN 和 en 翻译是否在代码中可用
 */

import { createI18n } from '../src/i18n';

function main() {
  console.log('🔍 验证翻译是否正确加载...\n');
  console.log('='.repeat(80));
  console.log();

  // 测试 keys
  const testKeys = [
    'ad.ad',
    'adPrompt.completeTask',
    'adPrompt.inviteFriends',
    'common.notSet',
    'common.userNotFound',
    'menu.title',
    'profile.title',
    'settings.title',
  ];

  console.log('📋 测试翻译加载:\n');

  // 测试 zh-TW
  console.log('1️⃣ 测试 zh-TW (繁体中文):');
  const zhTWI18n = createI18n('zh-TW');
  testKeys.forEach(key => {
    try {
      const value = zhTWI18n.t(key);
      if (value && !value.startsWith('[')) {
        console.log(`   ✅ ${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ ${key}: 未找到翻译`);
      }
    } catch (error) {
      console.log(`   ❌ ${key}: 错误 - ${error}`);
    }
  });
  console.log();

  // 测试 zh-CN
  console.log('2️⃣ 测试 zh-CN (简体中文):');
  const zhCNI18n = createI18n('zh-CN');
  testKeys.forEach(key => {
    try {
      const value = zhCNI18n.t(key);
      if (value && !value.startsWith('[')) {
        console.log(`   ✅ ${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ ${key}: 未找到翻译`);
      }
    } catch (error) {
      console.log(`   ❌ ${key}: 错误 - ${error}`);
    }
  });
  console.log();

  // 测试 en
  console.log('3️⃣ 测试 en (英文):');
  const enI18n = createI18n('en');
  testKeys.forEach(key => {
    try {
      const value = enI18n.t(key);
      if (value && !value.startsWith('[')) {
        console.log(`   ✅ ${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ ${key}: 未找到翻译`);
      }
    } catch (error) {
      console.log(`   ❌ ${key}: 错误 - ${error}`);
    }
  });
  console.log();

  // 测试变量替换
  console.log('4️⃣ 测试变量替换:');
  try {
    const testI18n = createI18n('en');
    const value = testI18n.t('common.userNotFound');
    console.log(`   ✅ common.userNotFound: ${value}`);
    
    // 测试带变量的翻译
    const valueWithParams = testI18n.t('menu.greeting', { nickname: 'TestUser' });
    console.log(`   ✅ menu.greeting (带参数): ${valueWithParams}`);
  } catch (error) {
    console.log(`   ❌ 变量替换测试失败: ${error}`);
  }
  console.log();

  console.log('='.repeat(80));
  console.log('✅ 翻译验证完成！\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

