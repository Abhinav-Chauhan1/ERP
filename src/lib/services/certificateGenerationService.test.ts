import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateBulkCertificates,
  type BulkCertificateGenerationOptions,
} from './certificateGenerationService';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    certificateTemplate: {
      findUnique: vi.fn(),
    },
    generatedCertificate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
  },
}));

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = {
      pageSize: {
        getWidth: () => 297,
        getHeight: () => 210,
      },
    };
    addImage = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setFont = vi.fn();
    text = vi.fn();
    splitTextToSize = vi.fn().mockReturnValue(['Line 1', 'Line 2']);
    output = vi.fn().mockReturnValue(new ArrayBuffer(100));
  }
  
  return {
    default: MockJsPDF,
  };
});

describe('Certificate Generation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateBulkCertificates', () => {
    it('should return error if template not found', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.certificateTemplate.findUnique).mockResolvedValue(null);

      const options: BulkCertificateGenerationOptions = {
        templateId: 'invalid-template',
        students: [
          {
            studentId: 'student-1',
            studentName: 'John Doe',
            data: { studentName: 'John Doe' },
          },
        ],
        issuedBy: 'admin-1',
      };

      const result = await generateBulkCertificates(options);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Certificate template not found');
      expect(result.totalGenerated).toBe(0);
    });

    it('should return error if template is not active', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.certificateTemplate.findUnique).mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        isActive: false,
        type: 'ACHIEVEMENT',
        layout: '{}',
        styling: '{}',
        content: 'Certificate content',
        mergeFields: '[]',
        pageSize: 'A4',
        orientation: 'LANDSCAPE',
      } as any);

      const options: BulkCertificateGenerationOptions = {
        templateId: 'template-1',
        students: [
          {
            studentId: 'student-1',
            studentName: 'John Doe',
            data: { studentName: 'John Doe' },
          },
        ],
        issuedBy: 'admin-1',
      };

      const result = await generateBulkCertificates(options);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Certificate template is not active');
      expect(result.totalGenerated).toBe(0);
    });

    it('should generate certificates for all students when template is valid', async () => {
      const { db } = await import('@/lib/db');
      
      // Mock template
      vi.mocked(db.certificateTemplate.findUnique).mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        isActive: true,
        type: 'ACHIEVEMENT',
        layout: JSON.stringify({ contentStartY: 60, contentStartX: 20 }),
        styling: JSON.stringify({ fontSize: 12, textAlign: 'center' }),
        content: 'This is to certify that {{studentName}} has achieved excellence.',
        mergeFields: JSON.stringify(['studentName']),
        pageSize: 'A4',
        orientation: 'LANDSCAPE',
        headerImage: null,
        footerImage: null,
        background: null,
        signature1: null,
        signature2: null,
      } as any);

      // Mock certificate creation
      vi.mocked(db.generatedCertificate.create).mockImplementation(
        async (args: any) => ({
          id: `cert-${Date.now()}`,
          certificateNumber: args.data.certificateNumber,
          templateId: args.data.templateId,
          studentId: args.data.studentId,
          studentName: args.data.studentName,
          data: args.data.data,
          pdfUrl: args.data.pdfUrl,
          verificationCode: args.data.verificationCode,
          isVerified: true,
          status: 'ACTIVE',
          issuedBy: args.data.issuedBy,
          issuedDate: new Date(),
          revokedAt: null,
          revokedBy: null,
          revokedReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
      );

      const options: BulkCertificateGenerationOptions = {
        templateId: 'template-1',
        students: [
          {
            studentId: 'student-1',
            studentName: 'John Doe',
            data: { studentName: 'John Doe' },
          },
          {
            studentId: 'student-2',
            studentName: 'Jane Smith',
            data: { studentName: 'Jane Smith' },
          },
        ],
        issuedBy: 'admin-1',
      };

      const result = await generateBulkCertificates(options);

      expect(result.success).toBe(true);
      expect(result.totalRequested).toBe(2);
      expect(result.totalGenerated).toBe(2);
      expect(result.certificates).toHaveLength(2);
      expect(result.certificates[0].success).toBe(true);
      expect(result.certificates[1].success).toBe(true);
    });

    it('should handle partial failures gracefully', async () => {
      const { db } = await import('@/lib/db');
      
      // Mock template
      vi.mocked(db.certificateTemplate.findUnique).mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        isActive: true,
        type: 'ACHIEVEMENT',
        layout: JSON.stringify({ contentStartY: 60, contentStartX: 20 }),
        styling: JSON.stringify({ fontSize: 12, textAlign: 'center' }),
        content: 'Certificate for {{studentName}}',
        mergeFields: JSON.stringify(['studentName']),
        pageSize: 'A4',
        orientation: 'LANDSCAPE',
        headerImage: null,
        footerImage: null,
        background: null,
        signature1: null,
        signature2: null,
      } as any);

      // Mock certificate creation - first succeeds, second fails
      let callCount = 0;
      vi.mocked(db.generatedCertificate.create).mockImplementation(
        async (args: any) => {
          callCount++;
          if (callCount === 2) {
            throw new Error('Database error');
          }
          return {
            id: `cert-${callCount}`,
            certificateNumber: args.data.certificateNumber,
            templateId: args.data.templateId,
            studentId: args.data.studentId,
            studentName: args.data.studentName,
            data: args.data.data,
            pdfUrl: args.data.pdfUrl,
            verificationCode: args.data.verificationCode,
            isVerified: true,
            status: 'ACTIVE',
            issuedBy: args.data.issuedBy,
            issuedDate: new Date(),
            revokedAt: null,
            revokedBy: null,
            revokedReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      );

      const options: BulkCertificateGenerationOptions = {
        templateId: 'template-1',
        students: [
          {
            studentId: 'student-1',
            studentName: 'John Doe',
            data: { studentName: 'John Doe' },
          },
          {
            studentId: 'student-2',
            studentName: 'Jane Smith',
            data: { studentName: 'Jane Smith' },
          },
        ],
        issuedBy: 'admin-1',
      };

      const result = await generateBulkCertificates(options);

      expect(result.success).toBe(true); // At least one succeeded
      expect(result.totalRequested).toBe(2);
      expect(result.totalGenerated).toBe(1);
      expect(result.certificates).toHaveLength(2);
      expect(result.certificates[0].success).toBe(true);
      expect(result.certificates[1].success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate unique certificate numbers for each certificate', async () => {
      const { db } = await import('@/lib/db');
      
      vi.mocked(db.certificateTemplate.findUnique).mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        isActive: true,
        type: 'ACHIEVEMENT',
        layout: JSON.stringify({}),
        styling: JSON.stringify({}),
        content: 'Certificate',
        mergeFields: JSON.stringify([]),
        pageSize: 'A4',
        orientation: 'LANDSCAPE',
        headerImage: null,
        footerImage: null,
        background: null,
        signature1: null,
        signature2: null,
      } as any);

      const certificateNumbers: string[] = [];
      vi.mocked(db.generatedCertificate.create).mockImplementation(
        async (args: any) => {
          certificateNumbers.push(args.data.certificateNumber);
          return {
            id: `cert-${Date.now()}`,
            certificateNumber: args.data.certificateNumber,
            templateId: args.data.templateId,
            studentId: args.data.studentId,
            studentName: args.data.studentName,
            data: args.data.data,
            pdfUrl: args.data.pdfUrl,
            verificationCode: args.data.verificationCode,
            isVerified: true,
            status: 'ACTIVE',
            issuedBy: args.data.issuedBy,
            issuedDate: new Date(),
            revokedAt: null,
            revokedBy: null,
            revokedReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        }
      );

      const options: BulkCertificateGenerationOptions = {
        templateId: 'template-1',
        students: [
          {
            studentId: 'student-1',
            studentName: 'John Doe',
            data: { studentName: 'John Doe' },
          },
          {
            studentId: 'student-2',
            studentName: 'Jane Smith',
            data: { studentName: 'Jane Smith' },
          },
          {
            studentId: 'student-3',
            studentName: 'Bob Johnson',
            data: { studentName: 'Bob Johnson' },
          },
        ],
        issuedBy: 'admin-1',
      };

      await generateBulkCertificates(options);

      // Verify all certificate numbers are unique
      const uniqueNumbers = new Set(certificateNumbers);
      expect(uniqueNumbers.size).toBe(3);
      expect(certificateNumbers).toHaveLength(3);
    });
  });
});
