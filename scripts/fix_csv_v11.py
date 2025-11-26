
import csv
import re

input_file = 'i18n_for_translation.csv'
output_file = 'i18n_for_translation_fixed_v11.csv'

def fix_text(text, key):
    if not text: return text
    
    # Fix menu.settings
    if "menu.settings" == key:
        # Match '• MBTI：$\n' or '• MBTI：\$\n'
        if "MBTI" in text and ("$\\n" in text or "$\\n" in text.replace('\\', '')):
             text = re.sub(r'MBTI：\\?\$', 'MBTI：${mbti}', text)

    if "menu.settings2" == key:
        if "星座" in text and ("$\\n" in text or "$\\n" in text.replace('\\', '')):
             text = re.sub(r'星座：\\?\$', '星座：${zodiac}', text)
             
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

