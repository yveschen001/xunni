/**
 * Log Monitor
 * Monitors Worker logs and detects errors automatically
 */

import { spawn } from 'child_process';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: any;
}

const logs: LogEntry[] = [];
const errors: LogEntry[] = [];
let errorCount = 0;
let warningCount = 0;

console.log('🔍 Starting Log Monitor...\n');
console.log('Monitoring Worker logs for errors and warnings...');
console.log('Press Ctrl+C to stop\n');
console.log('=' .repeat(80));

// Start wrangler tail
const wrangler = spawn('pnpm', ['wrangler', 'tail', '--env=staging', '--format=pretty'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});

wrangler.stdout.on('data', (data) => {
  const output = data.toString();
  const lines = output.split('\n').filter((line: string) => line.trim());

  lines.forEach((line: string) => {
    const timestamp = new Date();
    
    // Detect log level
    let level: 'info' | 'warn' | 'error' = 'info';
    if (line.includes('ERROR') || line.includes('Error') || line.includes('error')) {
      level = 'error';
      errorCount++;
    } else if (line.includes('WARN') || line.includes('Warning') || line.includes('warning')) {
      level = 'warn';
      warningCount++;
    }

    const logEntry: LogEntry = {
      timestamp,
      level,
      message: line,
    };

    logs.push(logEntry);

    if (level === 'error') {
      errors.push(logEntry);
      console.log(`\n❌ [${timestamp.toISOString()}] ERROR:`);
      console.log(line);
      console.log('=' .repeat(80));
    } else if (level === 'warn') {
      console.log(`\n⚠️  [${timestamp.toISOString()}] WARNING:`);
      console.log(line);
      console.log('-' .repeat(80));
    } else {
      // Normal log
      console.log(`[${timestamp.toISOString()}] ${line}`);
    }
  });
});

wrangler.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(`stderr: ${output}`);
});

wrangler.on('close', (code) => {
  console.log(`\n\nLog monitor stopped (exit code: ${code})`);
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Log Summary\n');
  console.log(`Total Logs: ${logs.length}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Warnings: ${warningCount}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors Detected:');
    errors.forEach((error, index) => {
      console.log(`\n${index + 1}. [${error.timestamp.toISOString()}]`);
      console.log(error.message);
    });
  }
  
  process.exit(code || 0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nStopping log monitor...');
  wrangler.kill();
});

