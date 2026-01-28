import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subscriptionPlans = [
  {
    name: 'Starter',
    description: 'Perfect for small schools getting started with digital management',
    amount: 2999, // ₹29.99 per month
    currency: 'inr',
    interval: 'monthly',
    features: {
      maxStudents: 100,
      maxTeachers: 10,
      maxAdmins: 2,
      storageGB: 5,
      whatsappMessages: 1000,
      smsMessages: 500,
      pricePerExtraStudent: 30,
      emailSupport: true,
      phoneSupport: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      advancedReports: false,
      multipleSchools: false,
      backupFrequency: 'weekly',
    },
    isActive: true,
  },
  {
    name: 'Growth',
    description: 'Ideal for growing schools with advanced features and priority support',
    amount: 4999, // ₹49.99 per month
    currency: 'inr',
    interval: 'monthly',
    features: {
      maxStudents: 500,
      maxTeachers: 50,
      maxAdmins: 5,
      storageGB: 25,
      whatsappMessages: 5000,
      smsMessages: 2500,
      pricePerExtraStudent: 25,
      emailSupport: true,
      phoneSupport: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      advancedReports: true,
      multipleSchools: false,
      backupFrequency: 'daily',
    },
    isActive: true,
  },
  {
    name: 'Enterprise',
    description: 'Complete solution for large institutions with unlimited resources',
    amount: 9999, // ₹99.99 per month
    currency: 'inr',
    interval: 'monthly',
    features: {
      maxStudents: -1, // Unlimited
      maxTeachers: -1, // Unlimited
      maxAdmins: -1, // Unlimited
      storageGB: 100,
      whatsappMessages: 25000,
      smsMessages: 10000,
      pricePerExtraStudent: 20,
      emailSupport: true,
      phoneSupport: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      advancedReports: true,
      multipleSchools: true,
      backupFrequency: 'daily',
    },
    isActive: true,
  },
  {
    name: 'Starter Yearly',
    description: 'Starter plan with yearly billing (2 months free)',
    amount: 29990, // ₹299.90 per year (10 months price)
    currency: 'inr',
    interval: 'yearly',
    features: {
      maxStudents: 100,
      maxTeachers: 10,
      maxAdmins: 2,
      storageGB: 5,
      whatsappMessages: 1000,
      smsMessages: 500,
      pricePerExtraStudent: 30,
      emailSupport: true,
      phoneSupport: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      advancedReports: false,
      multipleSchools: false,
      backupFrequency: 'weekly',
    },
    isActive: true,
  },
  {
    name: 'Growth Yearly',
    description: 'Growth plan with yearly billing (2 months free)',
    amount: 49990, // ₹499.90 per year (10 months price)
    currency: 'inr',
    interval: 'yearly',
    features: {
      maxStudents: 500,
      maxTeachers: 50,
      maxAdmins: 5,
      storageGB: 25,
      whatsappMessages: 5000,
      smsMessages: 2500,
      pricePerExtraStudent: 25,
      emailSupport: true,
      phoneSupport: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      advancedReports: true,
      multipleSchools: false,
      backupFrequency: 'daily',
    },
    isActive: true,
  },
  {
    name: 'Enterprise Yearly',
    description: 'Enterprise plan with yearly billing (2 months free)',
    amount: 99990, // ₹999.90 per year (10 months price)
    currency: 'inr',
    interval: 'yearly',
    features: {
      maxStudents: -1, // Unlimited
      maxTeachers: -1, // Unlimited
      maxAdmins: -1, // Unlimited
      storageGB: 100,
      whatsappMessages: 25000,
      smsMessages: 10000,
      pricePerExtraStudent: 20,
      emailSupport: true,
      phoneSupport: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      advancedReports: true,
      multipleSchools: true,
      backupFrequency: 'daily',
    },
    isActive: true,
  },
];

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  for (const planData of subscriptionPlans) {
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: planData.name },
    });

    if (!existingPlan) {
      await prisma.subscriptionPlan.create({
        data: planData,
      });
      console.log(`✅ Created plan: ${planData.name}`);
    } else {
      console.log(`⏭️  Plan already exists: ${planData.name}`);
    }
  }

  console.log('🎉 Subscription plans seeding completed!');
}

if (require.main === module) {
  seedSubscriptionPlans()
    .catch((e) => {
      console.error('❌ Error seeding subscription plans:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedSubscriptionPlans };