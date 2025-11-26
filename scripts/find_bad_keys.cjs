
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/i18n/locales/zh-TW.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let currentStack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimLine = line.trim();

  if (trimLine.endsWith(': {')) {
    const key = trimLine.replace(': {', '');
    currentStack.push(key);
  } else if (trimLine === '},' || trimLine === '}') {
    currentStack.pop();
  } else if (trimLine.includes('${matchResult.user.mbti_result')) {
    const match = trimLine.match(/([a-zA-Z0-9_]+):/);
    if (match) {
      const key = match[1];
      const fullPath = [...currentStack, key].join('.');
      console.log(`[Line ${i+1}] ${fullPath}: ${trimLine}`);
    }
  }
}

