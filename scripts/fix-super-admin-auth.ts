#!/usr/bin/env tsx

/**
 * Fix Super Admin Authentication Issues
 * This script helps diagnose and fix super admin authentication problems
 */

import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function fixSuperAdminAuth() {
  console.log("🔧 Fixing Super Admin Authentication Issues...\n");

  try {
    // 1. Check for super admin users
    console.log("1. Checking super admin users...");
    const superAdmins = await db.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        password: true,
      },
    });

    if (superAdmins.length === 0) {
      console.log("❌ No super admin users found");
      console.log("💡 Creating a super admin user...");
      
      const hashedPassword = await bcrypt.hash("SuperAdmin123!", 12);
      
      const newSuperAdmin = await db.user.create({
        data: {
          email: "superadmin@example.com",
          name: "Super Admin",
          password: hashedPassword,
          role: "SUPER_ADMIN",
          isActive: true,
          emailVerified: new Date(),
        },
      });
      
      console.log("✅ Created super admin user:");
      console.log(`   Email: ${newSuperAdmin.email}`);
      console.log(`   Password: SuperAdmin123!`);
      console.log(`   ID: ${newSuperAdmin.id}`);
    } else {
      console.log(`✅ Found ${superAdmins.length} super admin users:`);
      superAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name || admin.email} (${admin.email})`);
        console.log(`      Active: ${admin.isActive}`);
        console.log(`      Has Password: ${admin.password ? 'Yes' : 'No'}`);
      });

      // Check if any super admin needs password reset
      const inactiveAdmins = superAdmins.filter(admin => !admin.isActive);
      if (inactiveAdmins.length > 0) {
        console.log("\n🔄 Activating inactive super admin users...");
        for (const admin of inactiveAdmins) {
          await db.user.update({
            where: { id: admin.id },
            data: { isActive: true },
          });
          console.log(`   ✅ Activated: ${admin.email}`);
        }
      }

      // Check if any super admin needs password
      const adminsWithoutPassword = superAdmins.filter(admin => !admin.password);
      if (adminsWithoutPassword.length > 0) {
        console.log("\n🔑 Setting passwords for super admins without passwords...");
        const hashedPassword = await bcrypt.hash("SuperAdmin123!", 12);
        
        for (const admin of adminsWithoutPassword) {
          await db.user.update({
            where: { id: admin.id },
            data: { password: hashedPassword },
          });
          console.log(`   ✅ Set password for: ${admin.email}`);
          console.log(`      Password: SuperAdmin123!`);
        }
      }
    }

    // 2. Clean up any expired sessions
    console.log("\n2. Cleaning up expired sessions...");
    const expiredSessions = await db.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    console.log(`✅ Cleaned up ${expiredSessions.count} expired sessions`);

    // 3. Check authentication service
    console.log("\n3. Testing authentication service...");
    try {
      const { authenticationService } = await import("../src/lib/services/authentication-service");
      console.log("✅ Authentication service loaded successfully");
    } catch (error) {
      console.log("❌ Authentication service error:", error.message);
    }

    // 4. Provide login instructions
    console.log("\n🎯 Next Steps:");
    console.log("1. Go to: http://localhost:3000/sd");
    console.log("2. Login with:");
    console.log("   Email: superadmin@example.com");
    console.log("   Password: SuperAdmin123!");
    console.log("3. Navigate to School Management");
    console.log("4. Try launching the setup wizard");
    
    console.log("\n💡 If the issue persists:");
    console.log("1. Clear your browser cookies and cache");
    console.log("2. Open browser developer tools (F12)");
    console.log("3. Check the Console tab for JavaScript errors");
    console.log("4. Check the Network tab for failed API requests");
    console.log("5. Look for any 401/403 authentication errors");

  } catch (error) {
    console.error("❌ Fix failed:", error);
  } finally {
    await db.$disconnect();
  }
}

fixSuperAdminAuth().catch(console.error);