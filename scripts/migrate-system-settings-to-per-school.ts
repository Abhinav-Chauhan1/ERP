#!/usr/bin/env tsx

/**
 * Migration Script: SystemSettings to Per-School
 * 
 * This script migrates the global SystemSettings record to per-school records.
 * 
 * Steps:
 * 1. Get the current global settings
 * 2. Get all schools
 * 3. Create settings for each school (using global as template)
 * 4. Delete the old global settings
 * 5. Add foreign key and unique constraints
 * 
 * Usage:
 *   npx tsx scripts/migrate-system-settings-to-per-school.ts
 * 
 * Requirements:
 *   - Run prisma/migrations/add_schoolid_to_system_settings.sql first
 *   - Backup database before running
 *   - Test on staging environment first
 */

import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MigrationStats {
  totalSchools: number;
  settingsCreated: number;
  settingsSkipped: number;
  errors: string[];
}

async function migrateSystemSettings(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalSchools: 0,
    settingsCreated: 0,
    settingsSkipped: 0,
    errors: [],
  };

  console.log("=".repeat(60));
  console.log("SystemSettings Migration to Per-School");
  console.log("=".repeat(60));
  console.log();

  try {
    // Step 1: Get the current global settings
    console.log("Step 1: Fetching global settings...");
    const globalSettings = await prisma.systemSettings.findFirst({
      where: {
        OR: [
          { schoolId: null },
          { schoolId: "" },
        ],
      },
    });

    if (!globalSettings) {
      console.log("❌ No global settings found.");
      console.log("Creating default global settings...");
      
      // Create default settings
      const defaultSettings = await prisma.systemSettings.create({
        data: {
          schoolName: "School Name",
          timezone: "UTC",
          defaultGradingScale: "PERCENTAGE",
          passingGrade: 50,
          emailEnabled: true,
          defaultTheme: "LIGHT",
          language: "en",
          enableOfflineVerification: true,
          enableOnlinePayment: false,
          maxReceiptSizeMB: 5,
          allowedReceiptFormats: "jpg,jpeg,png,pdf",
          autoNotifyOnVerification: true,
        },
      });
      
      console.log("✓ Created default global settings");
      return migrateSystemSettings(); // Retry with new settings
    }

    console.log("✓ Found global settings");
    console.log(`  ID: ${globalSettings.id}`);
    console.log(`  School Name: ${globalSettings.schoolName}`);
    console.log();

    // Step 2: Get all schools
    console.log("Step 2: Fetching all schools...");
    const schools = await prisma.school.findMany({
      select: { 
        id: true, 
        name: true,
        subdomain: true,
      },
      orderBy: { name: 'asc' },
    });

    stats.totalSchools = schools.length;
    console.log(`✓ Found ${schools.length} schools`);
    console.log();

    if (schools.length === 0) {
      console.log("⚠️  No schools found. Migration not needed.");
      return stats;
    }

    // Step 3: Create settings for each school
    console.log("Step 3: Creating per-school settings...");
    console.log();

    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      const progress = `[${i + 1}/${schools.length}]`;
      
      try {
        console.log(`${progress} Processing: ${school.name} (${school.subdomain})`);

        // Check if settings already exist for this school
        const existing = await prisma.systemSettings.findFirst({
          where: { schoolId: school.id },
        });

        if (existing) {
          console.log(`  ⏭️  Settings already exist, skipping`);
          stats.settingsSkipped++;
          continue;
        }

        // Create new settings record for this school
        const { id, createdAt, updatedAt, ...settingsData } = globalSettings;
        
        await prisma.systemSettings.create({
          data: {
            ...settingsData,
            schoolId: school.id,
            schoolName: school.name, // Use actual school name
            onboardingCompleted: true, // School already exists, so onboarding is complete
          },
        });

        console.log(`  ✓ Created settings for ${school.name}`);
        stats.settingsCreated++;
      } catch (error: any) {
        const errorMsg = `Failed to create settings for ${school.name}: ${error.message}`;
        console.error(`  ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    console.log();
    console.log("Step 4: Cleaning up old global settings...");

    // Step 4: Delete the old global settings (if it has no schoolId)
    if (!globalSettings.schoolId) {
      await prisma.systemSettings.delete({
        where: { id: globalSettings.id },
      });
      console.log("✓ Deleted old global settings");
    } else {
      console.log("⏭️  Global settings already has schoolId, skipping deletion");
    }

    console.log();
    console.log("Step 5: Adding database constraints...");

    // Step 5: Add foreign key and unique constraints
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "system_settings" 
          ADD CONSTRAINT "system_settings_schoolId_fkey" 
          FOREIGN KEY ("schoolId") 
          REFERENCES "schools"("id") 
          ON DELETE CASCADE;
      `);
      console.log("✓ Added foreign key constraint");
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log("⏭️  Foreign key constraint already exists");
      } else {
        throw error;
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "system_settings" 
          ADD CONSTRAINT "system_settings_schoolId_key" 
          UNIQUE ("schoolId");
      `);
      console.log("✓ Added unique constraint on schoolId");
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log("⏭️  Unique constraint already exists");
      } else {
        throw error;
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("Migration Summary");
    console.log("=".repeat(60));
    console.log(`Total Schools:       ${stats.totalSchools}`);
    console.log(`Settings Created:    ${stats.settingsCreated}`);
    console.log(`Settings Skipped:    ${stats.settingsSkipped}`);
    console.log(`Errors:              ${stats.errors.length}`);
    console.log();

    if (stats.errors.length > 0) {
      console.log("Errors:");
      stats.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
      console.log();
    }

    if (stats.settingsCreated === stats.totalSchools) {
      console.log("✅ Migration completed successfully!");
    } else if (stats.settingsCreated + stats.settingsSkipped === stats.totalSchools) {
      console.log("✅ Migration completed (some settings already existed)");
    } else {
      console.log("⚠️  Migration completed with errors");
    }

    return stats;
  } catch (error: any) {
    console.error();
    console.error("❌ Migration failed:");
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Verification function
async function verifyMigration(): Promise<boolean> {
  console.log();
  console.log("=".repeat(60));
  console.log("Verification");
  console.log("=".repeat(60));
  console.log();

  try {
    // Check 1: All schools have settings
    const schoolCount = await prisma.school.count();
    const settingsCount = await prisma.systemSettings.count({
      where: {
        schoolId: { not: null },
      },
    });

    console.log(`Schools:  ${schoolCount}`);
    console.log(`Settings: ${settingsCount}`);

    if (schoolCount !== settingsCount) {
      console.log("❌ Mismatch: Not all schools have settings");
      return false;
    }

    // Check 2: No global settings remain
    const globalSettings = await prisma.systemSettings.count({
      where: {
        OR: [
          { schoolId: null },
          { schoolId: "" },
        ],
      },
    });

    if (globalSettings > 0) {
      console.log(`❌ Found ${globalSettings} global settings (should be 0)`);
      return false;
    }

    // Check 3: All settings have valid schoolId
    const invalidSettings = await prisma.systemSettings.count({
      where: {
        school: null,
      },
    });

    if (invalidSettings > 0) {
      console.log(`❌ Found ${invalidSettings} settings with invalid schoolId`);
      return false;
    }

    console.log();
    console.log("✅ All verification checks passed!");
    return true;
  } catch (error: any) {
    console.error("❌ Verification failed:");
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log();
  console.log("⚠️  WARNING: This migration will modify the database structure");
  console.log("⚠️  Ensure you have a backup before proceeding");
  console.log();

  try {
    // Run migration
    const stats = await migrateSystemSettings();

    // Verify migration
    const verified = await verifyMigration();

    if (!verified) {
      console.log();
      console.log("⚠️  Migration completed but verification failed");
      console.log("⚠️  Please review the database manually");
      process.exit(1);
    }

    console.log();
    console.log("🎉 Migration and verification completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error();
    console.error("💥 Migration failed with error");
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { migrateSystemSettings, verifyMigration };
