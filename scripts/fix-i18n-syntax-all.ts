
import fs from 'fs';
import path from 'path';

async function fixI18nSyntax() {
  const dir = path.resolve(process.cwd(), 'src/i18n/locales');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts')).map(f => path.join(dir, f));
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    // Regex to match:
    // vip3: `TEXT
    //       KEY: ...
    
    const brokenPattern = /(vip3: `[^`\n]*)(\n\s+[a-zA-Z0-9_]+:)/;
    
    if (content.match(brokenPattern)) {
      console.log(`Fixing ${path.basename(file)}...`);
      
      // Add backtick and comma after vip3 text
      content = content.replace(brokenPattern, '$1`,\n$2'); // Note: $2 contains indentation
      
      // Now clean up the end.
      // The original block ended with:
      //       LAST_KEY: `[需要翻译]`,
      //
      // `,
      
      // After our change, the trailing ` is now unmatched/dangling.
      // It looks like:
      //       LAST_KEY: `[需要翻译]`,
      //
      // `,
      
      // We need to remove the last backtick.
      // Pattern: `,\n\n`,
      // Replace with `,`
      
      content = content.replace(/`,\n\n`,\n/, '`,\n');
      
      modified = true;
      fs.writeFileSync(file, content, 'utf-8');
    }
  }
}

fixI18nSyntax().catch(console.error);
