# Maintenance Mode Protocols

> **⚠️ STATUS: ACTIVE**
> **EFFECTIVE DATE: 2025-12-02**

## 1. Core Principle
The project is currently in **Maintenance Mode**. The core system functionality is considered **STABLE and FROZEN**.

**Rule of Thumb:**
- **FOCUS**: Fix Language (i18n) & Optimize AI Prompts.
- **NO TOUCH**: Do NOT touch Core Business Logic, Database, or Handlers.
- **EXCEPTION**: Core code modifications are ONLY allowed for:
  1. **Critical Bug Fixes** (e.g., runtime errors, logic failures).
  2. **Proven Performance Optimization** (e.g., reducing DB reads, memory leaks).

## 2. Safe Zones (Allowed Modification Zones)
Only the following areas are open for modification:

### ✅ A. Localization (i18n)
- **Standard Workflow (AI-Direct Mode)**:
  - **Best for**: Small to medium changes (features, fixes, UI tweaks).
  - **Process**:
    1. Modify `src/i18n/locales/zh-TW/**/*.ts` (Source of Truth).
    2. **AI Agent** immediately updates all other 33 languages in the codebase to match.
    3. Run `pnpm check:i18n` to ensure integrity.
  - **Benefit**: Reduces CSV import/export errors and ensures atomic updates.
- **Bulk Workflow (CSV Mode)**:
  - **Best for**: Massive content updates (> 50 new keys) or external translation teams.
  - **Process**: `pnpm i18n:export` -> External Translate -> `pnpm i18n:import`.
- **Strict Rules**: 
  - NEVER use hardcoded strings (e.g., Chinese/English literals) in code.
  - NEVER use hardcoded UI text. Always use `i18n.t()`.
  - ALWAYS check integrity with `pnpm check:i18n` after any change.
  - `zodiac` module MUST be exported in `src/i18n/locales/*/index.ts`.

### ✅ B. AI Prompts
- **Files**: `src/prompts/**/*.ts`
- **Scope**: Adjusting system prompts, refining persona (e.g., Fortune Teller tone), optimizing token usage.
- **Constraint**: Must NOT break the JSON output structure required by the parsers.

## 3. Frozen Zones (Do Not Touch)
Modifications to these areas require **EXPLICIT USER AUTHORIZATION** or must fall under the **EXCEPTION** rule in Section 1.

### ⛔ C. Core Business Logic / Domain Logic (`src/domain/`)
- User logic, Bottle logic, Matching algorithms.
- **Zodiac Logic (`src/domain/zodiac.ts`)**: DO NOT modify unless fixing i18n mapping bugs.
- **⚠️ CRITICAL: Quota Calculation** (ABSOLUTELY FORBIDDEN):
  - `calculateDailyQuota()` (Permanent quota)
  - `getBottleQuota()` (Total quota)
  - `canThrowBottle()` / `canCatchBottle()` (Deduction check)
  - `calculateQuotaEarned()` (Ad rewards)
  - **Reason**: Changing these breaks the user contract and billing logic.

### ⛔ D. Handlers / Telegram Handlers (`src/telegram/`)
- Command handling, flow control, callback queries.
- **⚠️ CRITICAL: UI Display Logic** (ABSOLUTELY FORBIDDEN):
  - **Menu/Profile Quota Format**: Must remain `Remaining / Permanent + Temporary` (e.g., `2 / 3 + 1`).
  - DO NOT simplify this to `Remaining / Total`. Users need to see the breakdown.

### ⛔ E. Database Layer (`src/db/`)
- Schema (`schema.sql`), Migrations (`migrations/`), Client logic.
- **⚠️ CRITICAL**: DO NOT move query functions between files or change import paths without verifying ALL usages.

### ⛔ F. Core Services (`src/services/`)
- **Exception**: `src/services/fortune.ts` may be touched *only* to update prompt calling logic if absolutely necessary for the AI adjustment.

## 4. Operational Rules
1. **Backup First**: Before any batch edit, run `pnpm backup`.
2. **Read-Only Default**: Assume all files outside Safe Zones are Read-Only.
3. **Documentation**: Update `CHANGELOG.md` for any prompt/i18n changes.
4. **⚠️ CRITICAL: Minimal Change Principle**:
   - **DO NOT modify text that is already correct**. Only modify the specific text that the user explicitly requests to change.
   - **DO NOT "improve" or "optimize" existing translations** unless explicitly requested.
   - **DO NOT change working code** just because you think it could be better.
5. **⚠️ CRITICAL: i18n Cross-Language Check**:
   - **When fixing a language issue, check ALL 40 languages** for the same problem.
   - If the same issue exists in other languages, fix them all in the same change.
   - Use `pnpm i18n:sync` to ensure consistency across all languages.
   - Example: If Japanese has a typo, check if the same typo exists in Korean, Chinese, etc.
6. **⚠️ CRITICAL: Self-Verification Before Reporting**:
   - **Verify your changes work correctly** before reporting to the user.
   - **Test the changes** (run lint, check syntax, verify logic).
   - **Only report when changes are complete and verified**.
   - **Do NOT report "I've made changes, please test"** - test yourself first.
7. **i18n Regression Check**:
   - Before any deployment, verify `zodiac` keys are loading correctly.
   - Verify `router.throwPrompt` matches `throw.bottle8` content.
   - Run `pnpm i18n:check` to find missing keys.

## 5. Critical Regression Prevention
The following issues have occurred repeatedly and must be prevented:

### 5.1 i18n Regressions
- **Zodiacs in English**: Ensure `zodiac` is exported in `src/i18n/locales/*/index.ts`.
- **Raw Keys in UI**: Ensure keys like `fortune.profile_incomplete_hint`, `interests.back_to_categories` exist in CSV.
- **Hardcoded Strings/Text**: Never hardcode strings or UI text. Always use `i18n.t()`.
- **Language Count**: The project supports **40 languages**. Do not confuse with directory counts (there may be more directories due to test languages or variants).

### 5.2 Quota & Logic Regressions
- **Quota Display**: Verify `2 / 3 + 1` format exists in `menu.ts` and `profile.ts`.
- **DB Columns**: Never reference deleted columns (e.g., `daily_usage` table is DEPRECATED/REMOVED, do not use).

### 5.3 i18n Placeholder Regressions (CRITICAL)
- **⚠️ ABSOLUTELY FORBIDDEN**: Code expressions in i18n placeholders
  - ❌ `{completedCount}/{profileTasks.length}` → ✅ `{completed}/{total}`
  - ❌ `{calculateDailyQuota(user)}` → ✅ `{quota}`
  - ❌ `{task.reward_type === 'daily' ? '當天有效' : '永久有效'}` → ✅ `{rewardTypeText}`
- **Placeholder Format Rules**:
  - ✅ **Allowed**: `{variableName}`, `{variable.name}`, `{task.reward_amount}`
  - ❌ **Forbidden**: `.length`, `.join()`, `===`, `? :`, `()`, function calls, logical operators
- **Protection Mechanism**:
  - `scripts/i18n-manager.ts` now validates placeholders during import
  - Invalid placeholders are automatically replaced with zh-TW fallback
  - Run `pnpm tsx scripts/fix-placeholder-expressions.ts` to fix existing issues
- **Before Importing New Languages**:
  - ✅ Verify CSV does not contain code expressions
  - ✅ Check that all placeholders are simple variable names
  - ✅ Run placeholder validation before import
