/**
 * Manual Testing Script for WhatsApp Notification System
 * 
 * This script provides manual testing utilities for:
 * - MSG91 SMS service
 * - WhatsApp Business API service
 * - Communication service orchestration
 * - Bulk messaging
 * - Multi-language support
 * - Cost tracking
 * 
 * Usage:
 *   npx tsx scripts/test-whatsapp-system-manual.ts [test-name]
 * 
 * Available tests:
 *   - msg91-config: Test MSG91 configuration
 *   - whatsapp-config: Test WhatsApp configuration
 *   - send-sms: Send test SMS via MSG91
 *   - send-whatsapp: Send test WhatsApp message
 *   - send-template: Send WhatsApp template message
 *   - bulk-sms: Test bulk SMS sending
 *   - bulk-whatsapp: Test bulk WhatsApp sending
 *   - attendance-notification: Test attendance notification
 *   - leave-notification: Test leave notification
 *   - fee-notification: Test fee reminder notification
 *   - multi-language: Test multi-language templates
 *   - cost-tracking: Test cost calculation
 *   - all: Run all tests
 */

import { PrismaClient } from '@prisma/client';
import { 
  isMSG91Configured, 
  sendSMS, 
  sendBulkSMS,
  getSMSDeliveryStatus 
} from '@/lib/services/msg91-service';
import { 
  isWhatsAppConfigured,
  sendTextMessage,
  sendTemplateMessage,
  getMessageStatus
} from '@/lib/services/whatsapp-service';
import {
  sendNotification,
  sendAttendanceAlert,
  sendLeaveNotification,
  sendFeeReminder,
  sendBulkNotification
} from '@/lib/services/communication-service';
import { calculateMessageCost } from '@/lib/services/cost-calculation-service';
import { CommunicationChannel } from '@/lib/types/communication';

const prisma = new PrismaClient();

// Test configuration
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '+919876543210';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logSection(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}\n`, colors.cyan);
}

// Test 1: MSG91 Configuration
async function testMSG91Config() {
  logSection('Test 1: MSG91 Configuration');
  
  try {
    const isConfigured = isMSG91Configured();
    
    if (isConfigured) {
      logSuccess('MSG91 is properly configured');
      logInfo(`Auth Key: ${process.env.MSG91_AUTH_KEY?.substring(0, 10)}...`);
      logInfo(`Sender ID: ${process.env.MSG91_SENDER_ID}`);
      logInfo(`Route: ${process.env.MSG91_ROUTE}`);
      logInfo(`Country: ${process.env.MSG91_COUNTRY}`);
      return true;
    } else {
      logError('MSG91 is not configured');
      logWarning('Please set MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_ROUTE, and MSG91_COUNTRY in .env');
      return false;
    }
  } catch (error: any) {
    logError(`Configuration check failed: ${error.message}`);
    return false;
  }
}

// Test 2: WhatsApp Configuration
async function testWhatsAppConfig() {
  logSection('Test 2: WhatsApp Configuration');
  
  try {
    const isConfigured = isWhatsAppConfigured();
    
    if (isConfigured) {
      logSuccess('WhatsApp is properly configured');
      logInfo(`Access Token: ${process.env.WHATSAPP_ACCESS_TOKEN?.substring(0, 20)}...`);
      logInfo(`Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
      logInfo(`Business Account ID: ${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}`);
      logInfo(`API Version: ${process.env.WHATSAPP_API_VERSION}`);
      return true;
    } else {
      logError('WhatsApp is not configured');
      logWarning('Please set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, etc. in .env');
      return false;
    }
  } catch (error: any) {
    logError(`Configuration check failed: ${error.message}`);
    return false;
  }
}

// Test 3: Send SMS via MSG91
async function testSendSMS() {
  logSection('Test 3: Send SMS via MSG91');
  
  if (!isMSG91Configured()) {
    logError('MSG91 not configured. Skipping test.');
    return false;
  }
  
  try {
    logInfo(`Sending SMS to ${TEST_PHONE_NUMBER}...`);
    
    const result = await sendSMS(
      TEST_PHONE_NUMBER,
      'Test SMS from School ERP WhatsApp Notification System. This is a test message.'
    );
    
    if (result.success) {
      logSuccess(`SMS sent successfully!`);
      logInfo(`Message ID: ${result.messageId}`);
      return true;
    } else {
      logError(`SMS failed: ${result.error}`);
      return false;
    }
  } catch (error: any) {
    logError(`SMS sending failed: ${error.message}`);
    return false;
  }
}

// Test 4: Send WhatsApp Message
async function testSendWhatsApp() {
  logSection('Test 4: Send WhatsApp Message');
  
  if (!isWhatsAppConfigured()) {
    logError('WhatsApp not configured. Skipping test.');
    return false;
  }
  
  try {
    logInfo(`Sending WhatsApp message to ${TEST_PHONE_NUMBER}...`);
    
    const result = await sendTextMessage(
      TEST_PHONE_NUMBER,
      'Test WhatsApp message from School ERP. This is a test message.'
    );
    
    if (result.success) {
      logSuccess(`WhatsApp message sent successfully!`);
      logInfo(`Message ID: ${result.messageId}`);
      return true;
    } else {
      logError(`WhatsApp failed: ${result.error}`);
      return false;
    }
  } catch (error: any) {
    logError(`WhatsApp sending failed: ${error.message}`);
    return false;
  }
}

// Test 5: Send WhatsApp Template Message
async function testSendTemplate() {
  logSection('Test 5: Send WhatsApp Template Message');
  
  if (!isWhatsAppConfigured()) {
    logError('WhatsApp not configured. Skipping test.');
    return false;
  }
  
  try {
    logInfo(`Sending WhatsApp template message to ${TEST_PHONE_NUMBER}...`);
    logWarning('Note: Template must be pre-approved in WhatsApp Business Manager');
    
    const result = await sendTemplateMessage(
      TEST_PHONE_NUMBER,
      'hello_world', // Default WhatsApp template
      'en', // Language code
      [] // Parameters
    );
    
    if (result.success) {
      logSuccess(`Template message sent successfully!`);
      logInfo(`Message ID: ${result.messageId}`);
      return true;
    } else {
      logError(`Template failed: ${result.error}`);
      logWarning('Make sure the template exists and is approved');
      return false;
    }
  } catch (error: any) {
    logError(`Template sending failed: ${error.message}`);
    return false;
  }
}

// Test 6: Bulk SMS
async function testBulkSMS() {
  logSection('Test 6: Bulk SMS Sending');
  
  if (!isMSG91Configured()) {
    logError('MSG91 not configured. Skipping test.');
    return false;
  }
  
  try {
    // Create test recipients (use same number multiple times for testing)
    const recipients = Array(5).fill(TEST_PHONE_NUMBER);
    
    logInfo(`Sending bulk SMS to ${recipients.length} recipients...`);
    
    const results = await sendBulkSMS(
      recipients,
      'Bulk test SMS from School ERP. This is a test message.'
    );
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    logInfo(`Results: ${successCount} success, ${failCount} failed`);
    
    if (successCount > 0) {
      logSuccess(`Bulk SMS partially or fully successful`);
      return true;
    } else {
      logError(`All bulk SMS failed`);
      return false;
    }
  } catch (error: any) {
    logError(`Bulk SMS failed: ${error.message}`);
    return false;
  }
}

// Test 7: Bulk WhatsApp
async function testBulkWhatsApp() {
  logSection('Test 7: Bulk WhatsApp Sending');
  
  if (!isWhatsAppConfigured()) {
    logError('WhatsApp not configured. Skipping test.');
    return false;
  }
  
  try {
    // Create test recipients (use same number multiple times for testing)
    const recipients = Array(5).fill(TEST_PHONE_NUMBER);
    
    logInfo(`Sending bulk WhatsApp to ${recipients.length} recipients...`);
    
    const message = {
      type: 'text' as const,
      text: {
        body: 'Bulk test WhatsApp from School ERP. This is a test message.'
      }
    };
    
    // Send messages individually since sendBulkMessages is not available
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const result = await sendTextMessage(recipient, message.text.body);
          return result;
        } catch (error) {
          return { success: false, error: String(error) };
        }
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    logInfo(`Results: ${successCount} success, ${failCount} failed`);
    
    if (successCount > 0) {
      logSuccess(`Bulk WhatsApp partially or fully successful`);
      return true;
    } else {
      logError(`All bulk WhatsApp failed`);
      return false;
    }
  } catch (error: any) {
    logError(`Bulk WhatsApp failed: ${error.message}`);
    return false;
  }
}

// Test 8: Attendance Notification
async function testAttendanceNotification() {
  logSection('Test 8: Attendance Notification');
  
  try {
    logInfo('Sending attendance notification...');
    
    const result = await sendAttendanceAlert({
      studentId: TEST_USER_ID,
      studentName: 'Test Student',
      date: new Date(),
      status: 'ABSENT',
      attendancePercentage: 85.5,
      parentId: TEST_USER_ID
    });
    
    if (result.success) {
      logSuccess('Attendance notification sent successfully!');
      logInfo(`Channels used: ${Object.keys(result.channels).filter(k => result.channels[k as keyof typeof result.channels]?.success).join(', ')}`);
      return true;
    } else {
      logError('Attendance notification failed');
      return false;
    }
  } catch (error: any) {
    logError(`Attendance notification failed: ${error.message}`);
    return false;
  }
}

// Test 9: Leave Notification
async function testLeaveNotification() {
  logSection('Test 9: Leave Notification');
  
  try {
    logInfo('Sending leave notification...');
    
    const result = await sendLeaveNotification({
      applicantId: TEST_USER_ID,
      applicantName: 'Test Student',
      leaveType: 'SICK',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000), // Tomorrow
      status: 'APPROVED',
      approverName: 'Test Teacher'
    });
    
    if (result.success) {
      logSuccess('Leave notification sent successfully!');
      logInfo(`Channels used: ${Object.keys(result.channels).filter(k => result.channels[k as keyof typeof result.channels]?.success).join(', ')}`);
      return true;
    } else {
      logError('Leave notification failed');
      return false;
    }
  } catch (error: any) {
    logError(`Leave notification failed: ${error.message}`);
    return false;
  }
}

// Test 10: Fee Notification
async function testFeeNotification() {
  logSection('Test 10: Fee Reminder Notification');
  
  try {
    logInfo('Sending fee reminder...');
    
    const result = await sendFeeReminder({
      studentId: TEST_USER_ID,
      studentName: 'Test Student',
      amount: 5000,
      dueDate: new Date(Date.now() + 7 * 86400000), // 7 days from now
      isOverdue: false,
      parentId: TEST_USER_ID,
      outstandingBalance: 5000,
      paymentLink: 'https://example.com/pay'
    });
    
    if (result.success) {
      logSuccess('Fee reminder sent successfully!');
      logInfo(`Channels used: ${Object.keys(result.channels).filter(k => result.channels[k as keyof typeof result.channels]?.success).join(', ')}`);
      return true;
    } else {
      logError('Fee reminder failed');
      return false;
    }
  } catch (error: any) {
    logError(`Fee reminder failed: ${error.message}`);
    return false;
  }
}

// Test 11: Multi-language Support
async function testMultiLanguage() {
  logSection('Test 11: Multi-language Support');
  
  try {
    logInfo('Testing multi-language template selection...');
    
    // Check if templates exist for different languages
    const englishTemplate = await prisma.messageTemplate.findFirst({
      where: {
        type: 'WHATSAPP',
        whatsappLanguage: 'en',
        isActive: true
      }
    });
    
    const hindiTemplate = await prisma.messageTemplate.findFirst({
      where: {
        type: 'WHATSAPP',
        whatsappLanguage: 'hi',
        isActive: true
      }
    });
    
    if (englishTemplate) {
      logSuccess(`English template found: ${englishTemplate.name}`);
    } else {
      logWarning('No English WhatsApp template found');
    }
    
    if (hindiTemplate) {
      logSuccess(`Hindi template found: ${hindiTemplate.name}`);
    } else {
      logWarning('No Hindi WhatsApp template found');
    }
    
    if (englishTemplate || hindiTemplate) {
      logSuccess('Multi-language templates are configured');
      return true;
    } else {
      logError('No multi-language templates found');
      logWarning('Create templates with different whatsappLanguage values');
      return false;
    }
  } catch (error: any) {
    logError(`Multi-language test failed: ${error.message}`);
    return false;
  }
}

// Test 12: Cost Tracking
async function testCostTracking() {
  logSection('Test 12: Cost Tracking');
  
  try {
    logInfo('Testing cost calculation...');
    
    // Test SMS cost
    const smsCost = calculateMessageCost({ channel: CommunicationChannel.SMS, messageLength: 160 });
    logInfo(`SMS cost (India): ₹${smsCost.totalCost.toFixed(4)}`);
    
    // Test WhatsApp cost
    const whatsappCost = calculateMessageCost({ channel: CommunicationChannel.WHATSAPP });
    logInfo(`WhatsApp cost (India): ₹${whatsappCost.totalCost.toFixed(4)}`);
    
    // Test Email cost (should be 0)
    const emailCost = calculateMessageCost({ channel: CommunicationChannel.EMAIL });
    logInfo(`Email cost: ₹${emailCost.totalCost.toFixed(4)}`);
    
    // Calculate savings
    const savings = ((smsCost.totalCost - whatsappCost.totalCost) / smsCost.totalCost * 100).toFixed(1);
    logSuccess(`WhatsApp saves ${savings}% compared to SMS`);
    
    // Check message logs for cost tracking
    const recentLogs = await prisma.messageLog.findMany({
      where: {
        estimatedCost: { not: null }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    if (recentLogs.length > 0) {
      logSuccess(`Found ${recentLogs.length} message logs with cost tracking`);
      recentLogs.forEach(log => {
        logInfo(`${log.channel}: ₹${log.estimatedCost} - ${log.status}`);
      });
    } else {
      logWarning('No message logs with cost tracking found');
    }
    
    return true;
  } catch (error: any) {
    logError(`Cost tracking test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests(testName?: string) {
  const tests: Record<string, () => Promise<boolean>> = {
    'msg91-config': testMSG91Config,
    'whatsapp-config': testWhatsAppConfig,
    'send-sms': testSendSMS,
    'send-whatsapp': testSendWhatsApp,
    'send-template': testSendTemplate,
    'bulk-sms': testBulkSMS,
    'bulk-whatsapp': testBulkWhatsApp,
    'attendance-notification': testAttendanceNotification,
    'leave-notification': testLeaveNotification,
    'fee-notification': testFeeNotification,
    'multi-language': testMultiLanguage,
    'cost-tracking': testCostTracking,
  };
  
  log('\n' + '='.repeat(60), colors.bright + colors.cyan);
  log('  WhatsApp Notification System - Manual Testing', colors.bright + colors.cyan);
  log('='.repeat(60) + '\n', colors.bright + colors.cyan);
  
  logInfo(`Test Phone Number: ${TEST_PHONE_NUMBER}`);
  logInfo(`Test User ID: ${TEST_USER_ID}`);
  logWarning('Make sure to set TEST_PHONE_NUMBER and TEST_USER_ID in .env for testing\n');
  
  const results: Record<string, boolean> = {};
  
  if (testName && testName !== 'all') {
    // Run single test
    if (tests[testName]) {
      results[testName] = await tests[testName]();
    } else {
      logError(`Unknown test: ${testName}`);
      logInfo('Available tests: ' + Object.keys(tests).join(', ') + ', all');
      process.exit(1);
    }
  } else {
    // Run all tests
    for (const [name, testFn] of Object.entries(tests)) {
      try {
        results[name] = await testFn();
      } catch (error: any) {
        logError(`Test ${name} crashed: ${error.message}`);
        results[name] = false;
      }
      
      // Wait a bit between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Print summary
  logSection('Test Summary');
  
  const passed = Object.values(results).filter(r => r).length;
  const failed = Object.values(results).filter(r => !r).length;
  const total = Object.values(results).length;
  
  Object.entries(results).forEach(([name, passed]) => {
    if (passed) {
      logSuccess(`${name}: PASSED`);
    } else {
      logError(`${name}: FAILED`);
    }
  });
  
  log('\n' + '='.repeat(60), colors.cyan);
  log(`  Total: ${total} | Passed: ${passed} | Failed: ${failed}`, colors.bright);
  log('='.repeat(60) + '\n', colors.cyan);
  
  if (failed === 0) {
    logSuccess('All tests passed! 🎉');
  } else {
    logWarning(`${failed} test(s) failed. Check configuration and logs.`);
  }
  
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
const testName = process.argv[2];
runTests(testName).catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
