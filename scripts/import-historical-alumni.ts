#!/usr/bin/env ts-node

/**
 * Historical Alumni Import Script
 * 
 * Identifies existing graduated students and generates alumni profiles for them.
 * Backfills graduation dates from enrollment records.
 * 
 * Usage:
 *   npm run import:alumni                    # Run import
 *   npm run import:alumni -- --dry-run       # Dry run (preview only)
 *   npm run import:alumni -- --validate      # Validate import results
 *   npm run import:alumni -- --help          # Show help
 * 
 * Requirements: 4.1, 4.2
 */

import { PrismaClient, EnrollmentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isValidate = args.includes('--validate');
const isHelp = args.includes('--help') || args.includes('-h');

// System user ID for automated operations
const SYSTEM_USER_ID = 'system';

interface GraduatedStudent {
  studentId: string;
  studentName: string;
  admissionId: string;
  enrollmentId: string;
  finalClass: string;
  finalSection: string;
  finalAcademicYear: string;
  graduationDate: Date;
  hasAlumniProfile: boolean;
}

interface ImportResult {
  totalGraduated: number;
  alreadyImported: number;
  newlyImported: number;
  failed: number;
  errors: Array<{
    studentId: string;
    studentName: string;
    error: string;
  }>;
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`
Historical Alumni Import Script
================================

Identifies existing graduated students and generates alumni profiles for them.
Backfills graduation dates from enrollment records.

Usage:
  npm run import:alumni                    # Run import
  npm run import:alumni -- --dry-run       # Dry run (preview only)
  npm run import:alumni -- --validate      # Validate import results
  npm run import:alumni -- --help          # Show this help

Options:
  --dry-run    Preview import without making changes
  --validate   Validate import results
  --help, -h   Show this help message

Examples:
  # Preview what will be imported
  npm run import:alumni -- --dry-run

  # Run the actual import
  npm run import:alumni

  # Validate import results
  npm run import:alumni -- --validate
  `);
}

/**
 * Save import report to file
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
 * Find all graduated students without alumni profiles
 */
async function findGraduatedStudents(): Promise<GraduatedStudent[]> {
  console.log('Searching for graduated students...\n');

  // Find all students with GRADUATED enrollment status
  const graduatedEnrollments = await prisma.classEnrollment.findMany({
    where: {
      status: EnrollmentStatus.GRADUATED
    },
    include: {
      student: {
        include: {
          user: true,
          alumni: true
        }
      },
      class: {
        include: {
          academicYear: true
        }
      },
      section: true
    },
    orderBy: {
      updatedAt: 'desc' // Most recent graduations first
    }
  });

  console.log(`Found ${graduatedEnrollments.length} graduated enrollments\n`);

  // Group by student and get their most recent graduation
  const studentGraduations = new Map<string, GraduatedStudent>();

  for (const enrollment of graduatedEnrollments) {
    const studentId = enrollment.studentId;
    
    // Skip if we already have a more recent graduation for this student
    if (studentGraduations.has(studentId)) {
      continue;
    }

    // Determine graduation date (use updatedAt as proxy for when status changed to GRADUATED)
    const graduationDate = enrollment.updatedAt;

    studentGraduations.set(studentId, {
      studentId: enrollment.student.id,
      studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      admissionId: enrollment.student.admissionId,
      enrollmentId: enrollment.id,
      finalClass: enrollment.class.name,
      finalSection: enrollment.section.name,
      finalAcademicYear: enrollment.class.academicYear.name,
      graduationDate,
      hasAlumniProfile: !!enrollment.student.alumni
    });
  }

  return Array.from(studentGraduations.values());
}

/**
 * Run dry-run mode (preview only)
 */
async function runDryRun(): Promise<void> {
  console.log('='.repeat(80));
  console.log('DRY RUN MODE - No changes will be made');
  console.log('='.repeat(80));
  console.log('');

  try {
    const graduatedStudents = await findGraduatedStudents();

    if (graduatedStudents.length === 0) {
      console.log('No graduated students found.');
      return;
    }

    const needsImport = graduatedStudents.filter(s => !s.hasAlumniProfile);
    const alreadyImported = graduatedStudents.filter(s => s.hasAlumniProfile);

    console.log('Summary:');
    console.log(`  Total graduated students: ${graduatedStudents.length}`);
    console.log(`  Already have alumni profiles: ${alreadyImported.length}`);
    console.log(`  Need alumni profiles: ${needsImport.length}`);
    console.log('');

    if (needsImport.length > 0) {
      console.log('Students that will get alumni profiles:');
      console.log('-'.repeat(80));
      
      for (const student of needsImport.slice(0, 10)) {
        console.log(`Name: ${student.studentName}`);
        console.log(`Admission ID: ${student.admissionId}`);
        console.log(`Final Class: ${student.finalClass} - ${student.finalSection}`);
        console.log(`Academic Year: ${student.finalAcademicYear}`);
        console.log(`Graduation Date: ${student.graduationDate.toISOString().split('T')[0]}`);
        console.log('');
      }

      if (needsImport.length > 10) {
        console.log(`... and ${needsImport.length - 10} more students`);
        console.log('');
      }
    }

    console.log('='.repeat(80));
    console.log('DRY RUN COMPLETE - No changes were made');
    console.log('Run without --dry-run to perform actual import');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error during dry run:', error);
    throw error;
  }
}

/**
 * Run validation
 */
async function runValidation(): Promise<void> {
  console.log('='.repeat(80));
  console.log('VALIDATING IMPORT RESULTS');
  console.log('='.repeat(80));
  console.log('');

  try {
    const graduatedStudents = await findGraduatedStudents();
    const withoutAlumni = graduatedStudents.filter(s => !s.hasAlumniProfile);

    console.log('Validation Results:');
    console.log(`  Total graduated students: ${graduatedStudents.length}`);
    console.log(`  With alumni profiles: ${graduatedStudents.length - withoutAlumni.length}`);
    console.log(`  Missing alumni profiles: ${withoutAlumni.length}`);
    console.log('');

    if (withoutAlumni.length === 0) {
      console.log('✅ Validation PASSED - All graduated students have alumni profiles');
      console.log('='.repeat(80));
      process.exit(0);
    } else {
      console.log('❌ Validation FAILED - Some graduated students are missing alumni profiles:');
      console.log('');
      
      for (const student of withoutAlumni.slice(0, 5)) {
        console.log(`  - ${student.studentName} (${student.admissionId})`);
      }

      if (withoutAlumni.length > 5) {
        console.log(`  ... and ${withoutAlumni.length - 5} more`);
      }

      console.log('');
      console.log('Run the import script to create missing alumni profiles');
      console.log('='.repeat(80));
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

/**
 * Create alumni profile for a graduated student
 */
async function createAlumniProfile(
  student: GraduatedStudent,
  tx: any
): Promise<void> {
  await tx.alumni.create({
    data: {
      studentId: student.studentId,
      graduationDate: student.graduationDate,
      finalClass: student.finalClass,
      finalSection: student.finalSection,
      finalAcademicYear: student.finalAcademicYear,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      // Communication preferences default to true
      allowCommunication: true,
      // Other fields are optional and can be filled later by admin or alumni
    }
  });
}

/**
 * Run actual import
 */
async function runImport(): Promise<void> {
  console.log('='.repeat(80));
  console.log('STARTING HISTORICAL ALUMNI IMPORT');
  console.log('='.repeat(80));
  console.log('');

  const result: ImportResult = {
    totalGraduated: 0,
    alreadyImported: 0,
    newlyImported: 0,
    failed: 0,
    errors: []
  };

  try {
    const graduatedStudents = await findGraduatedStudents();
    result.totalGraduated = graduatedStudents.length;

    if (graduatedStudents.length === 0) {
      console.log('No graduated students found. Nothing to import.');
      return;
    }

    const needsImport = graduatedStudents.filter(s => !s.hasAlumniProfile);
    result.alreadyImported = graduatedStudents.length - needsImport.length;

    console.log(`Found ${needsImport.length} students needing alumni profiles\n`);

    if (needsImport.length === 0) {
      console.log('All graduated students already have alumni profiles.');
      return;
    }

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    let processed = 0;

    for (let i = 0; i < needsImport.length; i += BATCH_SIZE) {
      const batch = needsImport.slice(i, i + BATCH_SIZE);
      
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} students)...`);

      // Process batch in a transaction
      await prisma.$transaction(async (tx) => {
        for (const student of batch) {
          try {
            await createAlumniProfile(student, tx);
            result.newlyImported++;
            processed++;
            
            // Show progress
            if (processed % 10 === 0) {
              console.log(`  Imported ${processed}/${needsImport.length} alumni profiles...`);
            }
          } catch (error: any) {
            result.failed++;
            result.errors.push({
              studentId: student.studentId,
              studentName: student.studentName,
              error: error.message || 'Unknown error'
            });
            console.error(`  ❌ Failed to import ${student.studentName}: ${error.message}`);
          }
        }
      });
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('IMPORT COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log('Summary:');
    console.log(`  Total graduated students: ${result.totalGraduated}`);
    console.log(`  Already had alumni profiles: ${result.alreadyImported}`);
    console.log(`  Newly imported: ${result.newlyImported}`);
    console.log(`  Failed: ${result.failed}`);
    console.log('');

    if (result.errors.length > 0) {
      console.log('Errors:');
      for (const error of result.errors) {
        console.log(`  - ${error.studentName} (${error.studentId}): ${error.error}`);
      }
      console.log('');
    }

    // Generate and save report
    const report = generateReport(result, graduatedStudents);
    saveReport(report, 'alumni-import');

    // Exit with appropriate code
    if (result.failed > 0) {
      console.log('❌ Import completed with errors');
      process.exit(1);
    } else {
      console.log('✅ Import completed successfully');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during import:', error);
    throw error;
  }
}

/**
 * Generate detailed report
 */
function generateReport(result: ImportResult, students: GraduatedStudent[]): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(80));
  lines.push('HISTORICAL ALUMNI IMPORT REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Summary:');
  lines.push(`  Total graduated students: ${result.totalGraduated}`);
  lines.push(`  Already had alumni profiles: ${result.alreadyImported}`);
  lines.push(`  Newly imported: ${result.newlyImported}`);
  lines.push(`  Failed: ${result.failed}`);
  lines.push('');

  if (result.newlyImported > 0) {
    lines.push('Newly Imported Alumni:');
    lines.push('-'.repeat(80));
    
    const imported = students.filter(s => !s.hasAlumniProfile);
    for (const student of imported) {
      lines.push(`Name: ${student.studentName}`);
      lines.push(`Admission ID: ${student.admissionId}`);
      lines.push(`Final Class: ${student.finalClass} - ${student.finalSection}`);
      lines.push(`Academic Year: ${student.finalAcademicYear}`);
      lines.push(`Graduation Date: ${student.graduationDate.toISOString().split('T')[0]}`);
      lines.push('');
    }
  }

  if (result.errors.length > 0) {
    lines.push('Errors:');
    lines.push('-'.repeat(80));
    for (const error of result.errors) {
      lines.push(`Student: ${error.studentName} (${error.studentId})`);
      lines.push(`Error: ${error.error}`);
      lines.push('');
    }
  }

  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  if (isHelp) {
    displayHelp();
    process.exit(0);
  }

  try {
    if (isDryRun) {
      await runDryRun();
    } else if (isValidate) {
      await runValidation();
    } else {
      // Confirm before running actual import
      console.log('⚠️  WARNING: This will modify your database');
      console.log('Run with --dry-run first to preview changes');
      console.log('');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await runImport();
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  prisma.$disconnect();
  process.exit(1);
});
