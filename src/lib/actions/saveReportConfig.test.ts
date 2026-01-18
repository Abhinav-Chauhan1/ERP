import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveReportConfig } from './reportBuilderActions';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Mock modules
vi.mock('@/lib/db', () => ({
  prisma: {
    savedReportConfig: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('saveReportConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save report config when user is authenticated', async () => {
    const mockUser = { id: 'user123' };
    (auth as any).mockResolvedValue({ user: mockUser });
    (prisma.savedReportConfig.create as any).mockResolvedValue({ id: 'config123' });

    const config = {
      name: 'My Report',
      dataSource: 'students',
      selectedFields: ['name', 'email'],
      filters: [{ field: 'status', operator: 'equals', value: 'active' }],
      sorting: [{ field: 'name', direction: 'asc' }],
    };

    const result = await saveReportConfig(config as any);

    expect(result.success).toBe(true);
    expect(auth).toHaveBeenCalled();

    // We expect the arguments to match, using object containing to ignore undefined chartConfig if necessary or exact match
    expect(prisma.savedReportConfig.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: config.name,
        dataSource: config.dataSource,
        selectedFields: config.selectedFields,
        // JSON.parse(JSON.stringify(...)) result might differ in object reference but deep equality should pass
        filters: config.filters,
        sorting: config.sorting,
        userId: mockUser.id,
      })
    }));

    expect(revalidatePath).toHaveBeenCalledWith('/admin/reports');
  });

  it('should return unauthorized error when user is not authenticated', async () => {
    (auth as any).mockResolvedValue(null);

    const config = {
      name: 'My Report',
      dataSource: 'students',
      selectedFields: [],
      filters: [],
      sorting: [],
    };

    const result = await saveReportConfig(config as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
    expect(prisma.savedReportConfig.create).not.toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    const mockUser = { id: 'user123' };
    (auth as any).mockResolvedValue({ user: mockUser });
    (prisma.savedReportConfig.create as any).mockRejectedValue(new Error('DB Error'));

    const config = {
      name: 'My Report',
      dataSource: 'students',
      selectedFields: ['name'],
      filters: [],
      sorting: [],
    };

    const result = await saveReportConfig(config as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to save report configuration');
  });
});
