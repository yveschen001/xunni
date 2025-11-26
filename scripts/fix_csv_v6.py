
import csv
import re

input_file = 'i18n_for_translation.csv'
output_file = 'i18n_for_translation_fixed_v6.csv'

def fix_text(text, key):
    if not text: return text
    original_text = text
    
    # Fix escaped placeholders that survived previous fixes
    # e.g. \${matchResult...} -> ${mbti}
    # We need to handle backslashes if they exist in the raw string
    # But here 'text' is the python string. CSV reader doesn't escape backslashes.
    # So if CSV has \${...}, text has \${...}.
    
    # Remove garbage {matchResult...} (without $)
    text = re.sub(r'\{matchResult\.user\.mbti_result[^}]*\}', '', text)
    text = re.sub(r'\{matchResult\.user\.zodiac[^}]*\}', '', text)
    text = re.sub(r'\{user\.mbti_result[^}]*\}', '', text)
    text = re.sub(r'\{user\.zodiac_sign[^}]*\}', '', text)
    text = re.sub(r'\{bottle\.mbti_result[^}]*\}', '', text)

    # Fix standard placeholders
    if "matchResult.user.mbti_result" in text:
        text = re.sub(r'\\?\$\{matchResult\.user\.mbti_result[^\}]*\}', '${mbti}', text)
    if "matchResult.user.zodiac" in text:
        text = re.sub(r'\\?\$\{matchResult\.user\.zodiac[^\}]*\}', '${zodiac}', text)

    # Clean up double spaces created by removal
    text = re.sub(r'  +', ' ', text)

    if text != original_text:
        # print(f"Fixed {key}: {original_text[:30]}... -> {text[:30]}...")
        pass
        
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

