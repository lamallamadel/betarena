const fs = require('fs');
const path = 'c:\\Users\\a891780\\betarena-app\\src\\components\\match\\MatchCenterView.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

// Target: Lines 137 to 162 (1-indexed)
// Index: 136 to 161 (0-indexed)
// Count: 26 lines

const START_LINE = 137;
const END_LINE = 162;
const START_INDEX = START_LINE - 1;
const DELETE_COUNT = END_LINE - START_LINE + 1;

console.log(`Initial lines: ${lines.length}`);
console.log(`Deleting ${DELETE_COUNT} lines starting at index ${START_INDEX} (Line ${START_LINE})`);
console.log(`First deleted line: ${lines[START_INDEX]}`);
console.log(`Last deleted line: ${lines[START_INDEX + DELETE_COUNT - 1]}`);

lines.splice(START_INDEX, DELETE_COUNT);

console.log(`Final lines: ${lines.length}`);

// Detect line ending from original file (naive check)
const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(path, lines.join(lineEnding));
console.log('File successfully updated.');
