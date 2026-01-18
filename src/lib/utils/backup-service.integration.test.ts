
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import { createBackup, restoreBackup } from './backup-service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// We will NOT mock fs here, we want real file operations to verify the format
// We WILL mock the DB

// Mock db
vi.mock('@/lib/db', () => {
  return {
    db: {
      user: {
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      // Mock other models as needed for the test, or use a Proxy for generic handling
    },
    prisma: {
      // generic catch-all for other models if needed
    }
  };
});

// Mock console
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe('Backup Service Integration', () => {
  let tempDir: string;
  let originalBackupDir: string | undefined;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Create temp dir
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
    originalBackupDir = process.env.BACKUP_DIR;
    process.env.BACKUP_DIR = tempDir;

    // Mock DB data
    const dbMock = (await import('@/lib/db')).db;
    const users = [
      { id: '1', name: 'User 1', email: 'u1@example.com' },
      { id: '2', name: 'User 2', email: 'u2@example.com' },
    ];

    // Smart mock for pagination
    vi.mocked(dbMock.user.findMany).mockImplementation(async (args: any) => {
      const skip = args?.skip || 0;
      const take = args?.take || 1000;
      if (skip >= users.length) return [];
      return users.slice(skip, skip + take);
    });

    // Mock other findMany to return empty
    // We need to mock all findMany calls that exportDatabaseData makes
    // Or we can just mock the ones we care about and let others fail or return undefined?
    // exportDatabaseData catches errors for each table export, so it should be fine if others fail/return undefined
    // but better to return empty array
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
    if (originalBackupDir) process.env.BACKUP_DIR = originalBackupDir;
    else delete process.env.BACKUP_DIR;
  });

  it('should create and restore a backup successfully', async () => {
    // 1. Create Backup
    const backupResult = await createBackup();
    expect(backupResult.success).toBe(true);
    expect(backupResult.localPath).toBeDefined();

    // 2. Verify file exists
    const fileExists = await fs.stat(backupResult.localPath!).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // 3. Restore Backup
    // restoreBackup takes ID which is filename in the current impl
    const filename = path.basename(backupResult.localPath!);
    const restoreResult = await restoreBackup(filename);

    expect(restoreResult.success).toBe(true);
    expect(restoreResult.recordsRestored).toBeGreaterThan(0);

    // 4. Verify DB upsert was called
    const dbMock = (await import('@/lib/db')).db;
    expect(dbMock.user.upsert).toHaveBeenCalledTimes(2); // 2 users
    expect(dbMock.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: '1' },
      create: expect.objectContaining({ name: 'User 1' }),
    }));
  }, 30000);
});
