
const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
let content = fs.readFileSync(csvPath, 'utf8');

// Replace ${variable} with {variable}
// Regex: \$\{([^}]+)\} -> {$1}
const newContent = content.replace(/\$\{([^}]+)\}/g, '{$1}');

fs.writeFileSync(csvPath, newContent);
console.log('Fixed ${} syntax in CSV');

