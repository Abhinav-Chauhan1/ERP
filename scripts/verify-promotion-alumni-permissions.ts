/**
 * Verification script for Promotion and Alumni Permission Middleware
 * 
 * This script verifies that the permission middleware is correctly configured
 * for promotion and alumni routes.
 */

import { UserRole } from '@prisma/client';
import { 
  checkPermissionInMiddleware, 
  getRoutePermissionRequirements,
  routeRequiresPermission 
} from '@/lib/utils/permission-middleware';

// Test routes
const testRoutes = [
  // Promotion routes
  { path: '/admin/academic/promotion', expectedResource: 'PROMOTION', expectedAction: 'CREATE', allowedRoles: [UserRole.ADMIN] },
  { path: '/admin/academic/promotion/history', expectedResource: 'PROMOTION', expectedAction: 'READ', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/promotion/preview', expectedResource: 'PROMOTION', expectedAction: 'READ', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/promotion/execute', expectedResource: 'PROMOTION', expectedAction: 'CREATE', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/promotion/rollback', expectedResource: 'PROMOTION', expectedAction: 'DELETE', allowedRoles: [UserRole.ADMIN] },
  
  // Graduation routes
  { path: '/admin/academic/graduation', expectedResource: 'GRADUATION', expectedAction: 'CREATE', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/graduation', expectedResource: 'GRADUATION', expectedAction: 'CREATE', allowedRoles: [UserRole.ADMIN] },
  
  // Alumni management routes (Admin)
  { path: '/admin/alumni', expectedResource: 'ALUMNI', expectedAction: 'READ', allowedRoles: [UserRole.ADMIN] },
  { path: '/admin/alumni/abc123', expectedResource: 'ALUMNI', expectedAction: 'READ', allowedRoles: [UserRole.ADMIN] },
  { path: '/admin/alumni/abc123/edit', expectedResource: 'ALUMNI', expectedAction: 'UPDATE', allowedRoles: [UserRole.ADMIN] },
  { path: '/admin/alumni/communication', expectedResource: 'ALUMNI', expectedAction: 'CREATE', allowedRoles: [UserRole.ADMIN] },
  { path: '/admin/alumni/statistics', expectedResource: 'ALUMNI', expectedAction: 'READ', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/alumni/search', expectedResource: 'ALUMNI', expectedAction: 'READ', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/alumni/abc123', expectedResource: 'ALUMNI', expectedAction: 'UPDATE', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/alumni/message', expectedResource: 'ALUMNI', expectedAction: 'CREATE', allowedRoles: [UserRole.ADMIN] },
  { path: '/api/admin/alumni/report', expectedResource: 'ALUMNI', expectedAction: 'READ', allowedRoles: [UserRole.ADMIN] },
  
  // Alumni portal routes (for graduated students)
  { path: '/alumni/dashboard', expectedResource: 'ALUMNI_PORTAL', expectedAction: 'READ', allowedRoles: [UserRole.STUDENT] },
  { path: '/alumni/profile', expectedResource: 'ALUMNI_PORTAL', expectedAction: 'UPDATE', allowedRoles: [UserRole.STUDENT] },
  { path: '/alumni/directory', expectedResource: 'ALUMNI_PORTAL', expectedAction: 'READ', allowedRoles: [UserRole.STUDENT] },
  { path: '/api/alumni/profile', expectedResource: 'ALUMNI_PORTAL', expectedAction: 'UPDATE', allowedRoles: [UserRole.STUDENT] },
];

async function verifyPermissionMiddleware() {
  console.log('🔐 Verifying Promotion and Alumni Permission Middleware...\n');

  let passedTests = 0;
  let failedTests = 0;
  const errors: string[] = [];

  for (const testRoute of testRoutes) {
    const { path, expectedResource, expectedAction, allowedRoles } = testRoute;
    
    console.log(`Testing route: ${path}`);
    
    // Check if route requires permission
    const requiresPermission = routeRequiresPermission(path);
    if (!requiresPermission) {
      console.log(`  ❌ FAIL: Route does not require permission`);
      failedTests++;
      errors.push(`Route ${path} does not require permission`);
      continue;
    }
    
    // Get route permission requirements
    const requirements = getRoutePermissionRequirements(path);
    if (!requirements) {
      console.log(`  ❌ FAIL: No permission requirements found`);
      failedTests++;
      errors.push(`No permission requirements found for ${path}`);
      continue;
    }
    
    // Verify resource and action
    if (requirements.resource !== expectedResource) {
      console.log(`  ❌ FAIL: Expected resource ${expectedResource}, got ${requirements.resource}`);
      failedTests++;
      errors.push(`Route ${path}: Expected resource ${expectedResource}, got ${requirements.resource}`);
      continue;
    }
    
    if (requirements.action !== expectedAction) {
      console.log(`  ❌ FAIL: Expected action ${expectedAction}, got ${requirements.action}`);
      failedTests++;
      errors.push(`Route ${path}: Expected action ${expectedAction}, got ${requirements.action}`);
      continue;
    }
    
    // Verify allowed roles
    if (requirements.roles) {
      const rolesMatch = allowedRoles.every(role => requirements.roles?.includes(role));
      if (!rolesMatch) {
        console.log(`  ❌ FAIL: Role mismatch. Expected ${allowedRoles.join(', ')}, got ${requirements.roles.join(', ')}`);
        failedTests++;
        errors.push(`Route ${path}: Role mismatch`);
        continue;
      }
    }
    
    // Test permission check for each role
    let roleTestsPassed = true;
    for (const role of Object.values(UserRole)) {
      const result = checkPermissionInMiddleware(path, role);
      const shouldBeAllowed = allowedRoles.includes(role);
      
      if (result.allowed !== shouldBeAllowed) {
        console.log(`  ❌ FAIL: Role ${role} - Expected allowed=${shouldBeAllowed}, got allowed=${result.allowed}`);
        roleTestsPassed = false;
        errors.push(`Route ${path}: Role ${role} permission check failed`);
      }
    }
    
    if (roleTestsPassed) {
      console.log(`  ✅ PASS: All checks passed`);
      passedTests++;
    } else {
      failedTests++;
    }
    
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Summary:');
  console.log(`  Total tests: ${testRoutes.length}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log('═══════════════════════════════════════════════════════════');

  if (failedTests > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  } else {
    console.log('\n✅ All permission middleware tests passed!');
  }
}

// Run verification
verifyPermissionMiddleware()
  .then(() => {
    console.log('\n✅ Verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
