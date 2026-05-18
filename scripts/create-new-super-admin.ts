/**
 * Create a new Super Admin user
 * Run with: npx tsx scripts/create-new-super-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🔐 Creating new Super Admin user...\n");

  const email = "superadmin@sikshamitra.com";
  const password = "SuperAdmin@2024";
  const passwordHash = await bcrypt.hash(password, 12);

  // Check if user already exists
  const existing = await db.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("⚠️  User with this email already exists!");
    console.log(`   Email: ${existing.email}`);
    console.log(`   Role: ${existing.role}`);
    console.log("\n   Updating password and role...");

    await db.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("\n✅ Super Admin updated successfully!");
  } else {
    // Create new super admin
    const superAdmin = await db.user.create({
      data: {
        name: "Super Administrator",
        firstName: "Super",
        lastName: "Administrator",
        email,
        mobile: "9999999999",
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Super Admin created successfully!");
    console.log(`   User ID: ${superAdmin.id}`);
  }

  console.log("\n📋 Login Credentials:");
  console.log("   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log("   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n⚠️  IMPORTANT: Change this password after first login!");
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
