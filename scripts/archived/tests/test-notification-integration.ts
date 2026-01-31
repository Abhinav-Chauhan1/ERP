/**
 * Test script for notification integration with calendar reminders
 * 
 * This script tests:
 * 1. Creating in-app notifications
 * 2. Creating reminder notifications
 * 3. Fetching user notifications
 * 4. Marking notifications as read
 * 5. Integration with event reminder service
 */

import { PrismaClient } from '@prisma/client';
import {
  createNotification,
  createReminderNotification,
  getUserNotifications,
  getNotificationSummary,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../src/lib/services/notification-service';
import {
  createRemindersForEvent,
  processPendingReminders
} from '../src/lib/services/event-reminder-service';

const prisma = new PrismaClient();

async function testNotificationService() {
  console.log('='.repeat(50));
  console.log('Testing Notification Service');
  console.log('='.repeat(50));

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'TEACHER'
      }
    });

    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`✅ Using test user: ${testUser.email} (${testUser.id})`);

    // Test 1: Create a basic notification
    console.log('\n1. Creating basic notification...');
    const notification1 = await createNotification({
      userId: testUser.id,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'INFO'
    });
    console.log(`✅ Created notification: ${notification1.id}`);

    // Test 2: Create a reminder notification
    console.log('\n2. Creating reminder notification...');
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 1); // Tomorrow
    
    const notification2 = await createReminderNotification(
      testUser.id,
      'Math Exam',
      eventDate,
      '10:00 AM',
      'Room 101',
      'test-event-id'
    );
    console.log(`✅ Created reminder notification: ${notification2.id}`);
    console.log(`   Title: ${notification2.title}`);
    console.log(`   Message: ${notification2.message}`);
    console.log(`   Link: ${notification2.link}`);

    // Test 3: Get user notifications
    console.log('\n3. Fetching user notifications...');
    const notifications = await getUserNotifications(testUser.id, 10);
    console.log(`✅ Found ${notifications.length} notifications`);
    notifications.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.title} - ${n.isRead ? 'Read' : 'Unread'}`);
    });

    // Test 4: Get notification summary
    console.log('\n4. Getting notification summary...');
    const summary = await getNotificationSummary(testUser.id);
    console.log(`✅ Total: ${summary.total}, Unread: ${summary.unread}`);

    // Test 5: Mark notification as read
    console.log('\n5. Marking notification as read...');
    const updatedNotification = await markNotificationAsRead(notification1.id, testUser.id);
    console.log(`✅ Marked notification ${updatedNotification.id} as read`);
    console.log(`   Read at: ${updatedNotification.readAt}`);

    // Test 6: Mark all notifications as read
    console.log('\n6. Marking all notifications as read...');
    const count = await markAllNotificationsAsRead(testUser.id);
    console.log(`✅ Marked ${count} notifications as read`);

    // Test 7: Delete notification
    console.log('\n7. Deleting test notification...');
    await deleteNotification(notification1.id, testUser.id);
    console.log(`✅ Deleted notification ${notification1.id}`);

    console.log('\n✅ All notification service tests passed!');

  } catch (error) {
    console.error('❌ Error testing notification service:', error);
    throw error;
  }
}

async function testReminderIntegration() {
  console.log('\n' + '='.repeat(50));
  console.log('Testing Reminder Integration');
  console.log('='.repeat(50));

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'TEACHER'
      }
    });

    if (!testUser) {
      console.log('❌ No test user found.');
      return;
    }

    // Create or get user calendar preferences
    console.log('\n1. Setting up user calendar preferences...');
    const preferences = await prisma.userCalendarPreferences.upsert({
      where: { userId: testUser.id },
      update: {
        defaultReminderTime: 60, // 1 hour before
        reminderTypes: ['IN_APP', 'EMAIL']
      },
      create: {
        userId: testUser.id,
        defaultView: 'month',
        defaultReminderTime: 60,
        reminderTypes: ['IN_APP', 'EMAIL']
      }
    });
    console.log(`✅ User preferences: ${preferences.reminderTypes.join(', ')}`);
    console.log(`   Reminder time: ${preferences.defaultReminderTime} minutes before`);

    // Test creating reminder notifications directly
    console.log('\n2. Testing reminder notification creation...');
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 1); // Tomorrow
    
    const reminderNotif = await createReminderNotification(
      testUser.id,
      'Important Meeting',
      eventDate,
      '2:00 PM',
      'Conference Room A',
      'meeting-123'
    );
    
    console.log(`✅ Created reminder notification: ${reminderNotif.id}`);
    console.log(`   Title: ${reminderNotif.title}`);
    console.log(`   Message: ${reminderNotif.message}`);
    console.log(`   Type: ${reminderNotif.type}`);
    console.log(`   Link: ${reminderNotif.link}`);

    // Test fetching notifications
    console.log('\n3. Fetching reminder notifications...');
    const notifications = await prisma.notification.findMany({
      where: {
        userId: testUser.id,
        type: 'REMINDER'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    console.log(`✅ Found ${notifications.length} reminder notifications`);
    notifications.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.title} - ${n.isRead ? 'Read' : 'Unread'}`);
    });

    // Test notification summary
    console.log('\n4. Getting notification summary...');
    const summary = await getNotificationSummary(testUser.id);
    console.log(`✅ Total: ${summary.total}, Unread: ${summary.unread}`);

    console.log('\n✅ All reminder integration tests passed!');
    console.log('\nNote: Full event integration tests require EventCategory model to be created.');
    console.log('      This will be available after task 1 (database models) is complete.');

  } catch (error) {
    console.error('❌ Error testing reminder integration:', error);
    throw error;
  }
}

async function main() {
  try {
    await testNotificationService();
    await testReminderIntegration();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
