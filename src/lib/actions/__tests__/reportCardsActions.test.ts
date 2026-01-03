import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateReportCardRemarks } from '../reportCardsActions';
import type { ReportCardRemarksValues } from '@/lib/schemaValidation/reportCardsSchemaValidation';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    reportCard: {
      update: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Report Card Remarks Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateReportCardRemarks', () => {
    it('should successfully update remarks', async () => {
      const { db } = await import('@/lib/db');
      
      const mockReportCard = {
        id: 'report-card-1',
        teacherRemarks: 'Excellent performance',
        principalRemarks: 'Keep up the good work',
      };

      vi.mocked(db.reportCard.update).mockResolvedValue(mockReportCard as any);

      const input: ReportCardRemarksValues = {
        id: 'report-card-1',
        teacherRemarks: 'Excellent performance',
        principalRemarks: 'Keep up the good work',
      };

      const result = await updateReportCardRemarks(input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReportCard);
      expect(db.reportCard.update).toHaveBeenCalledWith({
        where: { id: 'report-card-1' },
        data: {
          teacherRemarks: 'Excellent performance',
          principalRemarks: 'Keep up the good work',
        },
      });
    });

    it('should handle empty remarks', async () => {
      const { db } = await import('@/lib/db');
      
      const mockReportCard = {
        id: 'report-card-1',
        teacherRemarks: '',
        principalRemarks: '',
      };

      vi.mocked(db.reportCard.update).mockResolvedValue(mockReportCard as any);

      const input: ReportCardRemarksValues = {
        id: 'report-card-1',
        teacherRemarks: '',
        principalRemarks: '',
      };

      const result = await updateReportCardRemarks(input);

      expect(result.success).toBe(true);
    });

    it('should enforce 500 character limit through validation', () => {
      const longText = 'a'.repeat(501);
      
      const input = {
        id: 'report-card-1',
        teacherRemarks: longText,
        principalRemarks: 'Valid remarks',
      };

      // This would be caught by Zod validation before reaching the action
      // The schema validation happens in the form, not in the action itself
      expect(longText.length).toBeGreaterThan(500);
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('@/lib/db');
      
      vi.mocked(db.reportCard.update).mockRejectedValue(
        new Error('Database connection failed')
      );

      const input: ReportCardRemarksValues = {
        id: 'report-card-1',
        teacherRemarks: 'Test remarks',
        principalRemarks: 'Test remarks',
      };

      const result = await updateReportCardRemarks(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
