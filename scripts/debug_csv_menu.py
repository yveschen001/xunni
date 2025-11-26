
import csv

input_file = 'i18n_for_translation.csv'

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if row['key'] == 'menu.settings':
            print(f"Row {i+2}: menu.settings")
            print(f"  zh-TW: {repr(row['zh-TW'])}")
        if row['key'] == 'menu.settings2':
            print(f"Row {i+2}: menu.settings2")
            print(f"  zh-TW: {repr(row['zh-TW'])}")

