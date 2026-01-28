const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const schoolCount = await prisma.school.count();
    console.log(`Schools in database: ${schoolCount}`);
    
    if (schoolCount > 0) {
      const schools = await prisma.school.findMany({ take: 3 });
      console.log('Sample schools:', schools.map(s => ({ id: s.id, name: s.name })));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();