import csv
import shutil
import sys
import os

filename = 'i18n_for_translation.csv'
temp_filename = 'i18n_for_translation_success_fix.csv'

# Backup original file
if not os.path.exists(filename + '.backup_success'):
    shutil.copy(filename, filename + '.backup_success')

try:
    rows = []
    fieldnames = []

    with open(filename, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        for row in reader:
            key = row.get('key')
            
            # Rename success.success to success.verify
            if key == 'success.success':
                print(f"Renaming key: {key} -> success.verify")
                row['key'] = 'success.verify'
                rows.append(row)
            # Rename success.success.success to success.verify2
            elif key == 'success.success.success':
                print(f"Renaming key: {key} -> success.verify2")
                row['key'] = 'success.verify2'
                rows.append(row)
            # Remove success.success.ad*
            elif key.startswith('success.success.ad'):
                print(f"Removing duplicate key: {key}")
                continue
            else:
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

