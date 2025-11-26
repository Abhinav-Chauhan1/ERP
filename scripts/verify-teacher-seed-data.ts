import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying teacher dashboard seed data...\n');

  // Check Documents
  const documents = await prisma.document.findMany({
    where: {
      category: {
        in: ['CERTIFICATE', 'TEACHING_MATERIAL', 'LESSON_PLAN', 'CURRICULUM', 'POLICY'],
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  console.log(`📄 Teacher Documents: ${documents.length}`);
  documents.forEach((doc) => {
    console.log(`  - ${doc.title} (${doc.category}) - ${doc.user.firstName} ${doc.user.lastName}`);
  });

  // Check Events
  const events = await prisma.event.findMany({
    where: {
      category: {
        in: ['TEACHER_MEETING', 'PARENT_TEACHER_CONFERENCE', 'PROFESSIONAL_DEVELOPMENT', 'HOLIDAY', 'EXAM'],
      },
    },
  });

  console.log(`\n🎉 Teacher-related Events: ${events.length}`);
  events.forEach((event) => {
    console.log(`  - ${event.title} (${event.category}) - ${event.startDate.toLocaleDateString()}`);
  });

  // Check Event RSVPs
  const rsvps = await prisma.eventRSVP.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      event: {
        select: {
          title: true,
        },
      },
    },
  });

  console.log(`\n📅 Event RSVPs: ${rsvps.length}`);
  const teacherRsvps = rsvps.filter((r) => r.user.role === 'TEACHER');
  console.log(`  Teacher RSVPs: ${teacherRsvps.length}`);
  teacherRsvps.forEach((rsvp) => {
    console.log(`  - ${rsvp.user.firstName} ${rsvp.user.lastName}: ${rsvp.event.title} (${rsvp.status})`);
  });

  // Check Achievements
  const achievements = await prisma.achievement.findMany({
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  console.log(`\n🏆 Teacher Achievements: ${achievements.length}`);
  achievements.forEach((achievement) => {
    console.log(
      `  - ${achievement.title} (${achievement.category}) - ${achievement.teacher.user.firstName} ${achievement.teacher.user.lastName}`
    );
  });

  console.log('\n✅ Verification complete!');
}

verifyData()
  .catch((e) => {
    console.error('❌ Error verifying data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
