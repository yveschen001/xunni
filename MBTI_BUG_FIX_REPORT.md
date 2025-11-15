# MBTI 测验数据库错误修复报告

**日期**: 2025-01-15  
**问题**: MBTI 测验完成时报错  
**状态**: ✅ 已修复并验证

---

## 🐛 问题描述

### 用户报告
用户在完成 MBTI 12 题测验后，看到以下错误：

```
❌ 計算結果時發生錯誤，請稍後再試。

錯誤信息：D1_ERROR: no such column: mbti_source: SQLITE_ERROR
```

### 影响范围
- 所有用户无法完成 MBTI 测验
- 注册流程卡在 MBTI 步骤
- 无法看到 MBTI 结果

---

## 🔍 问题分析

### 根本原因
Staging 数据库缺少 `mbti_source` 列。

### 为什么会发生？
1. 代码中添加了 `mbti_source` 字段（用于追踪 MBTI 来源：manual 或 test）
2. 迁移文件 `0002_add_mbti_source.sql` 存在
3. 但是 Staging 数据库没有执行这个迁移

### 技术细节
```typescript
// src/services/mbti_test_service.ts:152
await db.d1
  .prepare(
    `UPDATE users
     SET mbti_result = ?, mbti_source = 'test', mbti_completed_at = ?, updated_at = ?
     WHERE telegram_id = ?`
  )
  .bind(result.type, now, now, telegramId)
  .run();
```

这个 SQL 语句尝试更新 `mbti_source` 列，但数据库中不存在该列。

---

## 🔧 解决方案

### 1. 添加详细日志（调试用）

**文件**: `src/telegram/handlers/mbti_test.ts`

**修改**:
```typescript
async function handleTestCompletion(...) {
  try {
    console.log('[handleTestCompletion] Starting test completion for user:', telegramId);
    const result = await completeMBTITest(db, telegramId);
    console.log('[handleTestCompletion] MBTI result:', result);
    // ... more logs
  } catch (error) {
    console.error('[handleTestCompletion] Error:', error);
    console.error('[handleTestCompletion] Error stack:', error instanceof Error ? error.stack : 'No stack');
    await telegram.sendMessage(
      chatId, 
      `❌ 計算結果時發生錯誤，請稍後再試。\n\n` +
        `錯誤信息：${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

**作用**: 显示具体的错误信息，帮助快速定位问题。

### 2. 执行数据库迁移

**命令**:
```bash
npx wrangler d1 execute xunni-db-staging --remote \
  --command="ALTER TABLE users ADD COLUMN mbti_source TEXT CHECK(mbti_source IN ('manual', 'test'));"
```

**结果**:
```json
{
  "success": true,
  "meta": {
    "duration": 1.2569,
    "changes": 0,
    "rows_written": 1
  }
}
```

### 3. 验证修复

**命令**:
```bash
npx wrangler d1 execute xunni-db-staging --remote \
  --command="PRAGMA table_info(users);" | grep mbti_source
```

**结果**:
```json
"name": "mbti_source"
```

✅ 列已成功添加！

---

## ✅ 测试验证

### 测试步骤
1. 用户输入 `/dev_reset` 重置账号
2. 重新开始注册流程
3. 选择"進行快速測驗（12 題，僅供參考）"
4. 完成所有 12 题
5. 查看结果

### 测试结果
✅ **成功！**

用户看到：
```
🎉 恭喜！你已經完成所有設定！

你的個人資料：
• 暱稱：帅哥
• 性別：男性
• 年齡：26 歲
• 星座：Virgo
• MBTI：ENTP

現在你可以開始使用 XunNi 了！
```

---

## 📊 影响分析

### 修改的文件
1. `src/telegram/handlers/mbti_test.ts`
   - 添加详细的错误日志
   - 在错误信息中显示具体错误原因

2. Staging 数据库
   - 添加 `mbti_source` 列

### 未修改的文件
- 迁移文件 `0002_add_mbti_source.sql` 保持不变
- 其他代码逻辑保持不变

---

## 🎓 经验教训

### 1. 部署流程需要改进
**问题**: 代码部署了，但数据库迁移没有执行。

**改进**:
- 在部署文档中明确说明迁移步骤
- 考虑自动化迁移流程
- 添加部署前检查清单

### 2. 错误信息需要更详细
**问题**: 初始错误信息只显示"計算結果時發生錯誤"，无法定位问题。

**改进**:
- ✅ 已添加详细的错误日志
- ✅ 在 Staging 环境显示具体错误信息
- 在 Production 环境仍然显示友好错误信息

### 3. 测试覆盖不够
**问题**: 自动化测试没有覆盖数据库 schema 验证。

**改进**:
- 考虑添加 schema 验证测试
- 在 CI/CD 中检查迁移是否已执行

---

## 📝 后续行动

### 短期（已完成）
- ✅ 修复 Staging 数据库
- ✅ 添加详细日志
- ✅ 验证修复
- ✅ 提交到 GitHub

### 中期（待完成）
- ⏳ 更新部署文档，明确迁移步骤
- ⏳ 在 Production 部署前执行相同的迁移
- ⏳ 创建部署前检查清单

### 长期（待规划）
- ⏳ 考虑自动化迁移流程
- ⏳ 添加 schema 验证测试
- ⏳ 改进错误监控和告警

---

## 🔗 相关资源

### 文件
- `src/telegram/handlers/mbti_test.ts` - MBTI 测验处理
- `src/services/mbti_test_service.ts` - MBTI 测验服务
- `src/db/migrations/0002_add_mbti_source.sql` - 迁移文件

### 命令
```bash
# 查看数据库 schema
npx wrangler d1 execute xunni-db-staging --remote --command="PRAGMA table_info(users);"

# 执行迁移
npx wrangler d1 migrations apply xunni-db-staging --remote

# 执行单个 SQL
npx wrangler d1 execute xunni-db-staging --remote --command="YOUR_SQL_HERE"
```

### 文档
- `doc/DEPLOYMENT.md` - 部署指南
- `doc/SPEC.md` - 数据库 schema 定义
- `MBTI_DISCLAIMER_UPDATE.md` - MBTI 免责声明更新

---

## 🎉 总结

**问题**: MBTI 测验因缺少数据库列而失败  
**原因**: 代码更新了，但数据库迁移没有执行  
**解决**: 手动执行 ALTER TABLE 添加列  
**验证**: 用户成功完成测验并看到结果  
**改进**: 添加详细日志，更新部署流程

**状态**: ✅ 已完成并验证

---

**维护者**: XunNi 开发团队  
**最后更新**: 2025-01-15

