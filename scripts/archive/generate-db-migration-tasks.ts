/**
 * Generate database migration script for tasks table
 * Replaces Chinese hardcoded strings with i18n keys
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Task {
  id: string;
  name: string;
  description: string;
}

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

async function main() {
  console.log('📥 Reading tasks table SQL...');
  
  // Read tasks table SQL
  const sqlPath = join(process.cwd(), 'src', 'db', 'migrations', '0030_create_tasks_table.sql');
  const sqlContent = readFileSync(sqlPath, 'utf-8');
  
  // Extract tasks
  const tasks: Task[] = [];
  const lines = sqlContent.split('\n');
  let inInsert = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('INSERT INTO tasks')) {
      inInsert = true;
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
      
      if (trimmed.endsWith(';')) {
        inInsert = false;
      }
    }
  }
  
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
    
    return values.map(v => v.replace(/^'|'$/g, ''));
  }
  
  console.log(`✅ Found ${tasks.length} tasks`);
  
  // Generate migration script
  const migrationNumber = '0050'; // Next available migration number
  const migrationPath = join(process.cwd(), 'src', 'db', 'migrations', `${migrationNumber}_update_tasks_to_i18n_keys.sql`);
  
  let migrationSQL = `-- Migration: Update tasks table to use i18n keys
-- Description: Replace Chinese hardcoded strings with i18n keys
-- Date: ${new Date().toISOString().split('T')[0]}

-- Update tasks table to use i18n keys
`;

  for (const task of tasks) {
    const taskId = task.id.replace('task_', '');
    const nameKey = `tasks.name.${taskId}`;
    const descKey = `tasks.description.${taskId}`;
    
    migrationSQL += `UPDATE tasks 
SET name = '${escapeSQL(nameKey)}',
    description = '${escapeSQL(descKey)}'
WHERE id = '${escapeSQL(task.id)}';

`;
  }
  
  migrationSQL += `-- Verification queries (optional, for testing)
-- SELECT id, name, description FROM tasks;
`;
  
  writeFileSync(migrationPath, migrationSQL, 'utf-8');
  
  console.log(`✅ Generated migration script: ${migrationPath}`);
  console.log(`\n📋 Migration summary:`);
  console.log(`   - Tasks to update: ${tasks.length}`);
  console.log(`   - Total updates: ${tasks.length * 2} (name + description)`);
  console.log(`\n💡 Next steps:`);
  console.log(`1. Review the migration script`);
  console.log(`2. Test in staging environment:`);
  console.log(`   npx wrangler d1 execute <db-name> --file=${migrationPath} --env staging --remote`);
  console.log(`3. If successful, execute in production:`);
  console.log(`   npx wrangler d1 execute <db-name> --file=${migrationPath} --env production --remote`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

