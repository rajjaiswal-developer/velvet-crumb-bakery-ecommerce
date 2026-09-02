const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env / .env.local
['.env', '.env.local'].forEach((file) => {
  const envPath = path.resolve(__dirname, '..', file);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  }
});

const scripts = [
  'scripts/verify-fix-01.js',
  'scripts/verify-fix-02.js',
  'scripts/verify-fix-04.js',
  'scripts/verify-fix-05.js',
  'scripts/verify-fix-06.js',
  'scripts/verify-fix-07.js',
  'scripts/verify-fix-08.js',
  'scripts/verify-fix-09.js',
  'scripts/verify-fix-10.js',
  'scripts/verify-fix-11.js',
  'scripts/verify-fix-12.js',
  'scripts/verify-fix-18.js',
  'scripts/verify-phase8.js',
];

console.log('====================================================');
console.log('FULL REGRESSION SUITE EXECUTION');
console.log('====================================================\n');

const results = [];

for (const script of scripts) {
  process.stdout.write(`Running ${script}... `);
  const res = spawnSync('node', [script], {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    encoding: 'utf8',
  });
  if (res.status === 0) {
    console.log('✅ PASSED');
    results.push({ script, status: 'PASS', output: res.stdout });
  } else {
    console.log('❌ FAILED');
    results.push({ script, status: 'FAIL', error: res.stderr || res.stdout || res.error?.message });
  }
}

console.log('\n====================================================');
console.log('REGRESSION SUITE SUMMARY RESULTS');
console.log('====================================================');

let totalPass = 0;
let totalFail = 0;

for (const res of results) {
  if (res.status === 'PASS') {
    totalPass++;
    console.log(`[PASS] ${res.script}`);
  } else {
    totalFail++;
    console.log(`[FAIL] ${res.script}`);
    console.log('--- ERROR OUTPUT ---');
    console.log(res.error);
    console.log('--------------------');
  }
}

console.log(`\nTOTAL: ${totalPass} PASSED, ${totalFail} FAILED out of ${results.length}`);
process.exit(totalFail > 0 ? 1 : 0);
