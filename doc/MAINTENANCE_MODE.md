# Maintenance Mode Protocols

> **⚠️ STATUS: ACTIVE**
> **EFFECTIVE DATE: 2025-12-02**

## 1. Core Principle
The project is currently in **Maintenance Mode**. The core system functionality is considered **STABLE and FROZEN**.
No changes to business logic, database schema, or core handlers are allowed unless critical bugs are found.

## 2. Allowed Modification Zones (Safe Zones)
Only the following areas are open for modification:

### ✅ A. Localization (i18n)
- **Files**: `src/i18n/locales/**/*.ts`, `i18n_for_translation.csv`
- **Scope**: Adding new translations, fixing typos, adjusting tone.
- **Tools**: `pnpm i18n:sync`, `pnpm i18n:check`
- **Strict Rule**: 
  - NEVER use hardcoded strings (e.g., Chinese/English literals) in code.
  - ALWAYS check `i18n_for_translation.csv` for missing keys before deployment.
  - `zodiac` module MUST be exported in `src/i18n/locales/*/index.ts`.

### ✅ B. AI Prompts
- **Files**: `src/prompts/**/*.ts`
- **Scope**: Adjusting system prompts, refining persona (e.g., Fortune Teller tone), optimizing token usage.
- **Constraint**: Must NOT break the JSON output structure required by the parsers.

## 3. Frozen Zones (Do Not Touch)
Modifications to these areas require **EXPLICIT USER AUTHORIZATION** with a strong justification.

### ⛔ C. Domain Logic (`src/domain/`)
- User logic, Bottle logic, Matching algorithms.
- **Zodiac Logic (`src/domain/zodiac.ts`)**: DO NOT modify unless fixing i18n mapping bugs.

### ⛔ D. Telegram Handlers (`src/telegram/`)
- Command handling, flow control, callback queries.
- **Exception**: Adding *new* text-only responses via i18n is allowed, but changing flow logic is forbidden.
- **Rule**: If adding new UI elements, ensure corresponding i18n keys exist in CSV FIRST.

### ⛔ E. Database Layer (`src/db/`)
- Schema (`schema.sql`), Migrations (`migrations/`), Client logic.

### ⛔ F. Core Services (`src/services/`)
- **Exception**: `src/services/fortune.ts` may be touched *only* to update prompt calling logic if absolutely necessary for the AI adjustment, but logic flow should remain intact.

## 4. Operational Rules
1. **Backup First**: Before any batch edit, run `pnpm backup`.
2. **Read-Only Default**: Assume all files outside Safe Zones are Read-Only.
3. **Documentation**: Update `CHANGELOG.md` for any prompt/i18n changes.
4. **i18n Regression Check**:
   - Before any deployment, verify `zodiac` keys are loading correctly.
   - Verify `router.throwPrompt` matches `throw.bottle8` content.
   - Run `pnpm i18n:check` to find missing keys.

## 5. Critical Regression Prevention
The following issues have occurred repeatedly and must be prevented:
- **Zodiacs in English**: Ensure `zodiac` is exported in `src/i18n/locales/*/index.ts`.
- **Raw Keys in UI**: Ensure keys like `fortune.profile_incomplete_hint`, `interests.back_to_categories` exist in CSV.
- **Hardcoded Text**: Never hardcode UI text (e.g. VIP benefits) in handlers. Use `i18n.t()`.
