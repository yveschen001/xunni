/**
 * Debug regex issue
 */

const text = '/start invite_XUNNI-722WV34N';
console.log('Input:', text);

// Current regex
const regex1 = /^\/start\s+invite_(.+)$/;
const match1 = text.match(regex1);
console.log('\nCurrent regex: /^\/start\\s+invite_(.+)$/');
console.log('Match result:', match1);
console.log('match[0] (full match):', match1?.[0]);
console.log('match[1] (captured group):', match1?.[1]);

// Test with different regex
const regex2 = /^\/start\s+(.+)$/;
const match2 = text.match(regex2);
console.log('\nAlternative regex: /^\/start\\s+(.+)$/');
console.log('Match result:', match2);
console.log('match[0] (full match):', match2?.[0]);
console.log('match[1] (captured group):', match2?.[1]);

// Manual extraction
const parts = text.split(' ');
console.log('\nManual split by space:');
console.log('Parts:', parts);
console.log('Second part:', parts[1]);
console.log('After removing invite_:', parts[1]?.replace('invite_', ''));

