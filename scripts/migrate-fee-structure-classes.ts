#!/usr/bin/env ts-node

/**
 * Fee Structure Class Migration Script
 * 
 * Migrates existing fee structures from text-based applicableClasses field
 * to proper many-to-many relationships via FeeStructureClass junction table.
 * 
 * Usage:
 *   npm run migrate:fee-structures           # Run migration
 *   npm run migrate:fee-structures -- --dry-run  # Dry run (preview only)
 *   npm run migrate:fee-structures -- --validate # Validate migration results
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { feeStructureMigrationService } from '../src/lib/services/fee-structure-migration-service';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isValidate = args.includes('--validate');
const isHelp = args.includes('--help') || args.includes('-h');

// Display help
if (isHelp) {
  console.log(`
Fee Structure Class Migration Script
=====================================

Migrates existing fee structures from text-based applicableClasses field
to proper many-to-many relationships via FeeStructureClass junction table.

Usage:
  npm run migrate:fee-structures              # Run migration
  npm run migrate:fee-structures -- --dry-run # Dry run (preview only)
  npm run migrate:fee-structures -- --validate # Validate migration results
  npm run migrate:fee-structures -- --help    # Show this help

Options:
  --dry-run    Preview migration without making changes
  --validate   Validate migration results
  --help, -h   Show this help message

Examples:
  # Preview what will be migrated
  npm run migrate:fee-structures -- --dry-run

  # Run the actual migration
  npm run migrate:fee-structures

  # Validate migration results
  npm run migrate:fee-structures -- --validate
  `);
  process.exit(0);
}

/**
 * Save migration report to file
 */
function saveReport(report: string, filename: string): void {
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = path.join(logsDir, `${filename}-${timestamp}.log`);
  
  fs.writeFileSync(filepath, report, 'utf-8');
  console.log(`\nReport saved to: ${filepath}`);
}

/**
 * Run migration in dry-run mode (preview only)
 */
async function runDryRun(): Promise<void> {
  console.log('='.repeat(80));
  console.log('DRY RUN MODE - No changes will be made');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Import Prisma client for dry run queries
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Fetch fee structures with applicableClasses text
    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        applicableClasses: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        applicableClasses: true,
        academicYearId: true,
        classes: {
          select: {
            classId: true
          }
        }
      }
    });

    console.log(`Found ${feeStructures.length} fee structures with applicableClasses text\n`);

    if (feeStructures.length === 0) {
      console.log('No fee structures to migrate.');
      await prisma.$disconnect();
      return;
    }

    // Preview each fee structure
    for (const feeStructure of feeStructures) {
      console.log('-'.repeat(80));
      console.log(`Fee Structure: ${feeStructure.name}`);
      console.log(`ID: ${feeStructure.id}`);
      console.log(`Original Text: ${feeStructure.applicableClasses}`);
      
      // Check if already migrated
      if (feeStructure.classes.length > 0) {
        console.log(`Status: Already migrated (${feeStructure.classes.length} class associations)`);
      } else {
        // Parse and match classes
        const { matched, unmatched } = await feeStructureMigrationService.parseAndMatchClasses(
          feeStructure.applicableClasses!,
          feeStructure.academicYearId
        );

        console.log(`Matched Classes: ${matched.length}`);
        if (matched.length > 0) {
          console.log(`  Class IDs: ${matched.join(', ')}`);
        }
        
        if (unmatched.length > 0) {
          console.log(`⚠️  Unmatched Classes: ${unmatched.join(', ')}`);
        }
      }
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('DRY RUN COMPLETE - No changes were made');
    console.log('Run without --dry-run to perform actual migration');
    console.log('='.repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during dry run:', error);
    process.exit(1);
  }
}

/**
 * Run validation
 */
async function runValidation(): Promise<void> {
  console.log('='.repeat(80));
  console.log('VALIDATING MIGRATION RESULTS');
  console.log('='.repeat(80));
  console.log('');

  try {
    const validationResult = await feeStructureMigrationService.validateMigration();

    if (validationResult.isValid) {
      console.log('✅ Validation PASSED - All fee structures have proper class associations');
    } else {
      console.log('❌ Validation FAILED - Issues found:');
      console.log('');
      
      for (const issue of validationResult.issues) {
        console.log(`Fee Structure: ${issue.feeStructureName} (${issue.feeStructureId})`);
        console.log(`Issue: ${issue.issue}`);
        console.log('');
      }
    }

    console.log('='.repeat(80));
    process.exit(validationResult.isValid ? 0 : 1);
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

/**
 * Run actual migration
 */
async function runMigration(): Promise<void> {
  console.log('='.repeat(80));
  console.log('STARTING FEE STRUCTURE MIGRATION');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Run migration
    const result = await feeStructureMigrationService.migrateApplicableClasses();

    // Generate and display report
    const report = feeStructureMigrationService.generateReport(result);
    console.log('\n' + report);

    // Save report to file
    saveReport(report, 'fee-structure-migration');

    // Exit with appropriate code
    if (result.failedMigrations > 0) {
      console.log('\n❌ Migration completed with errors');
      process.exit(1);
    } else if (result.warnings.length > 0) {
      console.log('\n⚠️  Migration completed with warnings');
      console.log('Please review unmatched classes in the report');
      process.exit(0);
    } else {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  if (isDryRun) {
    await runDryRun();
  } else if (isValidate) {
    await runValidation();
  } else {
    // Confirm before running actual migration
    console.log('⚠️  WARNING: This will modify your database');
    console.log('Run with --dry-run first to preview changes');
    console.log('');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await runMigration();
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
