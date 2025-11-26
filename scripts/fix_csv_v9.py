
import csv
import re

input_file = 'i18n_for_translation.csv'
output_file = 'i18n_for_translation_fixed_v9.csv'

def fix_text(text, key):
    if not text: return text
    
    # Remove ${highlights} from throw.bottle keys as code appends it manually
    if "throw.bottle" in key and "highlights" in text:
        # Remove \${highlights}, ${highlights}, and surrounding newlines if needed
        text = re.sub(r'\\?\$\{highlights\}', '', text)
        # Clean up trailing newlines if multiple
        text = text.strip()
        
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

