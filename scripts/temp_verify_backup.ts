
import * as fs from 'fs';
import * as path from 'path';
import { exit } from 'process';
import { createI18n } from '../src/i18n';
// Import using require to avoid type issues with ts-node if needed, or just standard import
// We need to load the actual keys. The best way is to load the zh-TW object.
// Since we are in scripts/, we need to point to src/
import { translations as zhTwTranslations } from '../src/i18n/locales/zh-TW/index';

// Configuration
const SRC_DIR = path.join(process.cwd(), 'src');
const IGNORE_PATTERNS = [
    'src/i18n/locales', // Don't check locale definition files
    '**/*.test.ts',     // Ignore tests
    '**/*.spec.ts'
];

// Helper to recursively get files
function getFiles(dir: string): string[] {
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map((subdir) => {
        const res = path.resolve(dir, subdir);
        return (fs.statSync(res).isDirectory()) ? getFiles(res) : res;
    });
    return files.reduce((a, f) => a.concat(f), []);
}

// Helper to check if file should be ignored
function shouldIgnore(filePath: string): boolean {
    const relativePath = path.relative(process.cwd(), filePath);
    for (const pattern of IGNORE_PATTERNS) {
        if (relativePath.includes(pattern.replace('**', ''))) {
            return true;
        }
    }
    return false;
}

// Flatten keys from an object (e.g. { fortune: { love: "..." } } -> "fortune.love")
function flattenKeys(obj: any, prefix = ''): Set<string> {
    let keys = new Set<string>();
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nestedKeys = flattenKeys(obj[key], prefix + key + '.');
            nestedKeys.forEach(k => keys.add(k));
        } else {
            keys.add(prefix + key);
        }
    }
    return keys;
}

async function main() {
    console.log('🔍 Starting Static Analysis for i18n Key References...');

    // 1. Load valid keys from zh-TW (Source of Truth)
    // zhTwTranslations is likely the default export or named export. 
    // In src/i18n/locales/zh-TW/index.ts, it exports { ... } as default or named?
    // Let's assume the import above works (we might need to adjust based on structure)
    // If zhTwTranslations is undefined, we might need to verify the import.
    
    // We'll reconstruct the full object if the import isn't a single object
    // But typically src/i18n/locales/zh-TW/index.ts exports the full object.
    
    // Let's debug the import structure if needed.
    const validKeys = flattenKeys(zhTwTranslations);
    console.log(`📚 Loaded ${validKeys.size} valid keys from zh-TW.`);

    // 2. Scan Codebase
    const allFiles = getFiles(SRC_DIR);
    const tsFiles = allFiles.filter(f => f.endsWith('.ts') && !shouldIgnore(f));
    
    console.log(`📂 Scanning ${tsFiles.length} TypeScript files...`);

    let missingKeysCount = 0;
    const errors: string[] = [];

    // Regex to find i18n.t('key') or t('key')
    // Captures single or double quoted strings inside t() or i18n.t()
    // Limitation: Won't catch dynamic keys like `fortune.${type}`
    const regex = /(?:i18n\.t|[^a-zA-Z]t)\(\s*['"]([\w\.-]+)['"]/g;

    for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            const key = match[1];
            
            // Skip dynamic keys or variables (basic heuristic)
            if (key.includes('${') || key.includes(' + ')) {
                continue; 
            }

            if (!validKeys.has(key)) {
                const relativePath = path.relative(process.cwd(), file);
                const lineNo = content.substring(0, match.index).split('\n').length;
                errors.push(`❌ Missing Key: "${key}" in ${relativePath}:${lineNo}`);
                missingKeysCount++;
            }
        }
    }

    // 3. Report
    if (missingKeysCount > 0) {
        console.error('\n💥 FOUND MISSING KEYS IN CODE REFERENCES:');
        errors.forEach(e => console.error(e));
        console.error(`\nTotal ${missingKeysCount} missing key references found.`);
        console.error('👉 Please add these keys to src/i18n/locales/zh-TW/*.ts and run pnpm i18n:sync');
        exit(1);
    } else {
        console.log('✅ No missing static key references found.');
        exit(0);
    }
}

main().catch(err => {
    console.error('Fatal Error:', err);
    exit(1);
});

