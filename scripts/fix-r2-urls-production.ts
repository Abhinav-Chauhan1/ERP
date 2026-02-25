#!/usr/bin/env tsx
/**
 * Fix R2 URLs in Production Database
 * 
 * This script updates all R2 URLs in the database from the incorrect format
 * (https://sikshamitra.r2.dev/) to the correct public URL format
 * (https://pub-{accountId}.r2.dev/)
 * 
 * Usage:
 *   npx tsx scripts/fix-r2-urls-production.ts
 *   npx tsx scripts/fix-r2-urls-production.ts --dry-run  # Preview changes without applying
 */

import { db } from '../src/lib/db';

const OLD_DOMAIN = 'https://sikshamitra.r2.dev/';
const NEW_DOMAIN = 'https://pub-0ea3345fbf2e324457b0ce0fb45eace0.r2.dev/';

// Also handle variations
const OLD_DOMAIN_VARIATIONS = [
  'https://sikshamitra.r2.dev/',
  'http://sikshamitra.r2.dev/',
  'sikshamitra.r2.dev/',
];

interface UpdateStats {
  table: string;
  field: string;
  updated: number;
  errors: number;
}

async function fixR2Urls(dryRun: boolean = false) {
  console.log('🔧 Starting R2 URL Fix Script...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}\n`);
  console.log(`Old domain: ${OLD_DOMAIN}`);
  console.log(`New domain: ${NEW_DOMAIN}\n`);

  const stats: UpdateStats[] = [];

  try {
    // 1. Fix School logos
    console.log('📋 Checking School logos...');
    const schools = await db.school.findMany({
      where: {
        OR: OLD_DOMAIN_VARIATIONS.map(domain => ({
          logoUrl: {
            contains: domain,
          },
        })),
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    console.log(`Found ${schools.length} schools with old R2 URLs`);
    
    let schoolsUpdated = 0;
    let schoolsErrors = 0;

    for (const school of schools) {
      if (school.logoUrl) {
        const oldUrl = school.logoUrl;
        let newUrl = oldUrl;
        
        // Replace all variations
        for (const oldDomain of OLD_DOMAIN_VARIATIONS) {
          newUrl = newUrl.replace(oldDomain, NEW_DOMAIN);
        }

        if (oldUrl !== newUrl) {
          console.log(`  School: ${school.name}`);
          console.log(`    Old: ${oldUrl}`);
          console.log(`    New: ${newUrl}`);

          if (!dryRun) {
            try {
              await db.school.update({
                where: { id: school.id },
                data: { logoUrl: newUrl },
              });
              schoolsUpdated++;
            } catch (error) {
              console.error(`    ❌ Error updating school ${school.id}:`, error);
              schoolsErrors++;
            }
          } else {
            schoolsUpdated++;
          }
        }
      }
    }

    stats.push({
      table: 'School',
      field: 'logoUrl',
      updated: schoolsUpdated,
      errors: schoolsErrors,
    });

    // 2. Fix User images
    console.log('\n📋 Checking User images...');
    const users = await db.user.findMany({
      where: {
        OR: OLD_DOMAIN_VARIATIONS.map(domain => ({
          image: {
            contains: domain,
          },
        })),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
      },
    });

    console.log(`Found ${users.length} users with old R2 URLs`);
    
    let usersUpdated = 0;
    let usersErrors = 0;

    for (const user of users) {
      if (user.image) {
        const oldUrl = user.image;
        let newUrl = oldUrl;
        
        // Replace all variations
        for (const oldDomain of OLD_DOMAIN_VARIATIONS) {
          newUrl = newUrl.replace(oldDomain, NEW_DOMAIN);
        }

        if (oldUrl !== newUrl) {
          console.log(`  User: ${user.firstName} ${user.lastName}`);
          console.log(`    Old: ${oldUrl}`);
          console.log(`    New: ${newUrl}`);

          if (!dryRun) {
            try {
              await db.user.update({
                where: { id: user.id },
                data: { image: newUrl },
              });
              usersUpdated++;
            } catch (error) {
              console.error(`    ❌ Error updating user ${user.id}:`, error);
              usersErrors++;
            }
          } else {
            usersUpdated++;
          }
        }
      }
    }

    stats.push({
      table: 'User',
      field: 'image',
      updated: usersUpdated,
      errors: usersErrors,
    });

    // 3. Fix Student photos (if applicable)
    console.log('\n📋 Checking Student photos...');
    const students = await db.student.findMany({
      where: {
        OR: OLD_DOMAIN_VARIATIONS.map(domain => ({
          photo: {
            contains: domain,
          },
        })),
      },
      select: {
        id: true,
        admissionId: true,
        photo: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`Found ${students.length} students with old R2 URLs`);
    
    let studentsUpdated = 0;
    let studentsErrors = 0;

    for (const student of students) {
      if (student.photo) {
        const oldUrl = student.photo;
        let newUrl = oldUrl;
        
        // Replace all variations
        for (const oldDomain of OLD_DOMAIN_VARIATIONS) {
          newUrl = newUrl.replace(oldDomain, NEW_DOMAIN);
        }

        if (oldUrl !== newUrl) {
          console.log(`  Student: ${student.user.firstName} ${student.user.lastName} (${student.admissionId})`);
          console.log(`    Old: ${oldUrl}`);
          console.log(`    New: ${newUrl}`);

          if (!dryRun) {
            try {
              await db.student.update({
                where: { id: student.id },
                data: { photo: newUrl },
              });
              studentsUpdated++;
            } catch (error) {
              console.error(`    ❌ Error updating student ${student.id}:`, error);
              studentsErrors++;
            }
          } else {
            studentsUpdated++;
          }
        }
      }
    }

    stats.push({
      table: 'Student',
      field: 'photo',
      updated: studentsUpdated,
      errors: studentsErrors,
    });

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const stat of stats) {
      console.log(`\n${stat.table}.${stat.field}:`);
      console.log(`  ✅ Updated: ${stat.updated}`);
      if (stat.errors > 0) {
        console.log(`  ❌ Errors: ${stat.errors}`);
      }
      totalUpdated += stat.updated;
      totalErrors += stat.errors;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Total Updated: ${totalUpdated}`);
    if (totalErrors > 0) {
      console.log(`Total Errors: ${totalErrors}`);
    }
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
      console.log('Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ All R2 URLs updated successfully!');
    }

  } catch (error) {
    console.error('\n❌ Error during R2 URL fix:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run the script
fixR2Urls(dryRun).catch(console.error);
