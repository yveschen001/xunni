
import * as fs from 'fs';
import * as path from 'path';
import { exit } from 'process';

const LOCALES_DIR = path.join(process.cwd(), 'src/i18n/locales');

function getDirectories(source: string) {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

const locales = getDirectories(LOCALES_DIR);
let hasErrors = false;

console.log(`🛡️  Starting i18n Integrity Check for ${locales.length} locales...`);

locales.forEach(locale => {
    const localePath = path.join(LOCALES_DIR, locale);
    const indexFile = path.join(localePath, 'index.ts');
    
    // Check 1: Zodiac Export
    if (!fs.existsSync(indexFile)) {
        console.error(`❌ [${locale}] Missing index.ts`);
        hasErrors = true;
    } else {
        const content = fs.readFileSync(indexFile, 'utf-8');
        if (!content.includes(`import zodiac from './zodiac';`) && !content.includes(`import zodiac from "./zodiac";`)) {
             // Try stricter check? The previous fix script used single quotes.
             // Let's just check for 'zodiac' in export list to be safe.
        }
        
        // Check export list
        const exportMatch = content.match(/export const translations = \{([\s\S]*?)\};/);
        if (!exportMatch || !exportMatch[1].includes('zodiac,')) {
            console.error(`❌ [${locale}] 'zodiac' module is NOT exported in index.ts`);
            hasErrors = true;
        }
    }

    // Check 2: Bad Variable Patterns in all files
    const files = fs.readdirSync(localePath).filter(f => f.endsWith('.ts'));
    files.forEach(file => {
        const filePath = path.join(localePath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Regex for {fortunemessage ...} or similar machine translation artifacts
        const badVarRegex = /\{fortunemessage [^}]+\}/g;
        let match;
        while ((match = badVarRegex.exec(content)) !== null) {
            console.error(`❌ [${locale}/${file}] Found corrupted variable: "${match[0]}"`);
            hasErrors = true;
        }
        
        // Check for double braces which might indicate syntax error in some contexts, but { } is standard i18n.
        // Check for empty braces {} ? No, that might be valid text.
        
        // Check for missing keys is hard without a reference, skipping for this lightweight check.
    });
});

if (hasErrors) {
    console.error('\n💥 Integrity Check FAILED. Fix the errors above before deploying.');
    exit(1);
} else {
    console.log('✅ Integrity Check Passed. System is clean.');
    exit(0);
}

