import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publishReportCard, batchPublishReportCards } from '../reportCardsActions';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
  currentUser: vi.fn(() => ({ id: 'test-clerk-id' })),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    reportCard: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

describe('Report Card Publishing Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('publishReportCard', () => {
    it('should successfully publish a draft report card', async () => {
      const { db } = await import('@/lib/db');
      
      const mockReportCard = {
        id: 'report-1',
        studentId: 'student-1',
        termId: 'term-1',
        isPublished: false,
        student: {
          userId: 'user-1',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          parents: [
            {
              parent: {
                userId: 'parent-1',
                user: {
                  firstName: 'Jane',
                  lastName: 'Doe',
                  email: 'jane@example.com',
                },
              },
            },
          ],
        },
        term: {
          name: 'First Term',
          academicYear: {
            name: '2024-2025',
          },
        },
      };

      const updatedReportCard = {
        ...mockReportCard,
        isPublished: true,
        publishDate: new Date(),
      };

      vi.mocked(db.reportCard.findUnique).mockResolvedValue(mockReportCard as any);
      vi.mocked(db.reportCard.update).mockResolvedValue(updatedReportCard as any);
      vi.mocked(db.notification.create).mockResolvedValue({} as any);

      const result = await publishReportCard({
        id: 'report-1',
        sendNotification: true,
      });

      expect(result.success).toBe(true);
      expect(db.reportCard.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: {
          isPublished: true,
          publishDate: expect.any(Date),
        },
      });
      
      // Should create notification for student
      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            title: 'Report Card Published',
            type: 'ACADEMIC',
          }),
        })
      );
      
      // Should create notification for parent
      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'parent-1',
            title: 'Report Card Published',
            type: 'ACADEMIC',
          }),
        })
      );
    });

    it('should fail if report card is already published', async () => {
      const { db } = await import('@/lib/db');
      
      const mockReportCard = {
        id: 'report-1',
        isPublished: true,
        publishDate: new Date(),
        student: {
          userId: 'user-1',
          user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          parents: [],
        },
        term: {
          name: 'First Term',
          academicYear: { name: '2024-2025' },
        },
      };

      vi.mocked(db.reportCard.findUnique).mockResolvedValue(mockReportCard as any);

      const result = await publishReportCard({
        id: 'report-1',
        sendNotification: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Report card is already published');
      expect(db.reportCard.update).not.toHaveBeenCalled();
    });

    it('should fail if report card is not found', async () => {
      const { db } = await import('@/lib/db');
      
      vi.mocked(db.reportCard.findUnique).mockResolvedValue(null);

      const result = await publishReportCard({
        id: 'non-existent',
        sendNotification: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Report card not found');
    });

    it('should publish without sending notifications when sendNotification is false', async () => {
      const { db } = await import('@/lib/db');
      
      const mockReportCard = {
        id: 'report-1',
        isPublished: false,
        student: {
          userId: 'user-1',
          user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          parents: [],
        },
        term: {
          name: 'First Term',
          academicYear: { name: '2024-2025' },
        },
      };

      vi.mocked(db.reportCard.findUnique).mockResolvedValue(mockReportCard as any);
      vi.mocked(db.reportCard.update).mockResolvedValue({ ...mockReportCard, isPublished: true } as any);

      const result = await publishReportCard({
        id: 'report-1',
        sendNotification: false,
      });

      expect(result.success).toBe(true);
      expect(db.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('batchPublishReportCards', () => {
    it('should publish multiple report cards successfully', async () => {
      const { db } = await import('@/lib/db');
      
      const mockReportCard1 = {
        id: 'report-1',
        isPublished: false,
        student: {
          userId: 'user-1',
          user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          parents: [],
        },
        term: {
          name: 'First Term',
          academicYear: { name: '2024-2025' },
        },
      };

      const mockReportCard2 = {
        id: 'report-2',
        isPublished: false,
        student: {
          userId: 'user-2',
          user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
          parents: [],
        },
        term: {
          name: 'First Term',
          academicYear: { name: '2024-2025' },
        },
      };

      vi.mocked(db.reportCard.findUnique)
        .mockResolvedValueOnce(mockReportCard1 as any)
        .mockResolvedValueOnce(mockReportCard2 as any);
      
      vi.mocked(db.reportCard.update)
        .mockResolvedValueOnce({ ...mockReportCard1, isPublished: true } as any)
        .mockResolvedValueOnce({ ...mockReportCard2, isPublished: true } as any);

      const result = await batchPublishReportCards(['report-1', 'report-2'], false);

      expect(result.success).toBe(true);
      expect(result.data?.successful).toHaveLength(2);
      expect(result.data?.failed).toHaveLength(0);
    });

    it('should handle partial failures in batch publish', async () => {
      const { db } = await import('@/lib/db');
      
      const mockReportCard1 = {
        id: 'report-1',
        isPublished: false,
        student: {
          userId: 'user-1',
          user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          parents: [],
        },
        term: {
          name: 'First Term',
          academicYear: { name: '2024-2025' },
        },
      };

      vi.mocked(db.reportCard.findUnique)
        .mockResolvedValueOnce(mockReportCard1 as any)
        .mockResolvedValueOnce(null); // Second report card not found
      
      vi.mocked(db.reportCard.update)
        .mockResolvedValueOnce({ ...mockReportCard1, isPublished: true } as any);

      const result = await batchPublishReportCards(['report-1', 'report-2'], false);

      expect(result.success).toBe(true);
      expect(result.data?.successful).toHaveLength(1);
      expect(result.data?.failed).toHaveLength(1);
      expect(result.data?.failed[0].id).toBe('report-2');
    });
  });
});
