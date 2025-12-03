import os
import re

LOCALES_DIR = 'src/i18n/locales'

def fix_fortune_structure():
    print("Fixing fortune.ts structure...")
    for lang in os.listdir(LOCALES_DIR):
        file_path = os.path.join(LOCALES_DIR, lang, 'fortune.ts')
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check if tarot_ui is inside reports
        # Pattern: reports: { ... tarot_ui: { ... } ... }
        # This is hard to do with regex alone for nested structures.
        # But we know the structure usually looks like:
        #   "reports": {
        #     ...
        #     "tarot_ui": { ... }
        #   }
        
        if '"tarot_ui": {' in content:
            # Check indentation or context
            # If it's inside reports, we need to extract it.
            
            # Simple heuristic: Split by "reports": {
            parts = content.split('"reports": {')
            if len(parts) > 1:
                reports_content = parts[1]
                # If tarot_ui is in the reports part (before the closing brace of reports)
                # But matching closing brace is hard without a parser.
                pass

        # Alternative approach: Use string manipulation based on indentation if standardized
        # standard indentation is 2 or 4 spaces.
        
        # Let's try a safer approach: 
        # 1. Identify if tarot_ui is indented under reports (6 spaces?)
        # 2. Extract the block.
        # 3. Remove it from original location.
        # 4. Append it to the main object.
        
        lines = content.split('\n')
        new_lines = []
        in_reports = False
        in_tarot_ui = False
        tarot_ui_lines = []
        reports_indent = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            indent = len(line) - len(line.lstrip())
            
            if '"reports": {' in line:
                in_reports = True
                reports_indent = indent
                new_lines.append(line)
                continue
                
            if in_reports and '"tarot_ui": {' in line:
                in_tarot_ui = True
                tarot_ui_lines.append(line) # Keep indentation for now, fix later
                continue
                
            if in_tarot_ui:
                tarot_ui_lines.append(line)
                # Check for closing brace of tarot_ui
                if line.strip() == '}' or line.strip() == '},':
                     # Assume strictly formatted, closing brace aligns with start
                     # tarot_ui start indent was reports_indent + 2 (usually)
                     if indent == reports_indent + 2: # Closing of tarot_ui
                         in_tarot_ui = False
                continue
                
            if in_reports:
                # Check for closing of reports
                if indent == reports_indent and (line.strip() == '}' or line.strip() == '},'):
                    in_reports = False
            
            new_lines.append(line)
            
        # If we extracted tarot_ui lines
        if tarot_ui_lines:
            print(f"  Moving tarot_ui in {lang}")
            # Remove comma from last line of tarot_ui if present, as it will be at end
            # Actually, we should check where we insert it.
            
            # Re-indent tarot_ui lines (decrease indent by 2 levels usually)
            # Standard: reports is level 1 (2 spaces), content level 2 (4 spaces).
            # If nested: reports (2), tarot_ui (4), content (6).
            # We want: tarot_ui (2), content (4).
            
            fixed_tarot_lines = []
            for t_line in tarot_ui_lines:
                # Remove 2 spaces of indentation
                fixed_tarot_lines.append(t_line.replace('  ', '', 1))
            
            # Add comma to the closing brace of reports in new_lines if missing?
            # Or add comma to previous last element?
            
            # Actually, simpler way:
            # Just find the closing brace of the export object and insert before it.
            
            # Filter empty lines at the end of new_lines to find the last closing brace
            last_brace_idx = -1
            for i in range(len(new_lines) - 1, -1, -1):
                if new_lines[i].strip().startswith('}'):
                    last_brace_idx = i
                    break
            
            if last_brace_idx != -1:
                # Ensure previous line has a comma
                prev_idx = last_brace_idx - 1
                while prev_idx >= 0 and not new_lines[prev_idx].strip():
                    prev_idx -= 1
                
                if not new_lines[prev_idx].strip().endswith(',') and not new_lines[prev_idx].strip().endswith('{'):
                     new_lines[prev_idx] = new_lines[prev_idx].rstrip() + ','
                
                # Insert tarot lines
                # Ensure the last line of tarot doesn't have a comma if it's last? 
                # But usually safer to have trailing comma or strict JSON-like? 
                # TS allows trailing comma.
                
                # Insert before last brace
                new_lines[last_brace_idx:last_brace_idx] = fixed_tarot_lines
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(new_lines))

def fix_settings_keys():
    print("Fixing settings.ts keys...")
    for lang in os.listdir(LOCALES_DIR):
        file_path = os.path.join(LOCALES_DIR, lang, 'settings.ts')
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if '"quietHoursVipOnly":' not in content:
            print(f"  Adding quietHoursVipOnly to {lang}")
            # Add keys before the last closing brace
            # Keys to add:
            # "quietHoursVipOnly": "🔒 Quiet Hours (VIP Only)",
            # "upgradeForQuietHours": "Upgrade to VIP to use this feature",
            
            # We will use English/default placeholders if not zh-TW/ja
            if lang == 'zh-TW':
                val1 = "🔒 安靜時段 (VIP 專屬)"
                val2 = "升級 VIP 以使用此功能" # Assuming value
            elif lang == 'ja':
                 # Already fixed manually, but good to ensure
                val1 = "🔒 静かな時間 (VIP限定)"
                val2 = "この機能を使用するにはVIPにアップグレードしてください"
            else:
                val1 = "🔒 Quiet Hours (VIP Only)"
                val2 = "Upgrade to VIP to use this feature"
                
            lines = content.split('\n')
            last_brace_idx = -1
            for i in range(len(lines) - 1, -1, -1):
                if lines[i].strip().startswith('}'):
                    last_brace_idx = i
                    break
            
            if last_brace_idx != -1:
                # Ensure previous line has comma
                prev_idx = last_brace_idx - 1
                while prev_idx >= 0 and not lines[prev_idx].strip():
                    prev_idx -= 1
                
                if not lines[prev_idx].strip().endswith(',') and not lines[prev_idx].strip().endswith('{'):
                     lines[prev_idx] = lines[prev_idx].rstrip() + ','
                
                new_entries = [
                    f'  "quietHoursVipOnly": "{val1}",',
                    f'  "upgradeForQuietHours": "{val2}"'
                ]
                
                # Insert before last brace (leaving the last one without comma is fine in TS, 
                # but if we add multiple, the first needs comma if previous had one... wait.
                # If we append, we ensure previous has comma.
                # The last added one (upgradeForQuietHours) can be without comma if strict JSON, 
                # but TS allows it. I'll omit comma on last one to be safe if next line is brace.
                
                lines[last_brace_idx:last_brace_idx] = new_entries
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(lines))

if __name__ == '__main__':
    fix_fortune_structure()
    fix_settings_keys()

