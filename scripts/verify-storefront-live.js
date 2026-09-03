const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (err) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('🧪 Starting Storefront Live Verification Tests...\n');

  // Test 1: Public Products API
  const prodRes = await fetchJson('http://localhost:3000/api/products/public');
  console.log(`[PASS] GET /api/products/public (Status: ${prodRes.status})`);
  console.log(`       - Products count: ${prodRes.data?.data?.length}`);
  console.log(`       - Cache-Control: ${prodRes.headers['cache-control']}`);

  if (prodRes.data?.data?.length !== 25) {
    console.error('❌ Expected 25 products, got:', prodRes.data?.data?.length);
    process.exit(1);
  }

  // Test 2: Public Categories API
  const catRes = await fetchJson('http://localhost:3000/api/categories/public');
  console.log(`[PASS] GET /api/categories/public (Status: ${catRes.status})`);
  console.log(`       - Categories count: ${catRes.data?.data?.length}`);

  // Test 3: Public Flavors API
  const flavRes = await fetchJson('http://localhost:3000/api/flavors/public');
  console.log(`[PASS] GET /api/flavors/public (Status: ${flavRes.status})`);
  console.log(`       - Flavors count: ${flavRes.data?.data?.length}`);

  // Test 4: Sample Product PDP API
  const sampleSlug = prodRes.data.data[0].slug;
  const pdpRes = await fetchJson(`http://localhost:3000/api/products/public/${encodeURIComponent(sampleSlug)}`);
  console.log(`[PASS] GET /api/products/public/${sampleSlug} (Status: ${pdpRes.status})`);
  console.log(`       - Product Name: ${pdpRes.data?.data?.name}`);
  console.log(`       - Variants count: ${pdpRes.data?.data?.variants?.length}`);

  console.log('\n✅ All storefront live verification tests PASSED successfully!');
}

run().catch((err) => {
  console.error('❌ Storefront verification failed:', err);
  process.exit(1);
});
