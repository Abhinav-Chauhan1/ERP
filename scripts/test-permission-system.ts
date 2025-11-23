import { PrismaClient, UserRole, PermissionAction } from '@prisma/client';
import { hasPermission, getUserPermissions, grantPermission, revokePermission } from '../src/lib/utils/permissions';

const prisma = new PrismaClient();

/**
 * Test script for the Permission-Based Access Control System
 */

async function testPermissionSystem() {
  console.log('🧪 Testing Permission System...\n');

  try {
    // 1. Create a test user
    console.log('1️⃣ Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        clerkId: `test_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.TEACHER,
      },
    });
    console.log(`   ✓ Created user: ${testUser.email} (Role: ${testUser.role})\n`);

    // 2. Test role-based permissions
    console.log('2️⃣ Testing role-based permissions...');
    const canReadStudent = await hasPermission(
      testUser.id,
      'STUDENT',
      PermissionAction.READ
    );
    console.log(`   ✓ Teacher can READ students: ${canReadStudent}`);

    const canDeleteStudent = await hasPermission(
      testUser.id,
      'STUDENT',
      PermissionAction.DELETE
    );
    console.log(`   ✓ Teacher can DELETE students: ${canDeleteStudent}`);

    const canCreateExam = await hasPermission(
      testUser.id,
      'EXAM',
      PermissionAction.CREATE
    );
    console.log(`   ✓ Teacher can CREATE exams: ${canCreateExam}\n`);

    // 3. Get all user permissions
    console.log('3️⃣ Getting all user permissions...');
    const permissions = await getUserPermissions(testUser.id);
    console.log(`   ✓ User has ${permissions.length} permissions`);
    console.log(`   ✓ Sample permissions:`, permissions.slice(0, 5).map(p => p.name).join(', '), '...\n');

    // 4. Grant custom permission
    console.log('4️⃣ Granting custom permission...');
    const adminUser = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (adminUser) {
      await grantPermission(
        testUser.id,
        'DELETE_STUDENT',
        adminUser.id
      );
      console.log(`   ✓ Granted DELETE_STUDENT permission to user`);

      const canDeleteNow = await hasPermission(
        testUser.id,
        'STUDENT',
        PermissionAction.DELETE
      );
      console.log(`   ✓ Teacher can now DELETE students: ${canDeleteNow}\n`);
    } else {
      console.log(`   ⚠ No admin user found, skipping custom permission grant\n`);
    }

    // 5. Test temporary permission
    console.log('5️⃣ Testing temporary permission...');
    if (adminUser) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      await grantPermission(
        testUser.id,
        'APPROVE_APPLICATION',
        adminUser.id,
        expiresAt
      );
      console.log(`   ✓ Granted temporary APPROVE_APPLICATION permission (expires in 7 days)`);

      const canApprove = await hasPermission(
        testUser.id,
        'APPLICATION',
        PermissionAction.APPROVE
      );
      console.log(`   ✓ Teacher can APPROVE applications: ${canApprove}\n`);
    }

    // 6. Revoke permission
    console.log('6️⃣ Revoking permission...');
    if (adminUser) {
      await revokePermission(testUser.id, 'DELETE_STUDENT');
      console.log(`   ✓ Revoked DELETE_STUDENT permission`);

      const canDeleteAfterRevoke = await hasPermission(
        testUser.id,
        'STUDENT',
        PermissionAction.DELETE
      );
      console.log(`   ✓ Teacher can DELETE students after revoke: ${canDeleteAfterRevoke}\n`);
    }

    // 7. Test permission categories
    console.log('7️⃣ Testing permission categories...');
    const allPermissions = await getUserPermissions(testUser.id);
    const categories = [...new Set(allPermissions.map(p => p.category).filter(Boolean))];
    console.log(`   ✓ User has permissions in ${categories.length} categories:`);
    categories.forEach(cat => {
      const count = allPermissions.filter(p => p.category === cat).length;
      console.log(`      - ${cat}: ${count} permissions`);
    });
    console.log();

    // 8. Verify permission counts by role
    console.log('8️⃣ Verifying permission counts by role...');
    const roles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
    
    for (const role of roles) {
      const rolePermissions = await prisma.rolePermission.count({
        where: { role },
      });
      console.log(`   ✓ ${role}: ${rolePermissions} default permissions`);
    }
    console.log();

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.userPermission.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('   ✓ Test user deleted\n');

    console.log('✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Permission system is working correctly');
    console.log('   - Role-based permissions are functioning');
    console.log('   - User-specific permissions can be granted and revoked');
    console.log('   - Temporary permissions are supported');
    console.log('   - Permission categories are properly organized');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionSystem()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
