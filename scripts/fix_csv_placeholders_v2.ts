
import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const inputFile = 'i18n_for_translation.csv';
const outputFile = 'i18n_for_translation_fixed.csv';

const rows = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    // Modify zh-TW column
    let text = row['zh-TW'];
    
    // Fix 1: Remove double braces ${{...}} -> ${...}
    text = text.replace(/\$\{\{([^\}]+)\}\}/g, '${$1}');

    // Fix 2: Fix task reward expression
    if (text.includes("task.reward_type === 'daily'")) {
      text = text.replace(/\$\{task\.reward_type === 'daily' \? '當天有效' : '永久有效'\}/g, '${rewardTypeText}');
    }

    // Fix 3: Fix highlights.join
    if (text.includes("highlights.join")) {
      text = text.replace(/\$\{highlights\.join\([^\)]+\)\}/g, '${highlights}');
    }

    row['zh-TW'] = text;
    rows.push(row);
  })
  .on('end', async () => {
    const csvWriter = createObjectCsvWriter({
      path: outputFile,
      header: Object.keys(rows[0]).map(id => ({ id, title: id }))
    });

    await csvWriter.writeRecords(rows);
    console.log('CSV fixed successfully!');
    
    // Replace original file
    fs.renameSync(outputFile, inputFile);
  });

