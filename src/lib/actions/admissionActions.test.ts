import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  uploadAdmissionDocument, 
  createAdmissionApplication,
  getAdmissionApplications,
  getAdmissionApplicationById,
  updateApplicationStatus,
  updateApplicationRemarks,
  getAdmissionStatistics
} from './admissionActions';

// Mock the Cloudinary upload function
vi.mock('@/lib/cloudinary', () => ({
  uploadToCloudinary: vi.fn().mockResolvedValue({
    secure_url: 'https://cloudinary.com/test-document.pdf',
    original_filename: 'test-document.pdf',
    public_id: 'admission-documents/test-document',
    resource_type: 'raw',
    format: 'pdf',
    bytes: 1024,
  }),
}));

// Mock the email service
vi.mock('@/lib/utils/email-service', () => ({
  sendAdmissionConfirmationEmail: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id',
  }),
}));

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    admissionApplication: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({
        id: 'test-id',
        applicationNumber: 'APP20250001',
        studentName: 'Test Student',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'MALE',
        parentName: 'Test Parent',
        parentEmail: 'parent@test.com',
        parentPhone: '1234567890',
        address: 'Test Address',
        previousSchool: null,
        appliedClassId: 'class-id',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        remarks: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedClass: {
          name: 'Grade 1',
        },
        documents: [
          {
            id: 'doc-1',
            applicationId: 'test-id',
            type: 'BIRTH_CERTIFICATE',
            url: 'https://cloudinary.com/birth-cert.pdf',
            filename: 'birth-cert.pdf',
            uploadedAt: new Date(),
          },
          {
            id: 'doc-2',
            applicationId: 'test-id',
            type: 'PHOTOGRAPH',
            url: 'https://cloudinary.com/photo.jpg',
            filename: 'photo.jpg',
            uploadedAt: new Date(),
          },
        ],
      }),
    },
  },
}));

describe('Admission Actions - Document Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAdmissionDocument', () => {
    it('should upload a document successfully', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('type', 'BIRTH_CERTIFICATE');

      const result = await uploadAdmissionDocument(formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.url).toBe('https://cloudinary.com/test-document.pdf');
      expect(result.data?.filename).toBe('test-document.pdf');
      expect(result.data?.type).toBe('BIRTH_CERTIFICATE');
    });

    it('should return error when no file is provided', async () => {
      const formData = new FormData();
      formData.append('type', 'BIRTH_CERTIFICATE');

      const result = await uploadAdmissionDocument(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No file provided');
    });
  });

  describe('createAdmissionApplication', () => {
    it('should create application with documents', async () => {
      const applicationData = {
        studentName: 'Test Student',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'MALE' as const,
        parentName: 'Test Parent',
        parentEmail: 'parent@test.com',
        parentPhone: '1234567890',
        address: 'Test Address',
        appliedClassId: 'class-id',
      };

      const documents = [
        {
          type: 'BIRTH_CERTIFICATE',
          url: 'https://cloudinary.com/birth-cert.pdf',
          filename: 'birth-cert.pdf',
        },
        {
          type: 'PHOTOGRAPH',
          url: 'https://cloudinary.com/photo.jpg',
          filename: 'photo.jpg',
        },
      ];

      const result = await createAdmissionApplication(applicationData, documents);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.applicationNumber).toBe('APP20250001');
      expect(result.data?.documents).toHaveLength(2);
      expect(result.data?.documents[0].type).toBe('BIRTH_CERTIFICATE');
      expect(result.data?.documents[1].type).toBe('PHOTOGRAPH');
    });

    it('should create application without documents', async () => {
      const applicationData = {
        studentName: 'Test Student',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'MALE' as const,
        parentName: 'Test Parent',
        parentEmail: 'parent@test.com',
        parentPhone: '1234567890',
        address: 'Test Address',
        appliedClassId: 'class-id',
      };

      const result = await createAdmissionApplication(applicationData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.applicationNumber).toBeDefined();
    });
  });
});


describe('Admission Actions - Admin Review Interface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdmissionApplications', () => {
    it('should fetch applications with pagination', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          applicationNumber: 'APP20250001',
          studentName: 'Student 1',
          status: 'SUBMITTED',
          submittedAt: new Date(),
          appliedClass: { name: 'Grade 1' },
          documents: [],
        },
        {
          id: 'app-2',
          applicationNumber: 'APP20250002',
          studentName: 'Student 2',
          status: 'UNDER_REVIEW',
          submittedAt: new Date(),
          appliedClass: { name: 'Grade 2' },
          documents: [],
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.count).mockResolvedValue(2);
      vi.mocked(db.admissionApplication.findMany).mockResolvedValue(mockApplications as any);

      const result = await getAdmissionApplications({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter applications by status', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          applicationNumber: 'APP20250001',
          studentName: 'Student 1',
          status: 'ACCEPTED',
          submittedAt: new Date(),
          appliedClass: { name: 'Grade 1' },
          documents: [],
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.count).mockResolvedValue(1);
      vi.mocked(db.admissionApplication.findMany).mockResolvedValue(mockApplications as any);

      const result = await getAdmissionApplications({ 
        page: 1, 
        limit: 10, 
        status: 'ACCEPTED' 
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('ACCEPTED');
    });

    it('should search applications by student name', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          applicationNumber: 'APP20250001',
          studentName: 'John Doe',
          status: 'SUBMITTED',
          submittedAt: new Date(),
          appliedClass: { name: 'Grade 1' },
          documents: [],
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.count).mockResolvedValue(1);
      vi.mocked(db.admissionApplication.findMany).mockResolvedValue(mockApplications as any);

      const result = await getAdmissionApplications({ 
        page: 1, 
        limit: 10, 
        search: 'John' 
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].studentName).toContain('John');
    });
  });

  describe('getAdmissionApplicationById', () => {
    it('should fetch a single application by ID', async () => {
      const mockApplication = {
        id: 'app-1',
        applicationNumber: 'APP20250001',
        studentName: 'Test Student',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'MALE',
        parentName: 'Test Parent',
        parentEmail: 'parent@test.com',
        parentPhone: '1234567890',
        address: 'Test Address',
        previousSchool: null,
        appliedClassId: 'class-id',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        remarks: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedClass: {
          name: 'Grade 1',
          academicYear: { name: '2025-2026' },
        },
        documents: [],
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.findUnique).mockResolvedValue(mockApplication as any);

      const result = await getAdmissionApplicationById('app-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('app-1');
      expect(result?.applicationNumber).toBe('APP20250001');
    });
  });

  describe('updateApplicationStatus', () => {
    it('should accept an application', async () => {
      const mockUpdatedApplication = {
        id: 'app-1',
        applicationNumber: 'APP20250001',
        studentName: 'Test Student',
        status: 'ACCEPTED',
        remarks: 'Application accepted',
        reviewedBy: 'admin-123',
        reviewedAt: new Date(),
        appliedClass: { name: 'Grade 1' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.update).mockResolvedValue(mockUpdatedApplication as any);

      const result = await updateApplicationStatus(
        'app-1',
        'ACCEPTED',
        'Application accepted',
        'admin-123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ACCEPTED');
      expect(result.message).toContain('accepted');
    });

    it('should reject an application', async () => {
      const mockUpdatedApplication = {
        id: 'app-1',
        applicationNumber: 'APP20250001',
        studentName: 'Test Student',
        status: 'REJECTED',
        remarks: 'Does not meet criteria',
        reviewedBy: 'admin-123',
        reviewedAt: new Date(),
        appliedClass: { name: 'Grade 1' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.update).mockResolvedValue(mockUpdatedApplication as any);

      const result = await updateApplicationStatus(
        'app-1',
        'REJECTED',
        'Does not meet criteria',
        'admin-123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('REJECTED');
    });

    it('should waitlist an application', async () => {
      const mockUpdatedApplication = {
        id: 'app-1',
        applicationNumber: 'APP20250001',
        studentName: 'Test Student',
        status: 'WAITLISTED',
        remarks: 'Added to waitlist',
        reviewedBy: 'admin-123',
        reviewedAt: new Date(),
        appliedClass: { name: 'Grade 1' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.update).mockResolvedValue(mockUpdatedApplication as any);

      const result = await updateApplicationStatus(
        'app-1',
        'WAITLISTED',
        'Added to waitlist',
        'admin-123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('WAITLISTED');
    });
  });

  describe('updateApplicationRemarks', () => {
    it('should update application remarks', async () => {
      const mockUpdatedApplication = {
        id: 'app-1',
        applicationNumber: 'APP20250001',
        studentName: 'Test Student',
        status: 'UNDER_REVIEW',
        remarks: 'Updated remarks',
        updatedAt: new Date(),
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.admissionApplication.update).mockResolvedValue(mockUpdatedApplication as any);

      const result = await updateApplicationRemarks('app-1', 'Updated remarks');

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated');
    });
  });

  describe('getAdmissionStatistics', () => {
    it('should return admission statistics', async () => {
      const { db } = await import('@/lib/db');
      
      // Mock count calls for different statuses
      vi.mocked(db.admissionApplication.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30)  // submitted
        .mockResolvedValueOnce(20)  // under review
        .mockResolvedValueOnce(35)  // accepted
        .mockResolvedValueOnce(10)  // rejected
        .mockResolvedValueOnce(5);  // waitlisted

      const result = await getAdmissionStatistics();

      expect(result.total).toBe(100);
      expect(result.submitted).toBe(30);
      expect(result.underReview).toBe(20);
      expect(result.accepted).toBe(35);
      expect(result.rejected).toBe(10);
      expect(result.waitlisted).toBe(5);
    });
  });
});
