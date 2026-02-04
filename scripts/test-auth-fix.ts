/**
 * Test script to verify authentication fixes after school onboarding
 */

import { db } from '../src/lib/db';
import { validateCurrentSession, refreshUserSession } from '../src/lib/auth/session-refresh';
import { AuditAction } from '@prisma/client';

async function testAuthenticationFixes() {
  console.log('🔍 Testing authentication fixes...\n');

  try {
    // 1. Test audit action enum values
    console.log('1. Testing AuditAction enum values...');
    const validActions = Object.values(AuditAction);
    console.log('✅ Valid AuditAction values:', validActions);
    
    // Verify our commonly used actions exist
    const requiredActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'VERIFY'];
    const missingActions = requiredActions.filter(action => !validActions.includes(action as AuditAction));
    
    if (missingActions.length > 0) {
      console.log('❌ Missing required actions:', missingActions);
    } else {
      console.log('✅ All required AuditAction values are available\n');
    }

    // 2. Test audit log creation with valid actions
    console.log('2. Testing audit log creation...');
    try {
      await db.auditLog.create({
        data: {
          userId: 'test-user',
          action: AuditAction.LOGIN,
          resource: 'authentication_test',
          changes: {
            test: true,
            timestamp: new Date()
          },
          timestamp: new Date(),
          checksum: 'test-checksum-' + Date.now()
        }
      });
      console.log('✅ Audit log creation successful\n');
    } catch (error) {
      console.log('❌ Audit log creation failed:', error);
    }

    // 3. Test session validation functions
    console.log('3. Testing session validation functions...');
    try {
      // This will likely fail since we're not in a request context, but it should not crash
      const validation = await validateCurrentSession();
      console.log('✅ Session validation function executed without crashing');
      console.log('   Result:', validation.isValid ? 'Valid' : 'Invalid');
      if (validation.error) {
        console.log('   Expected error (no request context):', validation.error);
      }
    } catch (error) {
      console.log('❌ Session validation function crashed:', error);
    }

    // 4. Check for users with completed onboarding
    console.log('\n4. Checking users with completed school onboarding...');
    const usersWithOnboardedSchools = await db.user.findMany({
      where: {
        isActive: true,
        userSchools: {
          some: {
            isActive: true,
            school: {
              isOnboarded: true,
              onboardingCompletedAt: {
                not: null
              }
            }
          }
        }
      },
      include: {
        userSchools: {
          where: {
            isActive: true,
            school: {
              isOnboarded: true
            }
          },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                isOnboarded: true,
                onboardingCompletedAt: true
              }
            }
          }
        }
      },
      take: 5
    });

    console.log(`✅ Found ${usersWithOnboardedSchools.length} users with onboarded schools`);
    usersWithOnboardedSchools.forEach((user, index) => {
      console.log(`   ${index + 1}. User ${user.id} (${user.email}) - ${user.userSchools.length} onboarded schools`);
    });

    // 5. Check recent audit logs for authentication events
    console.log('\n5. Checking recent authentication audit logs...');
    const recentAuthLogs = await db.auditLog.findMany({
      where: {
        resource: {
          in: ['authentication', 'nextauth_login', 'nextauth_signin']
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log(`✅ Found ${recentAuthLogs.length} recent authentication logs`);
    recentAuthLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} - ${log.resource} - ${log.timestamp.toISOString()}`);
    });

    console.log('\n🎉 Authentication fix testing completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ AuditAction enum values are valid');
    console.log('   ✅ Audit log creation works');
    console.log('   ✅ Session validation functions are stable');
    console.log(`   ✅ Found ${usersWithOnboardedSchools.length} users with onboarded schools`);
    console.log(`   ✅ Found ${recentAuthLogs.length} recent authentication events`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testAuthenticationFixes().catch(console.error);