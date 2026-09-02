const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runLiveTest() {
  console.log('====================================================');
  console.log('E2E LIVE ADMIN MUTATION & STOREFRONT REVALIDATION TEST');
  console.log('====================================================\n');

  // 1. Log in as Admin
  console.log('1. Logging in as Admin (admin@velvetcrumbdemo.com)...');
  const loginPayload = JSON.stringify({ email: 'admin@velvetcrumbdemo.com', password: 'AdminVelvet#2026!' });
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload),
      },
    },
    loginPayload
  );

  if (loginRes.status !== 200) {
    console.error('❌ Admin login failed:', loginRes.status, loginRes.body);
    process.exit(1);
  }

  const setCookie = loginRes.headers['set-cookie'];
  const sessionCookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie || '';
  console.log('✓ Admin login successful! Received session cookie.\n');

  // 2. Fetch public products list to find target product
  console.log('2. Fetching current public storefront products (populates Next.js cache)...');
  const initialProductsRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products/public',
    method: 'GET',
  });

  const productsData = JSON.parse(initialProductsRes.body);
  const targetProduct = productsData.data?.[0];

  if (!targetProduct) {
    console.error('❌ No products found in storefront.');
    process.exit(1);
  }

  const originalName = targetProduct.name;
  const productId = targetProduct.id;
  const testName = `${originalName} (INSTANT REVALIDATED)`;

  console.log(`   Target Product: "${originalName}" (ID: ${productId}, Slug: ${targetProduct.slug})\n`);

  // 3. Admin edits product name via Admin API route
  console.log(`3. Admin editing product name to "${testName}" via PUT /api/admin/products/${productId}...`);
  const updatePayload = JSON.stringify({
    name: testName,
  });

  const updateRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${productId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updatePayload),
        Cookie: sessionCookie,
      },
    },
    updatePayload
  );

  const updateResponseBody = JSON.parse(updateRes.body);
  if (updateRes.status !== 200 || !updateResponseBody.success) {
    console.error('❌ Product update failed:', updateRes.status, updateResponseBody);
    process.exit(1);
  }

  console.log('✓ Admin DB write succeeded and revalidateCatalog([catalog, products]) triggered!\n');

  // 4. Immediately fetch public storefront endpoint & HTML page as customer WITHOUT DELAY
  console.log('4. Immediately fetching public products API as customer (Next request after admin edit)...');
  const revalidatedApiRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products/public',
    method: 'GET',
  });

  const revalidatedApiData = JSON.parse(revalidatedApiRes.body);
  const updatedInApi = revalidatedApiData.data?.find((p) => p.id === productId);

  if (updatedInApi && updatedInApi.name === testName) {
    console.log(`✓ SUCCESS: Storefront API returned updated name "${updatedInApi.name}" INSTANTLY!`);
  } else {
    console.error(`❌ FAIL: Storefront API returned stale name "${updatedInApi?.name}".`);
    process.exit(1);
  }

  // 5. Revert product name back to original
  console.log(`\n5. Admin reverting product name back to "${originalName}"...`);
  const revertPayload = JSON.stringify({
    name: originalName,
  });

  const revertRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${productId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(revertPayload),
        Cookie: sessionCookie,
      },
    },
    revertPayload
  );

  if (revertRes.status !== 200) {
    console.error('❌ Revert failed:', revertRes.status, revertRes.body);
    process.exit(1);
  }

  // 6. Verify revert on next load
  const finalApiRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/products/public',
    method: 'GET',
  });

  const finalApiData = JSON.parse(finalApiRes.body);
  const revertedInApi = finalApiData.data?.find((p) => p.id === productId);

  if (revertedInApi && revertedInApi.name === originalName) {
    console.log(`✓ SUCCESS: Storefront API reverted name to "${revertedInApi.name}" INSTANTLY!`);
  } else {
    console.error(`❌ FAIL: Revert verification failed.`);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('E2E REVALIDATION VERIFICATION COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

runLiveTest().catch((err) => {
  console.error('E2E Test Error:', err);
  process.exit(1);
});
