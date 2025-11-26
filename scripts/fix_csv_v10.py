
import csv
import re

input_file = 'i18n_for_translation.csv'
output_file = 'i18n_for_translation_fixed_v10.csv'

def fix_text(text, key):
    if not text: return text
    
    # Fix menu.settings broken by previous scripts
    if "menu.settings" == key:
        if "MBTI" in text and "$" in text and "mbti" not in text:
             text = text.replace('MBTI：$\n', 'MBTI：${mbti}\n')
             text = text.replace('MBTI：\\$\n', 'MBTI：${mbti}\n')

    if "menu.settings2" == key:
        if "星座" in text and "$" in text and "zodiac" not in text:
             text = text.replace('星座：$\n', '星座：${zodiac}\n')
             text = text.replace('星座：\\$\n', '星座：${zodiac}\n')
             
    # General cleanup for any other broken keys (aggressive fallback)
    # If text ends with "：$\n" it's likely broken
    if text.strip().endswith('：$'):
         # We can't easily guess the variable name without context, but we can try common ones
         if "MBTI" in text:
             text = text.replace('：$', '：${mbti}')
         elif "星座" in text:
             text = text.replace('：$', '：${zodiac}')
         elif "Zodiac" in text:
             text = text.replace('：$', '：${zodiac}')

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
        fixed = fix_text(original, f"{row['key']}") 
        if original != fixed:
            row[lang] = fixed
            fixed_count += 1

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Fixed {fixed_count} cells")

