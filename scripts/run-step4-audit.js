const fs = require('fs');
const path = require('path');

const auditTerms = [
  'amore',
  'amorecakes',
  '7666546708',
  '8169893459',
  '9876543210',
  'ghatkopar',
  'shyamu',
  'arjun',
  'raju',
  'chandan'
];

let matches = [];

function scanFile(filePath) {
  if (filePath.includes('run-step4-audit.js')) return;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      for (const term of auditTerms) {
        if (lower.includes(term)) {
          matches.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            term: term,
            content: line.trim()
          });
        }
      }
    });
  } catch (err) {}
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git' || entry === '.env') continue;
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile()) {
      scanFile(fullPath);
    }
  }
}

scanDirectory('.');

console.log('=== STEP 4 AUDIT RESULTS ===');
if (matches.length === 0) {
  console.log('PASS: zero matches found across entire demo codebase!');
} else {
  console.log('FAIL: ' + matches.length + ' matches remaining:');
  matches.forEach(m => {
    console.log(m.file + ':L' + m.line + ' [' + m.term + '] -> ' + m.content);
  });
}
