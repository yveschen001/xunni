import csv
import shutil
import sys

filename = 'i18n_for_translation.csv'
temp_filename = 'i18n_for_translation_fixed.csv'

# Backup original file
shutil.copy(filename, filename + '.backup_settings_fix')

# Define corrections
corrections = {
    'settings.changeLanguage': {
        'en': '🌐 Change Language',
        'zh-CN': '🌐 更改语言',
        'zh-TW': '🌐 更改語言',
    },
    'settings.returnToMenu': {
        'en': '🏠 Return to Menu',
        'zh-CN': '🏠 返回主菜单',
        'zh-TW': '🏠 返回主選單',
    }
}

try:
    with open(filename, 'r', encoding='utf-8') as infile, \
         open(temp_filename, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in reader:
            key = row.get('key')
            if key in corrections:
                print(f"Fixing key: {key}")
                # Apply corrections for specific languages
                for lang, value in corrections[key].items():
                    if lang in row:
                        print(f"  - {lang}: {row[lang]} -> {value}")
                        row[lang] = value
                    else:
                        print(f"  - Warning: Language {lang} not found in CSV")
                
                # For other languages, if value is missing or bad, use English
                # But for now, let's just fix the critical ones.
                # Actually, we should probably propagate English to other langs if they are empty/bad
                # But let's stick to minimal intervention.
            
            writer.writerow(row)

    # Replace original file
    shutil.move(temp_filename, filename)
    print("CSV file updated successfully.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

