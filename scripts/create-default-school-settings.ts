#!/usr/bin/env tsx

/**
 * Create default SchoolSettings for all schools that don't have settings yet
 * This is used when old tables have already been dropped
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDefaultSettings() {
  console.log('🚀 Creating default SchoolSettings for all schools...\n');

  try {
    // Get all schools
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, schoolCode: true },
    });

    console.log(`📊 Found ${schools.length} schools\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const school of schools) {
      try {
        // Check if settings already exist
        const existing = await prisma.schoolSettings.findUnique({
          where: { schoolId: school.id },
        });

        if (existing) {
          console.log(`⏭️  ${school.name} - Settings already exist, skipping`);
          skipped++;
          continue;
        }

        // Create default settings
        await prisma.schoolSettings.create({
          data: {
            schoolId: school.id,
            schoolName: school.name,
            // All other fields will use defaults from schema
          },
        });

        console.log(`✅ ${school.name} - Created default settings`);
        created++;
      } catch (error) {
        console.error(`❌ ${school.name} - Failed:`, error);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total schools:     ${schools.length}`);
    console.log(`✅ Created:        ${created}`);
    console.log(`⏭️  Skipped:        ${skipped}`);
    console.log(`❌ Failed:         ${failed}`);
    console.log('='.repeat(70));

    // Verify
    const settingsCount = await prisma.schoolSettings.count();
    console.log(`\n✅ Total SchoolSettings records: ${settingsCount}`);

    if (settingsCount === schools.length) {
      console.log('✅ All schools have settings!');
      process.exit(0);
    } else {
      console.log(`⚠️  ${schools.length - settingsCount} schools still missing settings`);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultSettings();
