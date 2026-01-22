import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markStudentsAsGraduated } from '../graduationActions';
import { generateBulkCertificates } from '@/lib/services/certificateGenerationService';

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    $transaction: vi.fn(async (callback) => callback({
      student: {
        findUnique: vi.fn(),
      },
      classEnrollment: {
        update: vi.fn(),
      },
      alumni: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    })),
    student: {
      findMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    certificateTemplate: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock certificate generation service
vi.mock('@/lib/services/certificateGenerationService', () => ({
  generateBulkCertificates: vi.fn(),
}));

describe('Graduation Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markStudentsAsGraduated', () => {
    it('should generate certificates when requested', async () => {
      // Import mocked modules
      const { auth } = await import('@/auth');
      const { db } = await import('@/lib/db');

      // Mock auth response
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any);

      // Mock student data for transaction
      const mockStudent = {
        id: 'student-1',
        admissionId: 'ADM001',
        fatherName: 'John Sr',
        motherName: 'Jane',
        user: { firstName: 'John', lastName: 'Doe' },
        enrollments: [
          {
            id: 'enrollment-1',
            status: 'ACTIVE',
            class: { name: 'Class 10', academicYear: { name: '2023-24' } },
            section: { name: 'A' },
            rollNumber: '101'
          },
        ],
      };

      // Mock transaction methods
      const tx = {
        student: {
          findUnique: vi.fn().mockResolvedValue(mockStudent),
        },
        classEnrollment: {
          update: vi.fn(),
        },
        alumni: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn(),
        },
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback) => {
        return callback(tx);
      });

      // Mock student data for certificate generation
      vi.mocked(db.student.findMany).mockResolvedValue([mockStudent] as any);

      // Mock template finding
      vi.mocked(db.certificateTemplate.findFirst).mockResolvedValue({
        id: 'template-1',
        name: 'Graduation Certificate',
      } as any);

      // Mock certificate generation result
      vi.mocked(generateBulkCertificates).mockResolvedValue({
        success: true,
        totalRequested: 1,
        totalGenerated: 1,
        certificates: [],
        errors: [],
      });

      // Call the action
      const input = {
        studentIds: ['student-1'],
        graduationDate: new Date('2024-05-01'),
        generateCertificates: true,
        sendNotifications: false,
      };

      const result = await markStudentsAsGraduated(input);

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data?.certificatesGenerated).toBe(1);

      // Verify generateBulkCertificates was called correctly
      expect(generateBulkCertificates).toHaveBeenCalledWith(expect.objectContaining({
        templateId: 'template-1',
        issuedBy: 'admin-1',
        students: expect.arrayContaining([
          expect.objectContaining({
            studentId: 'student-1',
            studentName: 'John Doe',
            data: expect.objectContaining({
              studentName: 'John Doe',
              admissionId: 'ADM001',
              className: 'Class 10',
              graduationDate: '5/1/2024',
            }),
          }),
        ]),
      }));
    });

    it('should create a default template if none exists', async () => {
      // Import mocked modules
      const { auth } = await import('@/auth');
      const { db } = await import('@/lib/db');

      // Mock auth response
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      } as any);

      const mockStudent = {
        id: 'student-1',
        admissionId: 'ADM001',
        user: { firstName: 'John', lastName: 'Doe' },
        enrollments: [{
            id: 'enrollment-1',
            status: 'ACTIVE',
            class: { name: 'Class 10', academicYear: { name: '2023-24' } },
            section: { name: 'A' },
        }],
      };

      // Mock transaction
      const tx = {
        student: { findUnique: vi.fn().mockResolvedValue(mockStudent) },
        classEnrollment: { update: vi.fn() },
        alumni: { findUnique: vi.fn(), create: vi.fn() },
      };
      vi.mocked(db.$transaction).mockImplementation(async (cb) => cb(tx));

      // Mock student fetching for certificates
      vi.mocked(db.student.findMany).mockResolvedValue([mockStudent] as any);

      // Mock template finding (return null to trigger creation)
      vi.mocked(db.certificateTemplate.findFirst).mockResolvedValue(null);

      // Mock template creation
      const createdTemplate = { id: 'new-template-1', name: 'Graduation Certificate' };
      vi.mocked(db.certificateTemplate.create).mockResolvedValue(createdTemplate as any);

      // Mock certificate generation
      vi.mocked(generateBulkCertificates).mockResolvedValue({
        success: true,
        totalRequested: 1,
        totalGenerated: 1,
        certificates: [],
        errors: [],
      });

      // Call action
      await markStudentsAsGraduated({
        studentIds: ['student-1'],
        graduationDate: new Date(),
        generateCertificates: true,
        sendNotifications: false,
      });

      // Verify template creation
      expect(db.certificateTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: 'Graduation Certificate',
          createdBy: 'admin-1',
        }),
      }));

      // Verify generation uses new template ID
      expect(generateBulkCertificates).toHaveBeenCalledWith(expect.objectContaining({
        templateId: 'new-template-1',
      }));
    });
  });
});
