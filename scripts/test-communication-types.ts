/**
 * Test script for communication types
 * 
 * This script verifies that all communication types are properly defined and exported.
 * Run with: npx tsx scripts/test-communication-types.ts
 */

import {
  CommunicationChannel,
  MessageStatus,
  NotificationType,
  WhatsAppMessageType,
  WhatsAppTemplateStatus,
  MSG91Route,
  type MSG91SMSParams,
  type MSG91Response,
  type MSG91SendResult,
  type WhatsAppTextMessage,
  type WhatsAppTemplateMessage,
  type WhatsAppInteractiveMessage,
  type NotificationParams,
  type CommunicationResult,
  type AttendanceAlertParams,
  type LeaveNotificationParams,
  type FeeReminderParams,
  type BulkNotificationParams,
  CommunicationError,
  MSG91Error,
  WhatsAppError
} from '../src/lib/types/communication';

console.log('=== Communication Types Test ===\n');

// Test 1: Enums
console.log('1. Testing Enums...');
console.log(`   CommunicationChannel.EMAIL: ${CommunicationChannel.EMAIL}`);
console.log(`   CommunicationChannel.SMS: ${CommunicationChannel.SMS}`);
console.log(`   CommunicationChannel.WHATSAPP: ${CommunicationChannel.WHATSAPP}`);
console.log(`   MessageStatus.SENT: ${MessageStatus.SENT}`);
console.log(`   NotificationType.ATTENDANCE: ${NotificationType.ATTENDANCE}`);
console.log(`   WhatsAppMessageType.TEXT: ${WhatsAppMessageType.TEXT}`);
console.log(`   MSG91Route.TRANSACTIONAL: ${MSG91Route.TRANSACTIONAL}`);
console.log('   ✓ All enums accessible');
console.log();

// Test 2: MSG91 Types
console.log('2. Testing MSG91 Types...');
const msg91Params: MSG91SMSParams = {
  sender: 'SCHOOL',
  route: MSG91Route.TRANSACTIONAL,
  country: '91',
  sms: [{
    message: 'Test message',
    to: ['919876543210']
  }],
  DLT_TE_ID: 'test_template_id'
};
console.log('   ✓ MSG91SMSParams created successfully');

const msg91Response: MSG91Response = {
  type: 'success',
  message: 'Message sent',
  request_id: 'test_request_id'
};
console.log('   ✓ MSG91Response created successfully');

const msg91Result: MSG91SendResult = {
  success: true,
  messageId: 'test_message_id'
};
console.log('   ✓ MSG91SendResult created successfully');
console.log();

// Test 3: WhatsApp Types
console.log('3. Testing WhatsApp Types...');
const whatsappText: WhatsAppTextMessage = {
  type: 'text',
  text: {
    body: 'Test message',
    preview_url: true
  }
};
console.log('   ✓ WhatsAppTextMessage created successfully');

const whatsappTemplate: WhatsAppTemplateMessage = {
  type: 'template',
  template: {
    name: 'attendance_alert',
    language: {
      code: 'en'
    },
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: 'John Doe' },
        { type: 'text', text: '2024-01-15' }
      ]
    }]
  }
};
console.log('   ✓ WhatsAppTemplateMessage created successfully');

const whatsappInteractive: WhatsAppInteractiveMessage = {
  type: 'interactive',
  interactive: {
    type: 'button',
    body: {
      text: 'Please confirm your attendance'
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: 'confirm_yes',
            title: 'Yes'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'confirm_no',
            title: 'No'
          }
        }
      ]
    }
  }
};
console.log('   ✓ WhatsAppInteractiveMessage created successfully');
console.log();

// Test 4: Communication Service Types
console.log('4. Testing Communication Service Types...');
const notificationParams: NotificationParams = {
  userId: 'user_123',
  type: NotificationType.ATTENDANCE,
  title: 'Attendance Alert',
  message: 'Your child was marked absent today',
  channels: [CommunicationChannel.WHATSAPP, CommunicationChannel.SMS]
};
console.log('   ✓ NotificationParams created successfully');

const communicationResult: CommunicationResult = {
  success: true,
  channels: {
    whatsapp: {
      success: true,
      messageId: 'whatsapp_msg_123'
    },
    sms: {
      success: true,
      messageId: 'sms_msg_456'
    }
  }
};
console.log('   ✓ CommunicationResult created successfully');

const attendanceParams: AttendanceAlertParams = {
  studentId: 'student_123',
  studentName: 'John Doe',
  date: new Date(),
  status: 'ABSENT',
  attendancePercentage: 85.5,
  parentId: 'parent_123'
};
console.log('   ✓ AttendanceAlertParams created successfully');

const leaveParams: LeaveNotificationParams = {
  applicantId: 'student_123',
  applicantName: 'John Doe',
  leaveType: 'Sick Leave',
  startDate: new Date(),
  endDate: new Date(),
  status: 'APPROVED',
  approverName: 'Principal Smith'
};
console.log('   ✓ LeaveNotificationParams created successfully');

const feeParams: FeeReminderParams = {
  studentId: 'student_123',
  studentName: 'John Doe',
  amount: 5000,
  dueDate: new Date(),
  isOverdue: false,
  outstandingBalance: 5000,
  parentId: 'parent_123'
};
console.log('   ✓ FeeReminderParams created successfully');

const bulkParams: BulkNotificationParams = {
  recipients: ['user_1', 'user_2', 'user_3'],
  type: NotificationType.ANNOUNCEMENT,
  title: 'School Announcement',
  message: 'School will be closed tomorrow',
  channel: CommunicationChannel.WHATSAPP
};
console.log('   ✓ BulkNotificationParams created successfully');
console.log();

// Test 5: Error Types
console.log('5. Testing Error Types...');
try {
  throw new CommunicationError('Test error', 'TEST_001', CommunicationChannel.SMS);
} catch (error) {
  if (error instanceof CommunicationError) {
    console.log(`   ✓ CommunicationError: ${error.message} (${error.code})`);
  }
}

try {
  throw new MSG91Error('Invalid auth key', '102', '919876543210');
} catch (error) {
  if (error instanceof MSG91Error) {
    console.log(`   ✓ MSG91Error: ${error.message} (${error.code})`);
  }
}

try {
  throw new WhatsAppError('Invalid number', 131026, '919876543210', 'text');
} catch (error) {
  if (error instanceof WhatsAppError) {
    console.log(`   ✓ WhatsAppError: ${error.message} (${error.code})`);
  }
}
console.log();

console.log('=== All Types Test Passed ===');
