import { SmartRunner, SmartRunnerConfig } from './runner';
import { runStaticChecks } from './static-checks';
import { runCriticalFlows } from './critical-flow';
import { runFeatureSuites } from './features';
import { parseArgs } from 'util';

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      local: { type: 'boolean', default: false },
      filter: { type: 'string' },
      retries: { type: 'string', default: '2' },
      timeout: { type: 'string', default: '5000' }, // 5s default
      autofix: { type: 'boolean', default: false },
    },
  });

  const config: SmartRunnerConfig = {
    targetUrl: values.local ? 'http://127.0.0.1:8787' : 'https://xunni-bot-staging.yves221.workers.dev',
    maxRetries: parseInt(values.retries as string, 10),
    timeout: parseInt(values.timeout as string, 10),
    filter: values.filter,
    isLocal: !!values.local,
    autoFix: !!values.autofix
  };

  console.log('🚀 Starting Smart Smoke Test v2');
  console.log(`   Target: ${config.targetUrl}`);
  console.log(`   Retries: ${config.maxRetries}`);
  console.log(`   Auto-fix: ${config.autoFix ? 'Enabled' : 'Disabled'}`);

  const runner = new SmartRunner(config);

  try {
    // 1. Static Checks (Parallelizable internally if needed, but fast enough)
    await runStaticChecks(runner);

    // 2. Critical Flows (Must pass to proceed)
    // We could check if critical tests passed in runner state before proceeding
    await runCriticalFlows(runner, config.targetUrl);

    // 3. Feature Suites (Parallel execution)
    await runFeatureSuites(runner, config.targetUrl, config);

  } catch (err) {
    console.error('🔥 Fatal error in test runner:', err);
    process.exit(1);
  } finally {
    runner.printSummary();
  }
}

main().catch(console.error);

