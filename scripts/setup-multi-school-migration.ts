#!/usr/bin/env tsx

/**
 * Setup script for multi-school migration
 * Creates the necessary database structure and migrates existing data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupMultiSchoolMigration() {
  console.log('🏗️  Setting up multi-school migration...\n');

  try {
    // Step 1: Create default school first
    console.log('1️⃣  Creating default school...');
    const schoolCode = `DEFAULT${Date.now().toString().slice(-6)}`;

    const defaultSchool = await prisma.school.create({
      data: {
        name: 'Default School',
        schoolCode,
        email: 'admin@defaultschool.com',
        phone: '+1234567890',
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: true,
        onboardingStep: 7,
        onboardingCompletedAt: new Date(),
      },
    });

    console.log(`✅ Created default school: ${defaultSchool.name} (${defaultSchool.schoolCode})`);

    // Step 2: Create subscription
    await prisma.subscription.create({
      data: {
        schoolId: defaultSchool.id,
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        paymentStatus: 'COMPLETED',
      },
    });

    // Step 3: Create usage counter
    await prisma.usageCounter.create({
      data: {
        schoolId: defaultSchool.id,
        month: new Date().toISOString().slice(0, 7),
        whatsappLimit: 1000,
        smsLimit: 1000,
        storageLimitMB: 1024,
      },
    });

    // Step 4: Migrate existing data to default school
    console.log('\n2️⃣  Migrating existing data...');

    // Get existing system settings
    const systemSettings = await prisma.systemSettings.findFirst();
    if (systemSettings) {
      // Update school with system settings data
      await prisma.school.update({
        where: { id: defaultSchool.id },
        data: {
          name: systemSettings.schoolName || defaultSchool.name,
          email: systemSettings.schoolEmail || defaultSchool.email,
          phone: systemSettings.schoolPhone || defaultSchool.phone,
        },
      });
      console.log('✅ Updated school with system settings');
    }

    // Migrate administrators
    const adminCount = await prisma.administrator.count();
    if (adminCount > 0) {
      await prisma.administrator.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${adminCount} administrators`);
    }

    // Migrate teachers
    const teacherCount = await prisma.teacher.count();
    if (teacherCount > 0) {
      await prisma.teacher.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${teacherCount} teachers`);
    }

    // Migrate students
    const studentCount = await prisma.student.count();
    if (studentCount > 0) {
      await prisma.student.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${studentCount} students`);
    }

    // Migrate parents
    const parentCount = await prisma.parent.count();
    if (parentCount > 0) {
      await prisma.parent.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${parentCount} parents`);
    }

    // Migrate academic data
    const academicYearCount = await prisma.academicYear.count();
    if (academicYearCount > 0) {
      await prisma.academicYear.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${academicYearCount} academic years`);
    }

    const termCount = await prisma.term.count();
    if (termCount > 0) {
      await prisma.term.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${termCount} terms`);
    }

    const classCount = await prisma.class.count();
    if (classCount > 0) {
      await prisma.class.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${classCount} classes`);
    }

    const sectionCount = await prisma.classSection.count();
    if (sectionCount > 0) {
      await prisma.classSection.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${sectionCount} class sections`);
    }

    const attendanceCount = await prisma.studentAttendance.count();
    if (attendanceCount > 0) {
      await prisma.studentAttendance.updateMany({
        data: { schoolId: defaultSchool.id },
      });
      console.log(`✅ Migrated ${attendanceCount} attendance records`);
    }

    // Step 5: Create user-school relationships
    console.log('\n3️⃣  Creating user-school relationships...');
    const users = await prisma.user.findMany({
      select: { id: true, role: true },
    });

    for (const user of users) {
      const existing = await prisma.userSchool.findFirst({
        where: {
          userId: user.id,
          schoolId: defaultSchool.id,
        },
      });

      if (!existing) {
        await prisma.userSchool.create({
          data: {
            userId: user.id,
            schoolId: defaultSchool.id,
            role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : user.role,
            isActive: true,
          },
        });
      }
    }

    console.log(`✅ Created user-school relationships for ${users.length} users`);

    // Step 6: Create super admin if needed
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });

    if (superAdminCount === 0) {
      console.log('\n👑 Creating super admin user...');
      const bcrypt = await import('bcryptjs');

      const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

      const superAdmin = await prisma.user.create({
        data: {
          email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@sikshamitra.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          active: true,
        },
      });

      await prisma.userSchool.create({
        data: {
          userId: superAdmin.id,
          schoolId: defaultSchool.id,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });

      console.log(`✅ Created super admin: ${superAdmin.email}`);
      console.log(`🔑 Password: ${superAdminPassword}`);
    }

    console.log('\n🎉 Multi-school migration setup completed!');
    console.log('\n📊 Migration Summary:');
    console.log(`   - Default School: ${defaultSchool.name} (${defaultSchool.schoolCode})`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Administrators: ${adminCount}`);
    console.log(`   - Teachers: ${teacherCount}`);
    console.log(`   - Students: ${studentCount}`);
    console.log(`   - Classes: ${classCount}`);

  } catch (error) {
    console.error('❌ Migration setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupMultiSchoolMigration()
  .then(() => {
    console.log('\n✅ Ready for next steps!');
    console.log('Run: npx tsx scripts/final-security-verification.ts');
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });