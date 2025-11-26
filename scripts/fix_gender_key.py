import csv
import shutil
import sys
import os

filename = 'i18n_for_translation.csv'
temp_filename = 'i18n_for_translation_gender_fix.csv'

# Backup original file
if not os.path.exists(filename + '.backup_gender'):
    shutil.copy(filename, filename + '.backup_gender')

try:
    rows = []
    fieldnames = []

    with open(filename, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        for row in reader:
            key = row.get('key')
            
            if key == 'gender':
                print(f"Renaming key: {key} -> gender.label")
                row['key'] = 'gender.label'
            
            rows.append(row)

    # Write back
    with open(temp_filename, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Replace original file
    shutil.move(temp_filename, filename)
    print("CSV file updated successfully.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

