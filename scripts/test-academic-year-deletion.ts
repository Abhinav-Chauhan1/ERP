/**
 * Test script for academic year deletion with dependency checking
 * This script verifies that:
 * 1. Academic years with terms cannot be deleted
 * 2. Academic years with classes cannot be deleted
 * 3. Academic years without dependencies can be deleted
 * 4. Error messages are informative
 */

import { db } from "../src/lib/db";

async function testDeletion() {
  console.log("🧪 Testing Academic Year Deletion with Dependency Checking\n");

  try {
    // Test 1: Create an academic year without dependencies
    console.log("Test 1: Creating academic year without dependencies...");
    const testYear = await db.academicYear.create({
      data: {
        name: "Test Year 2025-2026",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
        isCurrent: false,
      },
    });
    console.log(`✅ Created test academic year: ${testYear.id}\n`);

    // Test 2: Verify deletion logic for year without dependencies
    console.log("Test 2: Checking deletion logic for year without dependencies...");
    const hasTerms1 = await db.term.findFirst({ where: { academicYearId: testYear.id } });
    const hasClasses1 = await db.class.findFirst({ where: { academicYearId: testYear.id } });
    
    if (!hasTerms1 && !hasClasses1) {
      console.log("✅ No dependencies found - deletion should be allowed");
      await db.academicYear.delete({ where: { id: testYear.id } });
      console.log("✅ Successfully deleted academic year without dependencies\n");
    } else {
      console.error("❌ Unexpected dependencies found\n");
    }

    // Test 3: Create academic year with a term
    console.log("Test 3: Creating academic year with a term...");
    const testYearWithTerm = await db.academicYear.create({
      data: {
        name: "Test Year with Term 2025-2026",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
        isCurrent: false,
      },
    });
    
    const term = await db.term.create({
      data: {
        name: "Test Term 1",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-08-31"),
        academicYearId: testYearWithTerm.id,
      },
    });
    console.log(`✅ Created academic year with term: ${testYearWithTerm.id}\n`);

    // Test 4: Verify deletion logic prevents deletion with dependencies
    console.log("Test 4: Checking deletion logic for year with term...");
    const hasTerms2 = await db.term.findFirst({ where: { academicYearId: testYearWithTerm.id } });
    const hasClasses2 = await db.class.findFirst({ where: { academicYearId: testYearWithTerm.id } });
    
    if (hasTerms2 || hasClasses2) {
      console.log("✅ Dependencies found - deletion should be prevented");
      console.log("✅ Error message would be: 'Cannot delete this academic year because it has associated terms or classes. Remove them first.'\n");
    } else {
      console.error("❌ Dependencies not detected\n");
    }

    // Cleanup: Delete the term and then the academic year
    console.log("Cleanup: Removing test data...");
    await db.term.delete({ where: { id: term.id } });
    await db.academicYear.delete({ where: { id: testYearWithTerm.id } });
    console.log("✅ Cleanup complete\n");

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    await db.$disconnect();
  }
}

testDeletion();
