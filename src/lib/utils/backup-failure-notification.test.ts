/**
 * Tests for Backup Failure Notification
 * 
 * Tests the backup failure notification functionality
 * 
 * Requirements: 9.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the email service
const mockSendEmail = vi.fn();
vi.mock('./email-service', () => ({
  sendEmail: mockSendEmail
}));

// Mock the database
const mockFindMany = vi.fn();
vi.mock('@/lib/db', () => ({
  db: {
    administrator: {
      findMany: mockFindMany
    },
    backup: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    },
    user: { findMany: vi.fn() },
    teacher: { findMany: vi.fn() },
    student: { findMany: vi.fn() },
    parent: { findMany: vi.fn() },
    academicYear: { findMany: vi.fn() },
    term: { findMany: vi.fn() },
    class: { findMany: vi.fn() },
    classSection: { findMany: vi.fn() },
    subject: { findMany: vi.fn() },
    studentAttendance: { findMany: vi.fn() },
    exam: { findMany: vi.fn() },
    examResult: { findMany: vi.fn() },
    assignment: { findMany: vi.fn() },
    feeStructure: { findMany: vi.fn() },
    feePayment: { findMany: vi.fn() },
    announcement: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
    notification: { findMany: vi.fn() },
    document: { findMany: vi.fn() },
    event: { findMany: vi.fn() }
  }
}));

// Mock crypto and other Node.js modules
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => Buffer.from('test-random-bytes')),
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'test-checksum')
  })),
  createCipheriv: vi.fn(() => ({
    update: vi.fn(() => Buffer.from('encrypted')),
    final: vi.fn(() => Buffer.from('')),
    getAuthTag: vi.fn(() => Buffer.from('auth-tag'))
  })),
  createDecipheriv: vi.fn(() => ({
    setAuthTag: vi.fn(),
    update: vi.fn(() => Buffer.from('decrypted')),
    final: vi.fn(() => Buffer.from(''))
  }))
}));

vi.mock('zlib', () => ({
  gzip: vi.fn((data, callback) => callback(null, Buffer.from('compressed'))),
  gunzip: vi.fn((data, callback) => callback(null, Buffer.from('decompressed')))
}));

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(() => Promise.resolve()),
  writeFile: vi.fn(() => Promise.resolve()),
  readFile: vi.fn(() => Promise.resolve(Buffer.from('test-data'))),
  stat: vi.fn(() => Promise.resolve({ size: 1024 })),
  access: vi.fn(() => Promise.resolve()),
  unlink: vi.fn(() => Promise.resolve())
}));

describe('Backup Failure Notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockFindMany.mockResolvedValue([
      {
        id: 'admin-1',
        user: {
          email: 'admin1@school.com',
          active: true
        }
      },
      {
        id: 'admin-2',
        user: {
          email: 'admin2@school.com',
          active: true
        }
      }
    ]);
    
    mockSendEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id'
    });
  });

  describe('Email notification on backup failure', () => {
    it('should send email notification when backup fails', async () => {
      // Import after mocks are set up
      const { createBackup } = await import('./backup-service');
      
      // Mock a failure scenario by making the database export fail
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Database connection failed'));
      
      // Attempt backup with notification enabled
      const result = await createBackup(true, 'manual');
      
      // Verify backup failed
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Wait for async notification to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify email was sent
      expect(mockSendEmail).toHaveBeenCalled();
      
      // Verify email was sent to administrators
      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.to).toEqual(['admin1@school.com', 'admin2@school.com']);
      expect(emailCall.subject).toContain('URGENT');
      expect(emailCall.subject).toContain('Backup Failed');
      expect(emailCall.html).toContain('Database connection failed');
    });

    it('should include error details in notification email', async () => {
      const { createBackup } = await import('./backup-service');
      
      const testError = 'Insufficient disk space';
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error(testError));
      
      await createBackup(true, 'scheduled');
      
      // Wait for async notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSendEmail).toHaveBeenCalled();
      
      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain(testError);
      expect(emailCall.html).toContain('Error Message:');
    });

    it('should send to all active administrators', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'admin-1',
          user: { email: 'admin1@school.com', active: true }
        },
        {
          id: 'admin-2',
          user: { email: 'admin2@school.com', active: true }
        },
        {
          id: 'admin-3',
          user: { email: 'admin3@school.com', active: false } // Inactive
        }
      ]);
      
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      await createBackup(true, 'manual');
      
      // Wait for async notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSendEmail).toHaveBeenCalled();
      
      const emailCall = mockSendEmail.mock.calls[0][0];
      // Should only include active admins
      expect(emailCall.to).toEqual(['admin1@school.com', 'admin2@school.com']);
      expect(emailCall.to).not.toContain('admin3@school.com');
    });

    it('should not send notification when notifyOnFailure is false', async () => {
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      await createBackup(false, 'manual');
      
      // Wait a bit to ensure no async notification is sent
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should handle case when no administrators exist', async () => {
      mockFindMany.mockResolvedValue([]);
      
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      // Should not throw error even if no admins
      await expect(createBackup(true, 'manual')).resolves.toBeDefined();
      
      // Wait for async notification attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Email should not be sent if no admins
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should differentiate between manual and scheduled backup types', async () => {
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      
      // Test manual backup
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      await createBackup(true, 'manual');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSendEmail).toHaveBeenCalled();
      let emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.subject).toContain('Manual');
      expect(emailCall.html).toContain('Manual (User-triggered)');
      
      mockSendEmail.mockClear();
      
      // Test scheduled backup
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      await createBackup(true, 'scheduled');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSendEmail).toHaveBeenCalled();
      emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.subject).toContain('Scheduled');
      expect(emailCall.html).toContain('Scheduled (Daily 2:00 AM)');
    });

    it('should include recommended actions in notification', async () => {
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      await createBackup(true, 'manual');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Recommended Actions');
      expect(emailCall.html).toContain('database connectivity');
      expect(emailCall.html).toContain('disk space');
      expect(emailCall.html).toContain('encryption key');
    });

    it('should handle email service failure gracefully', async () => {
      mockSendEmail.mockResolvedValue({
        success: false,
        error: 'Email service unavailable'
      });
      
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      // Should not throw error even if email fails
      await expect(createBackup(true, 'manual')).resolves.toBeDefined();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSendEmail).toHaveBeenCalled();
    });
  });

  describe('Email content validation', () => {
    it('should include timestamp in notification', async () => {
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      await createBackup(true, 'manual');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Timestamp:');
    });

    it('should include system information in notification', async () => {
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      await createBackup(true, 'manual');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('System Information:');
      expect(emailCall.html).toContain('Environment:');
    });

    it('should use proper HTML formatting', async () => {
      const { createBackup } = await import('./backup-service');
      const { db } = await import('@/lib/db');
      vi.spyOn(db.user, 'findMany').mockRejectedValueOnce(new Error('Test error'));
      
      await createBackup(true, 'manual');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('<!DOCTYPE html>');
      expect(emailCall.html).toContain('<html>');
      expect(emailCall.html).toContain('</html>');
    });
  });
});
