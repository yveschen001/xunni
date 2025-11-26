
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/i18n/locales/zh-TW.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const results = [];
let currentStack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimLine = line.trim();

  // Simple stack tracking (imperfect but sufficient for this file structure)
  if (trimLine.endsWith(': {')) {
    const key = trimLine.replace(': {', '');
    currentStack.push(key);
  } else if (trimLine === '},' || trimLine === '}') {
    currentStack.pop();
  } else if (trimLine.includes('${{') || trimLine.includes('highlights.join') || trimLine.includes('task.reward_type')) {
    // Found suspicious line
    const match = trimLine.match(/([a-zA-Z0-9_]+):/);
    if (match) {
      const key = match[1];
      const fullPath = [...currentStack, key].join('.');
      results.push({
        line: i + 1,
        key: fullPath,
        content: trimLine
      });
    }
  }
}

console.log('Found suspicious keys:');
results.forEach(r => {
  console.log(`[Line ${r.line}] ${r.key}: ${r.content}`);
});

