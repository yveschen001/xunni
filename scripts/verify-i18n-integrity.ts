import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

// Helper to extract all values from a nested object
function getAllValues(obj: any, prefix = ''): Map<string, string> {
  const values = new Map<string, string>();
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const childValues = getAllValues(obj[key], prefix ? `${prefix}.${key}` : key);
      childValues.forEach((val, k) => values.set(k, val));
    } else if (typeof obj[key] === 'string') {
      values.set(prefix ? `${prefix}.${key}` : key, obj[key]);
    }
  }
  
  return values;
}

// Check for variable placeholders like {name}, {count}, etc.
function getPlaceholders(text: string): string[] {
  const matches = text.match(/\{[^}]+\}/g);
  return matches ? matches.sort() : [];
}

// Check for Markdown syntax (basic check)
function getMarkdownFeatures(text: string): string[] {
  const features: string[] = [];
  if (/\*\*.+\*\*/.test(text)) features.push('bold');
  if (/__.+__/.test(text)) features.push('italic');
  if (/\[.+\]\(.+\)/.test(text)) features.push('link');
  if (/`.+`/.test(text)) features.push('code');
  return features.sort();
}

async function verifyIntegrity(originalPath: string, newPath: string) {
  console.log(`🔍 Verifying integrity between:\n  Original: ${originalPath}\n  New: ${newPath}`);

  try {
    // Dynamic import to get the objects
    const originalModule = await import(originalPath);
    const newModule = await import(newPath);

    // Assuming the export is named 'translations' or default
    const original = originalModule.translations || originalModule.default;
    const current = newModule.translations || newModule.default;

    if (!original || !current) {
      throw new Error('Could not find translations object in one of the files.');
    }

    // 1. Deep Equality Check
    try {
      assert.deepStrictEqual(original, current);
      console.log('✅ Deep Strict Equality Check Passed');
    } catch (e) {
      console.error('❌ Deep Strict Equality Check Failed!');
      throw e;
    }

    // 2. Content Analysis
    const originalValues = getAllValues(original);
    const newValues = getAllValues(current);

    if (originalValues.size !== newValues.size) {
      throw new Error(`Key count mismatch! Original: ${originalValues.size}, New: ${newValues.size}`);
    }

    let errors = 0;

    for (const [key, originalVal] of originalValues) {
      const newVal = newValues.get(key);
      
      if (newVal === undefined) {
        console.error(`❌ Key missing in new version: ${key}`);
        errors++;
        continue;
      }

      // Check Placeholders
      const originalPlaceholders = getPlaceholders(originalVal);
      const newPlaceholders = getPlaceholders(newVal);
      if (JSON.stringify(originalPlaceholders) !== JSON.stringify(newPlaceholders)) {
         console.error(`❌ Placeholders mismatch for ${key}:\n  Original: ${originalPlaceholders}\n  New: ${newPlaceholders}`);
         errors++;
      }

      // Check Markdown
      const originalMarkdown = getMarkdownFeatures(originalVal);
      const newMarkdown = getMarkdownFeatures(newVal);
      if (JSON.stringify(originalMarkdown) !== JSON.stringify(newMarkdown)) {
         console.error(`❌ Markdown mismatch for ${key}`);
         errors++;
      }

      // Check Emoji (Basic presence check - integrity is covered by deepStrictEqual, this is just detailed reporting if equality fails)
      // Since we already passed deepStrictEqual, strictly speaking these checks are redundant for equality, 
      // but they are useful if we skip deepStrictEqual during development or partial checks.
    }

    if (errors > 0) {
      throw new Error(`Found ${errors} integrity issues.`);
    }

    console.log('✅ All Integrity Checks Passed!');
    return true;

  } catch (error) {
    console.error('💥 Verification Failed:', error);
    process.exit(1);
  }
}

// CLI usage
const args = process.argv.slice(2);
if (args.length === 2) {
  const [orig, newFile] = args;
  verifyIntegrity(path.resolve(orig), path.resolve(newFile));
} else {
  console.log('Usage: tsx scripts/verify-i18n-integrity.ts <original_file> <new_index_file>');
}

