#!/usr/bin/env tsx

/**
 * Simple Migration Script: SystemSettings to Per-School
 * Uses raw SQL to avoid Prisma schema validation issues
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("SystemSettings Migration to Per-School (Simple)");
  console.log("=".repeat(60) + "\n");

  try {
    // Step 1: Get global settings using raw SQL
    console.log("Step 1: Fetching global settings...");
    const globalSettings: any[] = await prisma.$queryRaw`
      SELECT * FROM "system_settings" 
      WHERE "schoolId" IS NULL 
      LIMIT 1
    `;

    if (globalSettings.length === 0) {
      console.log("❌ No global settings found");
      process.exit(1);
    }

    const template = globalSettings[0];
    console.log(`✓ Found global settings (ID: ${template.id})`);
    console.log();

    // Step 2: Get all schools
    console.log("Step 2: Fetching all schools...");
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, subdomain: true },
      orderBy: { name: 'asc' },
    });

    console.log(`✓ Found ${schools.length} schools`);
    console.log();

    // Step 3: Create settings for each school
    console.log("Step 3: Creating per-school settings...");
    let created = 0;
    let skipped = 0;

    for (const school of schools) {
      console.log(`  Processing: ${school.name}`);

      // Check if exists
      const existing: any[] = await prisma.$queryRaw`
        SELECT id FROM "system_settings" 
        WHERE "schoolId" = ${school.id}
      `;

      if (existing.length > 0) {
        console.log(`    ⏭️  Already exists, skipping`);
        skipped++;
        continue;
      }

      // Create new settings - use Prisma create to handle ID generation
      await prisma.$executeRawUnsafe(`
        INSERT INTO "system_settings" (
          id, "schoolId", "schoolName", "schoolEmail", "schoolPhone", 
          "schoolAddress", "schoolWebsite", "timezone", "defaultGradingScale",
          "passingGrade", "emailEnabled", "smsEnabled", "pushEnabled",
          "notifyEnrollment", "notifyPayment", "notifyAttendance",
          "notifyExamResults", "notifyLeaveApps", "twoFactorAuth",
          "sessionTimeout", "passwordExpiry", "autoBackup", "backupFrequency",
          "defaultTheme", "language", "dateFormat", "enableOnlinePayment",
          "enableOfflineVerification", "maxReceiptSizeMB", "allowedReceiptFormats",
          "autoNotifyOnVerification", "onboardingCompleted", "createdAt", "updatedAt"
        )
        SELECT 
          'cml' || substr(md5(random()::text), 1, 21) as id,
          '${school.id}', '${school.name.replace(/'/g, "''")}', 
          ${template.schoolEmail ? `'${template.schoolEmail.replace(/'/g, "''")}'` : 'NULL'},
          ${template.schoolPhone ? `'${template.schoolPhone.replace(/'/g, "''")}'` : 'NULL'},
          ${template.schoolAddress ? `'${template.schoolAddress.replace(/'/g, "''")}'` : 'NULL'},
          ${template.schoolWebsite ? `'${template.schoolWebsite.replace(/'/g, "''")}'` : 'NULL'},
          '${template.timezone}', '${template.defaultGradingScale}',
          ${template.passingGrade}, ${template.emailEnabled}, ${template.smsEnabled}, 
          ${template.pushEnabled}, ${template.notifyEnrollment}, ${template.notifyPayment},
          ${template.notifyAttendance}, ${template.notifyExamResults}, ${template.notifyLeaveApps},
          ${template.twoFactorAuth}, ${template.sessionTimeout}, ${template.passwordExpiry},
          ${template.autoBackup}, '${template.backupFrequency}', '${template.defaultTheme}',
          '${template.language}', '${template.dateFormat}', ${template.enableOnlinePayment},
          ${template.enableOfflineVerification}, ${template.maxReceiptSizeMB},
          '${template.allowedReceiptFormats}', ${template.autoNotifyOnVerification},
          true, NOW(), NOW()
      `);

      console.log(`    ✓ Created`);
      created++;
    }

    console.log();
    console.log(`Summary: Created ${created}, Skipped ${skipped}`);
    console.log();

    // Step 4: Delete global settings
    console.log("Step 4: Deleting global settings...");
    await prisma.$executeRaw`
      DELETE FROM "system_settings" 
      WHERE "schoolId" IS NULL
    `;
    console.log("✓ Deleted global settings");
    console.log();

    // Step 5: Add constraints
    console.log("Step 5: Adding database constraints...");
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "system_settings" 
          ADD CONSTRAINT "system_settings_schoolId_fkey" 
          FOREIGN KEY ("schoolId") 
          REFERENCES "schools"("id") 
          ON DELETE CASCADE
      `;
      console.log("✓ Added foreign key constraint");
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log("⏭️  Foreign key already exists");
      } else {
        throw e;
      }
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "system_settings" 
          ADD CONSTRAINT "system_settings_schoolId_key" 
          UNIQUE ("schoolId")
      `;
      console.log("✓ Added unique constraint");
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log("⏭️  Unique constraint already exists");
      } else {
        throw e;
      }
    }

    console.log();
    console.log("✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
