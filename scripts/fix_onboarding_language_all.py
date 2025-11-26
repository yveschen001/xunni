import csv
import shutil
import sys
import os

filename = 'i18n_for_translation.csv'
temp_filename = 'i18n_for_translation_fix_all.csv'

# Backup
if not os.path.exists(filename + '.backup_all_langs'):
    shutil.copy(filename, filename + '.backup_all_langs')

target_key = 'onboarding.languageSelection'
english_value = "🌐 **Choose Language**\n\nPlease select your preferred language:"

# Known translations (preserve these)
known_translations = {
    'zh-TW': "🌐 **選擇語言**\n\n請選擇你的偏好語言：",
    'zh-CN': "🌐 **选择语言**\n\n请选择你的偏好语言：",
    'en': english_value
}

try:
    rows = []
    fieldnames = []

    with open(filename, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        for row in reader:
            if row.get('key') == target_key:
                print(f"Processing {target_key} for all languages...")
                for field in fieldnames:
                    if field == 'key': continue
                    
                    current_val = row.get(field, '')
                    
                    # If it's one of our known good translations, verify it
                    if field in known_translations:
                        # Ensure it matches our known good version (override if it was partial)
                        # But wait, my previous fix might have set it correctly.
                        # Let's force set known ones to be sure.
                        row[field] = known_translations[field]
                    else:
                        # For other languages, check if it needs fixing
                        if not current_val or '[Need translation' in current_val or '[Translation needed' in current_val or '[需要翻译' in current_val:
                            print(f"  Fixing {field}: replacing placeholder with English fallback")
                            row[field] = english_value
            rows.append(row)

    # Write back
    with open(temp_filename, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    shutil.move(temp_filename, filename)
    print("CSV file updated successfully.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

