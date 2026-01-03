/**
 * Fee Structure Migration Service
 * 
 * Migrates existing fee structures from text-based applicableClasses field
 * to proper many-to-many relationships via FeeStructureClass junction table.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MigrationWarning {
  feeStructureId: string;
  feeStructureName: string;
  originalText: string;
  matchedClasses: string[];
  unmatchedClasses: string[];
}

export interface MigrationResult {
  totalProcessed: number;
  successfulMigrations: number;
  failedMigrations: number;
  warnings: MigrationWarning[];
  errors: Array<{ feeStructureId: string; error: string }>;
}

export class FeeStructureMigrationService {
  /**
   * Parse the applicableClasses text field and extract class names
   * Handles various formats:
   * - Comma-separated: "Grade 10, Grade 11, Grade 12"
   * - Semicolon-separated: "Grade 10; Grade 11; Grade 12"
   * - Newline-separated: "Grade 10\nGrade 11\nGrade 12"
   * - Mixed separators
   */
  private parseClassNames(applicableClassesText: string): string[] {
    if (!applicableClassesText || applicableClassesText.trim() === '') {
      return [];
    }

    // Split by common separators: comma, semicolon, newline, pipe
    const classNames = applicableClassesText
      .split(/[,;\n|]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    // Remove duplicates
    return [...new Set(classNames)];
  }

  /**
   * Match parsed class names to actual Class records in the database
   * Uses case-insensitive matching and handles variations
   */
  async parseAndMatchClasses(
    applicableClassesText: string,
    academicYearId: string
  ): Promise<{ matched: string[]; unmatched: string[] }> {
    const parsedNames = this.parseClassNames(applicableClassesText);
    
    if (parsedNames.length === 0) {
      return { matched: [], unmatched: [] };
    }

    // Fetch all classes for the academic year
    const classes = await prisma.class.findMany({
      where: { academicYearId },
      select: { id: true, name: true }
    });

    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const parsedName of parsedNames) {
      // Try exact match first (case-insensitive)
      const exactMatch = classes.find(
        c => c.name.toLowerCase() === parsedName.toLowerCase()
      );

      if (exactMatch) {
        matched.push(exactMatch.id);
        continue;
      }

      // Try partial match (contains)
      const partialMatch = classes.find(
        c => c.name.toLowerCase().includes(parsedName.toLowerCase()) ||
             parsedName.toLowerCase().includes(c.name.toLowerCase())
      );

      if (partialMatch) {
        matched.push(partialMatch.id);
        continue;
      }

      // No match found
      unmatched.push(parsedName);
    }

    return { matched, unmatched };
  }

  /**
   * Migrate a single fee structure from text-based to relationship-based
   */
  private async migrateSingleFeeStructure(
    feeStructure: {
      id: string;
      name: string;
      applicableClasses: string | null;
      academicYearId: string;
    }
  ): Promise<{
    success: boolean;
    warning?: MigrationWarning;
    error?: string;
  }> {
    try {
      // Skip if no applicableClasses text
      if (!feeStructure.applicableClasses) {
        return { success: true };
      }

      // Check if already migrated (has FeeStructureClass records)
      const existingAssociations = await prisma.feeStructureClass.count({
        where: { feeStructureId: feeStructure.id }
      });

      if (existingAssociations > 0) {
        console.log(`Fee structure ${feeStructure.id} already migrated, skipping...`);
        return { success: true };
      }

      // Parse and match classes
      const { matched, unmatched } = await this.parseAndMatchClasses(
        feeStructure.applicableClasses,
        feeStructure.academicYearId
      );

      // Create FeeStructureClass records for matched classes
      if (matched.length > 0) {
        await prisma.feeStructureClass.createMany({
          data: matched.map(classId => ({
            feeStructureId: feeStructure.id,
            classId
          })),
          skipDuplicates: true
        });
      }

      // Generate warning if there are unmatched classes
      const warning: MigrationWarning | undefined = unmatched.length > 0 ? {
        feeStructureId: feeStructure.id,
        feeStructureName: feeStructure.name,
        originalText: feeStructure.applicableClasses,
        matchedClasses: matched,
        unmatchedClasses: unmatched
      } : undefined;

      return { success: true, warning };
    } catch (error) {
      console.error(`Error migrating fee structure ${feeStructure.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Migrate all fee structures with applicableClasses text to relationships
   */
  async migrateApplicableClasses(): Promise<MigrationResult> {
    console.log('Starting fee structure migration...');

    const result: MigrationResult = {
      totalProcessed: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      warnings: [],
      errors: []
    };

    try {
      // Fetch all fee structures with applicableClasses text
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
          academicYearId: true
        }
      });

      result.totalProcessed = feeStructures.length;
      console.log(`Found ${result.totalProcessed} fee structures to migrate`);

      // Migrate each fee structure
      for (const feeStructure of feeStructures) {
        const migrationResult = await this.migrateSingleFeeStructure(feeStructure);

        if (migrationResult.success) {
          result.successfulMigrations++;
          if (migrationResult.warning) {
            result.warnings.push(migrationResult.warning);
          }
        } else {
          result.failedMigrations++;
          result.errors.push({
            feeStructureId: feeStructure.id,
            error: migrationResult.error || 'Unknown error'
          });
        }
      }

      console.log('Migration completed');
      console.log(`Successful: ${result.successfulMigrations}`);
      console.log(`Failed: ${result.failedMigrations}`);
      console.log(`Warnings: ${result.warnings.length}`);

      return result;
    } catch (error) {
      console.error('Fatal error during migration:', error);
      throw error;
    }
  }

  /**
   * Validate migration results
   * Checks that all fee structures have proper class associations
   */
  async validateMigration(): Promise<{
    isValid: boolean;
    issues: Array<{
      feeStructureId: string;
      feeStructureName: string;
      issue: string;
    }>;
  }> {
    console.log('Validating migration...');

    const issues: Array<{
      feeStructureId: string;
      feeStructureName: string;
      issue: string;
    }> = [];

    // Find fee structures with applicableClasses but no FeeStructureClass records
    const feeStructuresWithText = await prisma.feeStructure.findMany({
      where: {
        applicableClasses: {
          not: null
        }
      },
      include: {
        classes: true
      }
    });

    for (const feeStructure of feeStructuresWithText) {
      if (feeStructure.classes.length === 0) {
        issues.push({
          feeStructureId: feeStructure.id,
          feeStructureName: feeStructure.name,
          issue: `Has applicableClasses text but no FeeStructureClass associations`
        });
      }
    }

    // Find fee structures with neither text nor associations
    const feeStructuresWithoutBoth = await prisma.feeStructure.findMany({
      where: {
        applicableClasses: null,
        classes: {
          none: {}
        }
      }
    });

    for (const feeStructure of feeStructuresWithoutBoth) {
      issues.push({
        feeStructureId: feeStructure.id,
        feeStructureName: feeStructure.name,
        issue: `Has neither applicableClasses text nor FeeStructureClass associations`
      });
    }

    console.log(`Validation completed. Found ${issues.length} issues.`);

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate a detailed migration report
   */
  generateReport(result: MigrationResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(80));
    lines.push('FEE STRUCTURE MIGRATION REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Total Processed: ${result.totalProcessed}`);
    lines.push(`Successful: ${result.successfulMigrations}`);
    lines.push(`Failed: ${result.failedMigrations}`);
    lines.push(`Warnings: ${result.warnings.length}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      lines.push('-'.repeat(80));
      for (const error of result.errors) {
        lines.push(`Fee Structure ID: ${error.feeStructureId}`);
        lines.push(`Error: ${error.error}`);
        lines.push('');
      }
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS (Unmatched Classes):');
      lines.push('-'.repeat(80));
      for (const warning of result.warnings) {
        lines.push(`Fee Structure: ${warning.feeStructureName} (${warning.feeStructureId})`);
        lines.push(`Original Text: ${warning.originalText}`);
        lines.push(`Matched Classes: ${warning.matchedClasses.length}`);
        lines.push(`Unmatched Classes: ${warning.unmatchedClasses.join(', ')}`);
        lines.push('');
      }
    }

    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }
}

// Export singleton instance
export const feeStructureMigrationService = new FeeStructureMigrationService();
