# i18n 检查报告

生成时间: $(date)

## 数据库迁移状态

- ✅ 迁移脚本已生成: `src/db/migrations/0050_update_tasks_to_i18n_keys.sql`
- ⏳ 等待执行: 需要在 staging 环境执行

执行命令:
```bash
npx wrangler d1 execute xunni-db-staging \
  --file=src/db/migrations/0050_update_tasks_to_i18n_keys.sql \
  --env staging \
  --remote
```

## Handler 文件 i18n 使用情况

### ✅ 已使用 i18n 的文件 (12 个)

1. ✅ `admin_ban.ts` - 完全使用 i18n
2. ✅ `appeal.ts` - 完全使用 i18n
3. ✅ `history.ts` - 完全使用 i18n
4. ✅ `invite_activation.ts` - 完全使用 i18n
5. ✅ `language_selection.ts` - 完全使用 i18n
6. ✅ `menu.ts` - 完全使用 i18n
7. ✅ `profile.ts` - 完全使用 i18n
8. ✅ `report.ts` - 完全使用 i18n
9. ✅ `settings.ts` - 完全使用 i18n
10. ✅ `start.ts` - 完全使用 i18n
11. ✅ `tasks.ts` - 完全使用 i18n
12. ✅ `throw.ts` - 完全使用 i18n

### ⚠️ 需要检查的文件 (32 个)

这些文件未使用 i18n，需要检查是否包含硬编码中文:

1. ⚠️ `ad_reward.ts`
2. ⚠️ `admin_ad_config.ts`
3. ⚠️ `admin_analytics.ts`
4. ⚠️ `admin_diagnose_avatar.ts`
5. ⚠️ `admin_refresh_vip_avatars.ts`
6. ⚠️ `admin_test_refresh.ts`
7. ⚠️ `block.ts`
8. ⚠️ `broadcast.ts`
9. ⚠️ `catch.ts`
10. ⚠️ `chats.ts`
11. ⚠️ `conversation_actions.ts`
12. ⚠️ `country_confirmation.ts`
13. ⚠️ `country_selection.ts`
14. ⚠️ `dev.ts`
15. ⚠️ `draft.ts`
16. ⚠️ `edit_profile.ts`
17. ⚠️ `help.ts`
18. ⚠️ `maintenance.ts`
19. ⚠️ `mbti.ts`
20. ⚠️ `mbti_test.ts`
21. ⚠️ `message_forward.ts`
22. ⚠️ `nickname_callback.ts`
23. ⚠️ `official_ad.ts`
24. ⚠️ `onboarding_callback.ts`
25. ⚠️ `onboarding_input.ts`
26. ⚠️ `refresh_avatar.ts`
27. ⚠️ `refresh_conversations.ts`
28. ⚠️ `stats.ts`
29. ⚠️ `throw_advanced.ts`
30. ⚠️ `tutorial.ts`
31. ⚠️ `vip.ts`
32. ⚠️ `vip_refund.ts`

## 下一步行动

1. **执行数据库迁移** - 在 staging 环境执行迁移脚本
2. **检查未使用 i18n 的文件** - 确认哪些文件包含硬编码中文
3. **修复硬编码中文** - 将硬编码中文替换为 i18n keys
4. **测试** - 确保所有功能正常工作

