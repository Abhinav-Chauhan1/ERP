/**
 * Script to check all message attachments in the database
 * and identify any that are using example.com or other non-Cloudinary URLs
 */

import { db } from "../src/lib/db";

async function checkMessageAttachments() {
  console.log("🔍 Checking message attachments...\n");

  try {
    // Get all messages with attachments
    const messages = await db.message.findMany({
      where: {
        attachments: {
          not: null,
        },
      },
      select: {
        id: true,
        subject: true,
        attachments: true,
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdAt: true,
      },
    });

    console.log(`Found ${messages.length} messages with attachments\n`);

    const issues: any[] = [];

    messages.forEach((message, index) => {
      console.log(`\n📧 Message ${index + 1}:`);
      console.log(`   ID: ${message.id}`);
      console.log(`   Subject: ${message.subject || "(No subject)"}`);
      console.log(
        `   From: ${message.sender.firstName} ${message.sender.lastName} (${message.sender.role})`
      );
      console.log(
        `   To: ${message.recipient.firstName} ${message.recipient.lastName} (${message.recipient.role})`
      );
      console.log(`   Date: ${message.createdAt.toISOString()}`);

      try {
        const attachments = JSON.parse(message.attachments || "[]");
        console.log(`   Attachments (${attachments.length}):`);

        attachments.forEach((url: string, i: number) => {
          console.log(`      ${i + 1}. ${url}`);

          // Check for problematic URLs
          if (url.includes("example.com")) {
            issues.push({
              messageId: message.id,
              subject: message.subject,
              url,
              issue: "Contains example.com",
            });
            console.log(`         ⚠️  WARNING: Contains example.com`);
          } else if (url.includes("storage.example.com")) {
            issues.push({
              messageId: message.id,
              subject: message.subject,
              url,
              issue: "Contains storage.example.com",
            });
            console.log(`         ❌ ERROR: Contains storage.example.com`);
          } else if (!url.includes("cloudinary.com")) {
            issues.push({
              messageId: message.id,
              subject: message.subject,
              url,
              issue: "Not using Cloudinary",
            });
            console.log(`         ⚠️  WARNING: Not using Cloudinary`);
          } else {
            console.log(`         ✅ OK: Using Cloudinary`);
          }
        });
      } catch (error) {
        console.log(`   ❌ ERROR: Failed to parse attachments JSON`);
        console.log(`   Raw value: ${message.attachments}`);
        issues.push({
          messageId: message.id,
          subject: message.subject,
          url: message.attachments,
          issue: "Invalid JSON",
        });
      }
    });

    // Summary
    console.log("\n\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total messages with attachments: ${messages.length}`);
    console.log(`Messages with issues: ${issues.length}`);

    if (issues.length > 0) {
      console.log("\n❌ ISSUES FOUND:\n");
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. Message ID: ${issue.messageId}`);
        console.log(`   Subject: ${issue.subject || "(No subject)"}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   URL: ${issue.url}`);
        console.log("");
      });

      console.log("\n💡 RECOMMENDATION:");
      console.log(
        "Run the database seed again to replace these messages with proper Cloudinary URLs:"
      );
      console.log("   npx prisma db seed");
    } else {
      console.log("\n✅ All attachments are using Cloudinary URLs!");
    }
  } catch (error) {
    console.error("❌ Error checking attachments:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the check
checkMessageAttachments();
