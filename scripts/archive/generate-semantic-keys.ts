/**
 * Generate Semantic i18n Keys
 * 使用 AI 生成语义化的 i18n keys
 */

import * as fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

interface ExtractedString {
  text: string;
  file: string;
  line: number;
  context: string;
  type: 'string' | 'template';
}

interface KeyMapping {
  original: string;
  key: string;
  category: string;
  subcategory?: string;
  action?: string;
  confidence: number; // AI 生成的置信度
}

const BATCH_SIZE = 100; // 每次处理 100 个字符串
const MAX_RETRIES = 3;

/**
 * 调用 Claude API 生成语义化 keys
 */
async function generateKeysWithAI(
  strings: ExtractedString[],
  batchIndex: number
): Promise<KeyMapping[]> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `你是 i18n 专家。为以下中文字符串生成语义化的 i18n keys。

## Key 命名规则
格式: <category>.<subcategory>.<action>

分类 (category):
- errors: 错误消息
- success: 成功消息
- warnings: 警告消息
- buttons: 按钮文字
- menu: 菜单相关
- forms: 表单相关
- messages: 一般消息
- bottle: 漂流瓶相关
- conversation: 对话相关
- profile: 个人资料
- settings: 设置相关
- admin: 管理员功能
- vip: VIP 功能
- tasks: 任务系统
- onboarding: 新手引导
- help: 帮助信息
- common: 通用文字

## 示例
输入: "⚠️ 用戶不存在，請先使用 /start 註冊。"
输出: { "key": "errors.userNotFound", "category": "errors", "confidence": 0.95 }

输入: "👋 嗨，{nickname}！"
输出: { "key": "profile.greeting", "category": "profile", "confidence": 0.98 }

输入: "🍾 丟漂流瓶"
输出: { "key": "buttons.throwBottle", "category": "buttons", "subcategory": "bottle", "action": "throw", "confidence": 0.99 }

## 要处理的字符串（Batch ${batchIndex + 1}）

${strings.map((s, i) => `${i + 1}. "${s.text}" (${s.context} in ${s.file})`).join('\n')}

## 输出格式（JSON）

返回一个 JSON 数组，每个元素包含：
- index: 字符串索引（1-based）
- key: 生成的 key
- category: 分类
- subcategory: 子分类（可选）
- action: 动作（可选）
- confidence: 置信度（0-1）

只返回 JSON，不要其他文字。`;

  let lastError: Error | null = null;
  
  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // 提取 JSON
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const results = JSON.parse(jsonMatch[0]);

      // 映射回原始字符串
      const mappings: KeyMapping[] = results.map((r: any) => {
        const originalIndex = r.index - 1;
        if (originalIndex < 0 || originalIndex >= strings.length) {
          throw new Error(`Invalid index: ${r.index}`);
        }

        return {
          original: strings[originalIndex].text,
          key: r.key,
          category: r.category,
          subcategory: r.subcategory,
          action: r.action,
          confidence: r.confidence || 0.8,
        };
      });

      return mappings;
    } catch (error) {
      lastError = error as Error;
      console.error(`⚠️  Batch ${batchIndex + 1} 失败 (重试 ${retry + 1}/${MAX_RETRIES}): ${lastError.message}`);
      
      if (retry < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 等待 2 秒
      }
    }
  }

  throw new Error(`Batch ${batchIndex + 1} 失败: ${lastError?.message}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🤖 开始生成语义化 i18n keys...\n');

  // 检查 API Key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ 错误: 未设置 ANTHROPIC_API_KEY 环境变量');
    console.error('   请运行: export ANTHROPIC_API_KEY=your_api_key');
    process.exit(1);
  }

  // 读取提取的字符串
  const extractedData = JSON.parse(
    fs.readFileSync('i18n_extracted_clean.json', 'utf-8')
  );

  const strings: ExtractedString[] = extractedData.strings;
  console.log(`📊 总共 ${strings.length} 个唯一字符串`);

  // 分批处理
  const batches: ExtractedString[][] = [];
  for (let i = 0; i < strings.length; i += BATCH_SIZE) {
    batches.push(strings.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 分成 ${batches.length} 批，每批 ${BATCH_SIZE} 个\n`);

  const allMappings: KeyMapping[] = [];
  const startTime = Date.now();

  for (let i = 0; i < batches.length; i++) {
    console.log(`🔄 处理 Batch ${i + 1}/${batches.length}...`);
    
    try {
      const mappings = await generateKeysWithAI(batches[i], i);
      allMappings.push(...mappings);
      console.log(`   ✅ 完成 ${mappings.length} 个 keys`);
    } catch (error) {
      console.error(`   ❌ Batch ${i + 1} 失败: ${error}`);
      // 继续处理下一批
    }
    
    // 避免 API 限流
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✅ 生成完成！`);
  console.log(`📊 统计:`);
  console.log(`   - 生成 keys: ${allMappings.length} 个`);
  console.log(`   - 耗时: ${duration} 秒`);
  console.log(`   - 平均置信度: ${(allMappings.reduce((sum, m) => sum + m.confidence, 0) / allMappings.length).toFixed(2)}`);

  // 输出到 JSON
  fs.writeFileSync(
    'i18n_keys_mapping.json',
    JSON.stringify(allMappings, null, 2),
    'utf-8'
  );

  console.log('\n📄 输出文件:');
  console.log('   - i18n_keys_mapping.json');
  console.log('\n🎯 下一步: 运行 `npx tsx scripts/ai-review-i18n-keys.ts`');
}

main().catch((error) => {
  console.error('❌ 错误:', error);
  process.exit(1);
});

