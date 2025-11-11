import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDashboard() {
  console.log('🌱 Seeding dashboard data...\n');

  try {
    // Create Academic Year
    console.log('📅 Creating academic year...');
    const academicYear = await prisma.academicYear.upsert({
      where: { id: 'seed-ay-2024' },
      update: {},
      create: {
        id: 'seed-ay-2024',
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        isCurrent: true,
      },
    });

    // Create Terms
    console.log('📚 Creating terms...');
    const term1 = await prisma.term.upsert({
      where: { id: 'seed-term-1' },
      update: {},
      create: {
        id: 'seed-term-1',
        name: 'Term 1',
        academicYearId: academicYear.id,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-20'),
      },
    });

    // Create Departments
    console.log('🏢 Creating departments...');
    const mathDept = await prisma.department.upsert({
      where: { id: 'seed-dept-math' },
      update: {},
      create: {
        id: 'seed-dept-math',
        name: 'Mathematics',
        description: 'Mathematics Department',
      },
    });

    const scienceDept = await prisma.department.upsert({
      where: { id: 'seed-dept-science' },
      update: {},
      create: {
        id: 'seed-dept-science',
        name: 'Science',
        description: 'Science Department',
      },
    });

    // Create Subjects
    console.log('📖 Creating subjects...');
    const subjects = await Promise.all([
      prisma.subject.upsert({
        where: { code: 'MATH101' },
        update: {},
        create: {
          name: 'Mathematics',
          code: 'MATH101',
          departmentId: mathDept.id,
        },
      }),
      prisma.subject.upsert({
        where: { code: 'SCI101' },
        update: {},
        create: {
          name: 'Science',
          code: 'SCI101',
          departmentId: scienceDept.id,
        },
      }),
      prisma.subject.upsert({
        where: { code: 'ENG101' },
        update: {},
        create: {
          name: 'English',
          code: 'ENG101',
        },
      }),
      prisma.subject.upsert({
        where: { code: 'HIST101' },
        update: {},
        create: {
          name: 'History',
          code: 'HIST101',
        },
      }),
    ]);

    // Create Classes
    console.log('🏫 Creating classes...');
    const classes = await Promise.all([
      prisma.class.upsert({
        where: { id: 'seed-class-1' },
        update: {},
        create: {
          id: 'seed-class-1',
          name: 'Grade 9',
          academicYearId: academicYear.id,
        },
      }),
      prisma.class.upsert({
        where: { id: 'seed-class-2' },
        update: {},
        create: {
          id: 'seed-class-2',
          name: 'Grade 10',
          academicYearId: academicYear.id,
        },
      }),
      prisma.class.upsert({
        where: { id: 'seed-class-3' },
        update: {},
        create: {
          id: 'seed-class-3',
          name: 'Grade 11',
          academicYearId: academicYear.id,
        },
      }),
    ]);

    // Create Events
    console.log('📅 Creating events...');
    const now = new Date();
    await Promise.all([
      prisma.event.upsert({
        where: { id: 'seed-event-1' },
        update: {},
        create: {
          id: 'seed-event-1',
          title: 'Mid-term Exams',
          description: 'Mid-term examination period',
          startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          type: 'Academic',
          status: 'UPCOMING',
        },
      }),
      prisma.event.upsert({
        where: { id: 'seed-event-2' },
        update: {},
        create: {
          id: 'seed-event-2',
          title: 'Sports Day',
          description: 'Annual sports day event',
          startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
          type: 'Sports',
          status: 'UPCOMING',
        },
      }),
      prisma.event.upsert({
        where: { id: 'seed-event-3' },
        update: {},
        create: {
          id: 'seed-event-3',
          title: 'Parent-Teacher Meeting',
          description: 'Quarterly parent-teacher conference',
          startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          type: 'Academic',
          status: 'UPCOMING',
        },
      }),
    ]);

    console.log('\n✅ Dashboard data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Academic Years: 1`);
    console.log(`- Terms: 1`);
    console.log(`- Departments: 2`);
    console.log(`- Subjects: ${subjects.length}`);
    console.log(`- Classes: ${classes.length}`);
    console.log(`- Events: 3`);
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDashboard()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
