import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionType, Difficulty } from '@prisma/client';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    teacher: {
      findUnique: vi.fn(),
    },
    questionBank: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
    subject: {
      findMany: vi.fn(),
    },
  },
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Question Bank Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Question Type Validation', () => {
    it('should validate MCQ questions have at least 2 options', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');

      // Mock teacher exists
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      const result = await createQuestion({
        question: 'What is 2+2?',
        questionType: 'MCQ' as QuestionType,
        options: ['4'], // Only 1 option - should fail
        correctAnswer: '4',
        marks: 1,
        subjectId: 'subject-1',
        difficulty: 'EASY' as Difficulty,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 options');
    });

    it('should validate MCQ questions have a correct answer', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      const result = await createQuestion({
        question: 'What is 2+2?',
        questionType: 'MCQ' as QuestionType,
        options: ['3', '4', '5'],
        correctAnswer: '', // Empty correct answer - should fail
        marks: 1,
        subjectId: 'subject-1',
        difficulty: 'EASY' as Difficulty,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('correct answer');
    });

    it('should validate TRUE_FALSE questions have TRUE or FALSE as answer', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      const result = await createQuestion({
        question: 'The sky is blue',
        questionType: 'TRUE_FALSE' as QuestionType,
        correctAnswer: 'Yes', // Invalid answer - should fail
        marks: 1,
        subjectId: 'subject-1',
        difficulty: 'EASY' as Difficulty,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('TRUE or FALSE');
    });

    it('should successfully create a valid MCQ question', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      const mockQuestion = {
        id: 'question-1',
        question: 'What is 2+2?',
        questionType: 'MCQ',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        marks: 1,
        subjectId: 'subject-1',
        topic: null,
        difficulty: 'EASY',
        createdBy: 'teacher-1',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { id: 'subject-1', name: 'Math' },
        teacher: {
          id: 'teacher-1',
          user: { id: 'test-user-id', name: 'Test Teacher' },
        },
      };

      vi.mocked(prisma.questionBank.create).mockResolvedValue(mockQuestion as any);

      const result = await createQuestion({
        question: 'What is 2+2?',
        questionType: 'MCQ' as QuestionType,
        options: ['3', '4', '5'],
        correctAnswer: '4',
        marks: 1,
        subjectId: 'subject-1',
        difficulty: 'EASY' as Difficulty,
      });

      expect(result.success).toBe(true);
      expect(result.question).toBeDefined();
      expect(prisma.questionBank.create).toHaveBeenCalled();
    });

    it('should successfully create a valid TRUE_FALSE question', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      const mockQuestion = {
        id: 'question-2',
        question: 'The sky is blue',
        questionType: 'TRUE_FALSE',
        options: null,
        correctAnswer: 'TRUE',
        marks: 1,
        subjectId: 'subject-1',
        topic: null,
        difficulty: 'EASY',
        createdBy: 'teacher-1',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { id: 'subject-1', name: 'Science' },
        teacher: {
          id: 'teacher-1',
          user: { id: 'test-user-id', name: 'Test Teacher' },
        },
      };

      vi.mocked(prisma.questionBank.create).mockResolvedValue(mockQuestion as any);

      const result = await createQuestion({
        question: 'The sky is blue',
        questionType: 'TRUE_FALSE' as QuestionType,
        correctAnswer: 'TRUE',
        marks: 1,
        subjectId: 'subject-1',
        difficulty: 'EASY' as Difficulty,
      });

      expect(result.success).toBe(true);
      expect(result.question).toBeDefined();
      expect(prisma.questionBank.create).toHaveBeenCalled();
    });

    it('should successfully create an ESSAY question without correct answer', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      const mockQuestion = {
        id: 'question-3',
        question: 'Explain photosynthesis',
        questionType: 'ESSAY',
        options: null,
        correctAnswer: null,
        marks: 10,
        subjectId: 'subject-1',
        topic: 'Biology',
        difficulty: 'MEDIUM',
        createdBy: 'teacher-1',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { id: 'subject-1', name: 'Biology' },
        teacher: {
          id: 'teacher-1',
          user: { id: 'test-user-id', name: 'Test Teacher' },
        },
      };

      vi.mocked(prisma.questionBank.create).mockResolvedValue(mockQuestion as any);

      const result = await createQuestion({
        question: 'Explain photosynthesis',
        questionType: 'ESSAY' as QuestionType,
        marks: 10,
        subjectId: 'subject-1',
        topic: 'Biology',
        difficulty: 'MEDIUM' as Difficulty,
      });

      expect(result.success).toBe(true);
      expect(result.question).toBeDefined();
      expect(prisma.questionBank.create).toHaveBeenCalled();
    });
  });

  describe('Question Categorization', () => {
    it('should support categorization by subject, topic, and difficulty', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      const mockQuestion = {
        id: 'question-4',
        question: 'What is algebra?',
        questionType: 'ESSAY',
        options: null,
        correctAnswer: null,
        marks: 5,
        subjectId: 'math-subject',
        topic: 'Algebra',
        difficulty: 'HARD',
        createdBy: 'teacher-1',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { id: 'math-subject', name: 'Mathematics' },
        teacher: {
          id: 'teacher-1',
          user: { id: 'test-user-id', name: 'Test Teacher' },
        },
      };

      vi.mocked(prisma.questionBank.create).mockResolvedValue(mockQuestion as any);

      const result = await createQuestion({
        question: 'What is algebra?',
        questionType: 'ESSAY' as QuestionType,
        marks: 5,
        subjectId: 'math-subject',
        topic: 'Algebra',
        difficulty: 'HARD' as Difficulty,
      });

      expect(result.success).toBe(true);
      expect(result.question?.topic).toBe('Algebra');
      expect(result.question?.difficulty).toBe('HARD');
      expect(result.question?.subjectId).toBe('math-subject');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthorized users', async () => {
      const { createQuestion } = await import('./questionBankActions');
      const { auth } = await import('@clerk/nextjs/server');

      // Mock unauthorized user
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await createQuestion({
        question: 'Test question',
        questionType: 'MCQ' as QuestionType,
        options: ['A', 'B'],
        correctAnswer: 'A',
        marks: 1,
        subjectId: 'subject-1',
        difficulty: 'EASY' as Difficulty,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should only allow teachers to update their own questions', async () => {
      const { updateQuestion } = await import('./questionBankActions');
      const { prisma } = await import('@/lib/db');
      const { auth } = await import('@clerk/nextjs/server');

      // Ensure auth returns valid user
      vi.mocked(auth).mockResolvedValue({ userId: 'test-user-id' } as any);

      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 'teacher-1',
        userId: 'test-user-id',
      } as any);

      // Mock question belonging to different teacher
      vi.mocked(prisma.questionBank.findUnique).mockResolvedValue({
        id: 'question-1',
        createdBy: 'teacher-2', // Different teacher
      } as any);

      const result = await updateQuestion('question-1', {
        question: 'Updated question',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('your own questions');
    });
  });
});
