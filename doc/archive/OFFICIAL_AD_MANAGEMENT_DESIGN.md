# Official Ad Management System Design

## 1. Overview
The goal is to allow administrators to manage (Create, Read, Update, Delete) official ads directly via the Telegram Bot.
This design aligns with **`@doc/ADMIN_PANEL.md`** standards regarding architecture, role-based access, and audit logging.

## 2. Architecture & Standards
Following `doc/ADMIN_PANEL.md`:
- **Architecture**: `Telegram Handler` -> `Domain Service` -> `DB`.
- **Role Access**: Restricted to **god** (Super Admin) and **angel** (Admin) roles.
- **Audit Logging**: All modification actions (Create, Edit, Delete, Status Change) must be logged to `admin_actions` table.

### 2.1 Current Ad Architecture
- **Table**: `official_ads`
- **Ad Types**: `text`, `link`, `group`, `channel`
- **Logic**:
    - One-time display per user (`official_ad_views`).
    - **Reward Type**: Single-use (Temporary) quota added to today's limit.
    - Verification support for Groups/Channels.

## 3. Management Commands
Commands follow the `/admin_` naming convention.

### 3.1 Main Menu (`/admin_ads`)
Displays the list of official ads with actions.
- **List View**:
    - ID, Type, Title
    - Status (Active/Paused)
    - Stats (Views/Clicks/Conversions)
- **Actions**:
    - [➕ Create New Ad] (`callback: admin_ad_create`)
    - Rows of existing ads with [Edit] [Copy] [Status] buttons.

### 3.2 Create Ad (Wizard)
Triggered by `/admin_ad_create` or button.
**Interactive Wizard Flow**:
1. **Type Selection**: Buttons for [Text, Link, Group, Channel].
2. **Title Input**: Text (Max 40 chars - optimized for layout).
    - *Auto-Translate*: **Automatic** (System generates 34 languages via LLM).
3. **Content Input**: Text (Max 300 chars - concise).
    - *Auto-Translate*: **Automatic**.
4. **URL Input** (if Link/Group/Channel): Valid URL.
5. **Target ID Input** (if Group/Channel): `@channelname` or Chat ID.
    - *System Check*: Bot checks admin status in target chat.
6. **Reward Input**: Number of Bottles (Default: 1).
7. **Verification Required**: Yes/No (for Group/Channel).
8. **Confirm & Publish**.

### 3.3 Edit Ad (`/admin_ad_edit <id>`)
**Wizard-style Edit Flow**:
- Shows current value.
- Options: [Skip/Next] or Enter new value (Auto-translates new text).

### 3.4 Duplicate Ad (`/admin_ad_duplicate <id>`)
- Creates a copy with `(Copy)` suffix.
- Status: **Paused** by default.
- Logged in `admin_actions`.

### 3.5 Status & Delete
- **Toggle Status**: `/admin_ad_toggle <id>` (Active <-> Paused).
- **Delete**: `/admin_ad_delete <id>` (Soft delete `deleted_at`).
- All actions logged in `admin_actions`.

## 4. Verification Logic & Limitations
### 4.1 "Join Channel" Verification
- **Mechanism**: `getChatMember(chat_id, user_id)`.
- **Requirement**: **Bot MUST be Administrator** in target channel/group.

### 4.2 Limitations
- **Quantity**: No hard limit. Display FIFO.
- **Title**: Max 40 chars.
- **Content**: Max 300 chars.
- **Reward**: Temporary Daily Quota (1 bottle).
- **Auto-Translate**: Mandatory. Uses OpenAI/Gemini API.

## 5. i18n Support (Auto-Translation)
- **Input**: Admin inputs (en/zh).
- **Processing**: System calls LLM API to generate 34 languages.
- **Storage**:
    - Schema Change: Add `title_i18n` (JSON), `content_i18n` (JSON) to `official_ads`.
    - Fallback: Original text.

## 6. Implementation Plan
1. **Schema Update**:
    - Add `title_i18n`, `content_i18n`, `deleted_at`.
2. **Domain Service**:
    - Implement `src/domain/admin/ads.ts` (Logic, Role Check `god/angel`, Logging to `admin_actions`).
3. **Translation Service**:
    - Implement `src/services/translation.ts` (OpenAI/Gemini wrapper).
4. **Handlers**:
    - Implement `src/telegram/handlers/admin_ads.ts` (Wizard, Commands).
5. **Reward Logic**:
    - Update `official_ad.ts` to use Temporary Quota.
