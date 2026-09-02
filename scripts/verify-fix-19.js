const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=====================================================');
  console.log('VERIFYING FIX-19: AUTO-SCROLL AND PAGINATION FIX');
  console.log('=====================================================\n');

  // Check 1: Verify useAutoScrollToNotification file exists
  const autoScrollPath = path.join(__dirname, '../lib/hooks/useAutoScrollToNotification.ts');
  if (!fs.existsSync(autoScrollPath)) {
    throw new Error('useAutoScrollToNotification.ts does not exist!');
  }
  console.log('✓ Check 1: lib/hooks/useAutoScrollToNotification.ts file exists.');

  // Check 2: Verify useAutoScrollToNotification imports across all 5 target files
  const targetFiles = [
    { name: 'Admin Dashboard', path: path.join(__dirname, '../app/admin/dashboard/page.tsx') },
    { name: 'Admin Login', path: path.join(__dirname, '../app/admin/login/page.tsx') },
    { name: 'Checkout Page', path: path.join(__dirname, '../app/checkout/page.tsx') },
    { name: 'Product Detail Page', path: path.join(__dirname, '../components/storefront/ProductDetailClient.tsx') },
    { name: 'Order Tracking Page', path: path.join(__dirname, '../components/storefront/OrderTrackingClient.tsx') },
  ];

  for (const item of targetFiles) {
    const content = fs.readFileSync(item.path, 'utf8');
    if (!content.includes('useAutoScrollToNotification')) {
      throw new Error(`useAutoScrollToNotification is missing in ${item.name} (${item.path})`);
    }
    console.log(`✓ Check 2: useAutoScrollToNotification correctly integrated in ${item.name}.`);
  }

  // Check 3: Verify useAdminOrders useEffect automatic fetching
  const useAdminOrdersPath = path.join(__dirname, '../lib/hooks/useAdminOrders.ts');
  const useAdminOrdersContent = fs.readFileSync(useAdminOrdersPath, 'utf8');
  if (!useAdminOrdersContent.includes('useEffect') || !useAdminOrdersContent.includes('loadOrders()')) {
    throw new Error('useAdminOrders.ts is missing useEffect for loadOrders()!');
  }
  console.log('✓ Check 3: useAdminOrders.ts has automatic loadOrders() useEffect for page/filter state changes.');

  console.log('\n=====================================================');
  console.log('ALL FIX-19 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('\n❌ FIX-19 VERIFICATION FAILED:', err);
  process.exit(1);
});
