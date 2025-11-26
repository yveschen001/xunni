
import csv
import re

input_file = 'i18n_for_translation.csv'
output_file = 'i18n_for_translation_fixed_v8.csv'

def fix_text(text, key):
    if not text: return text
    
    # Fix broken catch.settings from v6 script
    # It looks like "🧠 MBTI：$\n $" or similar due to regex stripping
    if "catch.settings" in key:
        if "MBTI" in text and "$" in text and "mbti" not in text:
             # Fix the broken string
             text = re.sub(r'🧠 MBTI.*', '🧠 MBTI：${mbti}\\n', text)
             # Also fix en/zh-CN if they are different
             text = text.replace('MBTI: $\\n $', 'MBTI: ${mbti}\\n')

    # Ensure throw.settings uses simple placeholders
    if "throw.settings" in key:
        if "matchResult.user.mbti_result" in text:
             text = text.replace('${matchResult.user.mbti_result}', '${mbti}')
        if "matchResult.user.zodiac" in text:
             text = text.replace('${matchResult.user.zodiac}', '${zodiac}')

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
        fixed = fix_text(original, f"{row['key']}") # Pass key name only
        if original != fixed:
            row[lang] = fixed
            fixed_count += 1

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Fixed {fixed_count} cells")

