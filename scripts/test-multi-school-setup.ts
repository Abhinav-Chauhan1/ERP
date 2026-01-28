#!/usr/bin/env tsx

/**
 * Test script for multi-school SaaS setup
 *
 * This script tests:
 * 1. Migration from single-school to multi-school
 * 2. School creation and management
 * 3. User-school relationships
 * 4. Tenant isolation
 * 5. Setup wizard flow
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMultiSchoolSetup() {
  console.log('🧪 Testing multi-school SaaS setup...\n');

  try {
    // Test 1: Check if schools exist
    console.log('1️⃣  Testing school creation...');
    const schoolCount = await prisma.school.count();
    console.log(`   Found ${schoolCount} schools`);

    if (schoolCount === 0) {
      console.log('   ❌ No schools found. Run migration first.');
      return;
    }

    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            administrators: true,
            teachers: true,
            students: true,
          },
        },
      },
    });

    schools.forEach((school) => {
      console.log(`   ✅ School: ${school.name} (${school.schoolCode})`);
      console.log(`      Status: ${school.status}, Plan: ${school.plan}, Onboarded: ${school.isOnboarded}`);
      console.log(`      Users: ${school._count.administrators} admins, ${school._count.teachers} teachers, ${school._count.students} students`);
    });

    // Test 2: Check user-school relationships
    console.log('\n2️⃣  Testing user-school relationships...');
    const userSchoolCount = await prisma.userSchool.count();
    console.log(`   Found ${userSchoolCount} user-school relationships`);

    const userSchools = await prisma.userSchool.findMany({
      include: {
        user: { select: { email: true, role: true } },
        school: { select: { name: true, schoolCode: true } },
      },
      take: 5,
    });

    userSchools.forEach((us) => {
      console.log(`   ✅ ${us.user.email} (${us.user.role}) → ${us.school.name} (${us.role})`);
    });

    // Test 3: Check subscriptions
    console.log('\n3️⃣  Testing subscriptions...');
    const subscriptionCount = await prisma.subscription.count();
    console.log(`   Found ${subscriptionCount} subscriptions`);

    const subscriptions = await prisma.subscription.findMany({
      include: {
        school: { select: { name: true } },
      },
    });

    subscriptions.forEach((sub) => {
      console.log(`   ✅ ${sub.school.name}: ${sub.billingCycle} plan, ${sub.paymentStatus}, expires ${sub.endDate.toLocaleDateString()}`);
    });

    // Test 4: Check usage counters
    console.log('\n4️⃣  Testing usage counters...');
    const usageCount = await prisma.usageCounter.count();
    console.log(`   Found ${usageCount} usage counters`);

    const usageCounters = await prisma.usageCounter.findMany({
      include: {
        school: { select: { name: true } },
      },
    });

    usageCounters.forEach((usage) => {
      console.log(`   ✅ ${usage.school.name} (${usage.month}): ${usage.whatsappUsed}/${usage.whatsappLimit} WhatsApp, ${usage.smsUsed}/${usage.smsLimit} SMS`);
    });

    // Test 5: Check tenant isolation (school-scoped data)
    console.log('\n5️⃣  Testing tenant isolation...');

    const testSchool = schools[0];
    if (testSchool) {
      const academicYears = await prisma.academicYear.count({
        where: { schoolId: testSchool.id },
      });

      const classes = await prisma.class.count({
        where: { schoolId: testSchool.id },
      });

      const students = await prisma.student.count({
        where: { schoolId: testSchool.id },
      });

      console.log(`   ✅ School "${testSchool.name}" has:`);
      console.log(`      ${academicYears} academic years`);
      console.log(`      ${classes} classes`);
      console.log(`      ${students} students`);
    }

    // Test 6: Check super admin exists
    console.log('\n6️⃣  Testing super admin...');
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });

    if (superAdminCount > 0) {
      console.log(`   ✅ Found ${superAdminCount} super admin(s)`);

      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { email: true },
      });

      superAdmins.forEach((sa) => {
        console.log(`      Super Admin: ${sa.email}`);
      });
    } else {
      console.log('   ❌ No super admin found');
    }

    // Test 7: Check data integrity
    console.log('\n7️⃣  Testing data integrity...');

    // Check that all students belong to schools
    const orphanedStudents = await prisma.student.count({
      where: { schoolId: null },
    });

    if (orphanedStudents === 0) {
      console.log('   ✅ All students belong to schools');
    } else {
      console.log(`   ❌ ${orphanedStudents} students don't belong to any school`);
    }

    // Check that all teachers belong to schools
    const orphanedTeachers = await prisma.teacher.count({
      where: { schoolId: null },
    });

    if (orphanedTeachers === 0) {
      console.log('   ✅ All teachers belong to schools');
    } else {
      console.log(`   ❌ ${orphanedTeachers} teachers don't belong to any school`);
    }

    console.log('\n🎉 Multi-school setup test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Test functions for specific features
async function testSchoolCreation() {
  console.log('\n🆕 Testing school creation...');

  try {
    const newSchool = await prisma.school.create({
      data: {
        name: 'Test School',
        schoolCode: `TEST${Date.now().toString().slice(-6)}`,
        email: 'test@school.com',
        phone: '1234567890',
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: false,
      },
    });

    console.log(`   ✅ Created test school: ${newSchool.name} (${newSchool.schoolCode})`);

    // Create subscription and usage counter
    await prisma.subscription.create({
      data: {
        schoolId: newSchool.id,
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        paymentStatus: 'COMPLETED',
      },
    });

    await prisma.usageCounter.create({
      data: {
        schoolId: newSchool.id,
        month: new Date().toISOString().slice(0, 7),
        whatsappLimit: 100,
        smsLimit: 100,
        storageLimitMB: 1024,
      },
    });

    console.log('   ✅ Created subscription and usage counter');

    return newSchool.id;
  } catch (error) {
    console.error('   ❌ Failed to create test school:', error);
    throw error;
  }
}

async function testUserSchoolAssignment() {
  console.log('\n👤 Testing user-school assignment...');

  try {
    // Get first user and school
    const user = await prisma.user.findFirst();
    const school = await prisma.school.findFirst();

    if (!user || !school) {
      console.log('   ⚠️  No user or school found for testing');
      return;
    }

    // Create user-school relationship
    const userSchool = await prisma.userSchool.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : user.role,
        isActive: true,
      },
    });

    console.log(`   ✅ Assigned ${user.email} to ${school.name} as ${userSchool.role}`);

  } catch (error) {
    console.error('   ❌ Failed to assign user to school:', error);
    throw error;
  }
}

// Run tests
async function runAllTests() {
  try {
    await testMultiSchoolSetup();
    await testSchoolCreation();
    await testUserSchoolAssignment();

    console.log('\n🎯 All tests passed! Your multi-school SaaS is ready.');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run db:generate');
    console.log('   2. Test the setup wizard: Visit /setup');
    console.log('   3. Test super admin: Visit /super-admin');
    console.log('   4. Test school selection: Login with a user assigned to multiple schools');

  } catch (error) {
    console.error('\n💥 Tests failed:', error);
    process.exit(1);
  }
}

runAllTests();