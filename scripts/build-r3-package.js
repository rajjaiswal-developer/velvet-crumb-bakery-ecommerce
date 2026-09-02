const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();

const allowedFiles = [
  'app/globals.css',
  'app/layout.tsx',
  'app/page.tsx',
  'components/storefront/HomePageClient.tsx',
  'components/storefront/Navbar.tsx',
  'components/storefront/Footer.tsx',
  'components/storefront/ActiveOrderStatusBanner.tsx',
  'components/storefront/ProductCard.tsx',
  'components/storefront/Breadcrumbs.tsx',
  'app/categories/[slug]/page.tsx',
  'components/storefront/CategoryListingClient.tsx',
  'app/products/[slug]/page.tsx',
  'components/storefront/ProductDetailClient.tsx',
  'app/search/page.tsx',
  'components/storefront/SearchClient.tsx',
  'components/storefront/CartDrawer.tsx',
  'app/checkout/page.tsx',
  'components/storefront/PaymentProcessingOverlay.tsx',
  'app/orders/[receiptNumber]/page.tsx',
  'app/orders/track/page.tsx',
  'components/storefront/OrderTrackingClient.tsx',
  'app/custom-cakes/page.tsx',
  'components/storefront/CustomCakesClient.tsx',
  'app/admin/login/page.tsx',
  'app/admin/dashboard/page.tsx',
  'components/admin/LoadingOverlay.tsx',
  'app/privacy-policy/page.tsx',
  'app/terms-conditions/page.tsx',
  'app/return-refund-policy/page.tsx',
  'app/shipping-policy/page.tsx',
];

const contextFiles = [
  'context/r3-design-handoff-brief.md',
  'context/ui-context.md',
  'context/frontend-inventory.md',
];

const forbiddenKeywords = [
  'lib/',
  'app/api/',
  'prisma/',
  'middleware.ts',
  '.env',
];

console.log('1. Verifying existence of all 30 ALLOWED files on disk...');
for (const relPath of allowedFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`MISSING ALLOWED FILE: ${relPath}`);
  }
}
console.log('   PASSED: All 30 ALLOWED presentation files exist on disk.\n');

console.log('2. Verifying existence of required context files...');
for (const relPath of contextFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`MISSING CONTEXT FILE: ${relPath}`);
  }
}
console.log('   PASSED: All required context files exist on disk.\n');

// 3. Setup staging directory
const stagingDir = path.join(rootDir, 'r3-staging');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Write README.txt
const readmeContent =
  `This package contains the current presentation-layer code for Velvet Crumb Bakery.\n` +
  `Read r3-design-handoff-brief.md first — it defines what may and may not be changed.\n` +
  `All other files in this package are the real current source you're redesigning.\n`;
fs.writeFileSync(path.join(stagingDir, 'README.txt'), readmeContent, 'utf8');

// Copy allowed files preserving relative directory structure
const allToCopy = [...contextFiles, ...allowedFiles];
for (const relPath of allToCopy) {
  const src = path.join(rootDir, relPath);
  const dest = path.join(stagingDir, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// 4. Audit staging directory against forbidden list
console.log('3. Auditing staging directory against FORBIDDEN files/directories...');
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(path.relative(stagingDir, filePath).replace(/\\/g, '/'));
    }
  }
  return fileList;
}

const stagedFiles = getAllFiles(stagingDir);

for (const file of stagedFiles) {
  for (const forbidden of forbiddenKeywords) {
    if (file.toLowerCase().includes(forbidden.toLowerCase())) {
      throw new Error(`FORBIDDEN FILE DETECTED IN STAGING: ${file}`);
    }
  }
}
console.log(`   PASSED: Audited ${stagedFiles.length} files in staging. ZERO forbidden files found.\n`);

// 5. Package into r3-design-package.zip using PowerShell Compress-Archive
const zipPath = path.join(rootDir, 'r3-design-package.zip');
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log('4. Creating r3-design-package.zip...');
const psCommand = `powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPath}' -Force"`;
execSync(psCommand, { stdio: 'inherit' });

// Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });

// 6. Final verification of generated zip
if (!fs.existsSync(zipPath)) {
  throw new Error('Zip creation failed: r3-design-package.zip not found!');
}

const stats = fs.statSync(zipPath);
const zipSizeKb = (stats.size / 1024).toFixed(2);

console.log('\n====================================================');
console.log('R3 DESIGN PACKAGE CREATION SUCCESSFUL');
console.log('====================================================');
console.log(`Zip Archive Path: ${zipPath}`);
console.log(`Total Staged Files Packaged: ${stagedFiles.length}`);
console.log(`Total Zip Archive Size: ${zipSizeKb} KB (${stats.size} bytes)`);
console.log('Packaged Files Breakdown:');
console.log(` - 1 README.txt`);
console.log(` - 3 Context files (${contextFiles.join(', ')})`);
console.log(` - 30 ALLOWED presentation files (100% present matching live disk content)`);
console.log(' - 0 FORBIDDEN files included');
console.log('====================================================\n');
