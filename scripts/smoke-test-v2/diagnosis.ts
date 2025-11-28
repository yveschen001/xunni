import * as fs from 'fs';
import * as path from 'path';

export interface DiagnosisContext {
  testName: string;
  error: {
    message: string;
    stack?: string;
    response?: any;
  };
  config: any;
  timestamp: string;
}

export class DiagnosisReporter {
  private reportPath: string;

  constructor() {
    this.reportPath = path.resolve(process.cwd(), 'diagnosis_report.json');
  }

  generate(context: DiagnosisContext) {
    // Enrich context with additional system info if needed
    const report = {
      ...context,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    console.log(`  📄 Detailed diagnosis report saved to ${this.reportPath}`);
    return this.reportPath;
  }
}

