/**
 * Script to fix message attachments in the database
 * - Removes messages with storage.example.com URLs
 * - Fixes messages with invalid JSON (converts single URLs to JSON arrays)
 */

import { db } from "../src/lib/db";

async function fixMessageAttachments() {
  console.log("🔧 Fixing message attachments...\n");

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
      },
    });

    console.log(`Found ${messages.length} messages with attachments\n`);

    let deletedCount = 0;
    let fixedCount = 0;
    let skippedCount = 0;

    for (const message of messages) {
      try {
        // Try to parse as JSON
        const attachments = JSON.parse(message.attachments || "[]");

        // Check if any attachment contains example.com
        const hasExampleUrl = attachments.some((url: string) =>
          url.includes("example.com")
        );

        if (hasExampleUrl) {
          // Delete message with example.com URLs
          await db.message.delete({
            where: { id: message.id },
          });
          console.log(
            `❌ Deleted message "${message.subject || "(No subject)"}" (ID: ${message.id}) - Contains example.com URLs`
          );
          deletedCount++;
        } else {
          console.log(
            `✅ Kept message "${message.subject || "(No subject)"}" (ID: ${message.id}) - Valid Cloudinary URLs`
          );
          skippedCount++;
        }
      } catch (error) {
        // Invalid JSON - try to fix it
        const rawValue = message.attachments || "";

        if (rawValue.includes("example.com")) {
          // Delete message with example.com URLs
          await db.message.delete({
            where: { id: message.id },
          });
          console.log(
            `❌ Deleted message "${message.subject || "(No subject)"}" (ID: ${message.id}) - Contains example.com URL (invalid JSON)`
          );
          deletedCount++;
        } else if (rawValue.startsWith("http")) {
          // Single URL - convert to JSON array
          const fixedAttachments = JSON.stringify([rawValue]);
          await db.message.update({
            where: { id: message.id },
            data: { attachments: fixedAttachments },
          });
          console.log(
            `🔧 Fixed message "${message.subject || "(No subject)"}" (ID: ${message.id}) - Converted single URL to JSON array`
          );
          fixedCount++;
        } else {
          // Unknown format - delete it
          await db.message.delete({
            where: { id: message.id },
          });
          console.log(
            `❌ Deleted message "${message.subject || "(No subject)"}" (ID: ${message.id}) - Unknown attachment format`
          );
          deletedCount++;
        }
      }
    }

    // Summary
    console.log("\n\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total messages processed: ${messages.length}`);
    console.log(`Messages deleted: ${deletedCount}`);
    console.log(`Messages fixed: ${fixedCount}`);
    console.log(`Messages kept (valid): ${skippedCount}`);

    if (deletedCount > 0 || fixedCount > 0) {
      console.log("\n✅ Database cleanup completed successfully!");
    } else {
      console.log("\n✅ No issues found - all messages are valid!");
    }
  } catch (error) {
    console.error("❌ Error fixing attachments:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the fix
fixMessageAttachments();
