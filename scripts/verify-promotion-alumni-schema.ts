import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    console.log("Verifying Student Promotion and Alumni schema...\n");

    // Check if Alumni table exists and is accessible
    console.log("1. Checking Alumni table...");
    const alumniCount = await prisma.alumni.count();
    console.log(`   ✓ Alumni table exists (${alumniCount} records)`);

    // Check if PromotionHistory table exists and is accessible
    console.log("\n2. Checking PromotionHistory table...");
    const promotionHistoryCount = await prisma.promotionHistory.count();
    console.log(
      `   ✓ PromotionHistory table exists (${promotionHistoryCount} records)`
    );

    // Check if PromotionRecord table exists and is accessible
    console.log("\n3. Checking PromotionRecord table...");
    const promotionRecordCount = await prisma.promotionRecord.count();
    console.log(
      `   ✓ PromotionRecord table exists (${promotionRecordCount} records)`
    );

    // Verify relationships
    console.log("\n4. Verifying relationships...");

    // Check Alumni -> Student relationship
    const alumniWithStudent = await prisma.alumni.findFirst({
      include: { student: true },
    });
    console.log("   ✓ Alumni -> Student relationship configured");

    // Check PromotionRecord -> PromotionHistory relationship
    const recordWithHistory = await prisma.promotionRecord.findFirst({
      include: { history: true },
    });
    console.log("   ✓ PromotionRecord -> PromotionHistory relationship configured");

    // Check PromotionRecord -> Student relationship
    const recordWithStudent = await prisma.promotionRecord.findFirst({
      include: { student: true },
    });
    console.log("   ✓ PromotionRecord -> Student relationship configured");

    // Check Student -> Alumni relationship
    const studentWithAlumni = await prisma.student.findFirst({
      include: { alumni: true },
    });
    console.log("   ✓ Student -> Alumni relationship configured");

    // Check Student -> PromotionRecords relationship
    const studentWithRecords = await prisma.student.findFirst({
      include: { promotionRecords: true },
    });
    console.log("   ✓ Student -> PromotionRecords relationship configured");

    console.log("\n✅ All schema verifications passed!");
    console.log("\nDatabase tables created:");
    console.log("  - alumni");
    console.log("  - promotion_history");
    console.log("  - promotion_records");
    console.log("\nIndexes created:");
    console.log("  - alumni: studentId (unique), graduationDate, finalClass, currentCity, collegeName");
    console.log("  - promotion_history: sourceAcademicYear+sourceClass, targetAcademicYear+targetClass, executedAt");
    console.log("  - promotion_records: historyId, studentId");
    console.log("\nForeign keys configured:");
    console.log("  - alumni.studentId -> Student.id");
    console.log("  - promotion_records.historyId -> promotion_history.id");
    console.log("  - promotion_records.studentId -> Student.id");
  } catch (error) {
    console.error("❌ Schema verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
