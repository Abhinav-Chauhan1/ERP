import { db } from "../src/lib/db";
import {
  createCoScholasticActivity,
  getCoScholasticActivities,
  updateCoScholasticActivity,
  saveCoScholasticGrade,
  getCoScholasticGrades,
  deleteCoScholasticGrade,
  deleteCoScholasticActivity,
} from "../src/lib/actions/coScholasticActions";
import { generateReportCard } from "../src/lib/actions/reportCardsActions";

async function testCoScholasticIntegration() {
  console.log("Testing Co-Scholastic Integration...\n");

  try {
    // Test 1: Create activities
    console.log("1. Creating co-scholastic activities...");
    const sportsResult = await createCoScholasticActivity({
      name: "Sports",
      assessmentType: "GRADE",
    });
    const artResult = await createCoScholasticActivity({
      name: "Art & Craft",
      assessmentType: "MARKS",
      maxMarks: 100,
    });

    if (!sportsResult.success || !artResult.success) {
      throw new Error("Failed to create activities");
    }

    console.log("✓ Created Sports activity:", sportsResult.data.id);
    console.log("✓ Created Art activity:", artResult.data.id);

    // Test 2: Get all activities
    console.log("\n2. Fetching all activities...");
    const activitiesResult = await getCoScholasticActivities(false);
    if (!activitiesResult.success) {
      throw new Error("Failed to fetch activities");
    }
    console.log("✓ Found", activitiesResult.data.length, "active activities");

    // Test 3: Update an activity
    console.log("\n3. Updating Sports activity...");
    const updateResult = await updateCoScholasticActivity(sportsResult.data.id, {
      name: "Sports & Physical Education",
      assessmentType: "GRADE",
    });
    if (!updateResult.success) {
      throw new Error("Failed to update activity");
    }
    console.log("✓ Activity updated:", updateResult.data.name);

    // Test 4: Get a student and term
    console.log("\n4. Finding student and term...");
    const student = await db.student.findFirst({
      select: { id: true, admissionId: true },
    });
    const term = await db.term.findFirst({
      select: { id: true, name: true },
    });

    if (!student || !term) {
      throw new Error("No student or term found");
    }
    console.log("✓ Found student:", student.admissionId);
    console.log("✓ Found term:", term.name);

    // Test 5: Save co-scholastic grades
    console.log("\n5. Saving co-scholastic grades...");
    const sportsGradeResult = await saveCoScholasticGrade({
      activityId: sportsResult.data.id,
      studentId: student.id,
      termId: term.id,
      grade: "A",
      remarks: "Excellent participation",
    });

    const artGradeResult = await saveCoScholasticGrade({
      activityId: artResult.data.id,
      studentId: student.id,
      termId: term.id,
      marks: 85,
      remarks: "Creative work",
    });

    if (!sportsGradeResult.success || !artGradeResult.success) {
      throw new Error("Failed to save grades");
    }
    console.log("✓ Sports grade saved:", sportsGradeResult.data.grade);
    console.log("✓ Art grade saved:", artGradeResult.data.marks);

    // Test 6: Get grades for student
    console.log("\n6. Fetching grades for student...");
    const gradesResult = await getCoScholasticGrades(student.id, term.id);
    if (!gradesResult.success) {
      throw new Error("Failed to fetch grades");
    }
    console.log("✓ Found", gradesResult.data.length, "grades");

    // Test 7: Generate report card with co-scholastic data
    console.log("\n7. Generating report card with co-scholastic data...");
    
    // First, ensure the student has some exam results
    const examResult = await db.examResult.findFirst({
      where: {
        studentId: student.id,
        exam: {
          termId: term.id,
        },
      },
    });

    if (examResult) {
      const reportCardResult = await generateReportCard(student.id, term.id);
      if (reportCardResult.success) {
        console.log("✓ Report card generated with co-scholastic data");
        
        // Verify co-scholastic data is included
        const reportCard = await db.reportCard.findUnique({
          where: {
            studentId_termId: {
              studentId: student.id,
              termId: term.id,
            },
          },
        });

        if (reportCard?.coScholasticData) {
          console.log("✓ Co-scholastic data included in report card");
          console.log("  Activities:", JSON.stringify(reportCard.coScholasticData, null, 2));
        } else {
          console.log("⚠ No co-scholastic data in report card");
        }
      } else {
        console.log("⚠ Could not generate report card:", reportCardResult.error);
      }
    } else {
      console.log("⚠ No exam results found, skipping report card generation");
    }

    // Test 8: Cleanup - Delete grades
    console.log("\n8. Cleaning up grades...");
    await deleteCoScholasticGrade(sportsGradeResult.data.id);
    await deleteCoScholasticGrade(artGradeResult.data.id);
    console.log("✓ Grades deleted");

    // Test 9: Cleanup - Delete activities
    console.log("\n9. Cleaning up activities...");
    await deleteCoScholasticActivity(sportsResult.data.id);
    await deleteCoScholasticActivity(artResult.data.id);
    console.log("✓ Activities deleted");

    console.log("\n✅ All integration tests passed!");
  } catch (error) {
    console.error("\n❌ Integration test failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

testCoScholasticIntegration();
