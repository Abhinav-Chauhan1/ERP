#!/usr/bin/env tsx

/**
 * Rollback Script: SystemSettings Migration
 * 
 * This script rolls back the per-school SystemSettings migration.
 * 
 * WARNING: This will delete all per-school settings and restore a single global record.
 * Only use this if the migration failed or needs to be reverted.
 * 
 * Steps:
 * 1. Backup current per-school settings
 * 2. Create a single global settings record
 * 3. Delete all per-school settings
 * 4. Remove database constraints
 * 5. Remove schoolId column
 * 
 * Usage:
 *   npx tsx scripts/rollback-system-settings-migration.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function rollbackMigration() {
  console.log("=".repeat(60));
  console.log("SystemSettings Migration Rollback");
  console.log("=".repeat(60));
  console.log();
  console.log("⚠️  WARNING: This will revert to a single global settings record");
  console.log("⚠️  All per-school settings will be deleted");
  console.log();

  try {
    // Step 1: Backup current per-school settings
    console.log("Step 1: Backing up current per-school settings...");
    
    const allSettings = await prisma.systemSettings.findMany({
      where: {
        schoolId: { not: null },
      },
      include: {
        school: {
          select: {
            name: true,
            subdomain: true,
          },
        },
      },
    });

    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `system-settings-backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(allSettings, null, 2));
    console.log(`✓ Backed up ${allSettings.length} settings records to:`);
    console.log(`  ${backupFile}`);
    console.log();

    // Step 2: Create a single global settings record
    console.log("Step 2: Creating global settings record...");
    
    // Use the first school's settings as template
    const templateSettings = allSettings[0];
    if (!templateSettings) {
      console.log("❌ No settings found to use as template");
      return;
    }

    const { id, schoolId, school, createdAt, updatedAt, ...settingsData } = templateSettings;
    
    const globalSettings = await prisma.systemSettings.create({
      data: {
        ...settingsData,
        schoolName: "School Name", // Reset to generic name
        onboardingCompleted: false,
      },
    });

    console.log("✓ Created global settings record");
    console.log(`  ID: ${globalSettings.id}`);
    console.log();

    // Step 3: Delete all per-school settings
    console.log("Step 3: Deleting per-school settings...");
    
    const deleteResult = await prisma.systemSettings.deleteMany({
      where: {
        schoolId: { not: null },
      },
    });

    console.log(`✓ Deleted ${deleteResult.count} per-school settings records`);
    console.log();

    // Step 4: Remove database constraints
    console.log("Step 4: Removing database constraints...");
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "system_settings" 
          DROP CONSTRAINT IF EXISTS "system_settings_schoolId_key";
      `);
      console.log("✓ Removed unique constraint");
    } catch (error: any) {
      console.log(`⚠️  Could not remove unique constraint: ${error.message}`);
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "system_settings" 
          DROP CONSTRAINT IF EXISTS "system_settings_schoolId_fkey";
      `);
      console.log("✓ Removed foreign key constraint");
    } catch (error: any) {
      console.log(`⚠️  Could not remove foreign key constraint: ${error.message}`);
    }

    console.log();

    // Step 5: Remove schoolId column
    console.log("Step 5: Removing schoolId column...");
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "schoolId";
      `);
      console.log("✓ Removed schoolId column");
    } catch (error: any) {
      console.log(`❌ Could not remove schoolId column: ${error.message}`);
      throw error;
    }

    console.log();
    console.log("=".repeat(60));
    console.log("✅ Rollback completed successfully!");
    console.log("=".repeat(60));
    console.log();
    console.log("Next steps:");
    console.log("1. Update Prisma schema to remove schoolId field");
    console.log("2. Run: npx prisma generate");
    console.log("3. Revert code changes in settingsActions.ts and paymentConfigActions.ts");
    console.log();
    console.log(`Backup file: ${backupFile}`);
    console.log();

  } catch (error: any) {
    console.error();
    console.error("❌ Rollback failed:");
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log();
  console.log("⚠️  WARNING: This will revert the SystemSettings migration");
  console.log("⚠️  Ensure you understand the implications before proceeding");
  console.log();

  try {
    await rollbackMigration();
    process.exit(0);
  } catch (error) {
    console.error();
    console.error("💥 Rollback failed with error");
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { rollbackMigration };
