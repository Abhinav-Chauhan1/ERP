import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyParentSettings() {
  console.log('🔍 Verifying parent settings...\n');

  // Get all parents
  const parents = await prisma.parent.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      settings: true,
    },
  });

  console.log(`Total parents: ${parents.length}\n`);

  // Check each parent has settings
  let allHaveSettings = true;
  for (const parent of parents) {
    const hasSettings = parent.settings !== null;
    const status = hasSettings ? '✅' : '❌';
    console.log(
      `${status} ${parent.user.firstName} ${parent.user.lastName} (${parent.user.email})`
    );
    if (hasSettings && parent.settings) {
      console.log(`   Settings ID: ${parent.settings.id}`);
      console.log(`   Email Notifications: ${parent.settings.emailNotifications}`);
      console.log(`   Preferred Contact: ${parent.settings.preferredContactMethod}`);
      console.log(`   Theme: ${parent.settings.theme}`);
    } else {
      allHaveSettings = false;
      console.log('   ⚠️  No settings found!');
    }
    console.log('');
  }

  if (allHaveSettings) {
    console.log('✅ All parents have settings records!');
  } else {
    console.log('❌ Some parents are missing settings records!');
    process.exit(1);
  }

  await prisma.$disconnect();
}

verifyParentSettings().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
