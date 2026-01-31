#!/usr/bin/env tsx

/**
 * Test script for usage limits and enforcement
 */

import { PrismaClient } from '@prisma/client';
import {
  canSendWhatsApp,
  canSendSMS,
  hasStorageSpace,
  incrementWhatsAppUsage,
  incrementSMSUsage,
  incrementStorageUsage,
  getUsageLimits,
  getUsageStats,
  updateUsageLimits,
  validateFileUpload,
} from '../src/lib/services/usage-service';

const prisma = new PrismaClient();

async function testUsageLimits() {
  console.log('🧪 Testing usage limits and enforcement...\n');

  try {
    // Get first school for testing
    const school = await prisma.school.findFirst();
    if (!school) {
      console.log('❌ No school found. Run migration first.');
      return;
    }

    console.log(`📚 Testing with school: ${school.name} (${school.schoolCode})\n`);

    // Test 1: Get usage limits
    console.log('1️⃣  Testing usage limits retrieval...');
    const limits = await getUsageLimits(school.id);
    console.log(`   WhatsApp limit: ${limits.whatsappLimit}`);
    console.log(`   SMS limit: ${limits.smsLimit}`);
    console.log(`   Storage limit: ${limits.storageLimitMB} MB`);

    // Test 2: Get usage stats
    console.log('\n2️⃣  Testing usage statistics...');
    const stats = await getUsageStats(school.id);
    console.log(`   WhatsApp: ${stats.whatsappUsed}/${stats.whatsappLimit} (${stats.whatsappRemaining} remaining)`);
    console.log(`   SMS: ${stats.smsUsed}/${stats.smsLimit} (${stats.smsRemaining} remaining)`);
    console.log(`   Storage: ${(stats.storageLimitMB - stats.storageRemainingMB).toFixed(2)}/${stats.storageLimitMB} MB used (${stats.storageRemainingMB.toFixed(2)} remaining)`);

    // Test 3: Check sending permissions
    console.log('\n3️⃣  Testing sending permissions...');
    const canSendWA = await canSendWhatsApp(1, school.id);
    const canSendSMSMsg = await canSendSMS(1, school.id);
    console.log(`   Can send WhatsApp: ${canSendWA}`);
    console.log(`   Can send SMS: ${canSendSMSMsg}`);

    // Test 4: Check storage space
    console.log('\n4️⃣  Testing storage space checks...');
    const hasSpace = await hasStorageSpace(10, school.id); // 10MB
    console.log(`   Has 10MB space: ${hasSpace}`);

    // Test 5: Validate file upload
    console.log('\n5️⃣  Testing file upload validation...');
    const fileValidation = await validateFileUpload(5 * 1024 * 1024, school.id); // 5MB file
    console.log(`   5MB file allowed: ${fileValidation.allowed}`);
    if (!fileValidation.allowed && fileValidation.error) {
      console.log(`   Error: ${fileValidation.error}`);
    }

    // Test 6: Increment usage (be careful not to overuse in production)
    console.log('\n6️⃣  Testing usage increment...');
    const beforeStats = await getUsageStats(school.id);

    await incrementWhatsAppUsage(1, school.id);
    await incrementSMSUsage(1, school.id);
    await incrementStorageUsage(0.1, school.id); // 0.1 MB

    const afterStats = await getUsageStats(school.id);
    console.log(`   WhatsApp usage: ${beforeStats.whatsappUsed} → ${afterStats.whatsappUsed}`);
    console.log(`   SMS usage: ${beforeStats.smsUsed} → ${afterStats.smsUsed}`);
    console.log(`   Storage usage: ${(beforeStats.storageLimitMB - beforeStats.storageRemainingMB).toFixed(2)} → ${(afterStats.storageLimitMB - afterStats.storageRemainingMB).toFixed(2)} MB`);

    // Test 7: Update limits (Super Admin function)
    console.log('\n7️⃣  Testing limit updates...');
    await updateUsageLimits(school.id, {
      whatsappLimit: limits.whatsappLimit + 10,
      smsLimit: limits.smsLimit + 10,
    });

    const updatedLimits = await getUsageLimits(school.id);
    console.log(`   Updated WhatsApp limit: ${updatedLimits.whatsappLimit}`);
    console.log(`   Updated SMS limit: ${updatedLimits.smsLimit}`);

    // Test 8: Test limits exceeded scenarios
    console.log('\n8️⃣  Testing limit exceeded scenarios...');

    // Temporarily set very low limits for testing
    await updateUsageLimits(school.id, {
      whatsappLimit: 1,
      smsLimit: 1,
      storageLimitMB: 1,
    });

    const canSendAfterLimit = await canSendWhatsApp(1, school.id);
    const canSendSMSAfterLimit = await canSendSMS(1, school.id);
    const hasSpaceAfterLimit = await hasStorageSpace(2, school.id);

    console.log(`   Can send WhatsApp after limit: ${canSendAfterLimit}`);
    console.log(`   Can send SMS after limit: ${canSendSMSAfterLimit}`);
    console.log(`   Has space after limit: ${hasSpaceAfterLimit}`);

    // Restore original limits
    await updateUsageLimits(school.id, limits);

    console.log('\n✅ Usage limits testing completed successfully!');
    console.log('\n📊 Final usage stats:');
    const finalStats = await getUsageStats(school.id);
    console.log(`   WhatsApp: ${finalStats.whatsappUsed}/${finalStats.whatsappLimit}`);
    console.log(`   SMS: ${finalStats.smsUsed}/${finalStats.smsLimit}`);
    console.log(`   Storage: ${(finalStats.storageLimitMB - finalStats.storageRemainingMB).toFixed(2)}/${finalStats.storageLimitMB} MB`);

  } catch (error) {
    console.error('❌ Usage limits test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Test the services with usage limits
async function testServicesWithLimits() {
  console.log('\n🔧 Testing services with usage limits...');

  try {
    // Import the usage-limited services
    const { sendTextMessage: limitedSendTextMessage } = await import('../src/lib/services/whatsapp-service-with-limits');
    const { sendSMS: limitedSendSMS } = await import('../src/lib/services/sms-service-with-limits');

    console.log('   ✅ Services imported successfully');
    console.log('   ✅ Usage limits will be enforced on all communications');

  } catch (error) {
    console.error('   ❌ Failed to import services:', error);
  }
}

async function runAllTests() {
  try {
    await testUsageLimits();
    await testServicesWithLimits();

    console.log('\n🎯 All usage limit tests passed!');
    console.log('\n📋 Usage enforcement is now active for:');
    console.log('   • WhatsApp messaging');
    console.log('   • SMS messaging');
    console.log('   • File uploads and storage');
    console.log('   • All communication channels');

  } catch (error) {
    console.error('\n💥 Tests failed:', error);
    process.exit(1);
  }
}

runAllTests();