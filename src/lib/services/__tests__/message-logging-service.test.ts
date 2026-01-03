/**
 * Tests for Message Logging Service
 * 
 * Validates message logging functionality according to Requirements 4.1, 15.1, 17.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  logMessage,
  updateMessageStatus,
  getMessageLogs,
  getMessageLogById,
  getMessageLogByMessageId,
  getMessageStatsByChannel,
  getDeliveryRate,
} from '../message-logging-service';
import { CommunicationChannel, MessageLogStatus } from '@prisma/client';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    messageLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('Message Logging Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logMessage', () => {
    it('should create a message log entry with hashed content', async () => {
      const mockLog = {
        id: 'log-123',
        channel: CommunicationChannel.SMS,
        recipient: '+919876543210',
        userId: 'user-123',
        templateId: null,
        subject: null,
        body: 'hashed_content',
        status: MessageLogStatus.QUEUED,
        messageId: null,
        errorCode: null,
        errorMessage: null,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
        estimatedCost: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.messageLog.create).mockResolvedValue(mockLog);

      const result = await logMessage({
        channel: CommunicationChannel.SMS,
        recipient: '+919876543210',
        userId: 'user-123',
        body: 'Test message',
      });

      expect(db.messageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: CommunicationChannel.SMS,
          recipient: '+919876543210',
          userId: 'user-123',
          status: MessageLogStatus.QUEUED,
        }),
      });

      expect(result.id).toBe('log-123');
      expect(result.channel).toBe(CommunicationChannel.SMS);
    });

    it('should hash message body for privacy (Requirement 17.2)', async () => {
      const mockLog = {
        id: 'log-123',
        channel: CommunicationChannel.WHATSAPP,
        recipient: '+919876543210',
        userId: 'user-123',
        templateId: null,
        subject: null,
        body: 'some_hash_value',
        status: MessageLogStatus.QUEUED,
        messageId: null,
        errorCode: null,
        errorMessage: null,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
        estimatedCost: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.messageLog.create).mockResolvedValue(mockLog);

      await logMessage({
        channel: CommunicationChannel.WHATSAPP,
        recipient: '+919876543210',
        userId: 'user-123',
        body: 'Sensitive message content',
      });

      const createCall = vi.mocked(db.messageLog.create).mock.calls[0][0];
      
      // Body should be hashed, not plain text
      expect(createCall.data.body).not.toBe('Sensitive message content');
      expect(createCall.data.body).toBeTruthy();
    });

    it('should include metadata when provided', async () => {
      const mockLog = {
        id: 'log-123',
        channel: CommunicationChannel.SMS,
        recipient: '+919876543210',
        userId: 'user-123',
        templateId: null,
        subject: null,
        body: null,
        status: MessageLogStatus.QUEUED,
        messageId: null,
        errorCode: null,
        errorMessage: null,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
        estimatedCost: null,
        metadata: { dltTemplateId: 'DLT123' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.messageLog.create).mockResolvedValue(mockLog);

      await logMessage({
        channel: CommunicationChannel.SMS,
        recipient: '+919876543210',
        userId: 'user-123',
        metadata: { dltTemplateId: 'DLT123' },
      });

      expect(db.messageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { dltTemplateId: 'DLT123' },
        }),
      });
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message status to SENT', async () => {
      const existingLog = {
        id: 'log-123',
        messageId: 'msg-456',
        status: MessageLogStatus.QUEUED,
        sentAt: null,
      };

      const updatedLog = {
        ...existingLog,
        status: MessageLogStatus.SENT,
        sentAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.messageLog.findFirst).mockResolvedValue(existingLog as any);
      vi.mocked(db.messageLog.update).mockResolvedValue(updatedLog as any);

      const result = await updateMessageStatus({
        messageId: 'msg-456',
        status: MessageLogStatus.SENT,
      });

      expect(db.messageLog.update).toHaveBeenCalledWith({
        where: { id: 'log-123' },
        data: expect.objectContaining({
          status: MessageLogStatus.SENT,
          sentAt: expect.any(Date),
        }),
      });
    });

    it('should update message status to FAILED with error details', async () => {
      const existingLog = {
        id: 'log-123',
        messageId: 'msg-456',
        status: MessageLogStatus.SENDING,
      };

      const updatedLog = {
        ...existingLog,
        status: MessageLogStatus.FAILED,
        errorCode: '102',
        errorMessage: 'Invalid authentication key',
        failedAt: new Date(),
      };

      vi.mocked(db.messageLog.findFirst).mockResolvedValue(existingLog as any);
      vi.mocked(db.messageLog.update).mockResolvedValue(updatedLog as any);

      await updateMessageStatus({
        messageId: 'msg-456',
        status: MessageLogStatus.FAILED,
        errorCode: '102',
        errorMessage: 'Invalid authentication key',
      });

      expect(db.messageLog.update).toHaveBeenCalledWith({
        where: { id: 'log-123' },
        data: expect.objectContaining({
          status: MessageLogStatus.FAILED,
          errorCode: '102',
          errorMessage: 'Invalid authentication key',
          failedAt: expect.any(Date),
        }),
      });
    });

    it('should throw error if message log not found', async () => {
      vi.mocked(db.messageLog.findFirst).mockResolvedValue(null);

      await expect(
        updateMessageStatus({
          messageId: 'non-existent',
          status: MessageLogStatus.SENT,
        })
      ).rejects.toThrow('Message log not found');
    });
  });

  describe('getMessageLogs', () => {
    it('should retrieve message logs with filtering (Requirement 15.1)', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          channel: CommunicationChannel.SMS,
          recipient: '+919876543210',
          userId: 'user-123',
          status: MessageLogStatus.DELIVERED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'log-2',
          channel: CommunicationChannel.SMS,
          recipient: '+919876543211',
          userId: 'user-123',
          status: MessageLogStatus.SENT,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.messageLog.count).mockResolvedValue(2);
      vi.mocked(db.messageLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await getMessageLogs({
        channel: CommunicationChannel.SMS,
        userId: 'user-123',
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should support pagination', async () => {
      const mockLogs = Array(10).fill(null).map((_, i) => ({
        id: `log-${i}`,
        channel: CommunicationChannel.EMAIL,
        recipient: `user${i}@example.com`,
        status: MessageLogStatus.SENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      vi.mocked(db.messageLog.count).mockResolvedValue(100);
      vi.mocked(db.messageLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await getMessageLogs({
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toHaveLength(10);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      vi.mocked(db.messageLog.count).mockResolvedValue(5);
      vi.mocked(db.messageLog.findMany).mockResolvedValue([]);

      await getMessageLogs({
        startDate,
        endDate,
      });

      expect(db.messageLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });
  });

  describe('getMessageStatsByChannel', () => {
    it('should calculate statistics by channel (Requirement 15.1)', async () => {
      const mockLogs = [
        {
          channel: CommunicationChannel.SMS,
          status: MessageLogStatus.DELIVERED,
          estimatedCost: 0.05,
        },
        {
          channel: CommunicationChannel.SMS,
          status: MessageLogStatus.SENT,
          estimatedCost: 0.05,
        },
        {
          channel: CommunicationChannel.WHATSAPP,
          status: MessageLogStatus.DELIVERED,
          estimatedCost: 0.02,
        },
        {
          channel: CommunicationChannel.SMS,
          status: MessageLogStatus.FAILED,
          estimatedCost: 0.05,
        },
      ];

      vi.mocked(db.messageLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await getMessageStatsByChannel();

      expect(result).toHaveLength(2);
      
      const smsStats = result.find(s => s.channel === CommunicationChannel.SMS);
      expect(smsStats).toBeDefined();
      expect(smsStats?.total).toBe(3);
      expect(smsStats?.sent).toBe(1);
      expect(smsStats?.delivered).toBe(1);
      expect(smsStats?.failed).toBe(1);
      expect(smsStats?.totalCost).toBeCloseTo(0.15);

      const whatsappStats = result.find(s => s.channel === CommunicationChannel.WHATSAPP);
      expect(whatsappStats).toBeDefined();
      expect(whatsappStats?.total).toBe(1);
      expect(whatsappStats?.delivered).toBe(1);
    });
  });

  describe('getDeliveryRate', () => {
    it('should calculate delivery rate percentage', async () => {
      vi.mocked(db.messageLog.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(85);  // delivered

      const rate = await getDeliveryRate(CommunicationChannel.SMS);

      expect(rate).toBe(85);
    });

    it('should return 0 when no messages exist', async () => {
      vi.mocked(db.messageLog.count).mockResolvedValue(0);

      const rate = await getDeliveryRate(CommunicationChannel.EMAIL);

      expect(rate).toBe(0);
    });
  });
});

