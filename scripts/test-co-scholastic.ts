import { db } from "../src/lib/db";

async function testCoScholasticModels() {
  console.log("Testing Co-Scholastic Models...\n");

  try {
    // Test 1: Create a co-scholastic activity
    console.log("1. Creating a test co-scholastic activity...");
    const activity = await db.coScholasticActivity.create({
      data: {
        name: "Test Sports Activity",
        assessmentType: "GRADE",
        isActive: true,
      },
    });
    console.log("✓ Activity created:", activity.id);

    // Test 2: Fetch the activity
    console.log("\n2. Fetching the activity...");
    const fetchedActivity = await db.coScholasticActivity.findUnique({
      where: { id: activity.id },
    });
    console.log("✓ Activity fetched:", fetchedActivity?.name);

    // Test 3: Update the activity
    console.log("\n3. Updating the activity...");
    const updatedActivity = await db.coScholasticActivity.update({
      where: { id: activity.id },
      data: {
        assessmentType: "MARKS",
        maxMarks: 100,
      },
    });
    console.log("✓ Activity updated to MARKS type with max marks:", updatedActivity.maxMarks);

    // Test 4: Get a student and term for grade entry test
    console.log("\n4. Finding a student and term for grade entry...");
    const student = await db.student.findFirst({
      select: { id: true, admissionId: true },
    });
    const term = await db.term.findFirst({
      select: { id: true, name: true },
    });

    if (student && term) {
      console.log("✓ Found student:", student.admissionId);
      console.log("✓ Found term:", term.name);

      // Test 5: Create a co-scholastic grade
      console.log("\n5. Creating a co-scholastic grade...");
      const grade = await db.coScholasticGrade.create({
        data: {
          activityId: activity.id,
          studentId: student.id,
          termId: term.id,
          marks: 85,
        },
      });
      console.log("✓ Grade created:", grade.id);

      // Test 6: Fetch grades for the student
      console.log("\n6. Fetching grades for the student...");
      const grades = await db.coScholasticGrade.findMany({
        where: {
          studentId: student.id,
          termId: term.id,
        },
        include: {
          activity: true,
        },
      });
      console.log("✓ Found", grades.length, "grade(s)");

      // Test 7: Update the grade
      console.log("\n7. Updating the grade...");
      const updatedGrade = await db.coScholasticGrade.update({
        where: { id: grade.id },
        data: {
          marks: 90,
          remarks: "Excellent performance",
        },
      });
      console.log("✓ Grade updated to:", updatedGrade.marks);

      // Test 8: Delete the grade
      console.log("\n8. Deleting the grade...");
      await db.coScholasticGrade.delete({
        where: { id: grade.id },
      });
      console.log("✓ Grade deleted");
    } else {
      console.log("⚠ No student or term found, skipping grade tests");
    }

    // Test 9: Delete the activity
    console.log("\n9. Deleting the activity...");
    await db.coScholasticActivity.delete({
      where: { id: activity.id },
    });
    console.log("✓ Activity deleted");

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

testCoScholasticModels();
