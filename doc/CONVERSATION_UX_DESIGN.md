# XunNi Conversation UX Redesign (Phase 2 & 3)

> **Status**: Implemented & Deployed to Staging
> **Last Updated**: 2025-01-15

This document outlines the redesigned Conversation UX, including History Pagination, Profile Cards, and Fortune Integration.

## 1. Conversation List (`/chats`)

### 1.1 Overview
The conversation list uses a **Numbered Menu Selection** interface. Instead of a long vertical list of buttons, conversations are displayed in the message text with numbers (1-10), and users select the corresponding number from a compact button grid.

### 1.2 UI Layout
```text
💬 **My Conversations** (Page 1/3)

1️⃣ **🇯🇵 🚹 Takeshi** (✅)
   └ 📝 ID: 1205AB | 🕒 5 mins ago
   └ 💬 OK, no problem...

2️⃣ **🇹🇼 🚺 Alice** (⏸️)
   └ 📝 ID: 9988CC | 🕒 1 hour ago
   └ 💬 Thank you!

... (Up to 10 items)

━━━━━━━━━━━━━━━━
👇 **Tap a number to view details:**

[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]
[ 6 ] [ 7 ] [ 8 ] [ 9 ] [ 10 ]

[ ⬅️ Prev ]   [ Next ➡️ ]
      [ 🏠 Back to Menu ]
```

### 1.3 Key Features
- **Pagination**: 10 conversations per page.
- **Compact UI**: Fixed height button grid regardless of list size.
- **Rich Info**: Displays Status, Nickname, Gender, Country, ID, Last Message Time, and Preview.

## 2. Conversation History (`/history`)

### 2.1 Overview
The history view has been optimized for performance and readability, featuring pagination and date separators.

### 2.2 UI Layout
```text
💬 Conversation with 🇯🇵 Nickname (Page 1/3)
━━━━━━━━━━━━━━━━
📅 2025/01/15

[10:30] You: Hello!
[10:32] Other: Hi there! How are you?

📅 2025/01/14

[22:00] You: Good night!
━━━━━━━━━━━━━━━━
💡 Displaying translated content (if available)

[ < Prev ]   [ Next > ]
[ ↩️ Reply ] [ 🏠 Back to Menu ]
```

### 2.3 Key Features
- **Pagination**: 20 messages per page.
- **Date Separators**: Clear grouping of messages by date.
- **Translation Priority**: Displays translated text for VIPs (or if available), with a hint at the bottom.
- **Anonymous Identity**: Uses masked nicknames (e.g., `Ali***`) and country flags.

## 3. Profile Card (`/profile_card`)

### 3.1 Overview
A unified profile card used for both "Self View" and "Other View" (Stranger/Partner).

### 3.2 UI Layout
```text
┌─────────────────────────┐
│  [Avatar]               │
│  🇯🇵 Nickname            │
│  23-30 · Tokyo          │
│  ♈ Aries · INTJ        │
│                         │
│  "Hello, nice to meet..."│
│                         │
│  Interests:             │
│  Music, Travel, Code    │
│                         │
│  Language: zh-TW        │
└─────────────────────────┘

[ ↩️ Reply ] (If in conversation)
[ 🔮 Fortune Match ]
[ 🎁 Gift VIP ]
```

### 3.3 Interaction Logic
- **Self View**: Shows "Watch Ad" button (if non-VIP) to earn quota.
- **Other View**:
  - **Reply**: Only visible if accessing from a conversation context.
  - **Fortune Match**: Checks compatibility (VIP feature).
  - **Gift VIP**: Allows gifting VIP status to the user.

## 4. Implementation Details

- **Handlers**:
  - `src/telegram/handlers/history.ts`: Handles pagination and rendering.
  - `src/telegram/handlers/profile.ts`: Manages profile card and context buttons.
  - `src/telegram/handlers/chats.ts`: Manages conversation list (Numbered Grid UI).
- **Callback Data**:
  - `history_read:{identifier}:{page}`
  - `fortune_match:{targetId}`
  - `conv_reply_{identifier}`
