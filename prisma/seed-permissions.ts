import { PrismaClient, UserRole } from '@prisma/client';
import { DEFAULT_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../src/lib/utils/permission-defaults';

const prisma = new PrismaClient();

/**
 * Seed script for Permission-Based Access Control System
 * This script creates default permissions and assigns them to roles
 * Uses the SINGLE SOURCE OF TRUTH from src/lib/utils/permission-defaults.ts
 */

async function seedPermissions() {
  console.log('🔐 Starting permission system seeding...');

  // Clear existing permissions
  console.log('🧹 Cleaning existing permissions...');
  // We use deleteMany without where to delete all. 
  // Order matters due to foreign key constraints.
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();

  // Create permissions
  console.log('📝 Creating permissions...');
  const createdPermissions = new Map<string, string>();

  // Use DEFAULT_PERMISSIONS from our shared constants
  for (const permission of DEFAULT_PERMISSIONS) {
    const created = await prisma.permission.create({
      data: {
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        category: permission.category,
        description: permission.description,
        isActive: true,
      },
    });
    createdPermissions.set(permission.name, created.id);
    console.log(`  ✓ Created permission: ${permission.name}`);
  }

  // Assign permissions to roles
  console.log('🎭 Assigning permissions to roles...');
  for (const [role, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    // Skip ADMIN wildcard, they get nothing assigned in DB manually usually, 
    // or we can assign all if we want DB to reflect it, but the code handles bypass.
    // However, for completeness in the UI (e.g. checkbox state), we might want to assign them if the UI expects it.
    // But standard practice is Admin = Bypass. The UI might show "All Selected" or similar.
    // Let's stick to the list provided in DEFAULT_ROLE_PERMISSIONS.
    // If ADMIN is ['*'], we skip * lookup.

    if (permissionNames.includes('*')) {
      // Ideally we assign ALL permissions to Admin in DB so the UI "Permission Management" shows them as checked?
      // OR we accept Admin has 0 rows in rolePermission and the code handles it.
      // The UI uses `getRolePermissions(role)` which fetches DB rows.
      // If we want the UI to show Checked Boxes for Admin, we should insert all.
      console.log(`  ! Role ${role} has wildcard access. Assigning ALL permissions for UI consistency.`);

      for (const [permName, permId] of createdPermissions.entries()) {
        await prisma.rolePermission.create({
          data: {
            role: role as UserRole,
            permissionId: permId,
            isDefault: true,
          },
        });
      }
      console.log(`  ✓ Assigned ALL ${createdPermissions.size} permissions to ${role}`);
      continue;
    }

    let assignedCount = 0;
    for (const permissionName of permissionNames) {
      const permissionId = createdPermissions.get(permissionName);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            role: role as UserRole,
            permissionId,
            isDefault: true,
          },
        });
        assignedCount++;
      } else {
        console.warn(`  ⚠️ Warning: Permission '${permissionName}' defined for role '${role}' not found in PERMISSIONS list.`);
      }
    }
    console.log(`  ✓ Assigned ${assignedCount} permissions to ${role}`);
  }

  console.log('✅ Permission system seeding completed!');
  console.log(`   Total permissions created: ${DEFAULT_PERMISSIONS.length}`);
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
