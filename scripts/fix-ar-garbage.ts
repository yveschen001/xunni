
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/ar.ts');
let content = readFileSync(filePath, 'utf8');

// Find start of garbage: "ban: {" followed by "usageApprove"
const startMarker = 'ban: {\n      usageApprove:';
const start = content.indexOf(startMarker);

// Find end of garbage: "addUsageError:"
const endMarker = 'addUsageError:';
const end = content.indexOf(endMarker);

if (start !== -1 && end !== -1) {
  console.log(`Removing garbage from ${start} to ${end}`);
  // We keep content before start, and content starting from end.
  // But we need to make sure we don't leave a syntax error.
  // Previous key was `appealReviewCommands: ... ,`.
  // Next key is `addUsageError: ...`.
  // So we just need indentation before `addUsageError`.
  
  const before = content.substring(0, start);
  const after = content.substring(end);
  
  // The `before` part ends with `,\n    `.
  // We can clean up extra whitespace if needed.
  
  const newContent = before + after;
  writeFileSync(filePath, newContent);
  console.log('✅ Fixed ar.ts garbage');
} else {
  console.log('Markers not found in ar.ts');
}

