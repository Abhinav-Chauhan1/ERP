import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportMarksToFile, type ExportMarksInput } from "../exportMarksActions";

// Mock dependencies
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => ({ userId: "test-clerk-id" })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    exam: {
      findUnique: vi.fn(),
    },
    examResult: {
      findMany: vi.fn(),
    },
    class: {
      findUnique: vi.fn(),
    },
    section: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Export Marks Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportMarksToFile", () => {
    it("should export marks to CSV format with all required fields", async () => {
      const { db } = await import("@/lib/db");

      // Mock user
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-1",
      } as any);

      // Mock exam
      vi.mocked(db.exam.findUnique).mockResolvedValue({
        id: "exam-1",
        title: "Mid Term Exam",
        totalMarks: 100,
        subjectId: "subject-1",
        subject: { name: "Mathematics" },
        examType: { name: "Mid Term" },
        term: {
          name: "Term 1",
          academicYear: { name: "2024-2025" },
        },
        subjectMarkConfig: [],
      } as any);

      // Mock class and section lookups
      vi.mocked(db.class.findUnique).mockResolvedValue({
        id: "class-1",
        name: "Grade 10",
      } as any);

      vi.mocked(db.section.findUnique).mockResolvedValue({
        id: "section-1",
        name: "A",
      } as any);

      // Mock exam results
      vi.mocked(db.examResult.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          theoryMarks: 45,
          practicalMarks: 20,
          internalMarks: 10,
          totalMarks: 75,
          percentage: 75,
          grade: "B+",
          isAbsent: false,
          remarks: "Good performance",
          student: {
            rollNumber: "001",
            user: {
              firstName: "John",
              lastName: "Doe",
            },
          },
        },
        {
          studentId: "student-2",
          theoryMarks: null,
          practicalMarks: null,
          internalMarks: null,
          totalMarks: null,
          percentage: null,
          grade: null,
          isAbsent: true,
          remarks: null,
          student: {
            rollNumber: "002",
            user: {
              firstName: "Jane",
              lastName: "Smith",
            },
          },
        },
      ] as any);

      const input: ExportMarksInput = {
        examId: "exam-1",
        format: "csv",
      };

      const result = await exportMarksToFile(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.filename).toContain(".csv");
      expect(result.data?.mimeType).toBe("text/csv");

      // Verify CSV content includes headers
      const csvContent = result.data?.content || "";
      expect(csvContent).toContain("Student ID");
      expect(csvContent).toContain("Roll Number");
      expect(csvContent).toContain("Student Name");
      expect(csvContent).toContain("Theory Marks");
      expect(csvContent).toContain("Practical Marks");
      expect(csvContent).toContain("Internal Marks");
      expect(csvContent).toContain("Total Marks");
      expect(csvContent).toContain("Percentage");
      expect(csvContent).toContain("Grade");
      expect(csvContent).toContain("Status");
      expect(csvContent).toContain("Remarks");

      // Verify student data is included
      expect(csvContent).toContain("student-1");
      expect(csvContent).toContain("001");
      expect(csvContent).toContain("John Doe");
      expect(csvContent).toContain("45");
      expect(csvContent).toContain("75");
      expect(csvContent).toContain("B+");
      expect(csvContent).toContain("Present");

      // Verify absent student
      expect(csvContent).toContain("student-2");
      expect(csvContent).toContain("002");
      expect(csvContent).toContain("Jane Smith");
      expect(csvContent).toContain("Absent");
    });

    it("should export marks to Excel format with metadata", async () => {
      const { db } = await import("@/lib/db");

      // Mock user
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-1",
      } as any);

      // Mock exam
      vi.mocked(db.exam.findUnique).mockResolvedValue({
        id: "exam-1",
        title: "Final Exam",
        totalMarks: 100,
        subjectId: "subject-1",
        subject: { name: "Physics" },
        examType: { name: "Final" },
        term: {
          name: "Term 2",
          academicYear: { name: "2024-2025" },
        },
        subjectMarkConfig: [],
      } as any);

      // Mock class and section lookups
      vi.mocked(db.class.findUnique).mockResolvedValue({
        id: "class-1",
        name: "Grade 12",
      } as any);

      vi.mocked(db.section.findUnique).mockResolvedValue({
        id: "section-1",
        name: "Science",
      } as any);

      // Mock exam results
      vi.mocked(db.examResult.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          theoryMarks: 80,
          practicalMarks: 18,
          internalMarks: 10,
          totalMarks: 108,
          percentage: 90,
          grade: "A+",
          isAbsent: false,
          remarks: "Excellent",
          student: {
            rollNumber: "101",
            user: {
              firstName: "Alice",
              lastName: "Johnson",
            },
          },
        },
      ] as any);

      const input: ExportMarksInput = {
        examId: "exam-1",
        classId: "class-1",
        sectionId: "section-1",
        format: "excel",
      };

      const result = await exportMarksToFile(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.filename).toContain(".xlsx");
      expect(result.data?.mimeType).toBe("application/json");

      // Parse the JSON content
      const jsonData = JSON.parse(result.data?.content || "{}");

      // Verify metadata
      expect(jsonData.metadata).toBeDefined();
      expect(jsonData.metadata.examName).toContain("Physics");
      expect(jsonData.metadata.class).toBe("Grade 12");
      expect(jsonData.metadata.section).toBe("Science");
      expect(jsonData.metadata.term).toBe("Term 2");
      expect(jsonData.metadata.academicYear).toBe("2024-2025");
      expect(jsonData.metadata.totalMarks).toBe(100);

      // Verify data
      expect(jsonData.data).toHaveLength(1);
      expect(jsonData.data[0].studentId).toBe("student-1");
      expect(jsonData.data[0].rollNumber).toBe("101");
      expect(jsonData.data[0].studentName).toBe("Alice Johnson");
      expect(jsonData.data[0].theoryMarks).toBe(80);
      expect(jsonData.data[0].practicalMarks).toBe(18);
      expect(jsonData.data[0].totalMarks).toBe(108);
      expect(jsonData.data[0].grade).toBe("A+");
    });

    it("should filter by class and section when provided", async () => {
      const { db } = await import("@/lib/db");

      // Mock user
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-1",
      } as any);

      // Mock exam
      vi.mocked(db.exam.findUnique).mockResolvedValue({
        id: "exam-1",
        title: "Test Exam",
        totalMarks: 50,
        subjectId: "subject-1",
        subject: { name: "Chemistry" },
        examType: { name: "Unit Test" },
        term: {
          name: "Term 1",
          academicYear: { name: "2024-2025" },
        },
        subjectMarkConfig: [],
      } as any);

      // Mock exam results
      vi.mocked(db.examResult.findMany).mockResolvedValue([]);

      const input: ExportMarksInput = {
        examId: "exam-1",
        classId: "class-1",
        sectionId: "section-1",
        format: "csv",
      };

      await exportMarksToFile(input);

      // Verify that findMany was called with correct filters
      expect(db.examResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            examId: "exam-1",
            student: {
              enrollments: {
                some: {
                  classId: "class-1",
                  sectionId: "section-1",
                  status: "ACTIVE",
                },
              },
            },
          }),
        })
      );
    });

    it("should handle unauthorized access", async () => {
      const { auth } = await import("@clerk/nextjs/server");

      // Mock unauthorized user
      vi.mocked(auth).mockReturnValue({ userId: null } as any);

      const input: ExportMarksInput = {
        examId: "exam-1",
        format: "csv",
      };

      const result = await exportMarksToFile(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should handle exam not found", async () => {
      const { db } = await import("@/lib/db");
      const { auth } = await import("@clerk/nextjs/server");

      // Reset auth mock
      vi.mocked(auth).mockReturnValue({ userId: "test-clerk-id" } as any);

      // Mock user
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-1",
      } as any);

      // Mock exam not found
      vi.mocked(db.exam.findUnique).mockResolvedValue(null);

      const input: ExportMarksInput = {
        examId: "non-existent-exam",
        format: "csv",
      };

      const result = await exportMarksToFile(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Exam not found");
    });

    it("should properly escape CSV special characters", async () => {
      const { db } = await import("@/lib/db");

      // Mock user
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-1",
      } as any);

      // Mock exam
      vi.mocked(db.exam.findUnique).mockResolvedValue({
        id: "exam-1",
        title: "Test Exam",
        totalMarks: 100,
        subjectId: "subject-1",
        subject: { name: "English" },
        examType: { name: "Test" },
        term: {
          name: "Term 1",
          academicYear: { name: "2024-2025" },
        },
        subjectMarkConfig: [],
      } as any);

      // Mock class and section lookups
      vi.mocked(db.class.findUnique).mockResolvedValue({
        id: "class-1",
        name: "Grade 10",
      } as any);

      vi.mocked(db.section.findUnique).mockResolvedValue({
        id: "section-1",
        name: "A",
      } as any);

      // Mock exam results with special characters
      vi.mocked(db.examResult.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          theoryMarks: 85,
          practicalMarks: null,
          internalMarks: null,
          totalMarks: 85,
          percentage: 85,
          grade: "A",
          isAbsent: false,
          remarks: 'Good work, needs improvement in "essay writing"',
          student: {
            rollNumber: "001",
            user: {
              firstName: "O'Brien",
              lastName: "Smith, Jr.",
            },
          },
        },
      ] as any);

      const input: ExportMarksInput = {
        examId: "exam-1",
        classId: "class-1",
        sectionId: "section-1",
        format: "csv",
      };

      const result = await exportMarksToFile(input);

      expect(result.success).toBe(true);

      const csvContent = result.data?.content || "";

      // Verify special characters are properly escaped
      // The full name is combined and escaped as one field
      expect(csvContent).toContain('"O\'Brien Smith, Jr."');
      expect(csvContent).toContain('""essay writing""'); // Quotes should be doubled
    });
  });
});
