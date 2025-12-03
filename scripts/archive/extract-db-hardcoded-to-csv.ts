/**
 * Extract database hardcoded strings to CSV
 * Reads SQL migration files and extracts hardcoded Chinese strings
 * Adds them to i18n_for_translation.csv with proper i18n keys
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

// All 34 languages
const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr',
  'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he',
  'fa', 'ur', 'sw', 'ro'
];

interface Task {
  id: string;
  name: string;
  description: string;
}

function escapeCSV(value: string): string {
  if (!value) return '';
  value = value.replace(/\n/g, '\\n');
  value = value.replace(/"/g, '""');
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value}"`;
  }
  return value;
}

async function main() {
  console.log('📥 Reading tasks table SQL...');
  
  // Read tasks table SQL
  const sqlPath = join(process.cwd(), 'src', 'db', 'migrations', '0030_create_tasks_table.sql');
  const sqlContent = readFileSync(sqlPath, 'utf-8');
  
  // Extract tasks - handle multiple INSERT statements and multi-line VALUES
  const tasks: Task[] = [];
  
  // Split by lines and process
  const lines = sqlContent.split('\n');
  let inInsert = false;
  let currentValues: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Start of INSERT statement
    if (trimmed.startsWith('INSERT INTO tasks')) {
      inInsert = true;
      currentValues = [];
    }
    
    if (inInsert) {
      // Match VALUES (...) on same line
      const sameLineMatch = trimmed.match(/VALUES\s*\(([^)]+)\)/);
      if (sameLineMatch) {
        const valuesStr = sameLineMatch[1];
        const values = parseValues(valuesStr);
        if (values.length >= 4) {
          tasks.push({
            id: values[0],
            name: values[2],
            description: values[3]
          });
        }
      }
      
      // Match standalone (...) lines (multi-line VALUES)
      const standaloneMatch = trimmed.match(/^\(([^)]+)\)/);
      if (standaloneMatch) {
        const valuesStr = standaloneMatch[1];
        const values = parseValues(valuesStr);
        if (values.length >= 4) {
          tasks.push({
            id: values[0],
            name: values[2],
            description: values[3]
          });
        }
      }
      
      // End of INSERT statement
      if (trimmed.endsWith(';')) {
        inInsert = false;
      }
    }
  }
  
  // Helper function to parse VALUES string
  function parseValues(valuesStr: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i];
      if (char === "'" && (i === 0 || valuesStr[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current) values.push(current.trim());
    
    // Remove quotes
    return values.map(v => v.replace(/^'|'$/g, ''));
  }
  
  console.log(`✅ Found ${tasks.length} tasks in database`);
  
  // Read existing CSV
  console.log('📥 Reading existing CSV...');
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Array<Record<string, string>>;
  
  console.log(`✅ Loaded ${records.length} existing keys from CSV`);
  
  // Check which tasks are already in CSV
  const existingKeys = new Set(records.map(r => r.key));
  const newKeys: Array<{ key: string; value: string }> = [];
  
  for (const task of tasks) {
    // Generate i18n keys
    const taskId = task.id.replace('task_', '');
    const nameKey = `tasks.name.${taskId}`;
    const descKey = `tasks.description.${taskId}`;
    
    // Add name key if not exists
    if (!existingKeys.has(nameKey)) {
      newKeys.push({ key: nameKey, value: task.name });
      console.log(`  ➕ Adding: ${nameKey} = "${task.name}"`);
    } else {
      console.log(`  ✓ Already exists: ${nameKey}`);
    }
    
    // Add description key if not exists
    if (!existingKeys.has(descKey)) {
      newKeys.push({ key: descKey, value: task.description });
      console.log(`  ➕ Adding: ${descKey} = "${task.description}"`);
    } else {
      console.log(`  ✓ Already exists: ${descKey}`);
    }
  }
  
  if (newKeys.length === 0) {
    console.log('\n✅ All task keys already exist in CSV!');
    return;
  }
  
  console.log(`\n📝 Adding ${newKeys.length} new keys to CSV...`);
  
  // Add new keys to records
  for (const { key, value } of newKeys) {
    const row: Record<string, string> = { key };
    row['zh-TW'] = value;
    // Empty for other languages
    for (const lang of ALL_LANGUAGES.slice(1)) {
      row[lang] = '';
    }
    records.push(row);
  }
  
  // Sort by key
  records.sort((a, b) => a.key.localeCompare(b.key));
  
  // Generate CSV
  const header = `key,${ALL_LANGUAGES.join(',')}`;
  const rows = [header];
  
  for (const record of records) {
    const key = escapeCSV(record.key);
    const values = ALL_LANGUAGES.map(lang => {
      const value = record[lang] || '';
      return escapeCSV(value);
    });
    rows.push(`${key},${values.join(',')}`);
  }
  
  // Write CSV
  writeFileSync(csvPath, rows.join('\n'), 'utf-8');
  
  console.log(`✅ Updated: ${csvPath}`);
  console.log(`   - Added ${newKeys.length} new keys`);
  console.log(`   - Total keys: ${records.length}`);
  console.log('\n🎉 Complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Translate the new keys in CSV');
  console.log('2. Import translations');
  console.log('3. Generate database migration script');
  console.log('4. Execute migration to replace database values with i18n keys');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

