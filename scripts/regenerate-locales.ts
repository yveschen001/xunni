import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = 'src/i18n/locales';

interface KeyStructure {
  fullPath: string;
  key: string;
  value: string;
  path: string[];
  indent: number;
}

/**
 * Find the closing backtick position in a string starting from a given index.
 * Handles escaped backslashes and backticks.
 * Returns -1 if not found.
 */
function findClosingBacktick(str: string, startIndex: number): number {
  let i = startIndex;
  while (i < str.length) {
    if (str[i] === '\\') {
      i += 2; // Skip escape sequence
      continue;
    }
    if (str[i] === '`') {
      return i;
    }
    i++;
  }
  return -1;
}

/**
 * Extract all keys with their structure from a file
 * Handles both single-line and multi-line strings
 */
function extractKeys(filePath: string): Map<string, string> {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys = new Map<string, string>();
  
  let currentPath: string[] = [];
  let inTranslations = false;
  let inMultiLineString = false;
  let currentMultiLineKey = '';
  let currentMultiLineValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // If inside multi-line string, capture content
    if (inMultiLineString) {
      const closingBacktick = findClosingBacktick(line, 0);
      if (closingBacktick !== -1) {
        // Found end of string
        currentMultiLineValue += '\n' + line.substring(0, closingBacktick);
        keys.set(currentMultiLineKey, currentMultiLineValue);
        inMultiLineString = false;
        currentMultiLineKey = '';
        currentMultiLineValue = '';
      } else {
        currentMultiLineValue += '\n' + line;
      }
      continue;
    }

    if (line.trim() === '') continue;

    const indent = (line.match(/^(\s*)/)?.[1].length || 0) / 2;

    if (line.includes('export const translations')) {
      inTranslations = true;
      continue;
    }

    if (!inTranslations) continue;

    // Reset path based on indent
    currentPath = currentPath.slice(0, Math.max(0, indent - 1));

    // Check for object start
    const objMatch = line.match(/^(\s*)(\w+):\s*\{/);
    if (objMatch) {
      currentPath.push(objMatch[2]);
      continue;
    }

    // Check for key-value pair start
    const kvMatchStart = line.match(/^(\s*)(\w+):\s*`/);
    if (kvMatchStart) {
      const key = kvMatchStart[2];
      const fullPath = currentPath.length > 0 ? `${currentPath.join('.')}.${key}` : key;
      
      const firstBacktick = line.indexOf('`');
      const closingBacktick = findClosingBacktick(line, firstBacktick + 1);
      
      if (closingBacktick !== -1) {
        // Single line (or at least closes on same line)
        const value = line.substring(firstBacktick + 1, closingBacktick);
        keys.set(fullPath, value);
      } else {
        // Multi-line start
        inMultiLineString = true;
        currentMultiLineKey = fullPath;
        currentMultiLineValue = line.substring(firstBacktick + 1);
      }
    }
  }

  return keys;
}

/**
 * Extract structure from Reference file
 */
function extractStructure(filePath: string): { keys: KeyStructure[]; header: string } {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const keys: KeyStructure[] = [];
    let header = '';
    
    let currentPath: string[] = [];
    let inTranslations = false;
    let inMultiLineString = false;
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (inMultiLineString) {
          const closingBacktick = findClosingBacktick(line, 0);
          if (closingBacktick !== -1) {
              inMultiLineString = false;
          }
          continue;
      }
      
      if (line.trim() === '') continue;

      const indent = (line.match(/^(\s*)/)?.[1].length || 0) / 2;
  
      if (!inTranslations) {
          if (line.includes('export const translations')) {
            inTranslations = true;
            header += line + '\n';
          } else {
            header += line + '\n';
          }
          continue;
      }
  
      // Reset path based on indent
      currentPath = currentPath.slice(0, Math.max(0, indent - 1));
  
      // Check for object start
      const objMatch = line.match(/^(\s*)(\w+):\s*\{/);
      if (objMatch) {
        currentPath.push(objMatch[2]);
        keys.push({
            fullPath: currentPath.join('.'),
            key: objMatch[2],
            value: '{OBJECT_START}',
            path: [...currentPath],
            indent: indent
        });
        continue;
      }

      // Check for object end
      if (line.match(/^\s*\},?\s*$/)) {
          continue;
      }
  
      // Check for key-value pair
      const kvMatchStart = line.match(/^(\s*)(\w+):\s*`/);
      if (kvMatchStart) {
        const key = kvMatchStart[2];
        const fullPath = currentPath.length > 0 ? `${currentPath.join('.')}.${key}` : key;
        
        const firstBacktick = line.indexOf('`');
        const closingBacktick = findClosingBacktick(line, firstBacktick + 1);
        
        let value = '';
        
        if (closingBacktick !== -1) {
            value = line.substring(firstBacktick + 1, closingBacktick);
        } else {
            inMultiLineString = true;
            value = line.substring(firstBacktick + 1);
        }
        
        keys.push({
          fullPath,
          key,
          value, 
          path: [...currentPath],
          indent: indent
        });
      }
    }
    
    return { keys, header };
}

function generateContent(structure: KeyStructure[], values: Map<string, string>): string {
    let content = `import type { Translations } from '../types';

export const translations: Translations = {
`;
    
    let currentPath: string[] = [];
    
    for (const item of structure) {
        const itemPath = item.value === '{OBJECT_START}' ? item.path.slice(0, -1) : item.path;
        
        // Close braces if needed
        while (currentPath.length > itemPath.length) {
            const indent = '  '.repeat(currentPath.length);
            content += `${indent}},\n`;
            currentPath.pop();
        }
        while (currentPath.length > 0 && itemPath.length > 0 && currentPath[currentPath.length - 1] !== itemPath[currentPath.length - 1]) {
             const indent = '  '.repeat(currentPath.length);
             content += `${indent}},\n`;
             currentPath.pop();
        }
        
        const indentStr = '  '.repeat(item.indent + 1);
        
        if (item.value === '{OBJECT_START}') {
            content += `${indentStr}${item.key}: {\n`;
            currentPath.push(item.key);
        } else {
            const val = values.get(item.fullPath) || '[需要翻译]';
            content += `${indentStr}${item.key}: \`${val}\`,\n`;
        }
    }
    
    while (currentPath.length > 0) {
        const indent = '  '.repeat(currentPath.length);
        content += `${indent}},\n`;
        currentPath.pop();
    }
    
    content += '};\n';
    return content;
}

function main() {
    const zhTwPath = join(LOCALES_DIR, 'zh-TW.ts');
    const { keys: structure } = extractStructure(zhTwPath);
    
    const files = readdirSync(LOCALES_DIR);
    for (const file of files) {
        if (file === 'zh-TW.ts' || !file.endsWith('.ts')) continue;
        
        console.log(`Regenerating ${file}...`);
        const filePath = join(LOCALES_DIR, file);
        const values = extractKeys(filePath);
        
        const newContent = generateContent(structure, values);
        writeFileSync(filePath, newContent);
    }
    console.log('Done!');
}

main();

