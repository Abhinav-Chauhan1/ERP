/**
 * Test script for cascade deletion functionality
 * 
 * This script tests the cascade deletion of FeeStructureClass and FeeTypeClassAmount
 * records when a class is deleted.
 * 
 * Requirements: 1.5, 3.4
 */

import { PrismaClient } from "@prisma/client";
import {
  getClassDeletionCascadeInfo,
  logCascadeDeletion,
  validateClassDeletionSafety,
} from "../src/lib/services/cascade-deletion.service";

const db = new PrismaClient();

async function testCascadeDeletion() {
  console.log("=== Testing Cascade Deletion Functionality ===\n");

  try {
    // Step 1: Create test data
    console.log("Step 1: Creating test data...");

    // Get or create an academic year
    let academicYear = await db.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!academicYear) {
      academicYear = await db.academicYear.create({
        data: {
          name: "Test Academic Year 2024-2025",
          startDate: new Date("2024-09-01"),
          endDate: new Date("2025-06-30"),
          isCurrent: true,
        },
      });
      console.log(`  Created academic year: ${academicYear.name}`);
    } else {
      console.log(`  Using existing academic year: ${academicYear.name}`);
    }

    // Create a test class
    const testClass = await db.class.create({
      data: {
        name: "Test Class for Cascade Deletion",
        academicYearId: academicYear.id,
      },
    });
    console.log(`  Created test class: ${testClass.name} (${testClass.id})`);

    // Create a fee type
    const feeType = await db.feeType.create({
      data: {
        name: "Test Fee Type",
        amount: 1000,
        frequency: "ANNUAL",
      },
    });
    console.log(`  Created fee type: ${feeType.name}`);

    // Create a class-specific amount for the fee type
    const feeTypeClassAmount = await db.feeTypeClassAmount.create({
      data: {
        feeTypeId: feeType.id,
        classId: testClass.id,
        amount: 1500,
      },
    });
    console.log(
      `  Created class-specific amount: ${feeTypeClassAmount.amount} for ${testClass.name}`
    );

    // Create a fee structure
    const feeStructure = await db.feeStructure.create({
      data: {
        name: "Test Fee Structure",
        academicYearId: academicYear.id,
        validFrom: new Date("2024-09-01"),
        isActive: true,
      },
    });
    console.log(`  Created fee structure: ${feeStructure.name}`);

    // Create a fee structure class association
    const feeStructureClass = await db.feeStructureClass.create({
      data: {
        feeStructureId: feeStructure.id,
        classId: testClass.id,
      },
    });
    console.log(
      `  Created fee structure class association for ${testClass.name}`
    );

    console.log("\n✓ Test data created successfully\n");

    // Step 2: Test cascade deletion info retrieval
    console.log("Step 2: Testing cascade deletion info retrieval...");
    const cascadeInfo = await getClassDeletionCascadeInfo(testClass.id);

    console.log(`  Class: ${cascadeInfo.className}`);
    console.log(
      `  Fee Structure Associations: ${cascadeInfo.feeStructureAssociations.length}`
    );
    console.log(
      `  Fee Type Class Amounts: ${cascadeInfo.feeTypeClassAmounts.length}`
    );
    console.log(
      `  Total Records Affected: ${cascadeInfo.totalRecordsAffected}`
    );

    if (cascadeInfo.totalRecordsAffected !== 2) {
      throw new Error(
        `Expected 2 records to be affected, but got ${cascadeInfo.totalRecordsAffected}`
      );
    }

    console.log("\n✓ Cascade info retrieval successful\n");

    // Step 3: Test deletion safety validation
    console.log("Step 3: Testing deletion safety validation...");
    const safetyCheck = await validateClassDeletionSafety(testClass.id);

    console.log(`  Is Safe: ${safetyCheck.isSafe}`);
    console.log(
      `  Affected Active Fee Structures: ${safetyCheck.affectedActiveFeeStructures}`
    );
    console.log(`  Warnings: ${safetyCheck.warnings.length}`);

    if (safetyCheck.warnings.length > 0) {
      safetyCheck.warnings.forEach((warning, index) => {
        console.log(`    ${index + 1}. ${warning}`);
      });
    }

    if (!safetyCheck.isSafe) {
      throw new Error("Deletion safety check failed unexpectedly");
    }

    console.log("\n✓ Safety validation successful\n");

    // Step 4: Test logging
    console.log("Step 4: Testing cascade deletion logging...");
    logCascadeDeletion(cascadeInfo, "test-user-id");
    console.log("\n✓ Logging successful\n");

    // Step 5: Verify cascade deletion works
    console.log("Step 5: Testing actual cascade deletion...");

    // Count records before deletion
    const feeStructureClassCountBefore = await db.feeStructureClass.count({
      where: { classId: testClass.id },
    });
    const feeTypeClassAmountCountBefore = await db.feeTypeClassAmount.count({
      where: { classId: testClass.id },
    });

    console.log(
      `  FeeStructureClass records before: ${feeStructureClassCountBefore}`
    );
    console.log(
      `  FeeTypeClassAmount records before: ${feeTypeClassAmountCountBefore}`
    );

    // Delete the class (should cascade delete related records)
    await db.class.delete({
      where: { id: testClass.id },
    });

    console.log(`  Deleted class: ${testClass.name}`);

    // Verify cascade deletion
    const feeStructureClassCountAfter = await db.feeStructureClass.count({
      where: { classId: testClass.id },
    });
    const feeTypeClassAmountCountAfter = await db.feeTypeClassAmount.count({
      where: { classId: testClass.id },
    });

    console.log(
      `  FeeStructureClass records after: ${feeStructureClassCountAfter}`
    );
    console.log(
      `  FeeTypeClassAmount records after: ${feeTypeClassAmountCountAfter}`
    );

    if (feeStructureClassCountAfter !== 0 || feeTypeClassAmountCountAfter !== 0) {
      throw new Error("Cascade deletion did not work as expected");
    }

    console.log("\n✓ Cascade deletion successful\n");

    // Cleanup: Delete test fee structure and fee type
    await db.feeStructure.delete({ where: { id: feeStructure.id } });
    await db.feeType.delete({ where: { id: feeType.id } });

    console.log("=== All Tests Passed! ===\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testCascadeDeletion()
  .then(() => {
    console.log("Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
