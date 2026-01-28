import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const planUpdates = [
  {
    name: 'Starter',
    pricePerExtraStudent: 30,
  },
  {
    name: 'Growth',
    pricePerExtraStudent: 25,
  },
  {
    name: 'Enterprise',
    pricePerExtraStudent: 20,
  },
  {
    name: 'Starter Yearly',
    pricePerExtraStudent: 30,
  },
  {
    name: 'Growth Yearly',
    pricePerExtraStudent: 25,
  },
  {
    name: 'Enterprise Yearly',
    pricePerExtraStudent: 20,
  },
];

async function updatePlansWithExtraStudentPricing() {
  console.log('🔄 Updating subscription plans with extra student pricing...');

  for (const update of planUpdates) {
    try {
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: { name: update.name },
      });

      if (existingPlan) {
        const currentFeatures = existingPlan.features as any;
        const updatedFeatures = {
          ...currentFeatures,
          pricePerExtraStudent: update.pricePerExtraStudent,
        };

        await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: {
            features: updatedFeatures,
          },
        });

        console.log(`✅ Updated plan: ${update.name} with ₹${update.pricePerExtraStudent}/extra student`);
      } else {
        console.log(`⚠️  Plan not found: ${update.name}`);
      }
    } catch (error) {
      console.error(`❌ Error updating plan ${update.name}:`, error);
    }
  }

  console.log('🎉 Plan updates completed!');
}

if (require.main === module) {
  updatePlansWithExtraStudentPricing()
    .catch((e) => {
      console.error('❌ Error updating plans:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { updatePlansWithExtraStudentPricing };