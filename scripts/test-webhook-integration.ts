/**
 * Webhook Integration Test Script
 * 
 * This script tests the MSG91 and WhatsApp webhook endpoints with sample payloads
 * to verify they work correctly. It simulates webhook calls from both services
 * and verifies database updates occur as expected.
 * 
 * Requirements: Task 11 - Checkpoint - Ensure webhooks work correctly
 */

import crypto from 'crypto';
import { PrismaClient, MessageLogStatus, CommunicationChannel } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_CONFIG = {
  msg91: {
    webhookUrl: 'http://localhost:3000/api/webhooks/msg91',
    token: process.env.MSG91_WEBHOOK_TOKEN || 'test-token-123',
  },
  whatsapp: {
    webhookUrl: 'http://localhost:3000/api/webhooks/whatsapp',
    appSecret: process.env.WHATSAPP_APP_SECRET || 'test-app-secret',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'test-verify-token',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a WhatsApp webhook signature
 */
function createWhatsAppSignature(payload: string, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `sha256=${signature}`;
}

/**
 * Create a test message log entry
 */
async function createTestMessageLog(
  messageId: string,
  channel: CommunicationChannel,
  recipient: string
) {
  return await prisma.messageLog.create({
    data: {
      messageId,
      channel,
      recipient,
      status: MessageLogStatus.SENT,
      body: 'Test message',
      sentAt: new Date(),
    },
  });
}

/**
 * Get message log by message ID
 */
async function getMessageLog(messageId: string) {
  return await prisma.messageLog.findFirst({
    where: { messageId },
  });
}

/**
 * Clean up test data
 */
async function cleanupTestData(messageIds: string[]) {
  await prisma.messageLog.deleteMany({
    where: {
      messageId: {
        in: messageIds,
      },
    },
  });
}

// ============================================================================
// MSG91 Webhook Tests
// ============================================================================

async function testMSG91Webhooks() {
  console.log('\n=== Testing MSG91 Webhooks ===\n');

  const testMessageId = `msg91-test-${Date.now()}`;
  const testCases = [
    {
      name: 'DELIVERED status',
      payload: {
        request_id: testMessageId,
        status: 'DELIVERED',
        mobile: '919876543210',
        description: 'Message delivered successfully',
        timestamp: new Date().toISOString(),
      },
      expectedStatus: MessageLogStatus.DELIVERED,
    },
    {
      name: 'FAILED status',
      payload: {
        request_id: `${testMessageId}-failed`,
        status: 'FAILED',
        mobile: '919876543210',
        description: 'Invalid number',
        timestamp: new Date().toISOString(),
      },
      expectedStatus: MessageLogStatus.FAILED,
    },
    {
      name: 'REJECTED status (mapped to FAILED)',
      payload: {
        request_id: `${testMessageId}-rejected`,
        status: 'REJECTED',
        mobile: '919876543210',
        description: 'Message rejected by carrier',
        timestamp: new Date().toISOString(),
      },
      expectedStatus: MessageLogStatus.FAILED,
    },
  ];

  const messageIds: string[] = [];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);

      // Create test message log
      await createTestMessageLog(
        testCase.payload.request_id,
        CommunicationChannel.SMS,
        testCase.payload.mobile
      );
      messageIds.push(testCase.payload.request_id);

      // Simulate webhook call
      const response = await fetch(
        `${TEST_CONFIG.msg91.webhookUrl}?token=${TEST_CONFIG.msg91.token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.payload),
        }
      );

      const data = await response.json();

      if (response.status !== 200) {
        console.error(`  ❌ Failed: HTTP ${response.status}`, data);
        continue;
      }

      // Verify database update
      const messageLog = await getMessageLog(testCase.payload.request_id);

      if (!messageLog) {
        console.error('  ❌ Failed: Message log not found');
        continue;
      }

      if (messageLog.status !== testCase.expectedStatus) {
        console.error(
          `  ❌ Failed: Expected status ${testCase.expectedStatus}, got ${messageLog.status}`
        );
        continue;
      }

      console.log(`  ✅ Passed: Status updated to ${messageLog.status}`);

      // Verify timestamps
      if (testCase.expectedStatus === MessageLogStatus.DELIVERED && !messageLog.deliveredAt) {
        console.warn('  ⚠️  Warning: deliveredAt timestamp not set');
      }

      if (testCase.expectedStatus === MessageLogStatus.FAILED && !messageLog.failedAt) {
        console.warn('  ⚠️  Warning: failedAt timestamp not set');
      }
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  // Cleanup
  await cleanupTestData(messageIds);
  console.log('\n✓ MSG91 webhook tests completed\n');
}

// ============================================================================
// WhatsApp Webhook Tests
// ============================================================================

async function testWhatsAppWebhooks() {
  console.log('\n=== Testing WhatsApp Webhooks ===\n');

  const testMessageId = `wamid-test-${Date.now()}`;
  const testCases = [
    {
      name: 'DELIVERED status',
      payload: {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: testMessageId,
                      status: 'delivered',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: '919876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      },
      expectedStatus: MessageLogStatus.DELIVERED,
    },
    {
      name: 'READ status',
      payload: {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-456',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: `${testMessageId}-read`,
                      status: 'read',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: '919876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      },
      expectedStatus: MessageLogStatus.READ,
    },
    {
      name: 'FAILED status with error',
      payload: {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-error',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: `${testMessageId}-failed`,
                      status: 'failed',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: '919876543210',
                      errors: [
                        {
                          code: 131026,
                          title: 'Message undeliverable',
                        },
                      ],
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      },
      expectedStatus: MessageLogStatus.FAILED,
    },
  ];

  const messageIds: string[] = [];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);

      const messageId = testCase.payload.entry[0].changes[0].value.statuses[0].id;

      // Create test message log
      await createTestMessageLog(
        messageId,
        CommunicationChannel.WHATSAPP,
        '919876543210'
      );
      messageIds.push(messageId);

      // Create signature
      const payloadString = JSON.stringify(testCase.payload);
      const signature = createWhatsAppSignature(
        payloadString,
        TEST_CONFIG.whatsapp.appSecret
      );

      // Simulate webhook call
      const response = await fetch(TEST_CONFIG.whatsapp.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const data = await response.json();

      if (response.status !== 200) {
        console.error(`  ❌ Failed: HTTP ${response.status}`, data);
        continue;
      }

      // Verify database update
      const messageLog = await getMessageLog(messageId);

      if (!messageLog) {
        console.error('  ❌ Failed: Message log not found');
        continue;
      }

      if (messageLog.status !== testCase.expectedStatus) {
        console.error(
          `  ❌ Failed: Expected status ${testCase.expectedStatus}, got ${messageLog.status}`
        );
        continue;
      }

      console.log(`  ✅ Passed: Status updated to ${messageLog.status}`);

      // Verify timestamps
      if (testCase.expectedStatus === MessageLogStatus.DELIVERED && !messageLog.deliveredAt) {
        console.warn('  ⚠️  Warning: deliveredAt timestamp not set');
      }

      if (testCase.expectedStatus === MessageLogStatus.READ && !messageLog.readAt) {
        console.warn('  ⚠️  Warning: readAt timestamp not set');
      }

      if (testCase.expectedStatus === MessageLogStatus.FAILED && !messageLog.failedAt) {
        console.warn('  ⚠️  Warning: failedAt timestamp not set');
      }
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  // Cleanup
  await cleanupTestData(messageIds);
  console.log('\n✓ WhatsApp webhook tests completed\n');
}

// ============================================================================
// WhatsApp Incoming Message Tests
// ============================================================================

async function testWhatsAppIncomingMessages() {
  console.log('\n=== Testing WhatsApp Incoming Messages ===\n');

  const testCases = [
    {
      name: 'Text message',
      payload: {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-msg',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  messages: [
                    {
                      from: '919876543210',
                      id: `wamid-incoming-${Date.now()}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: 'text',
                      text: {
                        body: 'Hello, this is a test message',
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      },
    },
    {
      name: 'Button response',
      payload: {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-button',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone-123',
                  },
                  messages: [
                    {
                      from: '919876543210',
                      id: `wamid-button-${Date.now()}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: 'button',
                      button: {
                        text: 'Confirm',
                        payload: 'confirm_attendance',
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      },
    },
  ];

  const messageIds: string[] = [];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);

      const messageId = testCase.payload.entry[0].changes[0].value.messages[0].id;
      messageIds.push(messageId);

      // Create signature
      const payloadString = JSON.stringify(testCase.payload);
      const signature = createWhatsAppSignature(
        payloadString,
        TEST_CONFIG.whatsapp.appSecret
      );

      // Simulate webhook call
      const response = await fetch(TEST_CONFIG.whatsapp.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signature,
        },
        body: payloadString,
      });

      const data = await response.json();

      if (response.status !== 200) {
        console.error(`  ❌ Failed: HTTP ${response.status}`, data);
        continue;
      }

      // Verify message was logged
      const messageLog = await getMessageLog(messageId);

      if (!messageLog) {
        console.error('  ❌ Failed: Incoming message not logged');
        continue;
      }

      if (messageLog.channel !== CommunicationChannel.WHATSAPP) {
        console.error('  ❌ Failed: Wrong channel');
        continue;
      }

      console.log(`  ✅ Passed: Incoming message logged`);
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  // Cleanup
  await cleanupTestData(messageIds);
  console.log('\n✓ WhatsApp incoming message tests completed\n');
}

// ============================================================================
// WhatsApp Webhook Verification Test
// ============================================================================

async function testWhatsAppWebhookVerification() {
  console.log('\n=== Testing WhatsApp Webhook Verification ===\n');

  try {
    console.log('Testing: Webhook verification challenge');

    const challenge = 'test-challenge-' + Date.now();
    const url = new URL(TEST_CONFIG.whatsapp.webhookUrl);
    url.searchParams.set('hub.mode', 'subscribe');
    url.searchParams.set('hub.verify_token', TEST_CONFIG.whatsapp.verifyToken);
    url.searchParams.set('hub.challenge', challenge);

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const text = await response.text();

    if (response.status !== 200) {
      console.error(`  ❌ Failed: HTTP ${response.status}`);
      return;
    }

    if (text !== challenge) {
      console.error(`  ❌ Failed: Expected challenge "${challenge}", got "${text}"`);
      return;
    }

    console.log('  ✅ Passed: Webhook verification successful');
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
  }

  console.log('\n✓ WhatsApp webhook verification test completed\n');
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Webhook Integration Test Suite                    ║');
  console.log('║                                                            ║');
  console.log('║  This script tests MSG91 and WhatsApp webhook endpoints   ║');
  console.log('║  with sample payloads to verify correct functionality.    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n⚠️  Note: This script requires the development server to be running');
  console.log('   Run: npm run dev\n');

  try {
    // Test MSG91 webhooks
    await testMSG91Webhooks();

    // Test WhatsApp webhook verification
    await testWhatsAppWebhookVerification();

    // Test WhatsApp status update webhooks
    await testWhatsAppWebhooks();

    // Test WhatsApp incoming messages
    await testWhatsAppIncomingMessages();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  All Tests Completed                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
