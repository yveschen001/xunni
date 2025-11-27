
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/ar.ts');

try {
  let content = readFileSync(filePath, 'utf8');

  // Fix the specific known error:
  // appeal: `معرّف الاستئناف: ${appeal.id,
  // appeal2: `...
  
  // We use a regex to capture the broken line and the next line start
  // Note: the regex needs to be precise.
  
  // Pattern: appeal: `... ${appeal.id,
  // We want to change it to appeal: `... ${appeal.id}`,
  
  const brokenPattern = /(appeal:\s*`[^`]*\$\{appeal\.id),\s*(\n\s*appeal2:)/;
  
  if (brokenPattern.test(content)) {
    content = content.replace(brokenPattern, '$1}`,$2');
    writeFileSync(filePath, content);
    console.log('✅ Successfully patched ar.ts');
  } else {
    console.log('⚠️ Pattern not found in ar.ts. It might be different or already fixed.');
    // Try a more generic fix for the syntax error "Expected } but found 💡"
    // This happens when a template literal is not closed.
    // Look for lines that contain `${` but no `}` and are followed by a newline and another key.
    
    // Actually, looking at the debug output:
    // 100:     appeal: `معرّف الاستئناف: ${appeal.id,
    
    const lines = content.split('\n');
    let fixed = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('appeal: `') && lines[i].includes('${appeal.id,')) {
        lines[i] = lines[i].replace('${appeal.id,', '${appeal.id}`,' );
        fixed = true;
        console.log(`Fixed line ${i+1}: ${lines[i]}`);
      }
    }
    
    if (fixed) {
      writeFileSync(filePath, lines.join('\n'));
      console.log('✅ Successfully patched ar.ts via line iteration');
    } else {
      console.error('❌ Could not find the error line to fix.');
    }
  }
} catch (e) {
  console.error('Error fixing ar.ts:', e);
}

