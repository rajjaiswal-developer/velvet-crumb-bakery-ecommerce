const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STAGES = [
  { key: 'ORDER_RECEIVED', label: 'Order Received' },
  { key: 'PROCESSING', label: 'Baking & Processing' },
  { key: 'PACKAGING', label: 'Cake Packaging' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

function getStageSublabel(stageIndex, currentStageIndex) {
  const isCompleted = stageIndex <= currentStageIndex;
  const isCurrent = stageIndex === currentStageIndex;
  const isFinalStage = stageIndex === STAGES.length - 1;

  if (isCompleted) {
    if (isCurrent) {
      return isFinalStage ? 'Completed' : 'In Progress';
    }
    return 'Completed';
  }
  return 'Pending';
}

async function runVerification() {
  console.log('====================================================');
  console.log('VERIFICATION FOR FIX-14: DELIVERED STATUS LABEL');
  console.log('====================================================\n');

  // 1. Setup Test Order
  console.log('1. Creating test order in database...');
  const testReceipt = `FIX14-${Date.now().toString().slice(-6)}`;
  const testPhone = '9876501234';

  const order = await prisma.order.create({
    data: {
      receiptNumber: testReceipt,
      customerName: 'Fix 14 Test Customer',
      customerMobile: testPhone,
      customerEmail: 'fix14test@example.com',
      shippingAddress: '123 Bakery Lane, 12 Bakers Lane, Demo City',
      deliveryTimeSlot: 'Within 2 Hours',
      items: [{ productName: 'Red Velvet Cake', quantity: 1, itemTotal: 650 }],
      totalAmount: 650,
      orderStatus: 'ORDER_RECEIVED',
      paymentStatus: 'SUCCESS',
    },
  });

  console.log(`   Created test order ID: ${order.id} (Receipt #: ${testReceipt})\n`);

  // 2. Test timeline labels across all 5 order status transitions
  console.log('2. Advancing order through all 5 status stages and testing stage sub-labels...\n');

  const statusTransitions = ['ORDER_RECEIVED', 'PROCESSING', 'PACKAGING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  for (let currentStageIdx = 0; currentStageIdx < statusTransitions.length; currentStageIdx++) {
    const currentStatus = statusTransitions[currentStageIdx];

    // Update order status in DB
    await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: currentStatus },
    });

    console.log(`--- Stage [${currentStageIdx + 1}/5]: ${currentStatus} ---`);

    for (let stageIdx = 0; stageIdx < STAGES.length; stageIdx++) {
      const sublabel = getStageSublabel(stageIdx, currentStageIdx);
      console.log(`  - ${STAGES[stageIdx].label} (${STAGES[stageIdx].key}): "${sublabel}"`);

      // Assertions
      if (stageIdx < currentStageIdx) {
        if (sublabel !== 'Completed') {
          throw new Error(`FAILURE at ${currentStatus}: Past stage ${STAGES[stageIdx].key} labeled "${sublabel}", expected "Completed"`);
        }
      } else if (stageIdx === currentStageIdx) {
        const expected = currentStatus === 'DELIVERED' ? 'Completed' : 'In Progress';
        if (sublabel !== expected) {
          throw new Error(`FAILURE at ${currentStatus}: Active stage ${STAGES[stageIdx].key} labeled "${sublabel}", expected "${expected}"`);
        }
      } else {
        if (sublabel !== 'Pending') {
          throw new Error(`FAILURE at ${currentStatus}: Future stage ${STAGES[stageIdx].key} labeled "${sublabel}", expected "Pending"`);
        }
      }
    }

    console.log(`  PASSED: Stage ${currentStatus} sub-labels verified correctly.\n`);
  }

  // 3. Confirm DELIVERED Terminal Stage Specific Requirement
  console.log('3. Verifying terminal DELIVERED stage specifically...');
  const finalDeliveredLabel = getStageSublabel(4, 4);
  console.log(`   DELIVERED stage sub-label when orderStatus = DELIVERED: "${finalDeliveredLabel}"`);

  if (finalDeliveredLabel !== 'Completed') {
    throw new Error(`FAILURE: DELIVERED stage sub-label is "${finalDeliveredLabel}", expected "Completed"`);
  }
  console.log('   PASSED: DELIVERED terminal stage is correctly labeled "Completed" (NOT "In Progress")!\n');

  // 4. Cleanup
  console.log('4. Cleaning up test data...');
  await prisma.order.delete({ where: { id: order.id } });
  console.log('   PASSED: Cleanup complete.\n');

  console.log('====================================================');
  console.log('ALL FIX-14 VERIFICATION CHECKS PASSED SUCCESSFULLY');
  console.log('====================================================');
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
