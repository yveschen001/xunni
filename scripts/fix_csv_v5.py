
import csv
import re

input_file = 'i18n_for_translation.csv'
output_file = 'i18n_for_translation_fixed_v5.csv'

# Patterns
p1 = re.compile(r'\$\{\{\s*([^\}]+)\s*\}\}') 

def fix_text(text, key):
    if not text: return text
    original_text = text
    
    # Fix 1: Double braces
    text = p1.sub(r'${\1}', text)
    
    # Fix Paths
    if "matchResult.user.mbti_result" in text:
        text = re.sub(r'\$\{matchResult\.user\.mbti_result[^\}]*\}', '${mbti}', text)
    if "matchResult.user.zodiac" in text:
        text = re.sub(r'\$\{matchResult\.user\.zodiac[^\}]*\}', '${zodiac}', text)

    # Fix Logic Expressions - Gender
    if "gender" in text and "?" in text:
        text = re.sub(r'\$\{[a-zA-Z0-9_]*\.?user\.gender[^\}]+\}', '${gender}', text)
        text = re.sub(r'\$\{[a-zA-Z0-9_]*\.gender[^\}]+\}', '${gender}', text)

    # Fix Logic Expressions - Reward Type
    if "task.reward_type" in text and "?" in text:
         text = re.sub(r'\$\{task\.reward_type[^\}]+\}', '${rewardTypeText}', text)

    # Fix Logic Expressions - Review Info
    if "reviewInfo" in text and "?" in text:
        text = re.sub(r'\$\{reviewInfo[^\}]+\}', '${reviewInfo}', text)

    # Fix Logic Expressions - URL Check
    if "urlCheck.blockedUrls" in text:
        text = re.sub(r'\$\{urlCheck\.blockedUrls[^\}]+\}', '${blockedUrls}', text)

    # Fix Logic Expressions - Math.floor
    if "Math.floor" in text:
         text = re.sub(r'\$\{Math\.floor[^\}]+\}', '${daysAgo}', text)

    # Fix Logic Expressions - Math.round (New!)
    if "Math.round" in text:
         text = re.sub(r'\$\{Math\.round\([^\)]+\)\}', '${score}', text)

    # Fix Logic Expressions - Ad status
    if "ad.is_enabled" in text:
        text = re.sub(r'\$\{ad\.is_enabled[^\}]+\}', '${status}', text)
        
    # Fix Logic Expressions - Date
    if "user.vip_expire_at" in text and "toLocaleDateString" in text:
        text = re.sub(r'\$\{new Date[^\}]+\}', '${expireDate}', text)

    # Fix Logic Expressions - Invite Limit
    if "inviteLimit" in text and "?" in text:
        text = re.sub(r'\$\{!user\.is_vip[^\}]+\}', '${inviteLimitWarning}', text)

    if text != original_text:
        pass # print(f"Fixed {key}")
    return text

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

fixed_count = 0
for row in rows:
    for lang in fieldnames:
        if lang == 'key': continue
        original = row[lang]
        if not original: continue
        fixed = fix_text(original, f"{row['key']}[{lang}]")
        if original != fixed:
            row[lang] = fixed
            fixed_count += 1

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Fixed {fixed_count} cells")

