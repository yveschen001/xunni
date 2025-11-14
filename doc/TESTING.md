# XunNi 測試規範

## 1. 測試策略

### 1.1 測試金字塔

```
        /\
       /  \      E2E Tests (少量)
      /____\
     /      \    Integration Tests (適量)
    /________\
   /          \   Unit Tests (大量)
  /____________\
```

### 1.2 測試覆蓋率目標

- **Domain 層**: 90%+
- **Utils**: 80%+
- **Handlers**: 60%+（重點測試業務邏輯）

---

## 2. 單元測試

### 2.1 Domain 層測試

#### 2.1.1 usage.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { getDailyThrowLimit, canThrowBottle, getConversationDailyLimit } from '../../src/domain/usage';
import type { User, DailyUsage } from '../../src/db/types';

describe('getDailyThrowLimit', () => {
  it('免費使用者無邀請：基礎 3 個', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 0,
      vip_expire_at: null,
      activated_invites: 0,
      // ... 其他欄位
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(3);
  });
  
  it('免費使用者 5 個邀請：3 + 5 = 8', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 0,
      vip_expire_at: null,
      activated_invites: 5,
      // ...
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(8);
  });
  
  it('免費使用者 10 個邀請：上限 10', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 0,
      vip_expire_at: null,
      activated_invites: 10,
      // ...
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(10);
  });
  
  it('VIP 使用者無邀請：基礎 30 個', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 1,
      vip_expire_at: '2025-12-31T23:59:59Z',
      activated_invites: 0,
      // ...
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(30);
  });
  
  it('VIP 使用者 50 個邀請：30 + 50 = 80', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 1,
      vip_expire_at: '2025-12-31T23:59:59Z',
      activated_invites: 50,
      // ...
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(80);
  });
  
  it('VIP 使用者 100 個邀請：上限 100', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 1,
      vip_expire_at: '2025-12-31T23:59:59Z',
      activated_invites: 100,
      // ...
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(100);
  });
  
  it('VIP 已過期：退回免費邏輯', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 1,
      vip_expire_at: '2025-01-01T00:00:00Z', // 已過期
      activated_invites: 5,
      // ...
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(8); // 3 + 5
  });
});

describe('canThrowBottle', () => {
  it('未封禁、已完成 onboarding、未達上限：可以丟', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 0,
      vip_expire_at: null,
      activated_invites: 0,
      mbti_type: 'INTJ',
      trust_level: 1,
      risk_score: 0,
      // ...
    };
    const usage: DailyUsage = {
      user_id: '123',
      date: '2025-01-15',
      throws_count: 2,
    };
    expect(canThrowBottle(user, '2025-01-15', usage)).toBe(true);
  });
  
  it('已達上限：不能丟', () => {
    const user: User = {
      telegram_id: '123',
      is_vip: 0,
      activated_invites: 0,
      mbti_type: 'INTJ',
      trust_level: 1,
      risk_score: 0,
      // ...
    };
    const usage: DailyUsage = {
      user_id: '123',
      date: '2025-01-15',
      throws_count: 3, // 已達上限
    };
    expect(canThrowBottle(user, '2025-01-15', usage)).toBe(false);
  });
});
```

#### 2.1.2 risk.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addRisk, applyBan, isBanned } from '../../src/domain/risk';
import type { D1Database } from '@cloudflare/workers-types';

describe('risk management', () => {
  let mockDb: D1Database;
  
  beforeEach(() => {
    mockDb = {
      prepare: vi.fn(),
      // ... mock 其他方法
    } as any;
  });
  
  it('should add risk score', async () => {
    const prepareMock = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({}),
      }),
    });
    mockDb.prepare = prepareMock;
    
    await addRisk('123', 'URL_BLOCKED', mockDb);
    
    expect(prepareMock).toHaveBeenCalled();
  });
  
  // ... 更多測試
});
```

### 2.2 Utils 測試

```typescript
// tests/utils/url-whitelist.test.ts

import { describe, it, expect } from 'vitest';
import { isUrlAllowed, checkMessageUrls } from '../../src/utils/url-whitelist';

describe('URL whitelist', () => {
  it('should allow telegram.org', () => {
    expect(isUrlAllowed('https://telegram.org')).toBe(true);
  });
  
  it('should allow t.me', () => {
    expect(isUrlAllowed('https://t.me/channel')).toBe(true);
  });
  
  it('should reject unknown domain', () => {
    expect(isUrlAllowed('https://example.com')).toBe(false);
  });
  
  it('should extract and check URLs in message', () => {
    const message = 'Check this: https://telegram.org and https://evil.com';
    const result = checkMessageUrls(message);
    expect(result.allowed).toBe(false);
    expect(result.blockedUrls).toContain('https://evil.com');
  });
});
```

---

## 3. 整合測試

### 3.1 Handler 整合測試

```typescript
// tests/telegram/handlers/throw.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleThrow } from '../../src/telegram/handlers/throw';
import type { TelegramUpdate } from '../../src/telegram/types';
import type { Env, D1Database } from '../../src/config/env';

describe('handleThrow', () => {
  let mockEnv: Env;
  let mockDb: D1Database;
  
  beforeEach(() => {
    mockEnv = {
      TELEGRAM_BOT_TOKEN: 'test_token',
      // ... 其他環境變數
    } as Env;
    
    mockDb = {
      getUser: vi.fn(),
      getDailyUsage: vi.fn(),
      createBottle: vi.fn(),
      // ... mock 其他方法
    } as any;
  });
  
  it('should create bottle when user can throw', async () => {
    const update: TelegramUpdate = {
      message: {
        from: { id: 123456789 },
        text: '/throw',
        chat: { id: 123456789 },
      },
    };
    
    mockDb.getUser = vi.fn().mockResolvedValue({
      telegram_id: '123456789',
      is_vip: 0,
      mbti_type: 'INTJ',
      trust_level: 1,
      // ...
    });
    
    mockDb.getDailyUsage = vi.fn().mockResolvedValue({
      user_id: '123456789',
      date: '2025-01-15',
      throws_count: 0,
    });
    
    await handleThrow(update, mockEnv, mockDb);
    
    expect(mockDb.createBottle).toHaveBeenCalled();
  });
});
```

---

## 4. E2E 測試

### 4.1 測試流程

```typescript
// tests/e2e/onboarding.test.ts

import { describe, it, expect } from 'vitest';

describe('Onboarding flow', () => {
  it('should complete full onboarding', async () => {
    // 1. 發送 /start
    // 2. 驗證回應
    // 3. 完成 Step 1-7
    // 4. 驗證使用者狀態
  });
  
  it('should allow throw after onboarding', async () => {
    // 1. 完成 onboarding
    // 2. 發送 /throw
    // 3. 驗證可以丟瓶
  });
});
```

---

## 5. 測試工具配置

### 5.1 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
      ],
    },
  },
});
```

### 5.2 Mock 設定

```typescript
// tests/mocks/telegram.ts

export function createMockUpdate(overrides?: Partial<TelegramUpdate>): TelegramUpdate {
  return {
    update_id: 123,
    message: {
      message_id: 1,
      from: { id: 123456789, is_bot: false, first_name: 'Test' },
      chat: { id: 123456789, type: 'private' },
      text: '/start',
      date: Math.floor(Date.now() / 1000),
    },
    ...overrides,
  };
}
```

---

## 6. CI/CD 整合

### 6.1 GitHub Actions

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 7. 測試最佳實踐

1. **AAA 模式**：Arrange, Act, Assert
2. **測試隔離**：每個測試獨立，不依賴其他測試
3. **Mock 外部依賴**：資料庫、API 調用等
4. **測試邊界條件**：空值、極值、異常情況
5. **測試名稱清晰**：描述測試的意圖
6. **保持測試簡單**：一個測試只驗證一個行為

