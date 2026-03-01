import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function setupCore() {
  console.log('🏗️  Setting up core test data...');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Never run test setup in production!');
  }

  try {
    // 1. Create a Super Admin User
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Test Super Admin',
        firstName: 'Test',
        lastName: 'Super Admin',
        email: 'superadmin@test.com',
        passwordHash: superAdminPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Super Admin created (ID: ${superAdmin.id})`);

    // 2. Create a Test School
    const school = await prisma.school.create({
      data: {
        name: 'Test International School',
        schoolCode: 'TEST-INTL',
        subdomain: 'test-intl',
        email: 'info@test-intl.edu',
        phone: '+1234567890',
        address: '123 Test Ave, Testing City',
        status: 'ACTIVE',
        isOnboarded: true,
      },
    });
    console.log(`✅ School created (ID: ${school.id})`);

    // 3. Create a Test School Admin (School Level)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const schoolAdmin = await prisma.user.create({
      data: {
        name: 'Test School Admin',
        firstName: 'Test',
        lastName: 'School Admin',
        email: 'admin@test-intl.edu',
        passwordHash: adminPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    await prisma.userSchool.create({
      data: {
        userId: schoolAdmin.id,
        schoolId: school.id,
        role: 'ADMIN',
      }
    });

    await prisma.administrator.create({
      data: {
        userId: schoolAdmin.id,
        schoolId: school.id,
      }
    });

    console.log(`✅ School Admin created (ID: ${schoolAdmin.id})`);

    // 4. Create an Academic Year for the School
    const academicYear = await prisma.academicYear.create({
      data: {
        name: '2025-2026',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        schoolId: school.id,
        isCurrent: true,
      },
    });
    console.log(`✅ Academic Year created (ID: ${academicYear.id})`);

    console.log('\n======================================');
    console.log('✅ Core test data setup successfully!');
    console.log('======================================\n');
    console.log('Test Credentials:');
    console.log('- Super Admin: superadmin@test.com / superadmin123');
    console.log('- School Admin: admin@test-intl.edu / admin123');

    return { superAdmin, school, schoolAdmin, academicYear };

  } catch (error) {
    console.error('❌ Error setting up core data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupCore()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
