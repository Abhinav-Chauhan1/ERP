/**
 * SMS Service Usage Examples
 * 
 * This file demonstrates how to use the SMS service in the ERP system.
 * These are examples only - not meant to be executed directly.
 */

import {
  sendSMS,
  sendBulkSMS,
  getSMSDeliveryStatus,
  sendSMSWithRetry,
  isSMSConfigured,
  formatPhoneNumber,
  isValidPhoneNumber,
  SMSDeliveryStatus,
} from './sms-service';

/**
 * Example 1: Check if SMS service is configured
 */
async function example1_CheckConfiguration() {
  const configured = isSMSConfigured();

  if (configured) {
    console.log('✓ SMS service is ready to use');
  } else {
    console.log('✗ SMS service not configured. Set environment variables:');
    console.log('  - TWILIO_ACCOUNT_SID');
    console.log('  - TWILIO_AUTH_TOKEN');
    console.log('  - TWILIO_PHONE_NUMBER');
  }
}

/**
 * Example 2: Send a single SMS
 */
async function example2_SendSingleSMS() {
  const result = await sendSMS(
    '+1234567890',
    'Hello! This is a test message from School ERP.'
  );

  if (result.success) {
    console.log('✓ SMS sent successfully');
    console.log('  Message ID:', result.messageId);
    console.log('  Status:', result.status);
    console.log('  Sent to:', result.to);
  } else {
    console.error('✗ Failed to send SMS:', result.error);
  }
}

/**
 * Example 3: Send SMS with retry logic
 */
async function example3_SendWithRetry() {
  const result = await sendSMSWithRetry(
    '+1234567890',
    'Important: School will be closed tomorrow.',
    undefined // Retry logic is internal or this arg is template ID
  );

  if (result.success) {
    console.log('✓ SMS delivered after retries');
    console.log('  Message ID:', result.messageId);
  } else {
    console.error('✗ Failed after 3 retries:', result.error);
  }
}

/**
 * Example 4: Send bulk SMS to multiple recipients
 */
async function example4_SendBulkSMS() {
  const recipients = [
    '+1234567890',
    '+0987654321',
    '+1122334455',
  ];

  const message = 'Reminder: Parent-teacher meeting tomorrow at 3 PM.';

  const results = await sendBulkSMS(recipients, message);

  console.log(`Sent ${results.length} messages:`);

  results.forEach((result, index) => {
    if (result.success) {
      console.log(`  ✓ ${result.to}: ${result.status} (${result.messageId})`);
    } else {
      console.log(`  ✗ ${result.to}: ${result.error}`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  console.log(`\nSummary: ${successCount} successful, ${failureCount} failed`);
}

/**
 * Example 5: Check delivery status of a sent message
 */
async function example5_CheckDeliveryStatus() {
  // First, send a message
  const sendResult = await sendSMS('+1234567890', 'Test message');

  if (!sendResult.success || !sendResult.messageId) {
    console.error('Failed to send message');
    return;
  }

  console.log('Message sent, checking status...');

  // Wait a bit for delivery
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check status
  const statusResult = await getSMSDeliveryStatus(sendResult.messageId);

  if (statusResult.success) {
    console.log('✓ Delivery status retrieved');
    console.log('  Status:', statusResult.status);
    console.log('  Sent at:', statusResult.dateSent);
    console.log('  Updated at:', statusResult.dateUpdated);

    if (statusResult.errorCode) {
      console.log('  Error code:', statusResult.errorCode);
      console.log('  Error message:', statusResult.errorMessage);
    }
  } else {
    console.error('✗ Failed to get status:', statusResult.error);
  }
}

/**
 * Example 6: Format and validate phone numbers
 */
async function example6_PhoneNumberHandling() {
  // Format phone numbers
  const formatted1 = formatPhoneNumber('2025551234', '+1');
  console.log('Formatted US number:', formatted1); // +12025551234

  const formatted2 = formatPhoneNumber('9876543210', '+91');
  console.log('Formatted India number:', formatted2); // +919876543210

  // Validate phone numbers
  const valid1 = isValidPhoneNumber('+12025551234');
  console.log('+12025551234 is valid:', valid1); // true

  const valid2 = isValidPhoneNumber('2025551234');
  console.log('2025551234 is valid:', valid2); // false (missing country code)

  const valid3 = isValidPhoneNumber('+1-202-555-1234');
  console.log('+1-202-555-1234 is valid:', valid3); // false (has dashes)
}

/**
 * Example 7: Handle different delivery statuses
 */
async function example7_HandleDeliveryStatuses() {
  const result = await sendSMS('+1234567890', 'Test message');

  if (!result.success) {
    console.error('Failed to send:', result.error);
    return;
  }

  // Poll for status updates
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const status = await getSMSDeliveryStatus(result.messageId!);

    if (!status.success) {
      console.error('Failed to get status');
      break;
    }

    console.log(`Attempt ${attempts + 1}: Status = ${status.status}`);

    switch (status.status) {
      case SMSDeliveryStatus.DELIVERED:
        console.log('✓ Message delivered successfully!');
        return;

      case SMSDeliveryStatus.FAILED:
      case SMSDeliveryStatus.UNDELIVERED:
        console.error('✗ Message delivery failed');
        console.error('  Error:', status.errorMessage);
        return;

      case SMSDeliveryStatus.QUEUED:
      case SMSDeliveryStatus.SENDING:
      case SMSDeliveryStatus.SENT:
        // Still in progress, wait and check again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        break;
    }
  }

  console.log('Timeout waiting for delivery confirmation');
}

/**
 * Example 8: Error handling best practices
 */
async function example8_ErrorHandling() {
  try {
    // Validate input before sending
    const phoneNumber = '+1234567890';
    const message = 'Test message';

    if (!isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    // Check if service is configured
    if (!isSMSConfigured()) {
      throw new Error('SMS service not configured');
    }

    // Send with retry
    const result = await sendSMSWithRetry(phoneNumber, message);

    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    console.log('✓ Message sent successfully');

    // Log for audit trail
    console.log('Audit log:', {
      timestamp: result.timestamp,
      to: result.to,
      messageId: result.messageId,
      status: result.status,
    });

  } catch (error) {
    console.error('Error sending SMS:', error);

    // Log error for monitoring
    // In production, send to error tracking service (e.g., Sentry)

    // Return user-friendly error message
    return {
      success: false,
      error: 'Failed to send SMS. Please try again later.',
    };
  }
}

/**
 * Example 9: Batch processing with rate limiting
 */
async function example9_BatchProcessing() {
  const allRecipients = [
    '+1234567890',
    '+0987654321',
    '+1122334455',
    // ... potentially hundreds more
  ];

  const message = 'Important announcement from school';
  const batchSize = 10; // Process 10 at a time
  const delayBetweenBatches = 1000; // 1 second delay

  console.log(`Processing ${allRecipients.length} recipients in batches of ${batchSize}`);

  const allResults = [];

  for (let i = 0; i < allRecipients.length; i += batchSize) {
    const batch = allRecipients.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

    const batchResults = await sendBulkSMS(batch, message);
    allResults.push(...batchResults);

    // Delay between batches to avoid rate limits
    if (i + batchSize < allRecipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  const successCount = allResults.filter(r => r.success).length;
  const failureCount = allResults.filter(r => !r.success).length;

  console.log(`\nCompleted: ${successCount} successful, ${failureCount} failed`);
}

/**
 * Example 10: Integration with database logging
 */
async function example10_DatabaseLogging() {
  // This example shows how you might log SMS operations to database
  // Note: You would need to create an SMSLog model in Prisma schema

  const result = await sendSMS('+1234567890', 'Test message');

  // Example database log structure (not implemented in current schema)
  const logEntry = {
    messageId: result.messageId,
    to: result.to,
    body: result.body,
    status: result.status,
    success: result.success,
    error: result.error,
    timestamp: result.timestamp,
    sentBy: 'admin-user-id', // Current user ID
  };

  console.log('Would log to database:', logEntry);

  // In production:
  // await db.smsLog.create({ data: logEntry });
}

// Export examples for reference
export const examples = {
  example1_CheckConfiguration,
  example2_SendSingleSMS,
  example3_SendWithRetry,
  example4_SendBulkSMS,
  example5_CheckDeliveryStatus,
  example6_PhoneNumberHandling,
  example7_HandleDeliveryStatuses,
  example8_ErrorHandling,
  example9_BatchProcessing,
  example10_DatabaseLogging,
};
