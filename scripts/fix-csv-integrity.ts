
import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = path.join(process.cwd(), 'i18n_for_translation.csv');

if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV not found');
    process.exit(1);
}

let content = fs.readFileSync(CSV_PATH, 'utf-8');

// Replace {fortunemessage ...} with {fortuneBottle}
const regex = /\{fortunemessage [^}]+\}/g;
let count = 0;

const newContent = content.replace(regex, (match) => {
    count++;
    return '{fortuneBottle}';
});

if (count > 0) {
    console.log(`Fixed ${count} corrupted variables in CSV.`);
    fs.writeFileSync(CSV_PATH, newContent, 'utf-8');
} else {
    console.log('No corrupted variables found in CSV.');
}

