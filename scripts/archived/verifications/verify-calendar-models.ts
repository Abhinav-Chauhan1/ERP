import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCalendarModels() {
  console.log('🔍 Verifying calendar models...\n');

  try {
    // Check CalendarEventCategory
    const categories = await prisma.calendarEventCategory.findMany();
    console.log(`✅ CalendarEventCategory model: ${categories.length} categories found`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.color})`);
    });

    // Check CalendarEvent model exists (should be empty)
    const events = await prisma.calendarEvent.findMany();
    console.log(`\n✅ CalendarEvent model: ${events.length} events found`);

    // Check EventNote model exists
    const notes = await prisma.eventNote.findMany();
    console.log(`✅ EventNote model: ${notes.length} notes found`);

    // Check EventReminder model exists
    const reminders = await prisma.eventReminder.findMany();
    console.log(`✅ EventReminder model: ${reminders.length} reminders found`);

    // Check UserCalendarPreferences model exists
    const preferences = await prisma.userCalendarPreferences.findMany();
    console.log(`✅ UserCalendarPreferences model: ${preferences.length} preferences found`);

    console.log('\n✅ All calendar models verified successfully!');
  } catch (error) {
    console.error('❌ Error verifying calendar models:', error);
    throw error;
  }
}

async function main() {
  await verifyCalendarModels();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
