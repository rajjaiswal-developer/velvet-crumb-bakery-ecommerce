const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function runVerification() {
  console.log('=== VERIFICATION GATE: FIX 06 (PRODUCT TRANSACTION & IMAGE SHAPE) ===\n');

  // 1. Fetch subcategory & flavor to use for test product
  const subcategory = await db.category.findFirst({
    where: { parentId: { not: null } },
  });
  if (!subcategory) {
    throw new Error('No subcategory found in database. Seed database first.');
  }

  const flavorRecord = await db.flavor.findFirst();

  const testSlug = `fix06-test-cake-${Date.now()}`;
  const imageUrl = 'https://ik.imagekit.io/by3es5jcax/products/fix06-test-image.jpg';
  const fileId = 'fix06_test_file_id_123';

  // --- TEST 1: CREATE PRODUCT WITH IMAGE OBJECT ARRAY & MEASURE LATENCY ---
  console.log('1. Creating product WITH structured image object array [{ url, fileId }]...');
  const createStart = Date.now();

  let createdProduct;
  try {
    const productData = {
      name: 'Fix06 Test Cake',
      slug: testSlug,
      categoryId: subcategory.id,
      description: 'A delicious test cake for verifying fix-06 transaction and image validation.',
      flavorId: flavorRecord ? flavorRecord.id : null,
      isActive: true,
      isFeatured: false,
      images: [{ url: imageUrl, fileId: fileId }],
      variants: {
        create: [
          { label: '500g', price: 450, stockQuantity: 10, reservedQuantity: 0 },
          { label: '1kg', price: 850, stockQuantity: 5, reservedQuantity: 0 },
        ],
      },
    };

    createdProduct = await db.product.create({
      data: productData,
      include: { variants: true, category: true },
    });

    const createDuration = Date.now() - createStart;
    console.log(`   -> Created Product ID: ${createdProduct.id}`);
    console.log(`   -> Duration: ${createDuration} ms (Target: < 5000 ms timeout window)`);

    if (createDuration >= 5000) {
      throw new Error(`FAIL: Product creation took ${createDuration} ms, exceeding transaction timeout window!`);
    }

    // Validate image shape on created product
    const images = createdProduct.images;
    if (!Array.isArray(images) || images.length === 0 || typeof images[0] !== 'object' || images[0].url !== imageUrl) {
      throw new Error(`FAIL: Product image shape mismatch after creation! Received: ${JSON.stringify(images)}`);
    }
    console.log('   -> Image shape verified:', JSON.stringify(images));

    // --- TEST 2: EDIT EXISTING PRODUCT DETAILS (NO IMAGE CHANGE) & MEASURE LATENCY ---
    console.log('\n2. Updating product details (name & variants) without changing images...');
    const updateStart1 = Date.now();

    const updatedProduct1 = await db.$transaction(async (tx) => {
      // Update variant stock
      await tx.variant.update({
        where: { id: createdProduct.variants[0].id },
        data: { stockQuantity: 15 },
      });

      return tx.product.update({
        where: { id: createdProduct.id },
        data: {
          description: 'Updated description during fix-06 verification.',
        },
        include: { variants: true },
      });
    });

    const updateDuration1 = Date.now() - updateStart1;
    console.log(`   -> Duration: ${updateDuration1} ms (Target: < 5000 ms)`);

    if (updateDuration1 >= 5000) {
      throw new Error(`FAIL: Product update took ${updateDuration1} ms, exceeding transaction timeout window!`);
    }
    console.log('   -> Product updated successfully.');

    // --- TEST 3: EDIT PRODUCT IMAGE SPECIFICALLY ---
    console.log('\n3. Updating product image specifically to new image object...');
    const newImageUrl = 'https://ik.imagekit.io/by3es5jcax/products/fix06-updated-image.jpg';
    const newFileId = 'fix06_updated_file_id_456';

    const updateStart2 = Date.now();
    const updatedProduct2 = await db.product.update({
      where: { id: createdProduct.id },
      data: {
        images: [{ url: newImageUrl, fileId: newFileId }],
      },
    });
    const updateDuration2 = Date.now() - updateStart2;
    console.log(`   -> Duration: ${updateDuration2} ms`);

    const updatedImages = updatedProduct2.images;
    if (!Array.isArray(updatedImages) || updatedImages[0]?.url !== newImageUrl) {
      throw new Error(`FAIL: Product image update failed! Received: ${JSON.stringify(updatedImages)}`);
    }
    console.log('   -> Image update verified:', JSON.stringify(updatedImages));

    // --- TEST 4: AUDIT ALL PRODUCTS IN DB FOR IMAGE SHAPE COMPATIBILITY ---
    console.log('\n4. Auditing database product images shape across all non-deleted products...');
    const allProducts = await db.product.findMany({ where: { isDeleted: false } });
    for (const p of allProducts) {
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          if (typeof img === 'string') {
            throw new Error(
              `FAIL: Found unmigrated raw string image URL in product "${p.name}" (ID: ${p.id}): "${img}"`
            );
          }
        }
      }
    }
    console.log(`   -> All ${allProducts.length} active product(s) in DB verified to have valid image object shapes.`);
  } finally {
    if (createdProduct) {
      await db.product.delete({ where: { id: createdProduct.id } });
      console.log('\n   -> Hard-cleaned up test product from DB.');
    }
  }

  console.log('\n=== VERIFICATION SUCCESSFUL: FIX 06 PASSED ALL GATES ===');
  await db.$disconnect();
}

runVerification().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
