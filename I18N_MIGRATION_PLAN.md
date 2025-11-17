# Admin Ban i18n Migration Plan

## 需要修改的硬編碼訊息

### handleAdminList (行 420-467)
- ❌ `'❌ 只有超級管理員可以使用此命令。'` → ✅ `i18n.t('admin.onlySuperAdmin')`
- ❌ `'未註冊'` → ✅ `i18n.t('admin.listNotRegistered')`
- ❌ `'🔱 超級管理員'` → ✅ `i18n.t('admin.listRoleSuperAdmin')`
- ❌ `'👮 普通管理員'` → ✅ `i18n.t('admin.listRoleAdmin')`
- ❌ `'👥 **管理員列表**'` → ✅ `i18n.t('admin.listTitle')`
- ❌ `'總數：{count} 位'` → ✅ `i18n.t('admin.listTotal', { count })`
- ❌ `'💡 使用 /admin_add 添加管理員'` → ✅ `i18n.t('admin.listFooter')`
- ❌ `'❌ 發生錯誤，請稍後再試。'` → ✅ `i18n.t('admin.error')`

### handleAdminAdd (行 472-544)
- ❌ `'❌ 只有超級管理員可以使用此命令。'` → ✅ `i18n.t('admin.onlySuperAdmin')`
- ❌ `'❌ 使用方法錯誤...'` → ✅ `i18n.t('admin.addUsageError')`
- ❌ `'❌ 此用戶已經是超級管理員，無需添加。'` → ✅ `i18n.t('admin.addAlreadySuperAdmin')`
- ❌ `'❌ 此用戶已經是管理員。'` → ✅ `i18n.t('admin.addAlreadyAdmin')`
- ❌ `'❌ 用戶不存在或未註冊。'` → ✅ `i18n.t('admin.addUserNotFound')`
- ❌ `'⚠️ **注意**...'` → ✅ `i18n.t('admin.addInstructions', { userId, nickname, username })`

### handleAdminRemove (行 549-616)
- 類似 handleAdminAdd，使用 `admin.remove*` keys

### handleAdminBan (行 70-200)
- ❌ `'❌ 只有管理員可以使用此命令。'` → ✅ `i18n.t('admin.onlyAdmin')`
- ❌ `'❌ 使用方法錯誤...'` → ✅ `i18n.t('admin.banUsageError')`
- ❌ `'❌ 用戶不存在。'` → ✅ `i18n.t('admin.banUserNotFound')`
- ❌ `'❌ 無法封禁管理員帳號。'` → ✅ `i18n.t('admin.cannotBanAdmin')`
- ❌ `'✅ 已封禁用戶...'` → ✅ `i18n.t('admin.banSuccess', { ... })` 或 `i18n.t('admin.banSuccessPermanent', { ... })`

### handleAdminUnban (行 205-280)
- 類似 handleAdminBan，使用 `admin.unban*` keys

### handleAdminFreeze (行 285-415)
- 類似 handleAdminBan，使用 `admin.freeze*` keys

### handleAdminBans (行 621-765)
- ❌ `'📋 封禁記錄'` → ✅ `i18n.t('admin.bansTitle')`
- ❌ `'📋 用戶封禁歷史'` → ✅ `i18n.t('admin.bansUserHistory')`
- 等等...

### handleAdminAppeals (行 770-850)
- ❌ `'📋 待審核申訴'` → ✅ `i18n.t('admin.appealsTitle')`
- 等等...

### handleAdminApprove (行 855-935)
- ❌ `'❌ 使用方法錯誤...'` → ✅ `i18n.t('admin.approveUsageError')`
- 等等...

### handleAdminReject (行 940-984)
- ❌ `'❌ 使用方法錯誤...'` → ✅ `i18n.t('admin.rejectUsageError')`
- 等等...

## 修改策略

由於文件太大（984 行），我會：
1. 創建一個新的 `admin_ban_i18n.ts` 文件
2. 逐個函數遷移
3. 測試每個函數
4. 最後替換原文件

或者：
1. 直接在原文件中批量替換
2. 使用正則表達式
3. 一次性完成

**建議：使用批量替換方式，更快更安全**

