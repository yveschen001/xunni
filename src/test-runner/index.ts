
/**
 * Main Entry Point for the New Smoke Test Runner
 */

import { TestRunner } from './runner';
import { TestContext } from './core';
import { StaticChecksSuite } from './suites/static-checks';
import { CriticalFlowSuite } from './suites/critical';
import { MoonPacketSuite } from './suites/moonpacket';
import * as fs from 'fs';
import * as path from 'path';

// Parse CLI Arguments
const args = process.argv.slice(2);
const envArg = args.find(a => ['local', 'staging', 'prod'].includes(a)) || 'staging';
const filterArg = args.find(a => a.startsWith('--filter='))?.split('=')[1];

const CONFIG = {
  local: { url: 'http://127.0.0.1:8787' },
  staging: { url: 'https://xunni-bot-staging.yves221.workers.dev' },
  prod: { url: 'https://xunni-bot.yves221.workers.dev' }
};

const target = CONFIG[envArg as keyof typeof CONFIG];
const context: TestContext = {
  baseUrl: target.url,
  env: envArg as any
};

async function main() {
  const runner = new TestRunner(context, 3); // Concurrency = 3

  // Register Suites
  const suites = [
    new StaticChecksSuite(),
    new CriticalFlowSuite(),
    new MoonPacketSuite()
  ];

  // Apply Filter
  for (const suite of suites) {
    if (filterArg && !suite.name.toLowerCase().includes(filterArg.toLowerCase())) {
      continue;
    }
    runner.addSuite(suite);
  }

  // Run
  const success = await runner.runAll();
  
  if (!success) {
    console.error('❌ Some tests failed.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed.');
    process.exit(0);
  }
}

main().catch(e => {
  console.error('Fatal Error:', e);
  process.exit(1);
});

