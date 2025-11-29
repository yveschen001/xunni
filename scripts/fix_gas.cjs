const fs = require('fs');
const path = 'tools/gas/translation_tool.gs';
const part1Path = 'tools/gas/translation_part1.js';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find split point
let splitIdx = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('/* ===================== 質檢核心工具 (增強版) ===================== */')) {
        splitIdx = i;
        break;
    }
}

if (splitIdx === -1) {
    console.log('Split point not found!');
    process.exit(1);
}

const qaPart = lines.slice(splitIdx).join('\n');
const newTopPart = fs.readFileSync(part1Path, 'utf8');

fs.writeFileSync(path, newTopPart + '\n' + qaPart);
console.log('Merged translation_tool.gs successfully.');

