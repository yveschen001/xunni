import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
// Namespace binding name in wrangler.toml is usually "CACHE" or we use the ID directly if needed.
// For `wrangler kv:key put`, we need the `--binding` or `--namespace-id`.
// Let's assume we use `--binding CACHE` if run via `wrangler exec` or just upload to preview/production KV directly.
// Easier way: Use `wrangler kv:key put --binding=CACHE` might not work directly in shell without script context.
// Standard way: `wrangler kv:key put <key> <value> --namespace-id <id>` or `--binding <name>` inside a worker context?
// No, `wrangler kv:key put` takes a namespace ID locally.

// We need to parse wrangler.toml to get the namespace ID for "CACHE".
// Or user can provide it.
// Let's try to auto-detect from wrangler.toml

function getKvNamespaceId(env: string = 'production'): string | null {
  try {
    const wranglerContent = fs.readFileSync(path.resolve(__dirname, '../wrangler.toml'), 'utf-8');
    // Simple regex to find kv_namespaces
    // This is a bit heuristic.
    // [[kv_namespaces]]
    // binding = "CACHE"
    // id = "..."
    
    // We need to handle environments too. 
    // Usually 'staging' overrides the id.
    
    // Let's look for the block.
    const lines = wranglerContent.split('\n');
    let currentBinding = '';
    let foundId = '';
    
    // Very basic parser
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('binding = "CACHE"')) {
        // Look ahead for id
        for (let j = i + 1; j < lines.length; j++) {
           const nextLine = lines[j].trim();
           if (nextLine.startsWith('id =')) {
             foundId = nextLine.split('=')[1].trim().replace(/"/g, '');
             // If we are looking for production (default), this might be it if it's top level.
             // But if we are in [env.staging], we need to be careful.
             break;
           }
           if (nextLine.startsWith('[')) break; // New section
        }
      }
    }
    
    // Better approach: Let user pass the ID or rely on wrangler's environment handling if we run this via a worker script?
    // No, this is a local maintenance script.
    
    // Let's try to use `wrangler kv:namespace list` to get the ID.
    const listOutput = execSync('npx wrangler kv:namespace list', { encoding: 'utf-8' });
    const namespaces = JSON.parse(listOutput);
    
    // Look for a namespace that looks like "xunni-bot-staging-CACHE" or just "CACHE" depending on setup
    // Our binding is "CACHE".
    
    // Filter logic:
    // If env is staging, look for title containing "staging" and "CACHE" (or whatever wrangler auto-generated)
    // Or just look for the ID we saw in deployment logs: "8222fd298f254b498b7842d03e5d2a4d" (from user logs)
    
    const targetTitle = env === 'staging' ? 'xunni-bot-staging-CACHE' : 'xunni-bot-CACHE';
    const ns = namespaces.find((n: any) => n.title.includes(targetTitle) || n.title === `CACHE-${env}`);
    
    if (ns) return ns.id;
    
    // Fallback: Try to match just "CACHE" if strict match failed
    const fallbackNs = namespaces.find((n: any) => n.title.includes('CACHE'));
    if (fallbackNs) {
        console.warn(`⚠️ Ambiguous namespace match. Using: ${fallbackNs.title} (${fallbackNs.id})`);
        return fallbackNs.id;
    }
    
    return null;
  } catch (e) {
    console.error('Error finding KV ID:', e);
    return null;
  }
}

async function main() {
  const env = process.argv[2] || 'staging'; // Default to staging
  console.log(`🚀 Starting i18n upload for environment: ${env}`);

  // 1. Get Namespace ID
  // For safety, let's hardcode the IDs we saw in logs if detection fails, or ask user.
  // User log showed: CACHE: 8222fd298f254b498b7842d03e5d2a4d (for staging)
  let namespaceId = '';
  
  if (env === 'staging') {
      // From previous deployment log
      namespaceId = '8222fd298f254b498b7842d03e5d2a4d';
  } else {
      // Try to find for production
      const id = getKvNamespaceId(env);
      if (!id) {
          console.error('❌ Could not find KV Namespace ID for production. Please verify wrangler.toml or kv:namespace list.');
          process.exit(1);
      }
      namespaceId = id;
  }
  
  console.log(`- Target KV ID: ${namespaceId}`);

  // 2. Read all locales
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));
  console.log(`- Found ${files.length} language files.`);

  for (const file of files) {
    const langCode = file.replace('.ts', '');
    const filePath = path.join(LOCALES_DIR, file);
    
    console.log(`Processing ${langCode}...`);
    
    try {
      // Dynamic import to get the object
      // We need to use absolute path for import()
      const module = await import(filePath);
      const translations = module.translations;
      
      if (!translations) {
        console.warn(`  ⚠️ No translations export found in ${file}`);
        continue;
      }
      
      const jsonStr = JSON.stringify(translations);
      const kvKey = `i18n:lang:${langCode}`;
      
      // 3. Upload to KV
      // Use wrangler kv:key put --namespace-id <id> <key> <value>
      // Since value can be large, we might need to pipe it or use a file.
      // Writing to a temp file is safer for shell commands.
      
      const tempFile = path.resolve(__dirname, `../temp_i18n_${langCode}.json`);
      fs.writeFileSync(tempFile, jsonStr);
      
      try {
          execSync(`npx wrangler kv:key put "${kvKey}" --path="${tempFile}" --namespace-id=${namespaceId}`, { stdio: 'inherit' });
          console.log(`  ✅ Uploaded ${langCode} (${jsonStr.length} bytes)`);
      } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }
      
    } catch (e) {
      console.error(`  ❌ Failed to upload ${langCode}:`, e);
    }
  }
  
  console.log('🎉 All uploads completed!');
}

main().catch(console.error);

