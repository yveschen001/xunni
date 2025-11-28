import { DiagnosisReporter } from './diagnosis';
import { AiRepairAgent } from './repair-agent';

export type TestGroup = 'static' | 'critical' | 'feature';

export interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: any;
  retries?: number;
}

export interface SmartRunnerConfig {
  targetUrl: string;
  maxRetries: number;
  timeout: number;
  filter?: string;
  isLocal: boolean;
  autoFix: boolean;
}

export class SmartRunner {
  private config: SmartRunnerConfig;
  private results: Map<string, TestResult[]> = new Map();
  private diagnosisReporter = new DiagnosisReporter();
  private repairAgent = new AiRepairAgent();
  
  // New: Track which tests belong to which group for regression testing
  private groupTests: Map<TestGroup, {name: string, fn: () => Promise<void>}[]> = new Map();

  constructor(config: SmartRunnerConfig) {
    this.config = config;
  }
  
  // Register test for regression capability
  registerSuite(group: TestGroup, name: string, fn: () => Promise<void>) {
      if (!this.groupTests.has(group)) {
          this.groupTests.set(group, []);
      }
      this.groupTests.get(group)!.push({ name, fn });
  }

  async runSuite(group: TestGroup, name: string, fn: () => Promise<void>): Promise<boolean> {
    this.registerSuite(group, name, fn); // Auto-register
    
    if (this.config.filter && !name.toLowerCase().includes(this.config.filter.toLowerCase())) {
      return true; // Skip
    }

    console.log(`[${group.toUpperCase()}] Running: ${name}...`);
    const start = Date.now();
    let attempts = 0;
    
    // Initial Run & Retry Logic (Network/Flaky)
    while (attempts <= this.config.maxRetries) {
      try {
        await this.withTimeout(fn(), this.config.timeout);
        const duration = Date.now() - start;
        this.recordResult(group, { name, success: true, duration, retries: attempts });
        console.log(`  ✅ Passed (${duration}ms)`);
        return true;
      } catch (error: any) {
        attempts++;
        
        // Non-retryable error -> Stop standard retries, check if Auto-Fix applies
        if (!this.isRetryableError(error)) {
             console.log('  ⛔ Non-retryable error detected.');
             // Break out to enter Auto-Fix flow if enabled
             break; 
        }

        if (attempts > this.config.maxRetries) {
            break; // Retries exhausted
        }
        
        console.warn(`  ⚠️ Retry ${attempts}/${this.config.maxRetries}...`);
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
      }
    }
    
    // If we are here, the test failed (either retries exhausted or non-retryable error)
    // Enter Auto-Fix Loop
    if (this.config.autoFix) {
        return await this.enterAutoFixLoop(group, name, fn, start);
    } else {
        // Record final failure
        const duration = Date.now() - start;
        this.recordResult(group, { name, success: false, duration, error: new Error('Failed after retries') });
        console.error(`  ❌ Failed permanently.`);
        return false;
    }
  }

  private async enterAutoFixLoop(group: TestGroup, name: string, fn: () => Promise<void>, startTime: number): Promise<boolean> {
      console.log(`  🔧 Entering Auto-Fix Loop for "${name}"...`);
      let fixAttempts = 0;
      const MAX_FIX_LOOPS = 3;

      while (fixAttempts < MAX_FIX_LOOPS) {
          fixAttempts++;
          
          // 1. Run test to capture fresh error (we know it fails, but need precise error for this loop)
          let currentError: any = null;
          try {
              await this.withTimeout(fn(), this.config.timeout);
              // Miracle! It passed?
              console.log('  ✨ Test passed unexpectedly during fix loop!');
              return true;
          } catch (e) {
              currentError = e;
          }

          // 2. Generate Diagnosis
          const reportPath = this.diagnosisReporter.generate({
              testName: name,
              error: { message: currentError.message, stack: currentError.stack },
              config: this.config,
              timestamp: new Date().toISOString()
          });

          // 3. AI Repair
          const repairResult = await this.repairAgent.attemptRepair(reportPath, fixAttempts);
          
          if (!repairResult.success) {
              console.log(`  🛑 Fix attempt ${fixAttempts} failed: ${repairResult.reason}`);
              // If AI failed to generate/apply fix, stop looping
              break;
          }

          // 4. Verify Fix (Level 1)
          console.log('  🔍 Verifying fix (Level 1: Single Test)...');
          try {
              await this.withTimeout(fn(), this.config.timeout);
              console.log('  ✅ Level 1 Verification Passed!');
              
              // 5. Regression Check (Level 2)
              console.log('  🛡️  Running Regression Check (Level 2: Group Re-run)...');
              const regressionPassed = await this.runRegressionCheck(group);
              
              if (regressionPassed) {
                  console.log('  🎉 Fix Verified & Safe! Committing...');
                  // In a real agent, we might git commit here. 
                  // For now, we leave the changes applied (stashed content popped implies applied? No, we need to keep it.)
                  // repairAgent keeps changes on disk if verification passes.
                  return true;
              } else {
                  console.error('  💥 Regression Check Failed! Rolling back...');
                  this.repairAgent.revertLastChange();
                  // Continue loop to try another fix? Or stop?
                  // Usually stop to avoid infinite ping-pong.
                  break; 
              }

          } catch (e) {
              console.log('  ❌ Level 1 Verification Failed. Fix did not work.');
              this.repairAgent.revertLastChange(); // Revert and try again
          }
      }

      const duration = Date.now() - startTime;
      this.recordResult(group, { name, success: false, duration, error: new Error(`Auto-fix failed after ${fixAttempts} loops`) });
      console.error(`  💀 Auto-fix gave up.`);
      return false;
  }

  private async runRegressionCheck(group: TestGroup): Promise<boolean> {
      const tests = this.groupTests.get(group) || [];
      console.log(`     Re-running ${tests.length} tests in group [${group}]...`);
      
      for (const test of tests) {
          try {
              await this.withTimeout(test.fn(), this.config.timeout);
              // process.stdout.write('.');
          } catch (e) {
              console.log(`     Regression failed at: ${test.name}`);
              return false;
          }
      }
      console.log('     All regression tests passed.');
      return true;
  }

  private isRetryableError(error: any): boolean {
    const msg = error.message || '';
    if (msg.includes('fetch failed') || msg.includes('ETIMEDOUT') || msg.includes('502') || msg.includes('504')) {
      return true;
    }
    return false;
  }

  private recordResult(group: string, result: TestResult) {
    if (!this.results.has(group)) {
      this.results.set(group, []);
    }
    this.results.get(group)!.push(result);
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]);
  }

  public printSummary() {
    console.log('\n=============================================');
    console.log('SMOKE TEST SUMMARY');
    console.log('=============================================');
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const [group, tests] of this.results.entries()) {
      console.log(`\n[${group.toUpperCase()}]`);
      for (const test of tests) {
        const icon = test.success ? '✅' : '❌';
        console.log(`${icon} ${test.name} (${test.duration}ms)${test.retries ? ` [Retries: ${test.retries}]` : ''}`);
        if (!test.success && test.error) {
            console.log(`   Error: ${test.error.message}`);
        }
      }
      const passed = tests.filter(t => t.success).length;
      totalTests += tests.length;
      totalPassed += passed;
      totalFailed += tests.length - passed;
    }

    console.log('\n---------------------------------------------');
    console.log(`Total: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
    console.log('=============================================');
    
    if (totalFailed > 0) {
        process.exit(1);
    }
  }
}
