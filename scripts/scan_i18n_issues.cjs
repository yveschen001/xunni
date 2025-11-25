// Comprehensive i18n issue scanner
const fs = require('fs');
const path = require('path');

// Find all i18n locale files
const localesDir = path.join(__dirname, '../src/i18n/locales');
const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

console.log('🔍 Scanning i18n files for template string issues...\n');

const issues = [];

localeFiles.forEach(file => {
  const filePath = path.join(localesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for problematic patterns:
    // 1. ${variable || 'default'} - JavaScript expressions in i18n strings
    // 2. ${variable} that might not be properly escaped
    // 3. Template strings that might not be replaced
    
    // Pattern 1: JavaScript expressions (||, &&, ? :, etc.)
    if (line.includes('${') && (
      line.includes('||') ||
      line.includes('&&') ||
      line.includes('?') ||
      line.includes(':') && line.includes('${') && !line.includes('i18n.t')
    )) {
      // Skip if it's a comment or already handled
      if (!line.trim().startsWith('//') && !line.includes('// Note:')) {
        issues.push({
          file,
          line: lineNum,
          type: 'javascript_expression',
          content: line.trim(),
          severity: 'high'
        });
      }
    }
    
    // Pattern 2: Check for common problematic keys
    const problematicKeys = [
      'profile.message3',
      'profile.message4',
      'profile.message5',
      'profile.invite',
      'common.settings'
    ];
    
    problematicKeys.forEach(key => {
      if (line.includes(key) && line.includes('${')) {
        issues.push({
          file,
          line: lineNum,
          type: 'known_issue_key',
          key,
          content: line.trim(),
          severity: 'high'
        });
      }
    });
  });
});

// Group issues by file
const issuesByFile = {};
issues.forEach(issue => {
  if (!issuesByFile[issue.file]) {
    issuesByFile[issue.file] = [];
  }
  issuesByFile[issue.file].push(issue);
});

// Report
console.log(`Found ${issues.length} potential issues across ${Object.keys(issuesByFile).length} files\n`);

Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
  console.log(`\n📄 ${file} (${fileIssues.length} issues)`);
  fileIssues.forEach(issue => {
    console.log(`  Line ${issue.line}: [${issue.type}] ${issue.content.substring(0, 80)}...`);
  });
});

// Summary
const highSeverity = issues.filter(i => i.severity === 'high').length;
console.log(`\n${'='.repeat(60)}`);
console.log(`Summary:`);
console.log(`  Total issues: ${issues.length}`);
console.log(`  High severity: ${highSeverity}`);
console.log(`  Files affected: ${Object.keys(issuesByFile).length}`);

// Export for further processing
if (issues.length > 0) {
  fs.writeFileSync(
    path.join(__dirname, '../i18n_scan_results.json'),
    JSON.stringify({ issues, summary: { total: issues.length, highSeverity, files: Object.keys(issuesByFile).length } }, null, 2)
  );
  console.log(`\n📝 Results saved to i18n_scan_results.json`);
}

