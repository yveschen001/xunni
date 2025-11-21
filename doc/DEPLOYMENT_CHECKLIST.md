# 部署檢查清單（強制執行）

> **⚠️ 嚴重警告**：如果沒有完成此清單的所有項目，**絕對不要部署**，也**絕對不要說「已測試好了」**

## 為什麼需要這個清單？

### 血淚教訓

**2025-11-21 錯誤案例**：
- ❌ 新增了使用 `ad_sessions` 表的代碼
- ❌ 但沒有在遠端資料庫執行 migration
- ❌ 部署後立即出現 `no such table: ad_sessions` 錯誤
- ❌ 更嚴重的是：**沒有實際測試就說「已測試好了」**

**這種錯誤是完全可以避免的！**

---

## 📋 強制檢查清單

### 使用方式

```bash
# 在部署前執行此腳本
./scripts/pre-deploy-check.sh staging

# 或
./scripts/pre-deploy-check.sh production
```

### 手動檢查清單（如果腳本無法執行）

#### ✅ 檢查 1：Migration 是否已執行？

```bash
# 1. 查看是否有新的 migration
ls -la src/db/migrations/

# 2. 如果有新的 migration，必須先在遠端執行
npx wrangler d1 execute DB --env=staging --remote --file=src/db/migrations/XXXX_xxx.sql

# 3. 確認表已創建（以 ad_sessions 為例）
npx wrangler d1 execute DB --env=staging --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='ad_sessions';"
```

**❌ 如果沒有執行 migration，絕對不要部署！**

---

#### ✅ 檢查 2：Lint 是否通過？

```bash
pnpm lint
```

**預期結果**：0 errors（warnings 可以接受）

**❌ 如果有 errors，必須先修復！**

---

#### ✅ 檢查 3：測試是否通過？

```bash
pnpm test
```

**預期結果**：所有測試通過

**❌ 如果有測試失敗，必須先修復！**

---

#### ✅ 檢查 4：變更內容是否已檢查？

```bash
# 查看本次變更的文件
git diff --name-only HEAD~1 HEAD

# 查看具體變更內容
git diff HEAD~1 HEAD
```

**必須確認**：
- [ ] 知道每個文件為什麼被修改
- [ ] 沒有意外的變更
- [ ] 沒有遺漏必要的變更

---

#### ✅ 檢查 5：功能是否已實際測試？

**⚠️ 這是最重要的檢查！**

**絕對不能**：
- ❌ 只看代碼就說「測試好了」
- ❌ 只看 lint 通過就說「沒問題」
- ❌ 假設功能會正常運作

**必須做到**：
- ✅ 實際打開 Telegram Bot
- ✅ 實際點擊每個修改的按鈕
- ✅ 實際執行每個修改的指令
- ✅ 查看實際的結果
- ✅ 查看 Cloudflare Logs 確認無錯誤

**測試步驟範例**：

如果修改了「看廣告」功能：
```
1. 部署到 staging: pnpm deploy:staging
2. 打開 Telegram Bot
3. 點擊「看廣告」按鈕
4. 確認廣告頁面正常打開
5. 確認廣告能正常播放
6. 確認完成後能獲得獎勵
7. 查看 Cloudflare Logs 確認無錯誤
8. 如果有任何錯誤，修復後重新測試
```

如果修改了「查看資料卡」功能：
```
1. 部署到 staging: pnpm deploy:staging
2. 打開 Telegram Bot
3. 進入一個對話
4. 點擊「查看對方資料」按鈕
5. 確認資料卡正常顯示
6. 確認頭像正常顯示（模糊/清晰）
7. 確認國旗 emoji 正常顯示
8. 測試包含特殊字符的資料（如 `Test_User*123`）
9. 查看 Cloudflare Logs 確認無錯誤
```

---

#### ✅ 檢查 6：Cloudflare Logs 是否已確認？

**必須查看**：
```
https://dash.cloudflare.com/[account]/workers/services/view/xunni-bot-staging/logs/live
```

**確認**：
- [ ] 沒有 `Error` 級別的日誌
- [ ] 沒有 `SQLITE_ERROR` 錯誤
- [ ] 沒有 `can't parse entities` 錯誤
- [ ] 沒有 `no such table` 錯誤
- [ ] 所有功能的日誌都正常

**❌ 如果有任何錯誤，必須先修復！**

---

## 🚫 絕對禁止的行為

### 1. 沒有實際測試就說「已測試好了」

**這是欺騙行為，絕對不允許！**

- ❌ 「我看了代碼，應該沒問題」→ **不算測試**
- ❌ 「Lint 通過了，應該可以」→ **不算測試**
- ❌ 「邏輯上應該會動」→ **不算測試**

- ✅ 「我實際點擊了按鈕，功能正常」→ **這才是測試**
- ✅ 「我查看了 Logs，沒有錯誤」→ **這才是測試**

### 2. 部署前不檢查 Migration

**如果新增了資料表或欄位，必須先執行 migration！**

檢查方式：
```bash
# 查看最近的 commit 是否有新的 migration
git diff HEAD~5 HEAD --name-only | grep migrations

# 如果有，必須先執行
```

### 3. 跳過任何檢查項目

**每一項檢查都是必要的，不能跳過！**

如果覺得某項檢查不必要：
1. 先完成所有檢查
2. 部署成功後
3. 再討論是否可以簡化流程

---

## 📝 部署記錄範本

每次部署前，請填寫此記錄：

```markdown
## 部署記錄 - [日期]

### 環境
- [ ] Staging
- [ ] Production

### 變更內容
- 修改了 XXX 功能
- 新增了 YYY 功能
- 修復了 ZZZ 錯誤

### 檢查清單
- [ ] Migration 已執行（如有）
- [ ] Lint 通過
- [ ] 測試通過
- [ ] 變更內容已檢查
- [ ] 功能已實際測試
- [ ] Cloudflare Logs 已確認無錯誤

### 實際測試記錄
- 測試了 XXX 功能：✅ 正常
- 測試了 YYY 功能：✅ 正常
- 查看了 Logs：✅ 無錯誤

### 部署結果
- [ ] 成功
- [ ] 失敗（原因：）

### 備註
（任何需要注意的事項）
```

---

## 🎯 總結

**部署前必須做到**：
1. ✅ Migration 已執行（如有）
2. ✅ Lint 通過
3. ✅ 測試通過
4. ✅ 變更內容已檢查
5. ✅ **功能已實際測試**（最重要！）
6. ✅ Cloudflare Logs 已確認無錯誤

**如果沒有完成以上所有項目**：
- ❌ 不要部署
- ❌ 不要說「已測試好了」
- ❌ 不要假設功能會正常運作

**記住**：
> **沒有實際測試 = 沒有測試**
> 
> **說「已測試好了」但實際沒測試 = 欺騙**

---

**最後更新**：2025-11-21  
**維護者**：開發團隊  
**重要性**：🔥🔥🔥 極高

