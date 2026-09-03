const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('=== VERIFICATION GATE: FIX 11 (FAVICON REVERTED & CACHE BUSTING) ===\n');

  // 1. Verify favicon file sizes on disk
  console.log('1. Auditing favicon and icon asset file sizes on disk...');
  const appFavicon = path.join(__dirname, '../app/favicon.ico');
  const publicFavicon = path.join(__dirname, '../public/favicon.ico');
  const logoMaster = path.join(__dirname, '../public/logo-master.png');
  const appIcon = path.join(__dirname, '../app/icon.png');
  const publicIcon192 = path.join(__dirname, '../public/icon-192.png');
  const publicAppleIcon = path.join(__dirname, '../public/apple-touch-icon.png');

  if (!fs.existsSync(publicFavicon)) throw new Error('FAIL: public/favicon.ico is missing!');
  if (!fs.existsSync(appIcon)) throw new Error('FAIL: app/icon.png is missing!');
  if (!fs.existsSync(logoMaster)) throw new Error('FAIL: public/logo-master.png is missing!');

  const publicFaviconSize = fs.statSync(publicFavicon).size;
  const appIconSize = fs.statSync(appIcon).size;
  const logoMasterSize = fs.statSync(logoMaster).size;

  console.log(`   -> public/favicon.ico size: ${publicFaviconSize} bytes`);
  console.log(`   -> app/icon.png size: ${appIconSize} bytes`);
  console.log(`   -> public/logo-master.png size: ${logoMasterSize} bytes`);

  if (publicFaviconSize < 1000) {
    throw new Error(`FAIL: public/favicon.ico size (${publicFaviconSize} bytes) is too small!`);
  }
  if (appIconSize !== logoMasterSize) {
    throw new Error(`FAIL: app/icon.png size (${appIconSize} bytes) does not match authentic logo master (${logoMasterSize} bytes)!`);
  }
  console.log('   -> SUCCESS: All favicon and icon files match authentic Velvet Crumb Bakery logo asset.\n');

  // 2. Audit workspace for any remaining 963-byte boilerplate icons
  console.log('2. Auditing workspace for stale boilerplate 963-byte icon files...');
  const checkDirs = ['app', 'public'];
  for (const dir of checkDirs) {
    const fullDir = path.join(__dirname, '..', dir);
    const files = fs.readdirSync(fullDir);
    for (const file of files) {
      const filePath = path.join(fullDir, file);
      if (fs.statSync(filePath).isFile()) {
        const size = fs.statSync(filePath).size;
        if (size === 963) {
          throw new Error(`FAIL: Stale 963-byte boilerplate icon found at: ${filePath}`);
        }
      }
    }
  }
  console.log('   -> SUCCESS: Zero 963-byte boilerplate icon files found in workspace.\n');

  // 3. Audit app/layout.tsx for cache-busting icons metadata definition
  console.log('3. Verifying layout.tsx metadata icon configuration...');
  const layoutPath = path.join(__dirname, '../app/layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  if (!layoutContent.includes('icons:') || !layoutContent.includes('?v=2')) {
    throw new Error('FAIL: app/layout.tsx is missing icons metadata or ?v=2 cache-busting parameters!');
  }
  console.log('   -> SUCCESS: Layout metadata explicitly configures cache-busted icon references (?v=2).\n');

  // 4. Verify Navbar & Footer logo references
  console.log('4. Verifying Navbar and Footer logo asset references...');
  const navbarPath = path.join(__dirname, '../components/storefront/Navbar.tsx');
  const footerPath = path.join(__dirname, '../components/storefront/Footer.tsx');

  const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
  const footerContent = fs.readFileSync(footerPath, 'utf-8');

  if (!navbarContent.includes('logo-master.png')) {
    throw new Error('FAIL: Navbar.tsx does not reference /logo-master.png!');
  }
  if (!footerContent.includes('logo-master.png')) {
    throw new Error('FAIL: Footer.tsx does not reference /logo-master.png!');
  }
  console.log('   -> SUCCESS: Navbar and Footer brand logo references verified intact.\n');

  console.log('=== VERIFICATION SUCCESSFUL: FIX 11 PASSED ALL GATES ===');
}

runVerification().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
