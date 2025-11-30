
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localePath = path.join(__dirname, '../src/i18n/locales/zh-TW.ts');

function checkFile() {
  const content = fs.readFileSync(localePath, 'utf-8');
  
  // Regex for forbidden patterns in values
  // We look for "key": "value" patterns
  const lines = content.split('\n');
  let errors = 0;

  console.log('🔍 Scanning i18n file for forbidden raw code patterns...');

  lines.forEach((line, index) => {
    // Simple heuristic: check if line has a key-value pair
    if (!line.includes(': "')) return;

    const parts = line.split(': "');
    if (parts.length < 2) return;
    
    // Get content inside quotes (rough check)
    const value = parts[1]; 

    // 1. Check for function calls inside template
    if (value.match(/\$\{[^}]*\(/)) {
      console.error(`❌ Line ${index + 1}: Function call in template: ${line.trim()}`);
      errors++;
    }

    // 2. Check for new Date
    if (value.includes('new Date')) {
      console.error(`❌ Line ${index + 1}: 'new Date' usage: ${line.trim()}`);
      errors++;
    }

    // 3. Check for Math.
    if (value.includes('Math.')) {
      console.error(`❌ Line ${index + 1}: 'Math.' usage: ${line.trim()}`);
      errors++;
    }

    // 4. Check for Ternary (simple check)
    // Matches ${ ... ? ... : ... }
    if (value.match(/\$\{[^}]*\?.*:.*[^}]*\}/)) {
      console.error(`❌ Line ${index + 1}: Ternary operator: ${line.trim()}`);
      errors++;
    }

    // 5. Check for .length
    if (value.includes('.length')) {
      console.error(`❌ Line ${index + 1}: '.length' property access: ${line.trim()}`);
      errors++;
    }
    
    // 6. Check for .join(
    if (value.includes('.join(')) {
      console.error(`❌ Line ${index + 1}: '.join(' usage: ${line.trim()}`);
      errors++;
    }
    
    // 7. Check for .map(
    if (value.includes('.map(')) {
      console.error(`❌ Line ${index + 1}: '.map(' usage: ${line.trim()}`);
      errors++;
    }
  });

  if (errors > 0) {
    console.error(`\n🚨 Found ${errors} potential errors in i18n file.`);
    process.exit(1);
  } else {
    console.log('✅ No obvious raw code patterns found.');
  }
}

checkFile();
