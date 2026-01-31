/**
 * Verification script for Teacher Dashboard schema updates
 * This script verifies that all new models and enums are properly accessible
 */

import { PrismaClient, DocumentCategory, EventCategory, RSVPStatus, AchievementCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verifying Teacher Dashboard Schema Updates...\n');

  // Verify enums are accessible
  console.log('✅ DocumentCategory enum:', Object.values(DocumentCategory));
  console.log('✅ EventCategory enum:', Object.values(EventCategory));
  console.log('✅ RSVPStatus enum:', Object.values(RSVPStatus));
  console.log('✅ AchievementCategory enum:', Object.values(AchievementCategory));

  // Verify models are accessible
  console.log('\n📊 Verifying model access...');
  
  try {
    // Test Document model with category
    const documentCount = await prisma.document.count();
    console.log(`✅ Document model accessible (${documentCount} records)`);

    // Test Event model with category
    const eventCount = await prisma.event.count();
    console.log(`✅ Event model accessible (${eventCount} records)`);

    // Test EventRSVP model
    const rsvpCount = await prisma.eventRSVP.count();
    console.log(`✅ EventRSVP model accessible (${rsvpCount} records)`);

    // Test Achievement model
    const achievementCount = await prisma.achievement.count();
    console.log(`✅ Achievement model accessible (${achievementCount} records)`);

    // Test Teacher relation to achievements
    const teacherWithAchievements = await prisma.teacher.findFirst({
      include: {
        achievements: true,
      },
    });
    console.log('✅ Teacher-Achievement relation accessible');

    console.log('\n✨ All schema updates verified successfully!');
  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema()
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
