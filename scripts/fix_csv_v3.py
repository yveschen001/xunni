
import csv
import re

input_file = 'i18n_for_translation.csv'
output_file = 'i18n_for_translation_fixed_v3.csv'

# Patterns

# 1. Double braces with potential spaces
p1 = re.compile(r'\$\{\{\s*([^\}]+)\s*\}\}') 

# 2. Logic expressions (conditional operators)
# Matches ${... ? ... : ...}
p_logic = re.compile(r'\$\{[^}]+\?[^}]+\:[^}]+\}')

# 3. Function calls
# Matches ${...()}
p_func = re.compile(r'\$\{[^}]+\([^\)]*\)\}')

# 4. Specific known issues with spaces or paths
# matchResult.user.mbti_result (with optional space)
p_mbti = re.compile(r'\$\{matchResult\.user\.mbti_result\s*\}')
p_zodiac = re.compile(r'\$\{matchResult\.user\.zodiac\s*\}')

def fix_text(text):
    if not text: return text
    
    # Fix 1: Double braces
    text = p1.sub(r'${\1}', text)
    
    # Fix known paths first
    text = p_mbti.sub('${mbti}', text)
    text = p_zodiac.sub('${zodiac}', text)
    
    # Fix Logic Expressions
    # We need to handle specific cases we know how to map
    if "task.reward_type" in text and "?" in text:
         text = re.sub(r'\$\{task\.reward_type[^}]+\}', '${rewardTypeText}', text)
    
    if "user.gender" in text and "?" in text:
        # e.g. ${user.gender === 'male' ? '男' : '女'}
        # Code usually passes 'genderText' or handle it outside. 
        # But wait, looking at the code, sometimes it might not.
        # Let's check edit_profile.ts. It passes genderDisplay!
        # const genderDisplay = updatedUser.gender === 'male' ? ...
        # So in CSV it should be ${genderDisplay} or similar.
        # But existing keys might be using raw logic.
        # Let's see... edit_profile.ts:736: const genderDisplay = ...
        # But is it passed to i18n?
        # No, edit_profile.ts uses it for "common.male"/"female".
        # But wait, the error log showed:
        # value: 👤 性別：${updatedUser.gender === 'male' ? '男' : '女'}
        # This means the CSV contains this logic.
        # And the code PROBABLY DOES NOT pass 'updatedUser' with logic support.
        # We should replace this with ${gender} and ensure code passes it.
        text = re.sub(r'\$\{updatedUser\.gender[^}]+\}', '${gender}', text)
        text = re.sub(r'\$\{user\.gender[^}]+\}', '${gender}', text)
        text = re.sub(r'\$\{otherUser\.gender[^}]+\}', '${gender}', text)

    if "reviewInfo" in text and "?" in text:
        text = re.sub(r'\$\{reviewInfo[^}]+\}', '${reviewInfo}', text)

    if "urlCheck.blockedUrls" in text:
        text = re.sub(r'\$\{urlCheck\.blockedUrls[^}]+\}', '${blockedUrls}', text)

    if "Math.floor" in text:
         text = re.sub(r'\$\{Math\.floor[^}]+\}', '${daysAgo}', text)

    if "ad.is_enabled" in text:
        text = re.sub(r'\$\{ad\.is_enabled[^}]+\}', '${status}', text)
        
    if "user.vip_expire_at" in text and "toLocaleDateString" in text:
        text = re.sub(r'\$\{new Date[^}]+\}', '${expireDate}', text)

    if "inviteLimit" in text and "?" in text:
        text = re.sub(r'\$\{!user\.is_vip[^}]+\}', '${inviteLimitWarning}', text)

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
        
        fixed = fix_text(original)
        if original != fixed:
            row[lang] = fixed
            fixed_count += 1

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Fixed {fixed_count} cells")

