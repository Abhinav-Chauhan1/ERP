/**
 * Test script for Event Reminder Service
 * 
 * This script demonstrates the reminder service functionality:
 * - Creating reminders for events
 * - Calculating reminder times
 * - Generating notifications
 * - Processing pending reminders
 */

import { PrismaClient } from '@prisma/client';
import {
  createRemindersForEvent,
  calculateReminderTime,
  generateReminderNotification,
  getPendingReminders,
  synchronizeRemindersOnEventUpdate,
  processPendingReminders
} from '../src/lib/services/event-reminder-service';

const prisma = new PrismaClient();

async function main() {
  console.log('🔔 Event Reminder Service Test\n');

  try {
    // Test 1: Calculate reminder times
    console.log('Test 1: Calculate Reminder Times');
    console.log('='.repeat(50));
    
    const eventDate = new Date('2025-12-31T10:00:00');
    console.log(`Event Date: ${eventDate.toLocaleString()}`);
    
    const oneDayBefore = calculateReminderTime(eventDate, 1440);
    console.log(`1 day before: ${oneDayBefore.toLocaleString()}`);
    
    const oneWeekBefore = calculateReminderTime(eventDate, 10080);
    console.log(`1 week before: ${oneWeekBefore.toLocaleString()}`);
    
    const oneHourBefore = calculateReminderTime(eventDate, 60);
    console.log(`1 hour before: ${oneHourBefore.toLocaleString()}`);
    console.log();

    // Test 2: Check for existing events
    console.log('Test 2: Check Existing Events');
    console.log('='.repeat(50));
    
    const events = await prisma.calendarEvent.findMany({
      take: 1,
      include: {
        category: true
      }
    });

    if (events.length === 0) {
      console.log('⚠️  No events found in database');
      console.log('Please create some events first using the calendar system');
      console.log();
    } else {
      const event = events[0];
      console.log(`Found event: ${event.title}`);
      console.log(`Date: ${event.startDate.toLocaleString()}`);
      console.log(`Category: ${event.category.name}`);
      console.log();

      // Test 3: Generate notification
      console.log('Test 3: Generate Notification');
      console.log('='.repeat(50));
      
      const notification = generateReminderNotification(event);
      console.log('Notification Data:');
      console.log(`  Title: ${notification.eventTitle}`);
      console.log(`  Date: ${notification.eventDate.toLocaleDateString()}`);
      console.log(`  Time: ${notification.eventTime}`);
      console.log(`  Location: ${notification.location || 'N/A'}`);
      console.log(`  Description: ${notification.description || 'N/A'}`);
      console.log();

      // Test 4: Check existing reminders
      console.log('Test 4: Check Existing Reminders');
      console.log('='.repeat(50));
      
      const reminders = await prisma.eventReminder.findMany({
        where: { eventId: event.id },
        include: { event: true }
      });
      
      console.log(`Found ${reminders.length} reminder(s) for this event`);
      reminders.forEach((reminder, index) => {
        console.log(`  Reminder ${index + 1}:`);
        console.log(`    User ID: ${reminder.userId}`);
        console.log(`    Type: ${reminder.reminderType}`);
        console.log(`    Time: ${reminder.reminderTime.toLocaleString()}`);
        console.log(`    Sent: ${reminder.isSent ? 'Yes' : 'No'}`);
      });
      console.log();
    }

    // Test 5: Check pending reminders
    console.log('Test 5: Check Pending Reminders');
    console.log('='.repeat(50));
    
    const pendingReminders = await getPendingReminders();
    console.log(`Found ${pendingReminders.length} pending reminder(s)`);
    
    if (pendingReminders.length > 0) {
      console.log('\nPending reminders:');
      pendingReminders.slice(0, 5).forEach((reminder, index) => {
        console.log(`  ${index + 1}. ${reminder.event.title}`);
        console.log(`     Scheduled: ${reminder.reminderTime.toLocaleString()}`);
        console.log(`     Type: ${reminder.reminderType}`);
      });
      
      if (pendingReminders.length > 5) {
        console.log(`  ... and ${pendingReminders.length - 5} more`);
      }
    }
    console.log();

    // Test 6: Check user preferences
    console.log('Test 6: Check User Preferences');
    console.log('='.repeat(50));
    
    const preferences = await prisma.userCalendarPreferences.findMany({
      take: 3
    });
    
    console.log(`Found ${preferences.length} user preference(s)`);
    preferences.forEach((pref, index) => {
      console.log(`  User ${index + 1}:`);
      console.log(`    User ID: ${pref.userId}`);
      console.log(`    Default Reminder Time: ${pref.defaultReminderTime} minutes before`);
      console.log(`    Reminder Types: ${pref.reminderTypes.join(', ')}`);
    });
    console.log();

    // Test 7: Reminder statistics
    console.log('Test 7: Reminder Statistics');
    console.log('='.repeat(50));
    
    const totalReminders = await prisma.eventReminder.count();
    const sentReminders = await prisma.eventReminder.count({
      where: { isSent: true }
    });
    const pendingCount = await prisma.eventReminder.count({
      where: { isSent: false }
    });
    
    console.log(`Total Reminders: ${totalReminders}`);
    console.log(`Sent: ${sentReminders}`);
    console.log(`Pending: ${pendingCount}`);
    console.log();

    // Test 8: Reminder types breakdown
    console.log('Test 8: Reminder Types Breakdown');
    console.log('='.repeat(50));
    
    const remindersByType = await prisma.eventReminder.groupBy({
      by: ['reminderType'],
      _count: true
    });
    
    remindersByType.forEach(group => {
      console.log(`  ${group.reminderType}: ${group._count} reminder(s)`);
    });
    console.log();

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
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
