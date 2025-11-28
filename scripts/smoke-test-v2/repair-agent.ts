import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { DiagnosisContext } from './diagnosis';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Repair Agent (Powered by Gemini 3 Pro)
 * Enhanced with Token Safety & Loop Support
 */
export class AiRepairAgent {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-2.0-flash-exp'; // Use a cost-effective model for loop

  // Configuration limits
  private readonly MAX_TOKENS_ESTIMATE = 30000; // Approx safety limit per request (chars/4)
  
  constructor() {
      // 1. Try to load from .dev.vars (since we are in Node land)
      this.loadDevVars();

      // 2. Check for keys (support both names)
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (apiKey) {
          this.genAI = new GoogleGenerativeAI(apiKey);
          // User requested Gemini 3 Pro capability
          this.modelName = 'gemini-3-pro-preview'; 
      } else {
          console.warn('⚠️ GOOGLE_GEMINI_API_KEY not found. AI Repair will run in simulation mode.');
      }
  }

  private loadDevVars() {
      try {
          const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
          if (fs.existsSync(devVarsPath)) {
              const content = fs.readFileSync(devVarsPath, 'utf-8');
              const lines = content.split('\n');
              for (const line of lines) {
                  const match = line.match(/^([^=]+)=(.*)$/);
                  if (match) {
                      const key = match[1].trim();
                      const value = match[2].trim().replace(/^"(.*)"$/, '$1'); // Remove quotes if present
                      if (!process.env[key]) {
                          process.env[key] = value;
                      }
                  }
              }
          }
      } catch (e) {
          // Ignore errors loading .dev.vars
      }
  }
  
  // Now returns the path of the snapshot to allow multiple rollbacks if needed, 
  // or simple boolean indicating if repair attempt was made.
  // We change return type to specific RepairResult
  async attemptRepair(reportPath: string, attemptCount: number): Promise<RepairResult> {
    console.log(`\n🤖 AI Repair Agent (Attempt ${attemptCount})...`);
    
    if (!fs.existsSync(reportPath)) {
        return { success: false, reason: 'Report file missing' };
    }

    const report: DiagnosisContext = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    // 1. Safety Lock: Create Snapshot (Unique per attempt to allow stepping back)
    // We assume the Runner handles the main rollback, but here we ensure
    // we don't mess up if called independently.
    // For the loop logic in Runner, it's better if Runner manages the "Base State".
    // But here, we apply a patch. If the patch fails verification, we must revert IT.
    
    if (!this.createSnapshot(`repair-attempt-${attemptCount}`)) {
        return { success: false, reason: 'Snapshot failed' };
    }

    // 2. Gather Context
    const context = this.gatherContext(report);
    if (!context.files.length) {
        this.rollbackSnapshot();
        return { success: false, reason: 'No context files found' };
    }

    // 3. Token Safety Check
    if (!this.checkTokenSafety(context)) {
        this.rollbackSnapshot();
        return { success: false, reason: 'Token limit exceeded' };
    }

    // 4. Generate Fix
    let fixApplied = false;
    if (this.genAI) {
        try {
            fixApplied = await this.generateAndApplyFix(report, context);
        } catch (e: any) {
            console.error('  ❌ Gemini API Error:', e.message);
            fixApplied = false;
        }
    } else {
        fixApplied = await this.simulateAiFix(report);
    }

    if (fixApplied) {
        console.log('  ✅ AI applied a fix. Ready for verification.');
        return { success: true };
    } else {
        console.log('  ↩️ No fix generated or apply failed. Rolling back...');
        this.rollbackSnapshot();
        return { success: false, reason: 'AI failed to generate fix' };
    }
  }

  public revertLastChange() {
      this.rollbackSnapshot();
  }

  private checkTokenSafety(context: { files: { path: string, content: string }[] }): boolean {
      let totalChars = 0;
      for (const f of context.files) {
          totalChars += f.content.length;
      }
      // Rough estimate: 1 token ~= 4 chars
      const estimatedTokens = totalChars / 4;
      
      if (estimatedTokens > this.MAX_TOKENS_ESTIMATE) {
          console.warn(`  ⚠️ Context too large (${Math.round(estimatedTokens)} tokens). Aborting to save cost.`);
          return false;
      }
      return true;
  }

  private gatherContext(report: DiagnosisContext): { files: { path: string, content: string }[] } {
    const stack = report.error.stack || '';
    const lines = stack.split('\n');
    const projectRoot = process.cwd();
    const foundFiles = new Set<string>();

    for (const line of lines) {
        const match = line.match(/\((.*?):\d+:\d+\)/) || line.match(/at\s+(.*?):\d+:\d+/);
        if (match && match[1]) {
            let filePath = match[1];
            if (!path.isAbsolute(filePath)) {
                filePath = path.join(projectRoot, filePath);
            }
            if (filePath.startsWith(projectRoot) && fs.existsSync(filePath)) {
                if (!filePath.includes('node_modules') && !filePath.includes('smoke-test-v2')) {
                    foundFiles.add(filePath);
                }
            }
        }
    }
    
    // Heuristic: limit to top 2 relevant files
    const limitedFiles = Array.from(foundFiles).slice(0, 2);
    
    return {
        files: limitedFiles.map(f => ({
            path: path.relative(projectRoot, f),
            content: fs.readFileSync(f, 'utf-8')
        }))
    };
  }

  private async generateAndApplyFix(report: DiagnosisContext, context: { files: { path: string, content: string }[] }): Promise<boolean> {
      const model = this.genAI!.getGenerativeModel({ 
          model: this.modelName
      });

      const filesContext = context.files.map(f => 
          `File: ${f.path}\n\`\`\`typescript\n${f.content}\n\`\`\``
      ).join('\n\n');

      const prompt = `
You are an expert developer maintaining a Cloudflare Workers project.
A smoke test has failed. Your task is to analyze the error and fix the code.

CRITICAL RULES:
1. Only fix the specific error. Do not refactor unrelated code.
2. Follow strict TypeScript and project standards.
3. Return ONLY a JSON object with the file updates. No markdown.
4. Format: { "files": [ { "path": "path/to/file", "newContent": "complete new file content" } ] }
5. Ensure the new content is COMPLETE and valid.

ERROR INFO:
Test: ${report.testName}
Message: ${report.error.message}
Stack: ${report.error.stack}

SOURCE CODE:
${filesContext}

Fix the code now. JSON only.
`;

      console.log(`  🧠 Asking ${this.modelName} to fix...`);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
          const fixData = JSON.parse(jsonStr);
          if (fixData.files && Array.isArray(fixData.files)) {
              for (const file of fixData.files) {
                  const fullPath = path.resolve(process.cwd(), file.path);
                  if (fs.existsSync(fullPath)) {
                      console.log(`  📝 Patching ${file.path}...`);
                      fs.writeFileSync(fullPath, file.newContent);
                  }
              }
              return true;
          }
      } catch (e) {
          console.error('  ❌ Failed to parse AI response:', e);
      }

      return false;
  }

  private createSnapshot(msg: string): boolean {
    try {
        console.log(`  🔒 Creating snapshot: ${msg}...`);
        execSync(`git stash push -m "${msg}" --quiet`, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
  }

  private rollbackSnapshot() {
    try {
        console.log('  ↩️ Reverting last change (git stash pop)...');
        execSync('git stash pop --quiet', { stdio: 'ignore' });
    } catch (e) {
        console.error('  ⚠️ Rollback failed.');
    }
  }

  private simulateAiFix(report: DiagnosisContext): Promise<boolean> {
    if (report.error.message.includes('MOONPACKET_API_SECRET missing')) {
        console.log('  💡 [SIMULATION] AI Suggestion: Config issue detected.');
        return false;
    }
    return false;
  }
}

export interface RepairResult {
    success: boolean;
    reason?: string;
}
