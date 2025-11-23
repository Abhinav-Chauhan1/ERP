import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMeritListConfig,
  getMeritListConfigs,
  getMeritListConfigById,
  updateMeritListConfig,
  deleteMeritListConfig,
  generateMeritList,
  getMeritListById,
  getMeritLists,
  deleteMeritList,
} from './meritListActions';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    meritListConfig: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    meritList: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    admissionApplication: {
      findMany: vi.fn(),
    },
  },
}));

describe('Merit List Actions - Configuration Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMeritListConfig', () => {
    it('should create a merit list configuration with valid criteria', async () => {
      const mockConfig = {
        id: 'config-1',
        name: 'Grade 1 Merit List 2024',
        appliedClassId: 'class-1',
        criteria: [
          { field: 'submittedAt', weight: 60, order: 'asc' },
          { field: 'dateOfBirth', weight: 40, order: 'desc' },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedClass: { name: 'Grade 1' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.create).mockResolvedValue(mockConfig as any);

      const result = await createMeritListConfig({
        name: 'Grade 1 Merit List 2024',
        appliedClassId: 'class-1',
        criteria: [
          { field: 'submittedAt', weight: 60, order: 'asc' },
          { field: 'dateOfBirth', weight: 40, order: 'desc' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Grade 1 Merit List 2024');
      expect(result.message).toContain('created successfully');
    });

    it('should reject configuration with total weight not equal to 100', async () => {
      const result = await createMeritListConfig({
        name: 'Invalid Config',
        appliedClassId: 'class-1',
        criteria: [
          { field: 'submittedAt', weight: 50, order: 'asc' },
          { field: 'dateOfBirth', weight: 30, order: 'desc' },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Total weight must equal 100%');
    });

    it('should accept configuration with weight exactly 100', async () => {
      const mockConfig = {
        id: 'config-1',
        name: 'Valid Config',
        appliedClassId: 'class-1',
        criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedClass: { name: 'Grade 1' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.create).mockResolvedValue(mockConfig as any);

      const result = await createMeritListConfig({
        name: 'Valid Config',
        appliedClassId: 'class-1',
        criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getMeritListConfigs', () => {
    it('should fetch all configurations', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          name: 'Config 1',
          appliedClassId: 'class-1',
          criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
          isActive: true,
          appliedClass: { name: 'Grade 1' },
          meritLists: [],
        },
        {
          id: 'config-2',
          name: 'Config 2',
          appliedClassId: 'class-2',
          criteria: [{ field: 'dateOfBirth', weight: 100, order: 'desc' }],
          isActive: true,
          appliedClass: { name: 'Grade 2' },
          meritLists: [],
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.findMany).mockResolvedValue(mockConfigs as any);

      const result = await getMeritListConfigs();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Config 1');
      expect(result[1].name).toBe('Config 2');
    });

    it('should filter configurations by class', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          name: 'Config 1',
          appliedClassId: 'class-1',
          criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
          isActive: true,
          appliedClass: { name: 'Grade 1' },
          meritLists: [],
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.findMany).mockResolvedValue(mockConfigs as any);

      const result = await getMeritListConfigs('class-1');

      expect(result).toHaveLength(1);
      expect(result[0].appliedClassId).toBe('class-1');
    });
  });
});

describe('Merit List Actions - Merit List Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMeritList', () => {
    it('should generate merit list based on configuration', async () => {
      const mockConfig = {
        id: 'config-1',
        name: 'Test Config',
        appliedClassId: 'class-1',
        criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
        isActive: true,
      };

      const mockApplications = [
        {
          id: 'app-1',
          applicationNumber: 'APP20250001',
          studentName: 'Student 1',
          dateOfBirth: new Date('2010-01-01'),
          submittedAt: new Date('2024-01-01'),
          status: 'SUBMITTED',
          parentName: 'Parent 1',
          parentEmail: 'parent1@test.com',
        },
        {
          id: 'app-2',
          applicationNumber: 'APP20250002',
          studentName: 'Student 2',
          dateOfBirth: new Date('2010-02-01'),
          submittedAt: new Date('2024-01-02'),
          status: 'SUBMITTED',
          parentName: 'Parent 2',
          parentEmail: 'parent2@test.com',
        },
        {
          id: 'app-3',
          applicationNumber: 'APP20250003',
          studentName: 'Student 3',
          dateOfBirth: new Date('2010-03-01'),
          submittedAt: new Date('2024-01-03'),
          status: 'SUBMITTED',
          parentName: 'Parent 3',
          parentEmail: 'parent3@test.com',
        },
      ];

      const mockMeritList = {
        id: 'merit-1',
        configId: 'config-1',
        appliedClassId: 'class-1',
        generatedAt: new Date(),
        generatedBy: 'admin-1',
        totalApplications: 3,
        config: { name: 'Test Config' },
        appliedClass: { name: 'Grade 1' },
        entries: [
          {
            id: 'entry-1',
            meritListId: 'merit-1',
            applicationId: 'app-1',
            rank: 1,
            score: 100,
            application: mockApplications[0],
          },
          {
            id: 'entry-2',
            meritListId: 'merit-1',
            applicationId: 'app-2',
            rank: 2,
            score: 50,
            application: mockApplications[1],
          },
          {
            id: 'entry-3',
            meritListId: 'merit-1',
            applicationId: 'app-3',
            rank: 3,
            score: 0,
            application: mockApplications[2],
          },
        ],
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.findUnique).mockResolvedValue(mockConfig as any);
      vi.mocked(db.admissionApplication.findMany).mockResolvedValue(mockApplications as any);
      vi.mocked(db.meritList.create).mockResolvedValue(mockMeritList as any);

      const result = await generateMeritList(
        {
          configId: 'config-1',
          appliedClassId: 'class-1',
        },
        'admin-1'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.totalApplications).toBe(3);
      expect(result.data?.entries).toHaveLength(3);
      expect(result.message).toContain('generated successfully');
    });

    it('should return error when configuration not found', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.findUnique).mockResolvedValue(null);

      const result = await generateMeritList({
        configId: 'invalid-config',
        appliedClassId: 'class-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('configuration not found');
    });

    it('should return error when no applications found', async () => {
      const mockConfig = {
        id: 'config-1',
        name: 'Test Config',
        appliedClassId: 'class-1',
        criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
        isActive: true,
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.findUnique).mockResolvedValue(mockConfig as any);
      vi.mocked(db.admissionApplication.findMany).mockResolvedValue([]);

      const result = await generateMeritList({
        configId: 'config-1',
        appliedClassId: 'class-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No applications found');
    });

    it('should rank applications correctly based on submission date (asc)', async () => {
      const mockConfig = {
        id: 'config-1',
        name: 'Test Config',
        appliedClassId: 'class-1',
        criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
        isActive: true,
      };

      // Earlier submission should get higher rank (lower rank number)
      const mockApplications = [
        {
          id: 'app-1',
          applicationNumber: 'APP20250001',
          studentName: 'Student 1',
          dateOfBirth: new Date('2010-01-01'),
          submittedAt: new Date('2024-01-03'), // Latest
          status: 'SUBMITTED',
        },
        {
          id: 'app-2',
          applicationNumber: 'APP20250002',
          studentName: 'Student 2',
          dateOfBirth: new Date('2010-02-01'),
          submittedAt: new Date('2024-01-01'), // Earliest
          status: 'SUBMITTED',
        },
        {
          id: 'app-3',
          applicationNumber: 'APP20250003',
          studentName: 'Student 3',
          dateOfBirth: new Date('2010-03-01'),
          submittedAt: new Date('2024-01-02'), // Middle
          status: 'SUBMITTED',
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritListConfig.findUnique).mockResolvedValue(mockConfig as any);
      vi.mocked(db.admissionApplication.findMany).mockResolvedValue(mockApplications as any);

      // Mock the create to capture the entries
      let capturedEntries: any[] = [];
      vi.mocked(db.meritList.create).mockImplementation(async (args: any) => {
        capturedEntries = args.data.entries.create;
        return {
          id: 'merit-1',
          configId: 'config-1',
          appliedClassId: 'class-1',
          generatedAt: new Date(),
          generatedBy: 'admin-1',
          totalApplications: 3,
          config: { name: 'Test Config' },
          appliedClass: { name: 'Grade 1' },
          entries: capturedEntries.map((e: any, i: number) => ({
            ...e,
            id: `entry-${i}`,
            meritListId: 'merit-1',
            application: mockApplications.find((a) => a.id === e.applicationId),
          })),
        } as any;
      });

      const result = await generateMeritList({
        configId: 'config-1',
        appliedClassId: 'class-1',
      });

      expect(result.success).toBe(true);
      
      // Verify ranking: earlier submission should have rank 1
      const rank1Entry = capturedEntries.find((e) => e.rank === 1);
      const rank2Entry = capturedEntries.find((e) => e.rank === 2);
      const rank3Entry = capturedEntries.find((e) => e.rank === 3);

      expect(rank1Entry.applicationId).toBe('app-2'); // Earliest submission
      expect(rank2Entry.applicationId).toBe('app-3'); // Middle submission
      expect(rank3Entry.applicationId).toBe('app-1'); // Latest submission
    });
  });

  describe('getMeritListById', () => {
    it('should fetch a merit list with entries', async () => {
      const mockMeritList = {
        id: 'merit-1',
        configId: 'config-1',
        appliedClassId: 'class-1',
        generatedAt: new Date(),
        totalApplications: 2,
        config: {
          name: 'Test Config',
          criteria: [{ field: 'submittedAt', weight: 100, order: 'asc' }],
        },
        appliedClass: { name: 'Grade 1' },
        entries: [
          {
            id: 'entry-1',
            rank: 1,
            score: 100,
            application: {
              applicationNumber: 'APP20250001',
              studentName: 'Student 1',
              status: 'SUBMITTED',
            },
          },
          {
            id: 'entry-2',
            rank: 2,
            score: 50,
            application: {
              applicationNumber: 'APP20250002',
              studentName: 'Student 2',
              status: 'SUBMITTED',
            },
          },
        ],
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritList.findUnique).mockResolvedValue(mockMeritList as any);

      const result = await getMeritListById('merit-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('merit-1');
      expect(result?.entries).toHaveLength(2);
      expect(result?.entries[0].rank).toBe(1);
      expect(result?.entries[1].rank).toBe(2);
    });
  });

  describe('getMeritLists', () => {
    it('should fetch all merit lists', async () => {
      const mockMeritLists = [
        {
          id: 'merit-1',
          configId: 'config-1',
          appliedClassId: 'class-1',
          generatedAt: new Date(),
          totalApplications: 5,
          config: { name: 'Config 1' },
          appliedClass: { name: 'Grade 1' },
          _count: { entries: 5 },
        },
        {
          id: 'merit-2',
          configId: 'config-2',
          appliedClassId: 'class-2',
          generatedAt: new Date(),
          totalApplications: 3,
          config: { name: 'Config 2' },
          appliedClass: { name: 'Grade 2' },
          _count: { entries: 3 },
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.meritList.findMany).mockResolvedValue(mockMeritLists as any);

      const result = await getMeritLists();

      expect(result).toHaveLength(2);
      expect(result[0].totalApplications).toBe(5);
      expect(result[1].totalApplications).toBe(3);
    });
  });

  describe('deleteMeritList', () => {
    it('should delete a merit list', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.meritList.delete).mockResolvedValue({} as any);

      const result = await deleteMeritList('merit-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });
  });
});
