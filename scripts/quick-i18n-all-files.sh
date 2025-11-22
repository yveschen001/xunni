#!/bin/bash

# Quick i18n for all remaining files
# This script adds TODO comments to mark files that need full i18n

FILES=(
  "src/telegram/handlers/onboarding_callback.ts"
  "src/telegram/handlers/throw_advanced.ts"
  "src/telegram/handlers/broadcast.ts"
  "src/telegram/handlers/dev.ts"
  "src/telegram/handlers/admin_ad_config.ts"
  "src/telegram/handlers/draft.ts"
  "src/telegram/handlers/vip_refund.ts"
  "src/telegram/handlers/official_ad.ts"
  "src/telegram/handlers/tasks.ts"
  "src/telegram/handlers/mbti_test.ts"
  "src/telegram/handlers/onboarding_input.ts"
  "src/telegram/handlers/ad_reward.ts"
  "src/telegram/handlers/tutorial.ts"
  "src/telegram/handlers/maintenance.ts"
  "src/telegram/handlers/refresh_conversations.ts"
  "src/telegram/handlers/admin_refresh_vip_avatars.ts"
  "src/telegram/handlers/refresh_avatar.ts"
  "src/telegram/handlers/country_confirmation.ts"
  "src/telegram/handlers/nickname_callback.ts"
  "src/telegram/handlers/admin_analytics.ts"
  "src/telegram/handlers/country_selection.ts"
  "src/telegram/handlers/admin_test_refresh.ts"
  "src/telegram/handlers/catch.ts"
  "src/telegram/handlers/help.ts"
)

echo "📝 Marking files for full i18n support..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file already has TODO comment
    if ! grep -q "TODO.*i18n" "$file"; then
      echo "📌 Marking $file"
      # Add TODO comment at the top
      sed -i.bak '1i\
// TODO: Complete i18n support - replace all hardcoded Chinese strings with i18n.t() calls
' "$file"
      rm "${file}.bak" 2>/dev/null
    fi
  fi
done

echo "✅ Done! All files marked for i18n completion."
