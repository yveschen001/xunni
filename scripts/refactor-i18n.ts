import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

// JavaScript Reserved Words that cannot be used as variable names
const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import',
  'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'implements', 'interface', 'let',
  'package', 'private', 'protected', 'public', 'static', 'await', 'async'
]);

// Helper to determine module name for a key
function getModuleName(key: string, value: any): string {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return key; // Top-level object becomes a module
  }
  return 'misc'; // Top-level string becomes part of misc
}

async function refactorLocale(lang: string) {
  const sourceFile = path.join(LOCALES_DIR, `${lang}.ts`);
  const targetDir = path.join(LOCALES_DIR, lang);
  
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    return;
  }

  console.log(`🚀 Refactoring ${lang}...`);

  // 1. Import source
  const module = await import(sourceFile);
  const translations = module.translations || module.default;

  if (!translations) {
    console.error(`❌ Could not find translations in ${sourceFile}`);
    return;
  }

  // 2. Prepare target directory
  if (fs.existsSync(targetDir)) {
    console.log(`  ⚠️ Target directory ${targetDir} already exists. Cleaning up...`);
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // 3. Split content
  const modules: Record<string, any> = {};
  const imports: string[] = [];
  const exportAssignments: string[] = [];

  for (const key of Object.keys(translations)) {
    const value = translations[key];
    const moduleName = getModuleName(key, value);

    if (!modules[moduleName]) {
      modules[moduleName] = {};
    }

    if (moduleName === 'misc') {
      modules[moduleName][key] = value;
    } else {
      modules[moduleName] = value;
    }
  }

  // 4. Write module files
  for (const [modName, content] of Object.entries(modules)) {
    const filePath = path.join(targetDir, `${modName}.ts`);
    const fileContent = `export default ${JSON.stringify(content, null, 2)};\n`;
    fs.writeFileSync(filePath, fileContent);
    console.log(`  ✅ Created ${modName}.ts`);

    if (modName === 'misc') {
      imports.push(`import misc from './misc';`);
    } else {
      // Handle reserved words
      let varName = modName;
      if (RESERVED_WORDS.has(modName)) {
        varName = `${modName}_module`;
      }
      
      imports.push(`import ${varName} from './${modName}';`);
      
      if (varName !== modName) {
        exportAssignments.push(`  "${modName}": ${varName},`);
      } else {
        exportAssignments.push(`  ${modName},`);
      }
    }
  }

  // 5. Generate index.ts
  const indexContent = [
    imports.join('\n'),
    '',
    'export const translations = {',
    modules['misc'] ? '  ...misc,' : '',
    exportAssignments.join('\n'),
    '};',
    ''
  ].join('\n');

  fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);
  console.log(`  ✅ Created index.ts`);
  
  console.log(`🎉 Refactor complete for ${lang}!`);
}

// CLI
const langArg = process.argv[2];
if (langArg) {
  refactorLocale(langArg);
} else {
  console.log('Usage: tsx scripts/refactor-i18n.ts <lang_code>');
}
