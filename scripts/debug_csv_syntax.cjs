
const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
let content = fs.readFileSync(csvPath, 'utf8');

const matches = content.match(/\$\{[^}]*(\}|$)/g) || [];
console.log('Sample matches:', matches.slice(0, 10));

