
import { PrismaClient, EventSourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function getOrCreateCalendarCategoryId(eventType: string | undefined | null): Promise<string> {
    const defaultCategoryName = "School Event";
    let searchName = defaultCategoryName;
    let color = '#10b981'; // Green for School Event
    let icon = 'Star';
    let description = 'School-wide events and activities';

    if (eventType === 'HOLIDAY') {
        searchName = "Holiday";
        color = '#ef4444'; // Red
        icon = 'Calendar';
        description = 'School holidays and breaks';
    } else if (eventType === 'ADMINISTRATIVE') {
        searchName = "Meeting";
        color = '#3b82f6'; // Blue
        icon = 'Users';
        description = 'Meetings';
    } else if (eventType === 'SPORTS') {
        searchName = "Sports Event";
        color = '#f97316'; // Orange
        icon = 'Trophy';
        description = 'Sports competitions';
    }

    // Try to find existing category
    let category = await prisma.calendarEventCategory.findFirst({
        where: {
            name: {
                equals: searchName,
                mode: 'insensitive'
            }
        }
    });

    // If found, return it
    if (category) return category.id;

    // If not found, create it
    console.log(`Creating missing category: ${searchName}`);
    category = await prisma.calendarEventCategory.create({
        data: {
            name: searchName,
            color,
            icon,
            description,
            order: 10, // Default order
            isActive: true
        }
    });

    return category.id;
}

async function migrateEvents() {
    console.log('🚀 Starting event migration...');

    try {
        // 1. Fetch all existing Main Events
        const events = await prisma.event.findMany();
        console.log(`Found ${events.length} existing events.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const event of events) {
            // 2. Check if a calendar event already exists
            const existingCalendarEvent = await prisma.calendarEvent.findFirst({
                where: {
                    sourceType: EventSourceType.SCHOOL_EVENT,
                    sourceId: event.id
                }
            });

            if (existingCalendarEvent) {
                skippedCount++;
                continue;
            }

            // 3. Get or Create Calendar Category
            const categoryId = await getOrCreateCalendarCategoryId(event.type);

            await prisma.calendarEvent.create({
                data: {
                    title: event.title,
                    description: event.description || "",
                    categoryId: categoryId,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    location: event.location,
                    isAllDay: false,
                    // Default visibility for migrated events
                    visibleToRoles: event.isPublic
                        ? ["ADMIN", "TEACHER", "STUDENT", "PARENT"]
                        : ["ADMIN", "TEACHER"],
                    sourceType: EventSourceType.SCHOOL_EVENT,
                    sourceId: event.id,
                    createdBy: "MIGRATION_SCRIPT",
                }
            });
            createdCount++;
            process.stdout.write('.');
        }

        console.log('\n✅ Migration complete!');
        console.log(`Summary:`);
        console.log(`- Total Events: ${events.length}`);
        console.log(`- Created Calendar Entries: ${createdCount}`);
        console.log(`- Skipped (Already Existed): ${skippedCount}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateEvents();
