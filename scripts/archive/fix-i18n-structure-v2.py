import os

LOCALES_DIR = 'src/i18n/locales'

def fix_fortune_structure():
    print("Fixing fortune.ts structure...")
    for lang in os.listdir(LOCALES_DIR):
        file_path = os.path.join(LOCALES_DIR, lang, 'fortune.ts')
        if not os.path.exists(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Find tarot_ui block
        tarot_start_idx = -1
        tarot_end_idx = -1
        tarot_indent = 0
        
        for i, line in enumerate(lines):
            if '"tarot_ui": {' in line:
                indent = len(line) - len(line.lstrip())
                if indent > 2: # Nested
                    tarot_start_idx = i
                    tarot_indent = indent
                    break
        
        if tarot_start_idx != -1:
            # Find end of block
            for i in range(tarot_start_idx, len(lines)):
                line = lines[i]
                indent = len(line) - len(line.lstrip())
                if indent == tarot_indent and ('}' in line or '},' in line):
                     # Check if it matches start indent
                     tarot_end_idx = i
                     break
            
            if tarot_end_idx != -1:
                print(f"  Moving nested tarot_ui in {lang} (lines {tarot_start_idx}-{tarot_end_idx})")
                
                # Extract lines
                tarot_lines = lines[tarot_start_idx : tarot_end_idx + 1]
                
                # Remove from original location
                # We need to be careful about indices shifting if we modify list, but we can just rebuild it.
                
                # De-indent
                fixed_tarot_lines = []
                indent_diff = tarot_indent - 2
                for t_line in tarot_lines:
                    fixed_tarot_lines.append(t_line[indent_diff:]) # Remove extra spaces
                
                # Check for comma on the last line of extracted block
                if fixed_tarot_lines[-1].strip().endswith(','):
                     fixed_tarot_lines[-1] = fixed_tarot_lines[-1].rstrip().rstrip(',') + '\n' # Remove comma for now
                
                # Remove lines from original
                # Note: slice assignment
                del lines[tarot_start_idx : tarot_end_idx + 1]
                
                # Insert at the end, before last closing brace
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
                         lines[prev_idx] = lines[prev_idx].rstrip() + ',\n'
                    
                    # Insert tarot lines
                    # The fixed tarot lines need to ensure comma logic if we were inserting in middle, 
                    # but at end (before closing brace), the last item usually doesn't need comma.
                    
                    lines[last_brace_idx:last_brace_idx] = fixed_tarot_lines
                    
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(''.join(lines))

if __name__ == '__main__':
    fix_fortune_structure()

