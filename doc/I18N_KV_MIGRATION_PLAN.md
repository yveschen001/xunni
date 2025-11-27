# Cloudflare KV i18n Migration Plan

## Goal
Migrate translation files (`src/i18n/locales/*.ts`) from Worker bundle to Cloudflare KV storage to:
1.  Bypass the 3MB/10MB Worker size limit.
2.  Support infinite languages (currently 34+).
3.  Enable translation updates without redeploying the Worker.

## Architecture

-   **Storage**: Cloudflare KV (Namespace: `CACHE`)
-   **Key Format**: `i18n:lang:{code}` (e.g., `i18n:lang:ja`, `i18n:lang:zh-TW`)
-   **Value**: JSON string of the translation object.
-   **Caching**:
    -   **L1 (Memory)**: Global variable in Worker (lasts for the lifetime of the hot instance).
    -   **L2 (KV)**: Persistent storage.

## Phase 1: Upload Script (The "Producer")

Create `scripts/upload-i18n-to-kv.ts`:
-   [ ] Read all `.ts` files from `src/i18n/locales/`.
-   [ ] Parse them (using dynamic import or simple file reading + `eval` since they are simple objects).
-   [ ] Use `wrangler kv:key put` (via shell execution) to upload each file to the `CACHE` namespace.
-   [ ] Support batch upload for speed.

## Phase 2: Core Refactor (The "Consumer")

Modify `src/i18n/index.ts`:
-   [ ] Remove static imports of non-core languages (keep `zh-TW` as hard fallback).
-   [ ] Add `loadTranslations(env: Env, lang: string): Promise<void>` function.
-   [ ] Implement 2-layer caching strategy (Memory -> KV).
-   [ ] Ensure `t()` function remains synchronous but relies on pre-loaded data.

Modify `src/worker.ts` / `src/router.ts`:
-   [ ] In the main handler, determine user language early (from `from.language_code` or DB).
-   [ ] Call `await i18n.loadTranslations(env, lang)` **before** processing the update.
-   [ ] Pass the loaded translations down to handlers (or use the global singleton pattern carefully).

## Phase 3: Workflow Integration

-   [ ] Update `package.json`:
    -   `pnpm i18n:upload`: Run the upload script.
    -   `pnpm deploy`: Chain `i18n:upload` before `wrangler deploy`.
-   [ ] Update `doc/I18N_WORKFLOW_SUMMARY.md` with the new process.

## Risks & Mitigations

-   **KV Latency**: KV reads can take 10-100ms.
    -   *Mitigation*: Global variable cache means only the *first* request on a cold start pays this penalty.
-   **Consistency**: KV is eventually consistent.
    -   *Mitigation*: Acceptable for translations. Updates usually propagate within seconds/minutes.
-   **Dev Environment**: Local dev (`wrangler dev`) needs to access local KV or local files.
    -   *Mitigation*: The `loadTranslations` function should fallback to dynamic import in local dev mode if possible, or we mock the KV.

---
**Status**: Planning
**Owner**: DevOps

