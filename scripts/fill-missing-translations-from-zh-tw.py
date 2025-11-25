#!/usr/bin/env python3
"""
Fill missing translations in CSV by extracting from zh-TW.ts
Uses Python's AST parsing for more accurate extraction
"""

import re
import csv
import sys
from pathlib import Path

def unescape_value(value: str) -> str:
    """Unescape template string value"""
    value = value.replace('\\n', '\n')
    value = value.replace('\\`', '`')
    value = value.replace('\\${', '${')
    value = value.replace('\\\\', '\\')
    return value

def extract_translations_from_zh_tw(file_path: str) -> dict:
    """Extract all translations from zh-TW.ts"""
    translations = {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the translations object
    translations_match = re.search(r'export const translations: Translations = \{', content)
    if not translations_match:
        return translations
    
    start = translations_match.end()
    
    # Find matching closing brace
    depth = 1
    end = start
    for i in range(start, len(content)):
        if content[i] == '{':
            depth += 1
        if content[i] == '}':
            depth -= 1
        if depth == 0:
            end = i
            break
    
    translations_content = content[start:end]
    
    # Extract all keys with their namespace paths
    # First, find all top-level namespaces
    namespace_pattern = r'(\w+):\s*\{'
    namespaces = []
    
    for match in re.finditer(namespace_pattern, translations_content):
        namespace = match.group(1)
        start = match.end()
        
        # Find matching closing brace
        depth = 1
        end = start
        for i in range(start, len(translations_content)):
            if translations_content[i] == '{':
                depth += 1
            if translations_content[i] == '}':
                depth -= 1
            if depth == 0:
                end = i
                break
        
        namespaces.append((namespace, start, end))
    
    # Extract keys from each namespace
    for namespace, start, end in namespaces:
        ns_content = translations_content[start:end]
        
        # Extract direct keys (not nested)
        key_pattern = r"(['\"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`"
        for match in re.finditer(key_pattern, ns_content):
            key_name = match.group(2)
            value = match.group(3)
            value = unescape_value(value)
            
            # Check if this is followed by a nested object
            after_key = ns_content[match.end():].strip()
            if after_key.startswith('{'):
                continue  # Skip nested objects for now
            
            full_key = f"{namespace}.{key_name}"
            translations[full_key] = value
        
        # Handle nested namespaces (e.g., admin.ban.noPermission)
        nested_pattern = r"(['\"]?)([\w.]+)\1:\s*\{"
        for match in re.finditer(nested_pattern, ns_content):
            sub_namespace = match.group(2)
            nested_start = match.end()
            
            # Find matching closing brace
            nested_depth = 1
            nested_end = nested_start
            for i in range(nested_start, len(ns_content)):
                if ns_content[i] == '{':
                    nested_depth += 1
                if ns_content[i] == '}':
                    nested_depth -= 1
                if nested_depth == 0:
                    nested_end = i
                    break
            
            if nested_end > nested_start:
                nested_content = ns_content[nested_start:nested_end]
                
                # Extract keys from nested namespace
                nested_key_pattern = r"(['\"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`"
                for nested_match in re.finditer(nested_key_pattern, nested_content):
                    key_name = nested_match.group(2)
                    value = nested_match.group(3)
                    value = unescape_value(value)
                    
                    full_key = f"{namespace}.{sub_namespace}.{key_name}"
                    translations[full_key] = value
    
    return translations

def update_csv(csv_path: str, translations: dict):
    """Update CSV with missing translations"""
    # Read CSV
    rows = []
    header = None
    updated_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) == 0:
                continue
            
            key = row[0].strip('"')
            zh_tw_index = header.index('zh-TW') if 'zh-TW' in header else 1
            
            # Check if translation is missing
            if len(row) > zh_tw_index and row[zh_tw_index] in ['[需要从 zh-TW.ts 获取翻译]', '']:
                if key in translations:
                    row[zh_tw_index] = translations[key]
                    updated_count += 1
                    print(f"✅ Updated: {key}")
            
            rows.append(row)
    
    # Write updated CSV
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    
    print(f"\n✅ Updated {updated_count} translations in CSV")

if __name__ == '__main__':
    base_dir = Path(__file__).parent.parent
    
    zh_tw_path = base_dir / 'src' / 'i18n' / 'locales' / 'zh-TW.ts'
    csv_path = base_dir / 'i18n_for_translation.csv'
    
    print("📖 Extracting translations from zh-TW.ts...")
    translations = extract_translations_from_zh_tw(str(zh_tw_path))
    print(f"✅ Extracted {len(translations)} translations")
    
    print(f"\n📝 Updating CSV: {csv_path}")
    update_csv(str(csv_path), translations)
    
    print("\n✅ Done!")

