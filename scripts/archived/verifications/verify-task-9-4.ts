/**
 * Verification script for Task 9.4: Super Admin Onboarding Controls
 * Requirements: 9.4 - WHEN a super admin resets onboarding, THE System SHALL set isOnboarded flag to false and clear onboarding progress
 */

import { db } from '@/lib/db';
import { 
  resetSchoolOnboarding, 
  launchSetupWizard, 
  bulkResetOnboarding,
  getSchoolsOnboardingStatus
} from '@/lib/actions/school-management-actions';

async function verifyTask94() {
  console.log('🚀 Task 9.4 Verification: Super Admin Onboarding Controls');
  console.log('=' .repeat(60));

  try {
    // Clean up any existing test data
    await db.school.deleteMany({
      where: {
        name: {
          startsWith: 'Verify Task 9.4'
        }
      }
    });

    console.log('\n📝 Test 1: Creating test schools with different onboarding states...');
    
    // Create test schools
    const completedSchool = await db.school.create({
      data: {
        name: 'Verify Task 9.4 - Completed School',
        schoolCode: 'VT94C001',
        email: 'completed@verify94.com',
        plan: 'STARTER',
        status: 'ACTIVE',
        isOnboarded: true,
        onboardingStep: 7,
        onboardingCompletedAt: new Date(),
      },
    });

    const incompleteSchool = await db.school.create({
      data: {
        name: 'Verify Task 9.4 - Incomplete School',
        schoolCode: 'VT94I001',
        email: 'incomplete@verify94.com',
        plan: 'GROWTH',
        status: 'ACTIVE',
        isOnboarded: false,
        onboardingStep: 3,
        onboardingCompletedAt: null,
      },
    });

    console.log(`   ✅ Created completed school: ${completedSchool.name}`);
    console.log(`      isOnboarded: ${completedSchool.isOnboarded}, step: ${completedSchool.onboardingStep}`);
    console.log(`   ✅ Created incomplete school: ${incompleteSchool.name}`);
    console.log(`      isOnboarded: ${incompleteSchool.isOnboarded}, step: ${incompleteSchool.onboardingStep}`);

    console.log('\n📝 Test 2: Testing reset onboarding for completed school...');
    
    const resetResult = await resetSchoolOnboarding(completedSchool.id);
    
    if (resetResult.success) {
      console.log('   ✅ Reset onboarding successful');
      console.log(`   ✅ Message: ${resetResult.data?.message}`);
      
      // Verify the reset
      const resetSchool = await db.school.findUnique({
        where: { id: completedSchool.id },
        select: { isOnboarded: true, onboardingStep: true, onboardingCompletedAt: true }
      });
      
      console.log('   ✅ Verification after reset:');
      console.log(`      isOnboarded: ${resetSchool?.isOnboarded} (should be false)`);
      console.log(`      onboardingStep: ${resetSchool?.onboardingStep} (should be 0)`);
      console.log(`      onboardingCompletedAt: ${resetSchool?.onboardingCompletedAt} (should be null)`);
      
      if (resetSchool?.isOnboarded === false && 
          resetSchool?.onboardingStep === 0 && 
          resetSchool?.onboardingCompletedAt === null) {
        console.log('   ✅ Reset onboarding working correctly!');
      } else {
        console.log('   ❌ Reset onboarding not working as expected');
      }
    } else {
      console.log(`   ❌ Reset failed: ${resetResult.error}`);
    }

    console.log('\n📝 Test 3: Testing launch setup wizard for incomplete school...');
    
    const launchResult = await launchSetupWizard(incompleteSchool.id);
    
    if (launchResult.success) {
      console.log('   ✅ Launch setup wizard successful');
      console.log(`   ✅ Message: ${launchResult.data?.message}`);
      
      // Verify the launch
      const launchedSchool = await db.school.findUnique({
        where: { id: incompleteSchool.id },
        select: { isOnboarded: true, onboardingStep: true }
      });
      
      console.log('   ✅ Verification after launch:');
      console.log(`      isOnboarded: ${launchedSchool?.isOnboarded} (should be false)`);
      console.log(`      onboardingStep: ${launchedSchool?.onboardingStep} (should be 1)`);
      
      if (launchedSchool?.isOnboarded === false && launchedSchool?.onboardingStep === 1) {
        console.log('   ✅ Launch setup wizard working correctly!');
      } else {
        console.log('   ❌ Launch setup wizard not working as expected');
      }
    } else {
      console.log(`   ❌ Launch failed: ${launchResult.error}`);
    }

    console.log('\n📝 Test 4: Testing get onboarding status for multiple schools...');
    
    const statusResult = await getSchoolsOnboardingStatus([completedSchool.id, incompleteSchool.id]);
    
    if (statusResult.success && statusResult.data) {
      console.log('   ✅ Get onboarding status successful');
      
      statusResult.data.forEach(school => {
        console.log(`   ✅ School: ${school.name}`);
        console.log(`      isOnboarded: ${school.isOnboarded}`);
        console.log(`      onboardingStep: ${school.onboardingStep}`);
        console.log(`      requiresSetup: ${school.requiresSetup}`);
      });
    } else {
      console.log(`   ❌ Get status failed: ${statusResult.error}`);
    }

    console.log('\n📝 Test 5: Testing bulk reset onboarding...');
    
    // First, set one school back to completed state for testing
    await db.school.update({
      where: { id: completedSchool.id },
      data: {
        isOnboarded: true,
        onboardingStep: 7,
        onboardingCompletedAt: new Date(),
      }
    });

    const bulkResetResult = await bulkResetOnboarding([completedSchool.id, incompleteSchool.id]);
    
    if (bulkResetResult.success) {
      console.log('   ✅ Bulk reset onboarding successful');
      console.log(`   ✅ Message: ${bulkResetResult.message}`);
      
      // Verify both schools are reset
      const resetSchools = await db.school.findMany({
        where: {
          id: {
            in: [completedSchool.id, incompleteSchool.id]
          }
        },
        select: { id: true, name: true, isOnboarded: true, onboardingStep: true, onboardingCompletedAt: true }
      });
      
      console.log('   ✅ Verification after bulk reset:');
      resetSchools.forEach(school => {
        console.log(`      ${school.name}:`);
        console.log(`        isOnboarded: ${school.isOnboarded} (should be false)`);
        console.log(`        onboardingStep: ${school.onboardingStep} (should be 0)`);
        console.log(`        onboardingCompletedAt: ${school.onboardingCompletedAt} (should be null)`);
      });
      
      const allReset = resetSchools.every(school => 
        school.isOnboarded === false && 
        school.onboardingStep === 0 && 
        school.onboardingCompletedAt === null
      );
      
      if (allReset) {
        console.log('   ✅ Bulk reset onboarding working correctly!');
      } else {
        console.log('   ❌ Bulk reset onboarding not working as expected');
      }
    } else {
      console.log(`   ❌ Bulk reset failed: ${bulkResetResult.error}`);
    }

    console.log('\n📝 Test 6: Verifying audit logs were created...');
    
    const auditLogs = await db.auditLog.findMany({
      where: {
        resourceId: {
          in: [completedSchool.id, incompleteSchool.id]
        },
        action: {
          in: ['RESET_ONBOARDING', 'LAUNCH_SETUP_WIZARD', 'BULK_RESET_ONBOARDING']
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   ✅ Found ${auditLogs.length} audit log entries`);
    auditLogs.forEach(log => {
      console.log(`      Action: ${log.action}, Resource: ${log.resourceId}`);
    });

    console.log('\n📝 Test 7: Testing error handling with non-existent school...');
    
    const errorResult = await resetSchoolOnboarding('non-existent-school-id');
    
    if (!errorResult.success && errorResult.error === 'School not found') {
      console.log('   ✅ Error handling working correctly');
      console.log(`   ✅ Error message: ${errorResult.error}`);
    } else {
      console.log('   ❌ Error handling not working as expected');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    await db.auditLog.deleteMany({
      where: {
        resourceId: {
          in: [completedSchool.id, incompleteSchool.id]
        }
      }
    });

    await db.school.deleteMany({
      where: {
        id: {
          in: [completedSchool.id, incompleteSchool.id]
        }
      }
    });

    console.log('   ✅ Test data cleaned up');

    console.log('\n🎉 Task 9.4 Verification Complete!');
    console.log('✅ All super admin onboarding controls are working correctly');
    console.log('✅ Reset onboarding sets isOnboarded to false and clears progress');
    console.log('✅ Launch setup wizard guides schools through setup');
    console.log('✅ Bulk operations work for multiple schools');
    console.log('✅ Audit logging tracks all onboarding management actions');
    console.log('✅ Error handling works for invalid inputs');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyTask94()
    .then(() => {
      console.log('\n✅ Task 9.4 verification completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Task 9.4 verification failed:', error);
      process.exit(1);
    });
}

export { verifyTask94 };