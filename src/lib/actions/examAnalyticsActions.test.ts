import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExamAnalytics, getQuestionWiseAnalysis } from "./examAnalyticsActions";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => Promise.resolve({ userId: "test-user-id" })),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    teacher: {
      findUnique: vi.fn(),
    },
    onlineExam: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    questionBank: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("Exam Analytics Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getExamAnalytics", () => {
    it("should return error when user is not authenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const result = await getExamAnalytics("exam-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error when teacher is not found", async () => {
      const { prisma } = await import("@/lib/db");
      vi.mocked(prisma.teacher.findUnique).mockResolvedValueOnce(null);

      const result = await getExamAnalytics("exam-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Teacher not found");
    });

    it("should return error when exam is not found", async () => {
      const { prisma } = await import("@/lib/db");
      vi.mocked(prisma.teacher.findUnique).mockResolvedValueOnce({
        id: "teacher-id",
        userId: "test-user-id",
      } as any);
      vi.mocked(prisma.onlineExam.findUnique).mockResolvedValueOnce(null);

      const result = await getExamAnalytics("exam-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Exam not found");
    });

    it("should return error when teacher does not own the exam", async () => {
      const { prisma } = await import("@/lib/db");
      vi.mocked(prisma.teacher.findUnique).mockResolvedValueOnce({
        id: "teacher-id",
        userId: "test-user-id",
      } as any);
      vi.mocked(prisma.onlineExam.findUnique).mockResolvedValueOnce({
        id: "exam-id",
        createdBy: "different-teacher-id",
        attempts: [],
      } as any);

      const result = await getExamAnalytics("exam-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized to view this exam's analytics");
    });

    it("should calculate overall statistics correctly", async () => {
      const { prisma } = await import("@/lib/db");
      
      const mockTeacher = {
        id: "teacher-id",
        userId: "test-user-id",
      };

      const mockExam = {
        id: "exam-id",
        title: "Test Exam",
        totalMarks: 100,
        duration: 60,
        questions: ["q1", "q2"],
        createdBy: "teacher-id",
        subject: { name: "Math" },
        class: { name: "Grade 10" },
        attempts: [
          {
            id: "attempt-1",
            studentId: "student-1",
            score: 80,
            status: "SUBMITTED",
            answers: { q1: "A", q2: "B" },
            startedAt: new Date("2024-01-01T10:00:00"),
            submittedAt: new Date("2024-01-01T11:00:00"),
            student: {
              user: { firstName: "John", lastName: "Doe" },
            },
          },
          {
            id: "attempt-2",
            studentId: "student-2",
            score: 60,
            status: "GRADED",
            answers: { q1: "A", q2: "C" },
            startedAt: new Date("2024-01-01T10:00:00"),
            submittedAt: new Date("2024-01-01T11:00:00"),
            student: {
              user: { firstName: "Jane", lastName: "Smith" },
            },
          },
          {
            id: "attempt-3",
            studentId: "student-3",
            score: null,
            status: "IN_PROGRESS",
            answers: {},
            startedAt: new Date("2024-01-01T10:00:00"),
            submittedAt: null,
            student: {
              user: { firstName: "Bob", lastName: "Johnson" },
            },
          },
        ],
      };

      const mockQuestions = [
        {
          id: "q1",
          question: "What is 2+2?",
          questionType: "MCQ",
          marks: 50,
          difficulty: "EASY",
          topic: "Arithmetic",
          correctAnswer: "A",
          options: ["4", "5", "6"],
        },
        {
          id: "q2",
          question: "What is 3+3?",
          questionType: "MCQ",
          marks: 50,
          difficulty: "MEDIUM",
          topic: "Arithmetic",
          correctAnswer: "B",
          options: ["5", "6", "7"],
        },
      ];

      vi.mocked(prisma.teacher.findUnique).mockResolvedValueOnce(mockTeacher as any);
      vi.mocked(prisma.onlineExam.findUnique).mockResolvedValueOnce(mockExam as any);
      vi.mocked(prisma.questionBank.findMany).mockResolvedValueOnce(mockQuestions as any);

      const result = await getExamAnalytics("exam-id");

      expect(result.success).toBe(true);
      expect(result.analytics).toBeDefined();
      expect(result.analytics.overallStats.totalAttempts).toBe(3);
      expect(result.analytics.overallStats.completedAttempts).toBe(2);
      expect(result.analytics.overallStats.averageScore).toBe(70); // (80 + 60) / 2
      expect(result.analytics.overallStats.highestScore).toBe(80);
      expect(result.analytics.overallStats.lowestScore).toBe(60);
    });

    it("should identify difficult questions correctly", async () => {
      const { prisma } = await import("@/lib/db");
      
      const mockTeacher = {
        id: "teacher-id",
        userId: "test-user-id",
      };

      const mockExam = {
        id: "exam-id",
        title: "Test Exam",
        totalMarks: 100,
        duration: 60,
        questions: ["q1", "q2"],
        createdBy: "teacher-id",
        subject: { name: "Math" },
        class: { name: "Grade 10" },
        attempts: [
          {
            id: "attempt-1",
            studentId: "student-1",
            score: 50,
            status: "SUBMITTED",
            answers: { q1: "A", q2: "C" }, // q1 correct, q2 incorrect
            startedAt: new Date(),
            submittedAt: new Date(),
            student: {
              user: { firstName: "John", lastName: "Doe" },
            },
          },
          {
            id: "attempt-2",
            studentId: "student-2",
            score: 50,
            status: "SUBMITTED",
            answers: { q1: "A", q2: "C" }, // q1 correct, q2 incorrect
            startedAt: new Date(),
            submittedAt: new Date(),
            student: {
              user: { firstName: "Jane", lastName: "Smith" },
            },
          },
          {
            id: "attempt-3",
            studentId: "student-3",
            score: 50,
            status: "SUBMITTED",
            answers: { q1: "A", q2: "C" }, // q1 correct, q2 incorrect
            startedAt: new Date(),
            submittedAt: new Date(),
            student: {
              user: { firstName: "Bob", lastName: "Johnson" },
            },
          },
        ],
      };

      const mockQuestions = [
        {
          id: "q1",
          question: "Easy question",
          questionType: "MCQ",
          marks: 50,
          difficulty: "EASY",
          topic: "Topic A",
          correctAnswer: "A",
        },
        {
          id: "q2",
          question: "Hard question",
          questionType: "MCQ",
          marks: 50,
          difficulty: "HARD",
          topic: "Topic B",
          correctAnswer: "B",
        },
      ];

      vi.mocked(prisma.teacher.findUnique).mockResolvedValueOnce(mockTeacher as any);
      vi.mocked(prisma.onlineExam.findUnique).mockResolvedValueOnce(mockExam as any);
      vi.mocked(prisma.questionBank.findMany).mockResolvedValueOnce(mockQuestions as any);

      const result = await getExamAnalytics("exam-id");

      expect(result.success).toBe(true);
      expect(result.analytics.difficultQuestions).toBeDefined();
      expect(result.analytics.difficultQuestions.length).toBeGreaterThan(0);
      
      // q2 should be identified as difficult (0% success rate)
      const difficultQuestion = result.analytics.difficultQuestions.find(
        (q: any) => q.questionId === "q2"
      );
      expect(difficultQuestion).toBeDefined();
      expect(difficultQuestion.successRate).toBe(0);
    });
  });

  describe("getQuestionWiseAnalysis", () => {
    it("should return error when user is not authenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const result = await getQuestionWiseAnalysis("exam-id", "question-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should analyze MCQ option distribution correctly", async () => {
      const { prisma } = await import("@/lib/db");
      
      const mockTeacher = {
        id: "teacher-id",
        userId: "test-user-id",
      };

      const mockExam = {
        id: "exam-id",
        createdBy: "teacher-id",
        attempts: [
          {
            id: "attempt-1",
            studentId: "student-1",
            answers: { "q1": "A" },
            student: { user: { firstName: "John", lastName: "Doe" } },
          },
          {
            id: "attempt-2",
            studentId: "student-2",
            answers: { "q1": "A" },
            student: { user: { firstName: "Jane", lastName: "Smith" } },
          },
          {
            id: "attempt-3",
            studentId: "student-3",
            answers: { "q1": "B" },
            student: { user: { firstName: "Bob", lastName: "Johnson" } },
          },
        ],
      };

      const mockQuestion = {
        id: "q1",
        question: "What is 2+2?",
        questionType: "MCQ",
        marks: 10,
        difficulty: "EASY",
        topic: "Arithmetic",
        correctAnswer: "A",
        options: ["4", "5", "6"],
      };

      vi.mocked(prisma.teacher.findUnique).mockResolvedValueOnce(mockTeacher as any);
      vi.mocked(prisma.onlineExam.findUnique).mockResolvedValueOnce(mockExam as any);
      vi.mocked(prisma.questionBank.findUnique).mockResolvedValueOnce(mockQuestion as any);

      const result = await getQuestionWiseAnalysis("exam-id", "q1");

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.totalResponses).toBe(3);
      expect(result.analysis.correctResponses).toBe(2);
      expect(result.analysis.incorrectResponses).toBe(1);
      expect(result.analysis.optionAnalysis).toBeDefined();
      expect(result.analysis.optionAnalysis.length).toBe(3);
    });
  });
});
