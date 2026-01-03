import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createReportCardTemplate,
  updateReportCardTemplate,
  deleteReportCardTemplate,
  getReportCardTemplates,
  getReportCardTemplate,
  setDefaultTemplate,
  toggleTemplateActive,
  duplicateTemplate,
  type ReportCardTemplateInput,
} from '../reportCardTemplateActions';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    reportCardTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Report Card Template Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template Validation', () => {
    it('should validate required fields when creating template', async () => {
      const invalidInput = {
        name: '',
        type: 'CBSE' as const,
        sections: [],
        styling: {
          primaryColor: '#1e40af',
          secondaryColor: '#64748b',
          fontFamily: 'Arial',
          fontSize: 12,
          headerHeight: 100,
          footerHeight: 50,
        },
      };

      const result = await createReportCardTemplate(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate sections configuration', async () => {
      const inputWithoutSections = {
        name: 'Test Template',
        type: 'CBSE' as const,
        sections: [],
        styling: {
          primaryColor: '#1e40af',
          secondaryColor: '#64748b',
          fontFamily: 'Arial',
          fontSize: 12,
          headerHeight: 100,
          footerHeight: 50,
        },
      };

      const result = await createReportCardTemplate(inputWithoutSections);

      expect(result.success).toBe(false);
      expect(result.error).toContain('section');
    });

    it('should validate styling configuration', async () => {
      const inputWithIncompleteStyling = {
        name: 'Test Template',
        type: 'CBSE' as const,
        sections: [
          {
            id: 'test-section',
            name: 'Test Section',
            enabled: true,
            order: 1,
            fields: ['field1'],
          },
        ],
        styling: {
          primaryColor: '',
          secondaryColor: '#64748b',
          fontFamily: '',
          fontSize: 12,
          headerHeight: 100,
          footerHeight: 50,
        },
      };

      const result = await createReportCardTemplate(inputWithIncompleteStyling);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Styling');
    });
  });

  describe('Template CRUD Operations', () => {
    it('should create a valid template successfully', async () => {
      const { db } = await import('@/lib/db');
      
      const validInput: ReportCardTemplateInput = {
        name: 'CBSE Standard Template',
        description: 'Standard CBSE report card template',
        type: 'CBSE',
        pageSize: 'A4',
        orientation: 'PORTRAIT',
        sections: [
          {
            id: 'student-info',
            name: 'Student Information',
            enabled: true,
            order: 1,
            fields: ['name', 'rollNumber'],
          },
        ],
        styling: {
          primaryColor: '#1e40af',
          secondaryColor: '#64748b',
          fontFamily: 'Arial',
          fontSize: 12,
          headerHeight: 100,
          footerHeight: 50,
        },
        isActive: true,
        isDefault: false,
      };

      const mockTemplate = {
        id: 'template-1',
        ...validInput,
        createdBy: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue(null);
      vi.mocked(db.reportCardTemplate.create).mockResolvedValue(mockTemplate as any);

      const result = await createReportCardTemplate(validInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(db.reportCardTemplate.create).toHaveBeenCalled();
    });

    it('should prevent duplicate template names', async () => {
      const { db } = await import('@/lib/db');
      
      const input: ReportCardTemplateInput = {
        name: 'Existing Template',
        type: 'CBSE',
        sections: [
          {
            id: 'test',
            name: 'Test',
            enabled: true,
            order: 1,
            fields: ['test'],
          },
        ],
        styling: {
          primaryColor: '#1e40af',
          secondaryColor: '#64748b',
          fontFamily: 'Arial',
          fontSize: 12,
          headerHeight: 100,
          footerHeight: 50,
        },
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue({
        id: 'existing-id',
        name: 'Existing Template',
      } as any);

      const result = await createReportCardTemplate(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should update template successfully', async () => {
      const { db } = await import('@/lib/db');
      
      const existingTemplate = {
        id: 'template-1',
        name: 'Old Name',
        type: 'CBSE',
        isDefault: false,
      };

      // First call checks if template exists, second call checks for duplicate name
      vi.mocked(db.reportCardTemplate.findUnique)
        .mockResolvedValueOnce(existingTemplate as any)
        .mockResolvedValueOnce(null); // No duplicate name

      vi.mocked(db.reportCardTemplate.update).mockResolvedValue({
        ...existingTemplate,
        name: 'New Name',
      } as any);

      const result = await updateReportCardTemplate('template-1', {
        name: 'New Name',
      });

      expect(result.success).toBe(true);
      expect(db.reportCardTemplate.update).toHaveBeenCalled();
    });

    it('should delete template if not in use', async () => {
      const { db } = await import('@/lib/db');
      
      const template = {
        id: 'template-1',
        name: 'Test Template',
        isDefault: false,
        _count: {
          reportCards: 0,
        },
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue(template as any);
      vi.mocked(db.reportCardTemplate.delete).mockResolvedValue(template as any);

      const result = await deleteReportCardTemplate('template-1');

      expect(result.success).toBe(true);
      expect(db.reportCardTemplate.delete).toHaveBeenCalled();
    });

    it('should prevent deletion of template in use', async () => {
      const { db } = await import('@/lib/db');
      
      const template = {
        id: 'template-1',
        name: 'Test Template',
        isDefault: false,
        _count: {
          reportCards: 5,
        },
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue(template as any);

      const result = await deleteReportCardTemplate('template-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('being used');
      expect(db.reportCardTemplate.delete).not.toHaveBeenCalled();
    });

    it('should prevent deletion of default template', async () => {
      const { db } = await import('@/lib/db');
      
      const template = {
        id: 'template-1',
        name: 'Default Template',
        isDefault: true,
        _count: {
          reportCards: 0,
        },
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue(template as any);

      const result = await deleteReportCardTemplate('template-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('default');
      expect(db.reportCardTemplate.delete).not.toHaveBeenCalled();
    });
  });

  describe('Template Default Management', () => {
    it('should set template as default and unset others', async () => {
      const { db } = await import('@/lib/db');
      
      const template = {
        id: 'template-1',
        name: 'Test Template',
        isDefault: false,
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue(template as any);
      vi.mocked(db.reportCardTemplate.updateMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(db.reportCardTemplate.update).mockResolvedValue({
        ...template,
        isDefault: true,
      } as any);

      const result = await setDefaultTemplate('template-1');

      expect(result.success).toBe(true);
      expect(db.reportCardTemplate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      expect(db.reportCardTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { isDefault: true },
      });
    });

    it('should unset other defaults when creating default template', async () => {
      const { db } = await import('@/lib/db');
      
      const input: ReportCardTemplateInput = {
        name: 'New Default Template',
        type: 'CBSE',
        sections: [
          {
            id: 'test',
            name: 'Test',
            enabled: true,
            order: 1,
            fields: ['test'],
          },
        ],
        styling: {
          primaryColor: '#1e40af',
          secondaryColor: '#64748b',
          fontFamily: 'Arial',
          fontSize: 12,
          headerHeight: 100,
          footerHeight: 50,
        },
        isDefault: true,
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue(null);
      vi.mocked(db.reportCardTemplate.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(db.reportCardTemplate.create).mockResolvedValue({
        id: 'new-template',
        ...input,
      } as any);

      const result = await createReportCardTemplate(input);

      expect(result.success).toBe(true);
      expect(db.reportCardTemplate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('Template Status Management', () => {
    it('should toggle template active status', async () => {
      const { db } = await import('@/lib/db');
      
      const template = {
        id: 'template-1',
        name: 'Test Template',
        isActive: true,
      };

      vi.mocked(db.reportCardTemplate.findUnique).mockResolvedValue(template as any);
      vi.mocked(db.reportCardTemplate.update).mockResolvedValue({
        ...template,
        isActive: false,
      } as any);

      const result = await toggleTemplateActive('template-1');

      expect(result.success).toBe(true);
      expect(db.reportCardTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { isActive: false },
      });
    });
  });

  describe('Template Duplication', () => {
    it('should duplicate template with unique name', async () => {
      const { db } = await import('@/lib/db');
      
      const originalTemplate = {
        id: 'template-1',
        name: 'Original Template',
        description: 'Test description',
        type: 'CBSE',
        pageSize: 'A4',
        orientation: 'PORTRAIT',
        sections: [],
        styling: {},
        headerImage: null,
        footerImage: null,
        schoolLogo: null,
        isActive: true,
        isDefault: false,
      };

      vi.mocked(db.reportCardTemplate.findUnique)
        .mockResolvedValueOnce(originalTemplate as any)
        .mockResolvedValueOnce(null); // No duplicate name exists

      vi.mocked(db.reportCardTemplate.create).mockResolvedValue({
        ...originalTemplate,
        id: 'template-2',
        name: 'Original Template (Copy)',
        isActive: false,
      } as any);

      const result = await duplicateTemplate('template-1');

      expect(result.success).toBe(true);
      expect(result.data?.name).toContain('(Copy)');
      expect(result.data?.isActive).toBe(false);
      expect(result.data?.isDefault).toBe(false);
    });
  });
});
