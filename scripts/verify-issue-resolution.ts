import { db } from '../lib/db/client.js';
import { productUpdateSchema } from '../lib/validation/schemas.js';

async function main() {
  console.log('=== VERIFYING ISSUE RESOLUTION ===\n');

  // Test 1: Verify Royal Red Velvet Heart Cake in DB
  const redVelvet = await db.product.findFirst({
    where: {
      slug: 'royal-red-velvet-heart-cake',
      isActive: true,
      isDeleted: false,
    },
    include: { category: true, flavor: true, variants: true }
  });

  if (!redVelvet) {
    throw new Error('FAILED Test 1: Royal Red Velvet Heart Cake not found in DB with exact slug "royal-red-velvet-heart-cake"');
  }
  console.log('✅ Test 1 Passed: Royal Red Velvet Heart Cake found:');
  console.log(`   ID: ${redVelvet.id}`);
  console.log(`   Name: "${redVelvet.name}"`);
  console.log(`   Slug: "${redVelvet.slug}" (len: ${redVelvet.slug.length})`);
  console.log(`   Category: "${redVelvet.category.name}"`);
  console.log(`   Flavor: "${redVelvet.flavor?.name || 'N/A'}"`);
  console.log(`   isActive: ${redVelvet.isActive}, isDeleted: ${redVelvet.isDeleted}`);

  // Test 2: Verify all active products in DB are loadable and have clean slugs without trailing whitespace
  const activeProducts = await db.product.findMany({
    where: { isActive: true, isDeleted: false },
    include: { category: true, variants: true }
  });

  console.log(`\n✅ Test 2: Auditing all ${activeProducts.length} active products in DB:`);
  for (const p of activeProducts) {
    if (p.slug !== p.slug.trim()) {
      throw new Error(`FAILED Test 2: Product "${p.name}" has untrimmed slug "${p.slug}"`);
    }
    console.log(`   - "${p.name}" -> slug: "${p.slug}" (OK)`);
  }

  // Test 3: Test schema validation trimming on product updates
  console.log('\n✅ Test 3: Testing Zod schema validation trimming...');
  const testInputWithSpace = {
    name: '  Black Forest  ',
    slug: '  black-forest  ',
    categoryId: redVelvet.categoryId,
    description: 'Fresh Black Forest Cake',
    images: [{ url: 'https://example.com/test.jpg' }],
    variants: [{ label: '500g ', price: 700, stockQuantity: 10 }]
  };

  const parsed = productUpdateSchema.safeParse(testInputWithSpace);
  if (!parsed.success) {
    throw new Error(`FAILED Test 3: Schema validation failed: ${parsed.error.message}`);
  }
  if (parsed.data.slug !== 'black-forest') {
    throw new Error(`FAILED Test 3: Slug was not trimmed! Got "${parsed.data.slug}"`);
  }
  if (parsed.data.name !== 'Black Forest') {
    throw new Error(`FAILED Test 3: Name was not trimmed! Got "${parsed.data.name}"`);
  }
  if (parsed.data.variants?.[0]?.label !== '500g') {
    throw new Error(`FAILED Test 3: Variant label was not trimmed! Got "${parsed.data.variants?.[0]?.label}"`);
  }
  console.log('   Schema validation automatically trimmed slug, name, and variant labels!');

  // Test 4: Simulate updating image on a DIFFERENT product and confirming slug remains intact
  console.log('\n✅ Test 4: Re-testing image update on a DIFFERENT product...');
  const targetProduct = await db.product.findFirst({
    where: {
      slug: 'black-forest',
      isActive: true,
      isDeleted: false
    }
  });

  if (!targetProduct) {
    throw new Error('FAILED Test 4: Black Forest product not found for image update test');
  }

  console.log(`   Target Product: "${targetProduct.name}" (ID: ${targetProduct.id}, Slug: "${targetProduct.slug}")`);

  // Simulate updating images payload as an admin would send via PUT /api/admin/products/[id]
  const updatePayload = {
    name: targetProduct.name,
    slug: targetProduct.slug,
    categoryId: targetProduct.categoryId,
    description: targetProduct.description,
    images: [
      {
        url: 'https://ik.imagekit.io/by3es5jcax/products/images__2__qIvPlgnQI.jpg',
        fileId: '6a632bf85c7cd75eb8b36fed'
      }
    ]
  };

  const validatedUpdate = productUpdateSchema.parse(updatePayload);
  const updatedProduct = await db.product.update({
    where: { id: targetProduct.id },
    data: {
      name: validatedUpdate.name,
      slug: validatedUpdate.slug,
      images: validatedUpdate.images as any
    }
  });

  console.log(`   Updated Product Slug: "${updatedProduct.slug}" (len: ${updatedProduct.slug.length})`);
  if (updatedProduct.slug !== 'black-forest') {
    throw new Error(`FAILED Test 4: Image update corrupted slug to "${updatedProduct.slug}"`);
  }
  console.log('   Image update on different product succeeded with exact slug preserved!');

  console.log('\n==================================================');
  console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('==================================================');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
