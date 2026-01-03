/**
 * Migration Script: Convert Syllabus Units/Lessons to Modules/SubModules
 * 
 * This script migrates the existing syllabus structure to the new enhanced structure:
 * - SyllabusUnit → Module
 * - Lesson → SubModule
 * 
 * Features:
 * - Preserves all relationships and data
 * - Assigns sequential chapter numbers
 * - Supports dry-run mode for testing
 * - Includes rollback capability
 * - Provides detailed progress reporting
 * 
 * Usage:
 *   npm run migrate:syllabus -- --dry-run    # Test migration without changes
 *   npm run migrate:syllabus                 # Execute migration
 *   npm run migrate:syllabus -- --rollback   # Rollback migration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  syllabusCount: number;
  unitsConverted: number;
  lessonsConverted: number;
  modulesCreated: number;
  subModulesCreated: number;
  errors: string[];
}

interface MigrationBackup {
  syllabusId: string;
  moduleIds: string[];
  subModuleIds: string[];
}

const migrationBackups: MigrationBackup[] = [];

/**
 * Main migration function
 */
async function migrateToNewStructure(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    syllabusCount: 0,
    unitsConverted: 0,
    lessonsConverted: 0,
    modulesCreated: 0,
    subModulesCreated: 0,
    errors: [],
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting Syllabus Migration ${dryRun ? '(DRY RUN)' : ''}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Fetch all syllabi with their units and lessons
    const syllabi = await prisma.syllabus.findMany({
      include: {
        units: {
          include: {
            lessons: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    stats.syllabusCount = syllabi.length;
    console.log(`Found ${syllabi.length} syllabus(es) to migrate\n`);

    // Process each syllabus
    for (const syllabus of syllabi) {
      console.log(`\nProcessing Syllabus: "${syllabus.title}" (ID: ${syllabus.id})`);
      console.log(`  Units: ${syllabus.units.length}`);

      const backup: MigrationBackup = {
        syllabusId: syllabus.id,
        moduleIds: [],
        subModuleIds: [],
      };

      let chapterNumber = 1;

      // Convert each Unit to a Module
      for (const unit of syllabus.units) {
        console.log(`  Converting Unit: "${unit.title}" → Module (Chapter ${chapterNumber})`);

        try {
          if (!dryRun) {
            // Create Module from Unit
            const module = await prisma.module.create({
              data: {
                title: unit.title,
                description: unit.description,
                chapterNumber: chapterNumber,
                order: unit.order,
                syllabusId: syllabus.id,
              },
            });

            backup.moduleIds.push(module.id);
            stats.modulesCreated++;

            // Convert Lessons to SubModules
            const lessonsForUnit = unit.lessons;
            console.log(`    Converting ${lessonsForUnit.length} lesson(s) to sub-modules`);

            for (let i = 0; i < lessonsForUnit.length; i++) {
              const lesson = lessonsForUnit[i];
              console.log(`      - "${lesson.title}"`);

              const subModule = await prisma.subModule.create({
                data: {
                  title: lesson.title,
                  description: lesson.description,
                  order: i + 1, // Sequential order starting from 1
                  moduleId: module.id,
                },
              });

              backup.subModuleIds.push(subModule.id);
              stats.subModulesCreated++;
              stats.lessonsConverted++;
            }
          } else {
            // Dry run: just count
            stats.modulesCreated++;
            stats.subModulesCreated += unit.lessons.length;
            stats.lessonsConverted += unit.lessons.length;
          }

          stats.unitsConverted++;
          chapterNumber++;
        } catch (error) {
          const errorMsg = `Error converting unit "${unit.title}": ${error instanceof Error ? error.message : String(error)}`;
          console.error(`    ❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }

      if (!dryRun) {
        migrationBackups.push(backup);
      }

      console.log(`  ✓ Completed syllabus "${syllabus.title}"`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Syllabi processed:     ${stats.syllabusCount}`);
    console.log(`Units converted:       ${stats.unitsConverted}`);
    console.log(`Lessons converted:     ${stats.lessonsConverted}`);
    console.log(`Modules created:       ${stats.modulesCreated}`);
    console.log(`SubModules created:    ${stats.subModulesCreated}`);
    console.log(`Errors:                ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log(`${'='.repeat(60)}\n`);

    return stats;
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration by deleting created modules and submodules
 */
async function rollbackMigration(): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Starting Migration Rollback');
  console.log(`${'='.repeat(60)}\n`);

  if (migrationBackups.length === 0) {
    console.log('⚠️  No migration backups found. Cannot rollback.');
    console.log('Note: Rollback only works in the same session as migration.');
    console.log('For manual rollback, delete all Module and SubModule records.\n');
    return;
  }

  try {
    for (const backup of migrationBackups) {
      console.log(`Rolling back syllabus: ${backup.syllabusId}`);

      // Delete SubModules (will cascade delete progress records)
      if (backup.subModuleIds.length > 0) {
        const deletedSubModules = await prisma.subModule.deleteMany({
          where: {
            id: {
              in: backup.subModuleIds,
            },
          },
        });
        console.log(`  Deleted ${deletedSubModules.count} sub-modules`);
      }

      // Delete Modules (will cascade delete documents)
      if (backup.moduleIds.length > 0) {
        const deletedModules = await prisma.module.deleteMany({
          where: {
            id: {
              in: backup.moduleIds,
            },
          },
        });
        console.log(`  Deleted ${deletedModules.count} modules`);
      }

      console.log(`  ✓ Rollback completed for syllabus ${backup.syllabusId}`);
    }

    console.log(`\n✓ Rollback completed successfully\n`);
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    throw error;
  }
}

/**
 * Verify migration integrity
 */
async function verifyMigration(): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Verifying Migration Integrity');
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Check that all syllabi have modules
    const syllabi = await prisma.syllabus.findMany({
      include: {
        units: true,
        modules: {
          include: {
            subModules: true,
          },
        },
      },
    });

    let allValid = true;

    for (const syllabus of syllabi) {
      const unitCount = syllabus.units.length;
      const moduleCount = syllabus.modules.length;

      console.log(`Syllabus: "${syllabus.title}"`);
      console.log(`  Units: ${unitCount}, Modules: ${moduleCount}`);

      if (unitCount > 0 && moduleCount === 0) {
        console.log(`  ⚠️  Warning: Has units but no modules`);
        allValid = false;
      } else if (unitCount > 0 && moduleCount !== unitCount) {
        console.log(`  ⚠️  Warning: Unit count doesn't match module count`);
        allValid = false;
      } else {
        console.log(`  ✓ Valid`);
      }

      // Verify chapter numbers are sequential
      const chapterNumbers = syllabus.modules.map(m => m.chapterNumber).sort((a, b) => a - b);
      const expectedChapterNumbers = Array.from({ length: moduleCount }, (_, i) => i + 1);
      
      if (JSON.stringify(chapterNumbers) !== JSON.stringify(expectedChapterNumbers)) {
        console.log(`  ⚠️  Warning: Chapter numbers are not sequential`);
        console.log(`    Expected: ${expectedChapterNumbers.join(', ')}`);
        console.log(`    Actual: ${chapterNumbers.join(', ')}`);
        allValid = false;
      }
    }

    console.log(`\n${allValid ? '✓' : '❌'} Migration verification ${allValid ? 'passed' : 'failed'}\n`);
    return allValid;
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isRollback = args.includes('--rollback');
  const isVerify = args.includes('--verify');

  try {
    if (isRollback) {
      await rollbackMigration();
    } else if (isVerify) {
      await verifyMigration();
    } else {
      const stats = await migrateToNewStructure(isDryRun);

      if (!isDryRun && stats.errors.length === 0) {
        console.log('Running verification...');
        await verifyMigration();
      }

      if (isDryRun) {
        console.log('✓ Dry run completed. No changes were made to the database.');
        console.log('  Run without --dry-run to execute the migration.\n');
      } else if (stats.errors.length === 0) {
        console.log('✓ Migration completed successfully!');
        console.log('  The old Unit/Lesson structure is still intact.');
        console.log('  You can safely delete it after verifying the new structure.\n');
      } else {
        console.log('⚠️  Migration completed with errors.');
        console.log('  Please review the errors above and fix any issues.\n');
      }
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main();
