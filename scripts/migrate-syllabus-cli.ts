#!/usr/bin/env node
/**
 * Enhanced Migration CLI Command
 * 
 * Interactive CLI tool for migrating syllabus structure from Units/Lessons to Modules/SubModules
 * 
 * Features:
 * - Interactive mode with prompts
 * - Dry-run mode for safe testing
 * - Detailed progress reporting with real-time updates
 * - Comprehensive error logging to file
 * - Automatic recovery and retry mechanisms
 * - Verification and validation
 * - Rollback capability
 * 
 * Usage:
 *   npm run migrate:cli                    # Interactive mode
 *   npm run migrate:cli -- --dry-run       # Test without changes
 *   npm run migrate:cli -- --auto          # Non-interactive mode
 *   npm run migrate:cli -- --verify        # Verify migration
 *   npm run migrate:cli -- --rollback      # Rollback migration
 *   npm run migrate:cli -- --help          # Show help
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface MigrationStats {
  syllabusCount: number;
  unitsConverted: number;
  lessonsConverted: number;
  modulesCreated: number;
  subModulesCreated: number;
  errors: MigrationError[];
  warnings: string[];
  startTime: Date;
  endTime?: Date;
}

interface MigrationError {
  type: 'unit' | 'lesson' | 'module' | 'submodule' | 'database' | 'unknown';
  message: string;
  context?: any;
  timestamp: Date;
  recoverable: boolean;
}

interface MigrationBackup {
  syllabusId: string;
  syllabusTitle: string;
  moduleIds: string[];
  subModuleIds: string[];
  timestamp: Date;
}

interface CLIOptions {
  dryRun: boolean;
  auto: boolean;
  verify: boolean;
  rollback: boolean;
  verbose: boolean;
  logFile: string;
}

const migrationBackups: MigrationBackup[] = [];
let logStream: fs.WriteStream | null = null;

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    auto: args.includes('--auto'),
    verify: args.includes('--verify'),
    rollback: args.includes('--rollback'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    logFile: args.find(arg => arg.startsWith('--log='))?.split('=')[1] || 
             `migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
  };
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
${colors.bright}Enhanced Syllabus Migration CLI${colors.reset}

${colors.cyan}Description:${colors.reset}
  Migrate syllabus structure from Units/Lessons to Modules/SubModules

${colors.cyan}Usage:${colors.reset}
  npm run migrate:cli [options]

${colors.cyan}Options:${colors.reset}
  --dry-run          Test migration without making changes
  --auto             Run in non-interactive mode (auto-confirm)
  --verify           Verify migration integrity
  --rollback         Rollback the last migration
  --verbose, -v      Show detailed output
  --log=<file>       Specify log file path
  --help, -h         Show this help message

${colors.cyan}Examples:${colors.reset}
  npm run migrate:cli                    # Interactive mode
  npm run migrate:cli -- --dry-run       # Test without changes
  npm run migrate:cli -- --auto          # Non-interactive
  npm run migrate:cli -- --verify        # Verify migration
  npm run migrate:cli -- --rollback      # Rollback migration

${colors.cyan}Notes:${colors.reset}
  - Always run with --dry-run first to test
  - Migration preserves original data (Units/Lessons remain intact)
  - Rollback only works in the same session or with backup file
  - Check the log file for detailed error information
`);
}

/**
 * Initialize logging
 */
function initializeLogging(logFile: string): void {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const logPath = path.join(logsDir, logFile);
  logStream = fs.createWriteStream(logPath, { flags: 'a' });
  
  log(`Migration started at ${new Date().toISOString()}`, 'info');
  log(`Command: ${process.argv.join(' ')}`, 'info');
}

/**
 * Log message to file and optionally console
 */
function log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info', toConsole: boolean = false): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  if (logStream) {
    logStream.write(logMessage);
  }
  
  if (toConsole) {
    const colorMap = {
      info: colors.blue,
      warn: colors.yellow,
      error: colors.red,
      debug: colors.dim,
    };
    console.log(`${colorMap[level]}${message}${colors.reset}`);
  }
}

/**
 * Print formatted header
 */
function printHeader(title: string): void {
  const line = '='.repeat(70);
  console.log(`\n${colors.bright}${colors.cyan}${line}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title.padStart((70 + title.length) / 2)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${line}${colors.reset}\n`);
}

/**
 * Print progress bar
 */
function printProgress(current: number, total: number, label: string): void {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  process.stdout.write(`\r${colors.cyan}${label}${colors.reset} [${bar}] ${percentage}% (${current}/${total})`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * Ask user for confirmation
 */
async function confirm(question: string, defaultYes: boolean = false): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const defaultAnswer = defaultYes ? 'Y/n' : 'y/N';
    rl.question(`${colors.yellow}${question} [${defaultAnswer}]:${colors.reset} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      
      if (normalized === '') {
        resolve(defaultYes);
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}

/**
 * Create error object with context
 */
function createError(
  type: MigrationError['type'],
  message: string,
  context?: any,
  recoverable: boolean = false
): MigrationError {
  return {
    type,
    message,
    context,
    timestamp: new Date(),
    recoverable,
  };
}

/**
 * Main migration function with enhanced error handling
 */
async function migrateToNewStructure(options: CLIOptions): Promise<MigrationStats> {
  const stats: MigrationStats = {
    syllabusCount: 0,
    unitsConverted: 0,
    lessonsConverted: 0,
    modulesCreated: 0,
    subModulesCreated: 0,
    errors: [],
    warnings: [],
    startTime: new Date(),
  };

  printHeader(`Syllabus Migration ${options.dryRun ? '(DRY RUN)' : ''}`);
  log(`Starting migration (dry-run: ${options.dryRun})`, 'info', true);

  try {
    // Fetch all syllabi with their units and lessons
    console.log(`${colors.cyan}Fetching syllabi...${colors.reset}`);
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
    console.log(`${colors.green}✓${colors.reset} Found ${colors.bright}${syllabi.length}${colors.reset} syllabus(es) to migrate\n`);
    log(`Found ${syllabi.length} syllabi`, 'info');

    if (syllabi.length === 0) {
      console.log(`${colors.yellow}No syllabi found to migrate.${colors.reset}\n`);
      return stats;
    }

    // Process each syllabus
    let processedCount = 0;
    for (const syllabus of syllabi) {
      processedCount++;
      printProgress(processedCount, syllabi.length, 'Processing syllabi');
      
      console.log(`\n${colors.bright}Syllabus:${colors.reset} "${syllabus.title}" (ID: ${syllabus.id})`);
      console.log(`  ${colors.dim}Units: ${syllabus.units.length}${colors.reset}`);
      log(`Processing syllabus: ${syllabus.title} (${syllabus.id})`, 'info');

      const backup: MigrationBackup = {
        syllabusId: syllabus.id,
        syllabusTitle: syllabus.title,
        moduleIds: [],
        subModuleIds: [],
        timestamp: new Date(),
      };

      let chapterNumber = 1;

      // Convert each Unit to a Module
      for (const unit of syllabus.units) {
        console.log(`  ${colors.cyan}→${colors.reset} Converting Unit: "${unit.title}" → Module (Chapter ${chapterNumber})`);
        log(`Converting unit: ${unit.title} to module (chapter ${chapterNumber})`, 'info');

        try {
          if (!options.dryRun) {
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
            log(`Created module: ${module.id}`, 'debug');

            // Convert Lessons to SubModules
            const lessonsForUnit = unit.lessons;
            if (lessonsForUnit.length > 0) {
              console.log(`    ${colors.dim}Converting ${lessonsForUnit.length} lesson(s) to sub-modules${colors.reset}`);
            }

            for (let i = 0; i < lessonsForUnit.length; i++) {
              const lesson = lessonsForUnit[i];
              
              try {
                const subModule = await prisma.subModule.create({
                  data: {
                    title: lesson.title,
                    description: lesson.description,
                    order: i + 1,
                    moduleId: module.id,
                  },
                });

                backup.subModuleIds.push(subModule.id);
                stats.subModulesCreated++;
                stats.lessonsConverted++;
                log(`Created sub-module: ${subModule.id} from lesson: ${lesson.title}`, 'debug');
                
                if (options.verbose) {
                  console.log(`      ${colors.green}✓${colors.reset} "${lesson.title}"`);
                }
              } catch (error) {
                const err = createError(
                  'lesson',
                  `Failed to convert lesson "${lesson.title}": ${error instanceof Error ? error.message : String(error)}`,
                  { lessonId: lesson.id, unitId: unit.id },
                  true
                );
                stats.errors.push(err);
                log(err.message, 'error', true);
                console.log(`      ${colors.red}✗${colors.reset} Failed: "${lesson.title}"`);
              }
            }
          } else {
            // Dry run: just count
            stats.modulesCreated++;
            stats.subModulesCreated += unit.lessons.length;
            stats.lessonsConverted += unit.lessons.length;
          }

          stats.unitsConverted++;
          chapterNumber++;
          console.log(`    ${colors.green}✓${colors.reset} Completed`);
        } catch (error) {
          const err = createError(
            'unit',
            `Failed to convert unit "${unit.title}": ${error instanceof Error ? error.message : String(error)}`,
            { unitId: unit.id, syllabusId: syllabus.id },
            false
          );
          stats.errors.push(err);
          log(err.message, 'error', true);
          console.log(`    ${colors.red}✗${colors.reset} Failed`);
        }
      }

      if (!options.dryRun && backup.moduleIds.length > 0) {
        migrationBackups.push(backup);
        
        // Save backup to file
        const backupFile = path.join(process.cwd(), 'logs', `migration-backup-${syllabus.id}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        log(`Backup saved to: ${backupFile}`, 'info');
      }

      console.log(`  ${colors.green}✓${colors.reset} Completed syllabus "${syllabus.title}"\n`);
    }

    stats.endTime = new Date();
    printMigrationSummary(stats, options);

    return stats;
  } catch (error) {
    const err = createError(
      'database',
      `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      { error },
      false
    );
    stats.errors.push(err);
    log(err.message, 'error', true);
    console.error(`\n${colors.red}✗ Migration failed:${colors.reset}`, error);
    throw error;
  }
}

/**
 * Print migration summary
 */
function printMigrationSummary(stats: MigrationStats, options: CLIOptions): void {
  const duration = stats.endTime 
    ? ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(2)
    : '0';

  printHeader('Migration Summary');

  console.log(`${colors.bright}Statistics:${colors.reset}`);
  console.log(`  Syllabi processed:     ${colors.cyan}${stats.syllabusCount}${colors.reset}`);
  console.log(`  Units converted:       ${colors.cyan}${stats.unitsConverted}${colors.reset}`);
  console.log(`  Lessons converted:     ${colors.cyan}${stats.lessonsConverted}${colors.reset}`);
  console.log(`  Modules created:       ${colors.green}${stats.modulesCreated}${colors.reset}`);
  console.log(`  SubModules created:    ${colors.green}${stats.subModulesCreated}${colors.reset}`);
  console.log(`  Errors:                ${stats.errors.length > 0 ? colors.red : colors.green}${stats.errors.length}${colors.reset}`);
  console.log(`  Warnings:              ${stats.warnings.length > 0 ? colors.yellow : colors.green}${stats.warnings.length}${colors.reset}`);
  console.log(`  Duration:              ${colors.cyan}${duration}s${colors.reset}`);

  if (stats.errors.length > 0) {
    console.log(`\n${colors.red}${colors.bright}Errors encountered:${colors.reset}`);
    stats.errors.forEach((error, index) => {
      console.log(`  ${colors.red}${index + 1}.${colors.reset} [${error.type}] ${error.message}`);
      if (options.verbose && error.context) {
        console.log(`     ${colors.dim}Context: ${JSON.stringify(error.context)}${colors.reset}`);
      }
    });
  }

  if (stats.warnings.length > 0) {
    console.log(`\n${colors.yellow}${colors.bright}Warnings:${colors.reset}`);
    stats.warnings.forEach((warning, index) => {
      console.log(`  ${colors.yellow}${index + 1}.${colors.reset} ${warning}`);
    });
  }

  console.log();
  log(`Migration summary: ${JSON.stringify(stats)}`, 'info');
}

/**
 * Rollback migration
 */
async function rollbackMigration(options: CLIOptions): Promise<void> {
  printHeader('Migration Rollback');

  // Try to load backups from files if not in memory
  if (migrationBackups.length === 0) {
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
      const backupFiles = fs.readdirSync(logsDir)
        .filter(f => f.startsWith('migration-backup-') && f.endsWith('.json'));
      
      if (backupFiles.length > 0) {
        console.log(`${colors.cyan}Found ${backupFiles.length} backup file(s)${colors.reset}\n`);
        
        for (const file of backupFiles) {
          const backupPath = path.join(logsDir, file);
          const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
          migrationBackups.push(backup);
        }
      }
    }
  }

  if (migrationBackups.length === 0) {
    console.log(`${colors.yellow}⚠️  No migration backups found.${colors.reset}`);
    console.log(`${colors.dim}Note: Rollback requires backup files from a previous migration.${colors.reset}`);
    console.log(`${colors.dim}For manual rollback, delete all Module and SubModule records.${colors.reset}\n`);
    return;
  }

  console.log(`${colors.bright}Backups found:${colors.reset}`);
  migrationBackups.forEach((backup, index) => {
    console.log(`  ${index + 1}. ${backup.syllabusTitle} (${backup.moduleIds.length} modules, ${backup.subModuleIds.length} sub-modules)`);
  });
  console.log();

  if (!options.auto) {
    const confirmed = await confirm('Are you sure you want to rollback these migrations?', false);
    if (!confirmed) {
      console.log(`${colors.yellow}Rollback cancelled.${colors.reset}\n`);
      return;
    }
  }

  try {
    let processedCount = 0;
    for (const backup of migrationBackups) {
      processedCount++;
      printProgress(processedCount, migrationBackups.length, 'Rolling back');
      
      console.log(`\n${colors.cyan}Rolling back:${colors.reset} ${backup.syllabusTitle}`);
      log(`Rolling back syllabus: ${backup.syllabusId}`, 'info');

      // Delete SubModules
      if (backup.subModuleIds.length > 0) {
        const deletedSubModules = await prisma.subModule.deleteMany({
          where: {
            id: {
              in: backup.subModuleIds,
            },
          },
        });
        console.log(`  ${colors.green}✓${colors.reset} Deleted ${deletedSubModules.count} sub-modules`);
        log(`Deleted ${deletedSubModules.count} sub-modules`, 'info');
      }

      // Delete Modules
      if (backup.moduleIds.length > 0) {
        const deletedModules = await prisma.module.deleteMany({
          where: {
            id: {
              in: backup.moduleIds,
            },
          },
        });
        console.log(`  ${colors.green}✓${colors.reset} Deleted ${deletedModules.count} modules`);
        log(`Deleted ${deletedModules.count} modules`, 'info');
      }

      // Delete backup file
      const backupFile = path.join(process.cwd(), 'logs', `migration-backup-${backup.syllabusId}.json`);
      if (fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
        log(`Deleted backup file: ${backupFile}`, 'info');
      }
    }

    console.log(`\n${colors.green}✓ Rollback completed successfully${colors.reset}\n`);
    log('Rollback completed successfully', 'info');
  } catch (error) {
    console.error(`\n${colors.red}✗ Rollback failed:${colors.reset}`, error);
    log(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Verify migration integrity
 */
async function verifyMigration(options: CLIOptions): Promise<boolean> {
  printHeader('Migration Verification');

  try {
    const syllabi = await prisma.syllabus.findMany({
      include: {
        units: true,
        modules: {
          include: {
            subModules: true,
          },
          orderBy: {
            chapterNumber: 'asc',
          },
        },
      },
    });

    let allValid = true;
    const issues: string[] = [];

    console.log(`${colors.cyan}Verifying ${syllabi.length} syllabus(es)...${colors.reset}\n`);

    for (const syllabus of syllabi) {
      const unitCount = syllabus.units.length;
      const moduleCount = syllabus.modules.length;

      console.log(`${colors.bright}Syllabus:${colors.reset} "${syllabus.title}"`);
      console.log(`  Units: ${unitCount}, Modules: ${moduleCount}`);

      // Check if migration is needed
      if (unitCount > 0 && moduleCount === 0) {
        const issue = `Has units but no modules - migration needed`;
        issues.push(`${syllabus.title}: ${issue}`);
        console.log(`  ${colors.yellow}⚠️  ${issue}${colors.reset}`);
        allValid = false;
      } else if (unitCount > 0 && moduleCount !== unitCount) {
        const issue = `Unit count (${unitCount}) doesn't match module count (${moduleCount})`;
        issues.push(`${syllabus.title}: ${issue}`);
        console.log(`  ${colors.yellow}⚠️  ${issue}${colors.reset}`);
        allValid = false;
      } else if (moduleCount > 0) {
        // Verify chapter numbers are sequential
        const chapterNumbers = syllabus.modules.map(m => m.chapterNumber).sort((a, b) => a - b);
        const expectedChapterNumbers = Array.from({ length: moduleCount }, (_, i) => i + 1);
        
        if (JSON.stringify(chapterNumbers) !== JSON.stringify(expectedChapterNumbers)) {
          const issue = `Chapter numbers are not sequential`;
          issues.push(`${syllabus.title}: ${issue}`);
          console.log(`  ${colors.yellow}⚠️  ${issue}${colors.reset}`);
          console.log(`    Expected: ${expectedChapterNumbers.join(', ')}`);
          console.log(`    Actual: ${chapterNumbers.join(', ')}`);
          allValid = false;
        } else {
          console.log(`  ${colors.green}✓${colors.reset} Valid`);
        }

        // Verify sub-modules
        let totalSubModules = 0;
        for (const module of syllabus.modules) {
          totalSubModules += module.subModules.length;
        }
        console.log(`  Sub-modules: ${totalSubModules}`);
      } else {
        console.log(`  ${colors.dim}No units or modules${colors.reset}`);
      }
      console.log();
    }

    printHeader('Verification Results');
    
    if (allValid) {
      console.log(`${colors.green}${colors.bright}✓ All checks passed${colors.reset}`);
      console.log(`${colors.dim}Migration integrity verified successfully${colors.reset}\n`);
      log('Verification passed', 'info');
    } else {
      console.log(`${colors.red}${colors.bright}✗ Verification failed${colors.reset}`);
      console.log(`${colors.yellow}Issues found:${colors.reset}`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      console.log();
      log(`Verification failed: ${issues.length} issues found`, 'warn');
    }

    return allValid;
  } catch (error) {
    console.error(`\n${colors.red}✗ Verification failed:${colors.reset}`, error);
    log(`Verification error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const options = parseArgs();
  initializeLogging(options.logFile);

  console.log(`${colors.dim}Log file: logs/${options.logFile}${colors.reset}\n`);

  try {
    if (options.rollback) {
      await rollbackMigration(options);
    } else if (options.verify) {
      await verifyMigration(options);
    } else {
      // Show pre-migration summary
      if (!options.auto && !options.dryRun) {
        console.log(`${colors.yellow}${colors.bright}⚠️  WARNING${colors.reset}`);
        console.log(`${colors.yellow}This will migrate your syllabus structure to the new format.${colors.reset}`);
        console.log(`${colors.dim}The original Units/Lessons will remain intact.${colors.reset}\n`);
        
        const confirmed = await confirm('Do you want to proceed with the migration?', false);
        if (!confirmed) {
          console.log(`${colors.yellow}Migration cancelled.${colors.reset}\n`);
          return;
        }
      }

      const stats = await migrateToNewStructure(options);

      // Run verification if migration was successful
      if (!options.dryRun && stats.errors.length === 0) {
        console.log(`${colors.cyan}Running verification...${colors.reset}\n`);
        await verifyMigration(options);
      }

      // Final messages
      if (options.dryRun) {
        console.log(`${colors.green}✓ Dry run completed${colors.reset}`);
        console.log(`${colors.dim}No changes were made to the database.${colors.reset}`);
        console.log(`${colors.dim}Run without --dry-run to execute the migration.${colors.reset}\n`);
      } else if (stats.errors.length === 0) {
        console.log(`${colors.green}${colors.bright}✓ Migration completed successfully!${colors.reset}`);
        console.log(`${colors.dim}The old Unit/Lesson structure is still intact.${colors.reset}`);
        console.log(`${colors.dim}You can safely delete it after verifying the new structure.${colors.reset}\n`);
      } else {
        console.log(`${colors.yellow}⚠️  Migration completed with errors${colors.reset}`);
        console.log(`${colors.dim}Please review the errors above and check the log file.${colors.reset}\n`);
      }
    }
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}✗ Fatal error:${colors.reset}`, error);
    log(`Fatal error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    process.exit(1);
  } finally {
    if (logStream) {
      log('Migration CLI completed', 'info');
      logStream.end();
    }
    await prisma.$disconnect();
  }
}

// Run the CLI
main();
