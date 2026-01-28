import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testExtraStudentPricing() {
  console.log('🧪 Testing extra student pricing functionality...');

  try {
    // Fetch a plan to test
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Growth' },
    });

    if (plan) {
      console.log('📋 Plan Details:');
      console.log(`  Name: ${plan.name}`);
      console.log(`  Base Price: ₹${plan.amount.toLocaleString('en-IN')}`);
      console.log(`  Max Students: ${plan.features?.maxStudents || 'N/A'}`);
      console.log(`  Price per Extra Student: ₹${plan.features?.pricePerExtraStudent || 'N/A'}`);

      // Calculate example pricing
      const extraStudents = 50;
      const basePrice = plan.amount;
      const extraStudentCost = (plan.features as any)?.pricePerExtraStudent * extraStudents;
      const totalPrice = basePrice + extraStudentCost;

      console.log('\n💰 Example Pricing (50 extra students):');
      console.log(`  Base Price: ₹${basePrice.toLocaleString('en-IN')}`);
      console.log(`  Extra Students Cost: ₹${extraStudentCost.toLocaleString('en-IN')}`);
      console.log(`  Total Monthly Cost: ₹${totalPrice.toLocaleString('en-IN')}`);
    } else {
      console.log('❌ No Growth plan found');
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testExtraStudentPricing()
    .catch((e) => {
      console.error('❌ Error running test:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { testExtraStudentPricing };