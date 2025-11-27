# Admin User Management Optimization Design

## 1. Current Status Analysis (AS-IS)

Currently, the user management system relies heavily on text commands (`/admin_ban`, `/admin_unban`, `/admin_appeals`) executed in private chats with the bot.

### Existing Features
*   **Manual Ban/Unban**: Admins use `/admin_ban <id>` and `/admin_unban <id>`.
*   **List Bans**: `/admin_bans` shows recent bans or specific user history.
*   **Appeals**: Users submit appeals via `/appeal`. Admins view them via `/admin_appeals` and approve/reject via commands.
*   **Auto-Ban**: System automatically bans users based on report count (1 report = 1hr, 2 = 6hrs, etc.). Logic exists in `report.ts`.
*   **Notifications**:
    *   User gets notified when banned/unbanned.
    *   Admins **do not** receive real-time notifications of new bans or appeals in a centralized group.

### Pain Points
1.  **Lack of Visibility**: Admins don't know when an auto-ban happens unless they constantly check `/admin_bans`.
2.  **Tedious Workflow**: Handling appeals or bans requires copying User IDs and typing commands.
3.  **No Central Log**: There's no single "Audit Log" channel where all admins can see what's happening.
4.  **User Experience**: Users might not know their own Telegram ID to report issues effectively.
5.  **Lack of Context**: Reports do not show the offending message or history, making manual judgement hard.
6.  **Manual Workload**: Reviewing every report and appeal is time-consuming.

---

## 2. Proposed Optimization (TO-BE)

We will implement an **"Admin Operation Channel" (Admin Ops)** workflow combined with **AI-Assisted Governance**. This leverages existing Cloudflare Workers and D1 infrastructure, adding Gemini for intelligence.

### Core Concept
Move from "CLI Commands" to "ChatOps with AI".
*   **Admins**: Operate via buttons in a private group.
*   **AI (Gemini)**: Acts as the first line of defense (Auto-Ban) and the first reviewer (Auto-Appeal Review).

### Key Features

#### 2.1. Centralized Admin Log Group
*   **Config**: Add `ADMIN_LOG_GROUP_ID` to `wrangler.toml`.
*   **Function**: All significant user events are forwarded here.

#### 2.2. Enhanced Report & Auto-Ban Notifications (with Evidence)
When a user is reported or auto-banned, the system captures context.

**Message to Admin Group:**
```text
🚨 **New Report / Auto-Ban**
Reporter: UserA (`123`)
Suspect: UserB (`456`)
Reason: Harassment
Risk Score: 80 (High)

**📝 Evidence (Last 3 Messages):**
UserA: Hello
UserB: [Offensive Content]
UserA: ?

**🤖 AI Analysis:**
Verdict: Violated (Harassment)
Confidence: 95%
Action: **Auto-Banned (24h)**

[🔓 Unban (False Positive)] [📜 History]
```

#### 2.3. Appeal Management & AI Review
When a user submits `/appeal`, AI analyzes the appeal text + ban reason.

**Message to Admin Group:**
```text
📝 **Appeal Review**
User: UserB (`456`)
Ban Reason: Harassment
Appeal: "I apologize, I was drunk. Won't happen again."

**🤖 AI Recommendation:**
Verdict: **Unban**
Reason: User admits fault and apologizes. First offense.

[✅ Approve (Auto-Unban)] [❌ Reject]
```

#### 2.4. User ID Display Improvements
Instead of adding a new command, we will improve existing interfaces to display the User ID clearly.

*   **Profile Update**: Add `ID: 123456789` to the `/profile` output.
*   **Notification Update**: When a user receives a ban/unban notification, clearly state their User ID and advise them to quote it when contacting support.

#### 2.5. User Notifications (Refined)
*   **To Banned User (Unban)**:
    > "✅ Your account restrictions have been lifted.
    > ID: `123456`
    >
    > Please adhere to our Terms of Service. This restriction was triggered by multiple user reports. Maintaining a friendly environment is everyone's responsibility."
*   **To Reporter**:
    > "✅ Report received. We have forwarded it to our review team/AI system.
    >
    > Please note: We will not notify you of the specific outcome, but we take every report seriously. Thank you for helping keep the community safe."

**Note on i18n**: All user-facing texts must be added to `src/i18n/locales/zh-TW.ts` and accessed via `i18n.t()`. No hardcoded strings allowed.

---

## 3. Implementation Plan

### Phase 1: Configuration & Infrastructure
1.  Add `ADMIN_LOG_GROUP_ID` to environment variables.
2.  Create `ContentModerationService` (wrapper around Gemini API) for text analysis.
3.  Create `AdminLogService` to standardize message formatting.

### Phase 2: Logic Updates (Leveraging Existing Flows)
1.  **Update `report.ts`**:
    *   Capture conversation context (fetch last 5 messages from `conversation_messages` table).
    *   Call `ContentModerationService`.
    *   If AI Score > Threshold -> Trigger `autoBanUser`.
    *   Send structured log to Admin Group.
2.  **Update `appeal.ts`**:
    *   Send log to Admin Group with buttons.
3.  **Update `admin_ban.ts`**:
    *   Manual bans also log to group.

### Phase 3: Cron Job (AI Patrol)
1.  Create `cron/ai_moderation_patrol.ts`.
2.  Scan `appeals` where `status = 'pending'`.
3.  Apply AI judgment logic.
4.  Execute `handleAdminApprove` or `handleAdminReject` logic automatically if confidence is high.

### Phase 4: User-Facing Polish
1.  Update `autoBanUser` notification to include clear User ID.
2.  Implement the specific "Unban" and "Report Receipt" message templates defined in section 2.5.
3.  **Update `profile.ts`**: Add User ID display line to the main profile message.

## 4. Fairness & Safety
*   **Appeal Loop**: Users can always appeal.
*   **Human Override**: Admins in the group can always click `[Unban]` to reverse an AI decision.
*   **Transparency**: All AI actions are logged to the Admin Group, so humans can audit the "robots".

## 5. Recommendation
This design maximizes automation using existing table structures (`reports`, `appeals`, `bans`) and the Gemini API integration we already have. It minimizes new "heavy" development by piggybacking on the current logic flow.
