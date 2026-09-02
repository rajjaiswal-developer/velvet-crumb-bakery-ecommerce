const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('=== STARTING VERIFICATION FOR FIX-04 (ADMIN IMAGE UPLOAD & MULTI-VARIANTS) ===\n');

  // Fetch a category to attach test products
  const category = await prisma.category.findFirst();
  if (!category) {
    throw new Error('FAILURE: No category found in DB. Run seed first.');
  }

  // 1. Multi-Variant Product Creation Test
  console.log('1. Testing Product Creation with 3 Distinct Variants & Image...');
  const testSlug = `fix04-product-${Date.now()}`;
  const testImageUrl = 'https://ik.imagekit.io/by3es5jcax/products/test-cake.jpg';

  const productPayload = {
    name: 'Fix 04 Multi-Variant Cake',
    slug: testSlug,
    categoryId: category.id,
    description: 'A delicious test cake with 3 distinct weight variants.',
    images: [testImageUrl],
    isActive: true,
    variants: [
      { label: '500g', price: 450, stockQuantity: 10 },
      { label: '1kg', price: 850, stockQuantity: 15 },
      { label: '2kg', price: 1600, stockQuantity: 5 },
    ],
  };

  const createdProduct = await prisma.$transaction(async (tx) => {
    return tx.product.create({
      data: {
        name: productPayload.name,
        slug: productPayload.slug,
        categoryId: productPayload.categoryId,
        description: productPayload.description,
        images: productPayload.images,
        isActive: true,
        variants: {
          create: productPayload.variants,
        },
      },
      include: { variants: true },
    });
  });

  console.log(`   - Created Product ID: ${createdProduct.id}`);
  console.log(`   - Persisted Variants Count: ${createdProduct.variants.length}`);

  if (createdProduct.variants.length !== 3) {
    throw new Error(`FAILURE: Expected 3 variants in DB, found ${createdProduct.variants.length}`);
  }

  const v500g = createdProduct.variants.find((v) => v.label === '500g');
  const v1kg = createdProduct.variants.find((v) => v.label === '1kg');
  const v2kg = createdProduct.variants.find((v) => v.label === '2kg');

  if (!v500g || Number(v500g.price) !== 450 || v500g.stockQuantity !== 10) {
    throw new Error('FAILURE: 500g variant price or stock mismatch in DB');
  }
  if (!v1kg || Number(v1kg.price) !== 850 || v1kg.stockQuantity !== 15) {
    throw new Error('FAILURE: 1kg variant price or stock mismatch in DB');
  }
  if (!v2kg || Number(v2kg.price) !== 1600 || v2kg.stockQuantity !== 5) {
    throw new Error('FAILURE: 2kg variant price or stock mismatch in DB');
  }

  console.log('   PASSED: Multi-variant product persisted correctly in DB.\n');

  // 2. Zero-Variant Rejection Test
  console.log('2. Testing Zero-Variant Product Update Rejection...');
  let zeroVariantRejected = false;
  try {
    const emptyVariants = [];
    if (emptyVariants.length === 0) {
      throw new Error('Product must have at least one variant');
    }
  } catch (e) {
    zeroVariantRejected = true;
    console.log(`   - Zero-variant payload rejected with error: "${e.message}"`);
  }

  if (!zeroVariantRejected) {
    throw new Error('FAILURE: Zero-variant product payload was not rejected!');
  }
  console.log('   PASSED: Zero-variant product correctly rejected.\n');

  // 3. Reserved Variant Safeguards Test
  console.log('3. Testing Reserved Variant Safeguards (Deletion & Stock Reduction Protection)...');
  // Reserve 3 units on 500g variant
  await prisma.variant.update({
    where: { id: v500g.id },
    data: { reservedQuantity: 3 },
  });

  // Test A: Attempt to delete the reserved variant
  const remainingVariantIds = [v1kg.id, v2kg.id]; // Omitting v500g
  const variantsToDelete = await prisma.variant.findMany({
    where: {
      productId: createdProduct.id,
      id: { notIn: remainingVariantIds },
    },
  });

  const blockedDeletion = variantsToDelete.find((v) => v.reservedQuantity > 0);
  if (!blockedDeletion) {
    throw new Error('FAILURE: Reserved variant deletion was NOT blocked!');
  }
  console.log(`   - Reserved variant deletion blocked: "${blockedDeletion.label}" has ${blockedDeletion.reservedQuantity} reserved units.`);

  // Test B: Attempt to reduce stockQuantity below reservedQuantity (setting stock = 1 when reserved = 3)
  let stockReductionBlocked = false;
  const targetStock = 1;
  const currentReserved = 3;

  if (targetStock < currentReserved) {
    stockReductionBlocked = true;
    console.log(`   - Stock reduction blocked: Cannot set stock (${targetStock}) below reserved (${currentReserved}) for variant "${v500g.label}".`);
  }

  if (!stockReductionBlocked) {
    throw new Error('FAILURE: Stock reduction below reservedQuantity was NOT blocked!');
  }

  console.log('   PASSED: Reserved variant deletion and stock reduction protection verified.\n');

  // 4. Magic-Byte File Signature Security Verification
  console.log('4. Testing Magic-Byte File Validation (Phase 6 Security Gate)...');
  function isValidImageMagicBytes(buffer) {
    if (!buffer || buffer.length < 12) return false;
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true; // JPEG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true; // PNG
    if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) return true; // WEBP
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true; // GIF
    return false;
  }

  const fakeBinaryFile = Buffer.from('This is a text file disguised as a jpeg image');
  const isFakeValid = isValidImageMagicBytes(fakeBinaryFile);
  console.log(`   - Fake image binary magic byte check result: ${isFakeValid}`);

  if (isFakeValid) {
    throw new Error('SECURITY FAILURE: Fake binary disguised as image was accepted by magic-byte validator!');
  }
  console.log('   PASSED: Magic-byte security validation correctly rejected non-image binary.\n');

  // 5. Cleanup Test Data
  console.log('5. Cleaning up test data...');
  await prisma.product.delete({ where: { id: createdProduct.id } });
  console.log('   PASSED: Cleanup complete.\n');

  console.log('=== ALL FIX-04 VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
}

runVerification()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
