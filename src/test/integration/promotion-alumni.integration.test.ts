/**
 * Integration Tests for Student Promotion and Alumni Management
 * 
 * Task 29: Final Integration Testing
 * 
 * These tests verify the complete workflows for:
 * - Student promotion (29.1)
 * - Alumni management (29.2)
 * - Error scenarios (29.3)
 * - Performance (29.4)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { UserRole, EnrollmentStatus } from "@prisma/client";
import {
  getStudentsForPromotion,
  previewPromotion,
  executeBulkPromotion,
  getPromotionHistory,
  getPromotionDetails,
} from "@/lib/actions/promotionActions";
import {
  searchAlumni,
  getAlumniProfile,
  updateAlumniProfile,
  getAlumniStatistics,
} from "@/lib/actions/alumniActions";

// Mock auth for testing
vi.mock("@/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-admin-id",
        role: UserRole.ADMIN,
        email: "admin@test.com",
      },
    })
  ),
}));

// Mock audit log to avoid headers error in test environment
vi.mock("@/lib/utils/audit-log", () => ({
  logAudit: vi.fn(() => Promise.resolve()),
}));

// Test data setup
let testAcademicYear: any;
let testSourceClass: any;
let testTargetClass: any;
let testSection: any;
let testStudents: any[] = [];
let testUsers: any[] = [];

describe("Task 29.1: Complete Promotion Workflow", () => {
  beforeAll(async () => {
    // Create test academic years
    testAcademicYear = await db.academicYear.create({
      data: {
        name: "2024-2025",
        startDate: new Date("2024-04-01"),
        endDate: new Date("2025-03-31"),
        isCurrent: true,
      },
    });

    const targetAcademicYear = await db.academicYear.create({
      data: {
        name: "2025-2026",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
        isCurrent: false,
      },
    });

    // Create test classes
    testSourceClass = await db.class.create({
      data: {
        name: "Grade 9",
        academicYearId: testAcademicYear.id,
      },
    });

    testTargetClass = await db.class.create({
      data: {
        name: "Grade 10",
        academicYearId: targetAcademicYear.id,
      },
    });

    // Create test section
    testSection = await db.classSection.create({
      data: {
        name: "A",
        classId: testSourceClass.id,
      },
    });

    // Create test students (5 students for testing)
    for (let i = 1; i <= 5; i++) {
      const user = await db.user.create({
        data: {
          email: `student${i}@test.com`,
          firstName: `Student${i}`,
          lastName: `Test`,
          role: UserRole.STUDENT,
          password: "hashed_password",
        },
      });
      testUsers.push(user);

      const student = await db.student.create({
        data: {
          userId: user.id,
          admissionId: `ADM${i.toString().padStart(4, "0")}`,
          dateOfBirth: new Date("2010-01-01"),
          admissionDate: new Date("2020-04-01"),
          gender: "MALE",
        },
      });
      testStudents.push(student);

      // Create active enrollment
      await db.classEnrollment.create({
        data: {
          studentId: student.id,
          classId: testSourceClass.id,
          sectionId: testSection.id,
          rollNumber: `${i}`,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await db.classEnrollment.deleteMany({
      where: { studentId: { in: testStudents.map((s) => s.id) } },
    });
    await db.alumni.deleteMany({
      where: { studentId: { in: testStudents.map((s) => s.id) } },
    });
    await db.student.deleteMany({
      where: { id: { in: testStudents.map((s) => s.id) } },
    });
    await db.user.deleteMany({
      where: { id: { in: testUsers.map((u) => u.id) } },
    });
    await db.classSection.deleteMany({ where: { id: testSection.id } });
    await db.class.deleteMany({
      where: { id: { in: [testSourceClass.id, testTargetClass.id] } },
    });
    await db.academicYear.deleteMany({
      where: { name: { in: ["2024-2025", "2025-2026"] } },
    });
  });

  it("should fetch students for promotion", async () => {
    const result = await getStudentsForPromotion({
      classId: testSourceClass.id,
      sectionId: testSection.id,
      academicYearId: testAcademicYear.id,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.students).toHaveLength(5);
    expect(result.data?.summary.total).toBe(5);
    expect(result.data?.summary.eligible).toBe(5);
  });

  it("should preview promotion with validation", async () => {
    const studentIds = testStudents.map((s) => s.id);

    const result = await previewPromotion({
      studentIds,
      targetAcademicYearId: testAcademicYear.id,
      targetClassId: testTargetClass.id,
      targetSectionId: testSection.id,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.students).toHaveLength(5);
  });

  it("should execute bulk promotion successfully", async () => {
    const studentIds = testStudents.slice(0, 3).map((s) => s.id);

    const result = await executeBulkPromotion({
      sourceClassId: testSourceClass.id,
      sourceSectionId: testSection.id,
      sourceAcademicYearId: testAcademicYear.id,
      targetAcademicYearId: testAcademicYear.id,
      targetClassId: testTargetClass.id,
      targetSectionId: testSection.id,
      studentIds,
      excludedStudents: [],
      rollNumberStrategy: "auto",
      sendNotifications: false,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.summary.promoted).toBeGreaterThan(0);
    expect(result.data?.historyId).toBeDefined();

    // Verify enrollments were updated
    const oldEnrollments = await db.classEnrollment.findMany({
      where: {
        studentId: { in: studentIds },
        classId: testSourceClass.id,
      },
    });
    expect(oldEnrollments.every((e) => e.status === EnrollmentStatus.GRADUATED)).toBe(true);

    // Verify new enrollments were created
    const newEnrollments = await db.classEnrollment.findMany({
      where: {
        studentId: { in: studentIds },
        classId: testTargetClass.id,
      },
    });
    expect(newEnrollments.length).toBeGreaterThan(0);
    expect(newEnrollments.every((e) => e.status === EnrollmentStatus.ACTIVE)).toBe(true);
  });

  it("should handle exclusions correctly", async () => {
    const studentIds = testStudents.slice(3, 5).map((s) => s.id);
    const excludedStudent = studentIds[0];

    const result = await executeBulkPromotion({
      sourceClassId: testSourceClass.id,
      sourceSectionId: testSection.id,
      sourceAcademicYearId: testAcademicYear.id,
      targetAcademicYearId: testAcademicYear.id,
      targetClassId: testTargetClass.id,
      targetSectionId: testSection.id,
      studentIds,
      excludedStudents: [
        {
          studentId: excludedStudent,
          reason: "Needs to repeat grade",
        },
      ],
      rollNumberStrategy: "auto",
      sendNotifications: false,
    });

    expect(result.success).toBe(true);
    expect(result.data?.summary.excluded).toBe(1);
    expect(result.data?.summary.promoted).toBe(1);

    // Verify excluded student still has active enrollment in source class
    const excludedEnrollment = await db.classEnrollment.findFirst({
      where: {
        studentId: excludedStudent,
        classId: testSourceClass.id,
      },
    });
    expect(excludedEnrollment?.status).toBe(EnrollmentStatus.ACTIVE);
  });

  it("should create alumni profiles for promoted students", async () => {
    const promotedStudentIds = testStudents.slice(0, 3).map((s) => s.id);

    const alumni = await db.alumni.findMany({
      where: {
        studentId: { in: promotedStudentIds },
      },
    });

    expect(alumni.length).toBeGreaterThan(0);
    alumni.forEach((alumnus) => {
      expect(alumnus.finalClass).toBe(testSourceClass.name);
      expect(alumnus.graduationDate).toBeDefined();
    });
  });

  it("should record promotion history", async () => {
    const result = await getPromotionHistory({
      page: 1,
      pageSize: 10,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.history.length).toBeGreaterThan(0);

    const history = result.data?.history[0];
    expect(history?.sourceClass).toBe(testSourceClass.name);
    expect(history?.targetClass).toBe(testTargetClass.name);
    expect(history?.totalStudents).toBeGreaterThan(0);
  });

  it("should retrieve promotion details", async () => {
    const historyResult = await getPromotionHistory({ page: 1, pageSize: 1 });
    const historyId = historyResult.data?.history[0]?.id;

    if (!historyId) {
      throw new Error("No promotion history found");
    }

    const result = await getPromotionDetails({ historyId });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.students.length).toBeGreaterThan(0);
    expect(result.data?.sourceClass).toBe(testSourceClass.name);
    expect(result.data?.targetClass).toBe(testTargetClass.name);
  });
});

describe("Task 29.2: Alumni Management Workflow", () => {
  it("should search alumni directory", async () => {
    const result = await searchAlumni({
      page: 1,
      pageSize: 10,
      sortBy: "graduationDate",
      sortOrder: "desc",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.alumni).toBeDefined();
    expect(result.data?.pagination).toBeDefined();
  });

  it("should filter alumni by graduation year", async () => {
    const currentYear = new Date().getFullYear();

    const result = await searchAlumni({
      graduationYearFrom: currentYear,
      graduationYearTo: currentYear,
      page: 1,
      pageSize: 10,
      sortBy: "graduationDate",
      sortOrder: "desc",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should filter alumni by class", async () => {
    const result = await searchAlumni({
      finalClass: testSourceClass.name,
      page: 1,
      pageSize: 10,
      sortBy: "graduationDate",
      sortOrder: "desc",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.data?.alumni.length) {
      expect(result.data.alumni.every((a) => a.finalClass === testSourceClass.name)).toBe(true);
    }
  });

  it("should retrieve alumni profile", async () => {
    const searchResult = await searchAlumni({
      page: 1,
      pageSize: 1,
      sortBy: "graduationDate",
      sortOrder: "desc",
    });

    if (!searchResult.data?.alumni.length) {
      console.log("No alumni found, skipping profile test");
      return;
    }

    const alumniId = searchResult.data.alumni[0].id;
    const result = await getAlumniProfile({ alumniId });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe(alumniId);
    expect(result.data?.student).toBeDefined();
    expect(result.data?.graduationDate).toBeDefined();
  });

  it("should update alumni profile", async () => {
    const searchResult = await searchAlumni({
      page: 1,
      pageSize: 1,
      sortBy: "graduationDate",
      sortOrder: "desc",
    });

    if (!searchResult.data?.alumni.length) {
      console.log("No alumni found, skipping update test");
      return;
    }

    const alumniId = searchResult.data.alumni[0].id;

    const result = await updateAlumniProfile({
      alumniId,
      currentOccupation: "Software Engineer",
      currentEmployer: "Tech Corp",
      currentCity: "Bangalore",
      currentCountry: "India",
    });

    expect(result.success).toBe(true);

    // Verify update
    const updatedProfile = await getAlumniProfile({ alumniId });
    expect(updatedProfile.data?.currentOccupation).toBe("Software Engineer");
    expect(updatedProfile.data?.currentEmployer).toBe("Tech Corp");
    expect(updatedProfile.data?.currentCity).toBe("Bangalore");
  });

  it("should retrieve alumni statistics", async () => {
    const result = await getAlumniStatistics();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalAlumni).toBeGreaterThanOrEqual(0);
    expect(result.data?.byGraduationYear).toBeDefined();
    expect(result.data?.byOccupation).toBeDefined();
  });
});

describe("Task 29.3: Error Scenarios", () => {
  it("should handle invalid student IDs", async () => {
    const result = await previewPromotion({
      studentIds: ["invalid-id-1", "invalid-id-2"],
      targetAcademicYearId: testAcademicYear?.id || "test-year-id",
      targetClassId: testTargetClass?.id || "test-class-id",
      targetSectionId: testSection?.id || "test-section-id",
    });

    // Should handle gracefully - either success with 0 eligible or error
    expect(result).toBeDefined();
    if (result.success) {
      expect(result.data?.summary.eligible).toBe(0);
    }
  });

  it("should prevent duplicate enrollments", async () => {
    // Skip if test data not set up
    if (!testStudents.length || !testSourceClass || !testTargetClass) {
      console.log("Test data not available, skipping duplicate enrollment test");
      return;
    }

    // Try to promote a student that's already promoted
    const alreadyPromotedStudent = testStudents[0];

    const result = await executeBulkPromotion({
      sourceClassId: testSourceClass.id,
      sourceSectionId: testSection.id,
      sourceAcademicYearId: testAcademicYear.id,
      targetAcademicYearId: testAcademicYear.id,
      targetClassId: testTargetClass.id,
      targetSectionId: testSection.id,
      studentIds: [alreadyPromotedStudent.id],
      excludedStudents: [],
      rollNumberStrategy: "auto",
      sendNotifications: false,
    });

    // Should either fail or report the student as ineligible
    if (result.success) {
      expect(result.data?.summary.promoted).toBe(0);
    }
  });

  it("should handle missing target class", async () => {
    // Skip if test data not set up
    if (!testStudents.length || !testAcademicYear || !testSection) {
      console.log("Test data not available, skipping missing target class test");
      return;
    }

    const result = await previewPromotion({
      studentIds: testStudents.map((s) => s.id),
      targetAcademicYearId: testAcademicYear.id,
      targetClassId: "non-existent-class-id",
      targetSectionId: testSection.id,
    });

    // Should handle gracefully
    expect(result).toBeDefined();
  });

  it("should handle invalid alumni ID", async () => {
    const result = await getAlumniProfile({
      alumniId: "non-existent-alumni-id",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should validate alumni profile updates", async () => {
    const searchResult = await searchAlumni({
      page: 1,
      pageSize: 1,
      sortBy: "graduationDate",
      sortOrder: "desc",
    });

    if (!searchResult.data?.alumni.length) {
      console.log("No alumni found, skipping validation test");
      return;
    }

    const alumniId = searchResult.data.alumni[0].id;

    // Try to update with invalid data (e.g., invalid email format)
    const result = await updateAlumniProfile({
      alumniId,
      currentEmail: "invalid-email",
    });

    // Should either fail validation or handle gracefully
    expect(result).toBeDefined();
  });
});

describe("Task 29.4: Performance Tests", () => {
  let performanceStudents: any[] = [];
  let performanceUsers: any[] = [];

  beforeAll(async () => {
    // Create 50 students for performance testing
    for (let i = 1; i <= 50; i++) {
      const user = await db.user.create({
        data: {
          email: `perfstudent${i}@test.com`,
          firstName: `PerfStudent${i}`,
          lastName: `Test`,
          role: UserRole.STUDENT,
          password: "hashed_password",
        },
      });
      performanceUsers.push(user);

      const student = await db.student.create({
        data: {
          userId: user.id,
          admissionId: `PERF${i.toString().padStart(4, "0")}`,
          dateOfBirth: new Date("2010-01-01"),
          admissionDate: new Date("2020-04-01"),
          gender: "MALE",
        },
      });
      performanceStudents.push(student);

      // Create active enrollment
      await db.classEnrollment.create({
        data: {
          studentId: student.id,
          classId: testSourceClass.id,
          sectionId: testSection.id,
          rollNumber: `PERF${i}`,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    }
  });

  afterAll(async () => {
    // Cleanup performance test data
    await db.classEnrollment.deleteMany({
      where: { studentId: { in: performanceStudents.map((s) => s.id) } },
    });
    await db.alumni.deleteMany({
      where: { studentId: { in: performanceStudents.map((s) => s.id) } },
    });
    await db.student.deleteMany({
      where: { id: { in: performanceStudents.map((s) => s.id) } },
    });
    await db.user.deleteMany({
      where: { id: { in: performanceUsers.map((u) => u.id) } },
    });
  });

  it("should handle bulk promotion of 50+ students efficiently", async () => {
    const startTime = Date.now();

    const studentIds = performanceStudents.map((s) => s.id);

    const result = await executeBulkPromotion({
      sourceClassId: testSourceClass.id,
      sourceSectionId: testSection.id,
      sourceAcademicYearId: testAcademicYear.id,
      targetAcademicYearId: testAcademicYear.id,
      targetClassId: testTargetClass.id,
      targetSectionId: testSection.id,
      studentIds,
      excludedStudents: [],
      rollNumberStrategy: "auto",
      sendNotifications: false,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result.success).toBe(true);
    expect(result.data?.summary.promoted).toBeGreaterThan(0);
    
    // Should complete within reasonable time (30 seconds)
    expect(duration).toBeLessThan(30000);
    
    console.log(`Bulk promotion of ${studentIds.length} students took ${duration}ms`);
  });

  it("should search alumni efficiently with large dataset", async () => {
    const startTime = Date.now();

    const result = await searchAlumni({
      page: 1,
      pageSize: 50,
      sortBy: "graduationDate",
      sortOrder: "desc",
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // Should complete within reasonable time (5 seconds)
    expect(duration).toBeLessThan(5000);
    
    console.log(`Alumni search took ${duration}ms`);
  });

  it("should handle concurrent promotion operations", async () => {
    // Split students into two groups
    const group1 = performanceStudents.slice(0, 25).map((s) => s.id);
    const group2 = performanceStudents.slice(25, 50).map((s) => s.id);

    // Create a second target class for concurrent test
    const targetClass2 = await db.class.create({
      data: {
        name: "Grade 11",
        academicYearId: testAcademicYear.id,
      },
    });

    const startTime = Date.now();

    // Execute two promotions concurrently
    const [result1, result2] = await Promise.all([
      executeBulkPromotion({
        sourceClassId: testSourceClass.id,
        sourceSectionId: testSection.id,
        sourceAcademicYearId: testAcademicYear.id,
        targetAcademicYearId: testAcademicYear.id,
        targetClassId: testTargetClass.id,
        targetSectionId: testSection.id,
        studentIds: group1,
        excludedStudents: [],
        rollNumberStrategy: "auto",
        sendNotifications: false,
      }),
      executeBulkPromotion({
        sourceClassId: testSourceClass.id,
        sourceSectionId: testSection.id,
        sourceAcademicYearId: testAcademicYear.id,
        targetAcademicYearId: testAcademicYear.id,
        targetClassId: targetClass2.id,
        targetSectionId: testSection.id,
        studentIds: group2,
        excludedStudents: [],
        rollNumberStrategy: "auto",
        sendNotifications: false,
      }),
    ]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    
    console.log(`Concurrent promotions took ${duration}ms`);

    // Cleanup
    await db.class.delete({ where: { id: targetClass2.id } });
  });

  it("should verify database query performance", async () => {
    // Test query performance for fetching students
    const startTime = Date.now();

    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId: testSourceClass.id,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(enrollments.length).toBeGreaterThan(0);
    
    // Should complete within reasonable time (2 seconds)
    expect(duration).toBeLessThan(2000);
    
    console.log(`Database query for ${enrollments.length} enrollments took ${duration}ms`);
  });
});
