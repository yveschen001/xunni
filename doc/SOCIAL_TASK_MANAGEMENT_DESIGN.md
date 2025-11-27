# Social Media Task Management Design

## 1. Overview
The goal is to extend the existing **Task System** to allow administrators to dynamically manage "Social Media Tasks" (e.g., Follow Twitter, Join Telegram Channel) via the Telegram Bot. This enables the marketing team to add new engagement tasks without code changes.

## 2. Architecture & Standards
Following `@doc/ADMIN_PANEL.md` and `@doc/OFFICIAL_AD_MANAGEMENT_DESIGN.md`:
- **Architecture**: `Handler` -> `Domain Service` -> `DB`.
- **Role Access**: **god** (Super Admin) and **angel** (Admin).
- **Audit Logging**: Log changes to `admin_actions`.
- **i18n**: Mandatory auto-translation using OpenAI/Gemini.

## 3. Database Schema Changes
The existing `tasks` table needs extension to support dynamic configuration.

### 3.1 New Columns for `tasks` table
| Column | Type | Description |
|--------|------|-------------|
| `action_url` | TEXT | URL to open (e.g., Twitter link, TG link) |
| `verification_type` | TEXT | `none` (Click only), `telegram_chat` (Check member) |
| `target_id` | TEXT | Telegram Chat ID or Username (for verification) |
| `name_i18n` | TEXT | JSON string for multilingual names |
| `description_i18n` | TEXT | JSON string for multilingual descriptions |
| `icon` | TEXT | Emoji icon (default: 📢) |
| `deleted_at` | TEXT | Soft delete timestamp |

*Note: Existing system tasks (e.g., `task_bio`) will remain but can now have their text/rewards edited.*

## 4. Management Commands (`/admin_tasks`)

### 4.1 Main Menu
Displays list of tasks, separated by category (System vs Social).
- **List View**:
    - ID, Name, Status (Active/Paused)
    - Stats (Completions)
- **Actions**:
    - [➕ Create Social Task]
    - [Edit System Task] (Restricted to text/reward only)

### 4.2 Create Social Task (Wizard)
**Flow**:
1. **Platform/Icon**: Select Emoji (🐦, ✈️, 📸, 🌐).
2. **Task Name**: Input text (Max 20 chars) -> **Auto-Translate**.
3. **Description**: Input text (Max 50 chars) -> **Auto-Translate**.
4. **Action URL**: Valid URL.
5. **Verification Type**:
    - **No Verification**: User clicks -> Task marks complete (or claims reward).
    - **Telegram Chat**: User joins -> Bot checks membership.
6. **Target ID** (if Telegram Chat): `@channel` or ID.
    - *System Check*: Bot checks if it is admin in that chat.
7. **Reward**: Number of Bottles (Daily Quota).
8. **Confirm & Publish**.

### 4.3 Edit/Delete
- **Edit**: Wizard style, skip unchanged fields.
- **Delete**: Soft delete (`deleted_at`). **Only applies to Social Tasks**. System tasks cannot be deleted.
- **Toggle Status**: Enable/Disable.

## 5. User Experience (Client Side)
The `/tasks` command will dynamically render the list.

### 5.1 Task Logic
- **Social Tasks**:
    - Displayed in "Social Tasks" section.
    - **Action Button**: "Go / Join" (opens URL).
    - **Verify Button**:
        - If `verification_type=none`: "Claim Reward" (Immediate).
        - If `verification_type=telegram_chat`: "Verify & Claim" (Triggers `getChatMember`).

### 5.2 Verification Logic
- **Telegram**:
    - User clicks "Verify".
    - Bot calls `getChatMember(target_id, user_id)`.
    - If member/admin/creator -> Grant Reward.
    - If not -> Show alert "Please join first".
- **Link Click (No Verify)**:
    - User clicks link.
    - User clicks "Claim".
    - *Risk*: User might claim without actually following. Accepted trade-off for external platforms without API access.

## 6. Implementation Plan
1.  **Schema Update**: Add columns to `tasks` table.
2.  **Domain Service**: `AdminTasksService` (CRUD, Auth, Logging, Translation).
3.  **Handlers**: `/admin_tasks` wizard.
4.  **User UI Update**: Update `src/telegram/handlers/tasks.ts` to render dynamic buttons and handle new verification types.
5.  **Verification Service**: Reuse/Extend `channel_membership_check.ts`.

