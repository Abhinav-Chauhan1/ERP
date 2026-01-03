import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCalendarCategories() {
  console.log('🗓️  Seeding calendar event categories...');

  // Default event categories as specified in the requirements
  const categories = [
    {
      name: 'Holiday',
      description: 'School holidays and breaks',
      color: '#ef4444', // red
      icon: 'Calendar',
      order: 1,
    },
    {
      name: 'Exam',
      description: 'Examination schedules',
      color: '#f59e0b', // amber
      icon: 'FileText',
      order: 2,
    },
    {
      name: 'Assignment',
      description: 'Assignment deadlines',
      color: '#8b5cf6', // purple
      icon: 'ClipboardList',
      order: 3,
    },
    {
      name: 'Meeting',
      description: 'Parent-teacher meetings and staff meetings',
      color: '#3b82f6', // blue
      icon: 'Users',
      order: 4,
    },
    {
      name: 'School Event',
      description: 'School-wide events and activities',
      color: '#10b981', // green
      icon: 'Star',
      order: 5,
    },
    {
      name: 'Sports Event',
      description: 'Sports competitions and athletic events',
      color: '#f97316', // orange
      icon: 'Trophy',
      order: 6,
    },
  ];

  // Check if categories already exist
  const existingCategories = await prisma.calendarEventCategory.findMany();
  
  if (existingCategories.length > 0) {
    console.log('⚠️  Calendar categories already exist. Skipping...');
    return;
  }

  // Create categories
  for (const category of categories) {
    await prisma.calendarEventCategory.create({
      data: category,
    });
  }

  console.log(`✅ Created ${categories.length} calendar event categories`);
}

async function main() {
  try {
    await seedCalendarCategories();
    console.log('✅ Calendar categories seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding calendar categories:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
