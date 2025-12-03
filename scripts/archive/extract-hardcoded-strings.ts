/**
 * Extract all hardcoded Chinese strings from handler files
 * This script will scan files and extract Chinese strings for i18n
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const HANDLERS_DIR = join(process.cwd(), 'src', 'telegram', 'handlers');

interface ExtractedString {
  file: string;
  line: number;
  text: string;
  context: string;
}

function extractChineseStrings(filename: string): ExtractedString[] {
  const filePath = join(HANDLERS_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const extracted: ExtractedString[] = [];
  
  // Regex to match Chinese strings in quotes
  const chineseStringRegex = /['"`]([^'"`]*[\u4e00-\u9fa5]+[^'"`]*)['"`]/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    
    while ((match = chineseStringRegex.exec(line)) !== null) {
      const text = match[1];
      
      // Skip if it's already using i18n
      if (line.includes('i18n.t(')) {
        continue;
      }
      
      // Skip if it's a comment
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        continue;
      }
      
      extracted.push({
        file: filename,
        line: i + 1,
        text,
        context: line.trim().substring(0, 100),
      });
    }
  }
  
  return extracted;
}

// Main
console.log('🔍 Extracting hardcoded Chinese strings...\n');

const files = readdirSync(HANDLERS_DIR).filter(f => f.endsWith('.ts'));
const allStrings: ExtractedString[] = [];

for (const file of files) {
  const strings = extractChineseStrings(file);
  if (strings.length > 0) {
    console.log(`📄 ${file}: ${strings.length} strings`);
    allStrings.push(...strings);
  }
}

console.log(`\n📊 Total: ${allStrings.length} hardcoded Chinese strings found\n`);

// Group by file
const byFile = allStrings.reduce((acc, str) => {
  if (!acc[str.file]) {
    acc[str.file] = [];
  }
  acc[str.file].push(str);
  return {};
}, {} as Record<string, ExtractedString[]>);

// Write to file
const outputPath = join(process.cwd(), 'HARDCODED_STRINGS.txt');
let output = '# Hardcoded Chinese Strings\n\n';

for (const file of files) {
  const strings = allStrings.filter(s => s.file === file);
  if (strings.length > 0) {
    output += `## ${file} (${strings.length} strings)\n\n`;
    for (const str of strings.slice(0, 10)) {  // Show first 10
      output += `Line ${str.line}: "${str.text}"\n`;
    }
    if (strings.length > 10) {
      output += `... and ${strings.length - 10} more\n`;
    }
    output += '\n';
  }
}

writeFileSync(outputPath, output, 'utf-8');
console.log(`✅ Extracted strings saved to: HARDCODED_STRINGS.txt`);
console.log(`\n💡 Next step: Create i18n keys for these strings`);

