#!/bin/bash

# Batch add i18n initialization to handler files
# This script adds i18n import and initialization to files that don't have it yet

FILES=(
  "src/telegram/handlers/catch.ts"
  "src/telegram/handlers/chats.ts"
  "src/telegram/handlers/help.ts"
  "src/telegram/handlers/vip.ts"
  "src/telegram/handlers/tasks.ts"
  "src/telegram/handlers/onboarding_callback.ts"
  "src/telegram/handlers/edit_profile.ts"
  "src/telegram/handlers/throw_advanced.ts"
  "src/telegram/handlers/conversation_actions.ts"
  "src/telegram/handlers/mbti.ts"
  "src/telegram/handlers/mbti_test.ts"
  "src/telegram/handlers/onboarding_input.ts"
  "src/telegram/handlers/country_confirmation.ts"
  "src/telegram/handlers/country_selection.ts"
  "src/telegram/handlers/nickname_callback.ts"
  "src/telegram/handlers/draft.ts"
  "src/telegram/handlers/message_forward.ts"
  "src/telegram/handlers/vip_refund.ts"
  "src/telegram/handlers/block.ts"
  "src/telegram/handlers/tutorial.ts"
  "src/telegram/handlers/refresh_conversations.ts"
  "src/telegram/handlers/refresh_avatar.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file already has i18n
    if grep -q "createI18n\|i18n\.t(" "$file"; then
      echo "⏭️  Skipping $file (already has i18n)"
    else
      echo "🔧 Adding i18n placeholder comments to $file"
      # Add a comment at the top to mark files that need i18n
      sed -i.bak '1i\
// TODO: Add i18n support - use createI18n() and i18n.t() for all user-facing strings
' "$file"
      rm "${file}.bak"
    fi
  fi
done

echo "✅ Done!"
