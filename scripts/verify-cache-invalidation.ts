import { db } from '../lib/db/client';
import { getCachedPublicProducts, getCachedPublicCategories, getCachedPublicFlavors, revalidateCatalog, CACHE_TAGS } from '../lib/cache';

async function runVerification() {
  console.log('=== Starting Cache & Revalidation Verification ===\n');

  // 1. Test Cached Fetching
  console.log('1. Testing getCachedPublicProducts, getCachedPublicCategories, getCachedPublicFlavors...');
  const productsInitial = await getCachedPublicProducts();
  const categoriesInitial = await getCachedPublicCategories();
  const flavorsInitial = await getCachedPublicFlavors();

  console.log(`✓ Fetched ${productsInitial.length} products, ${categoriesInitial.length} categories, ${flavorsInitial.length} flavors.`);

  // 2. Find a test product
  const targetProduct = productsInitial[0];
  if (!targetProduct) {
    console.error('❌ No products found in database to perform verification.');
    process.exit(1);
  }

  console.log(`\n2. Target Product: "${targetProduct.name}" (ID: ${targetProduct.id}, Slug: ${targetProduct.slug})`);

  // 3. Update product name in DB to test on-demand revalidation
  const updatedName = `${targetProduct.name} (Verified)`;
  console.log(`Updating product name to "${updatedName}"...`);

  await db.product.update({
    where: { id: targetProduct.id },
    data: { name: updatedName },
  });

  // Call revalidate helper (simulates admin action)
  revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.PRODUCTS]);

  // Re-fetch cached products
  const productsUpdated = await getCachedPublicProducts();
  const foundUpdated = productsUpdated.find((p) => p.id === targetProduct.id);

  if (foundUpdated && foundUpdated.name === updatedName) {
    console.log('✓ SUCCESS: Storefront catalog revalidated on-demand! Updated product name returned instantly.');
  } else {
    console.error('❌ FAILURE: Cached catalog did not update after revalidation.');
  }

  // Restore product name
  await db.product.update({
    where: { id: targetProduct.id },
    data: { name: targetProduct.name },
  });
  revalidateCatalog([CACHE_TAGS.CATALOG, CACHE_TAGS.PRODUCTS]);

  // 4. Test PDP Live Stock Read
  console.log('\n3. Testing PDP Live Stock Uncached Read...');
  const variantToTest = targetProduct.variants[0];
  if (variantToTest) {
    const originalStock = variantToTest.stockQuantity;
    const testStock = originalStock + 99;

    console.log(`Updating variant "${variantToTest.label}" stockQuantity from ${originalStock} to ${testStock}...`);
    await db.variant.update({
      where: { id: variantToTest.id },
      data: { stockQuantity: testStock },
    });

    // Query DB directly (simulates live PDP endpoint query)
    const pdpDirectProduct = await db.product.findFirst({
      where: {
        slug: targetProduct.slug.trim(),
        isDeleted: false,
        isActive: true,
      },
      include: {
        variants: { orderBy: { price: 'asc' } },
      },
    });

    const pdpVariant = pdpDirectProduct?.variants.find((v) => v.id === variantToTest.id);
    if (pdpVariant && pdpVariant.stockQuantity === testStock) {
      console.log(`✓ SUCCESS: PDP query fetched live stock (${pdpVariant.stockQuantity}) directly from DB!`);
    } else {
      console.error('❌ FAILURE: PDP query did not reflect live stock update.');
    }

    // Revert variant stock
    await db.variant.update({
      where: { id: variantToTest.id },
      data: { stockQuantity: originalStock },
    });
    console.log(`Reverted variant stock back to ${originalStock}.`);
  }

  console.log('\n=== Cache & Revalidation Verification Complete ===');
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification error:', err);
    process.exit(1);
  });
