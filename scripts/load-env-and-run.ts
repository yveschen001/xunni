#!/usr/bin/env tsx

/**
 * Load .dev.vars and run the polling script
 * 
 * This script loads environment variables from .dev.vars
 * and then starts the polling script.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

// Load .dev.vars
const devVarsPath = resolve(process.cwd(), '.dev.vars');

try {
  const content = readFileSync(devVarsPath, 'utf-8');
  
  // Parse .dev.vars
  content.split('\n').forEach(line => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) {
      return;
    }
    
    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim();
    }
  });
  
  console.log('✅ Loaded environment variables from .dev.vars\n');
  
  // Start the polling script
  const child = spawn('tsx', ['scripts/dev-polling.ts'], {
    stdio: 'inherit',
    env: process.env,
  });
  
  // Forward signals
  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
  
} catch (error) {
  console.error('❌ Error loading .dev.vars:', error);
  console.error('💡 Make sure .dev.vars file exists in the project root');
  process.exit(1);
}

