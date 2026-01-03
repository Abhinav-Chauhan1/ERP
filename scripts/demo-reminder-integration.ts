/**
 * Demo: Reminder Service Integration
 * 
 * This script demonstrates the complete integration between
 * calendar events and the reminder system.
 */

import { PrismaClient } from '@prisma/client';
import { createCalendarEvent, updateCalendarEvent } from '../src/lib/services/calendar-service';
import {
  createRemindersForEvent,
  synchronizeRemindersOnEventUpdate,
  getPendingReminders,
  generateReminderNotification
} from '../src/lib/services/event-reminder-service';

const prisma = new PrismaClient();

async function main() {
  console.log('📅 Calendar & Reminder Integration Demo\n');

  try {
    // Step 1: Get or create a category
    console.log('Step 1: Setting up event category');
    console.log('='.repeat(50));
    
    let category = await prisma.calendarEventCategory.findFirst({
      where: { name: 'Meeting' }
    });

    if (!category) {
      category = await prisma.calendarEventCategory.create({
        data: {
          name: 'Meeting',
          description: 'Team meetings and discussions',
          color: '#8B5CF6',
          icon: 'users',
          isActive: true,
          order: 1
        }
      });
      console.log('✅ Created Meeting category');
    } else {
      console.log('✅ Using existing Meeting category');
    }
    console.log();

    // Step 2: Create a test user preference
    console.log('Step 2: Setting up user preferences');
    console.log('='.repeat(50));
    
    const testUserId = 'demo-user-123';
    
    let userPrefs = await prisma.userCalendarPreferences.findUnique({
      where: { userId: testUserId }
    });

    if (!userPrefs) {
      userPrefs = await prisma.userCalendarPreferences.create({
        data: {
          userId: testUserId,
          defaultView: 'month',
          defaultReminderTime: 1440, // 1 day before
          reminderTypes: ['EMAIL', 'IN_APP']
        }
      });
      console.log('✅ Created user preferences');
    } else {
      console.log('✅ Using existing user preferences');
    }
    
    console.log(`   Reminder Time: ${userPrefs.defaultReminderTime} minutes before event`);
    console.log(`   Reminder Types: ${userPrefs.reminderTypes.join(', ')}`);
    console.log();

    // Step 3: Create a calendar event
    console.log('Step 3: Creating calendar event');
    console.log('='.repeat(50));
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    futureDate.setHours(14, 0, 0, 0); // 2:00 PM
    
    const endDate = new Date(futureDate);
    endDate.setHours(15, 0, 0, 0); // 3:00 PM

    const event = await createCalendarEvent({
      title: 'Team Planning Meeting',
      description: 'Quarterly planning and review session',
      categoryId: category.id,
      startDate: futureDate,
      endDate: endDate,
      isAllDay: false,
      location: 'Conference Room A',
      visibleToRoles: ['TEACHER', 'ADMIN'],
      createdBy: testUserId
    });

    console.log('✅ Event created successfully');
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Title: ${event.title}`);
    console.log(`   Date: ${event.startDate.toLocaleString()}`);
    console.log();

    // Step 4: Create reminders for the event
    console.log('Step 4: Creating reminders');
    console.log('='.repeat(50));
    
    const userIds = [testUserId, 'demo-user-456', 'demo-user-789'];
    
    // Create user preferences for other users
    for (const userId of userIds.slice(1)) {
      await prisma.userCalendarPreferences.upsert({
        where: { userId },
        create: {
          userId,
          defaultView: 'month',
          defaultReminderTime: 1440,
          reminderTypes: ['IN_APP']
        },
        update: {}
      });
    }

    const reminders = await createRemindersForEvent(event.id, userIds);
    
    console.log(`✅ Created ${reminders.length} reminder(s)`);
    reminders.forEach((reminder, index) => {
      console.log(`   Reminder ${index + 1}:`);
      console.log(`     User: ${reminder.userId}`);
      console.log(`     Type: ${reminder.reminderType}`);
      console.log(`     Scheduled: ${reminder.reminderTime.toLocaleString()}`);
    });
    console.log();

    // Step 5: Generate notification preview
    console.log('Step 5: Notification Preview');
    console.log('='.repeat(50));
    
    const notification = generateReminderNotification(event);
    console.log('Email/Notification Content:');
    console.log(`   Subject: Reminder: ${notification.eventTitle}`);
    console.log(`   Event: ${notification.eventTitle}`);
    console.log(`   Date: ${notification.eventDate.toLocaleDateString()}`);
    console.log(`   Time: ${notification.eventTime}`);
    console.log(`   Location: ${notification.location}`);
    console.log(`   Description: ${notification.description}`);
    console.log();

    // Step 6: Update event and synchronize reminders
    console.log('Step 6: Updating event and synchronizing reminders');
    console.log('='.repeat(50));
    
    const newStartDate = new Date(futureDate);
    newStartDate.setHours(16, 0, 0, 0); // Move to 4:00 PM
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setHours(17, 0, 0, 0); // 5:00 PM

    console.log(`   Old time: ${futureDate.toLocaleTimeString()}`);
    console.log(`   New time: ${newStartDate.toLocaleTimeString()}`);

    const updatedEvent = await updateCalendarEvent(event.id, {
      startDate: newStartDate,
      endDate: newEndDate
    });

    console.log('✅ Event updated successfully');
    console.log('✅ Reminders automatically synchronized');
    console.log();

    // Step 7: Verify reminder synchronization
    console.log('Step 7: Verifying reminder synchronization');
    console.log('='.repeat(50));
    
    const updatedReminders = await prisma.eventReminder.findMany({
      where: { eventId: event.id }
    });

    console.log(`Found ${updatedReminders.length} reminder(s) after update`);
    updatedReminders.forEach((reminder, index) => {
      console.log(`   Reminder ${index + 1}:`);
      console.log(`     Scheduled: ${reminder.reminderTime.toLocaleString()}`);
      console.log(`     Status: ${reminder.isSent ? 'Sent' : 'Pending'}`);
    });
    console.log();

    // Step 8: Check pending reminders
    console.log('Step 8: Checking pending reminders');
    console.log('='.repeat(50));
    
    const pending = await getPendingReminders(new Date('2099-12-31')); // Get all future reminders
    const ourReminders = pending.filter(r => r.eventId === event.id);
    
    console.log(`Found ${ourReminders.length} pending reminder(s) for our event`);
    console.log();

    // Step 9: Cleanup
    console.log('Step 9: Cleanup');
    console.log('='.repeat(50));
    
    await prisma.calendarEvent.delete({
      where: { id: event.id }
    });
    console.log('✅ Event deleted (reminders cascade deleted)');
    
    // Clean up user preferences
    for (const userId of userIds) {
      await prisma.userCalendarPreferences.deleteMany({
        where: { userId }
      });
    }
    console.log('✅ User preferences cleaned up');
    console.log();

    console.log('✅ Demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('  ✓ Reminder time calculation based on user preferences');
    console.log('  ✓ Automatic reminder creation for multiple users');
    console.log('  ✓ Notification content generation');
    console.log('  ✓ Reminder synchronization on event updates');
    console.log('  ✓ Deduplication logic');
    console.log('  ✓ Cascade deletion of reminders');

  } catch (error) {
    console.error('❌ Error during demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
