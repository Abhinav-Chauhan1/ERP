/**
 * Integration Tests for Communication Service Message Logging
 * 
 * Validates that the communication service properly logs messages
 * when sending through different channels.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import * as messageLoggingService from '../message-logging-service';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    messageLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    parent: {
      findUnique: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    teacher: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

// Mock the channel services
vi.mock('../msg91-service', () => ({
  sendSMS: vi.fn(),
  sendSMSWithRetry: vi.fn(),
  isMSG91Configured: vi.fn(() => true),
}));

vi.mock('../whatsapp-service', () => ({
  sendTextMessage: vi.fn(),
  sendTextMessageWithRetry: vi.fn(),
  isWhatsAppConfigured: vi.fn(() => true),
}));

vi.mock('../email-service', () => ({
  sendEmail: vi.fn(),
  sendEmailWithRetry: vi.fn(),
  isEmailConfigured: vi.fn(() => true),
}));

describe('Communication Service Message Logging Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log messages when sending via SMS', async () => {
    const { sendSMSWithRetry } = await import('../msg91-service');
    
    // Mock successful SMS send
    vi.mocked(sendSMSWithRetry).mockResolvedValue({
      success: true,
      messageId: 'sms-123',
    });

    // Mock message logging
    const logMessageSpy = vi.spyOn(messageLoggingService, 'logMessage');
    const updateMessageStatusSpy = vi.spyOn(messageLoggingService, 'updateMessageStatus');

    logMessageSpy.mockResolvedValue({
      id: 'log-123',
      channel: 'SMS' as any,
      recipient: '+919876543210',
      status: 'QUEUED' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    updateMessageStatusSpy.mockResolvedValue({} as any);

    // Import and call the communication service
    const { sendNotification } = await import('../communication-service');

    // Mock user preferences
    vi.mocked(db.parent.findUnique).mockResolvedValue({
      id: 'parent-123',
      email: 'parent@example.com',
      phone: '+919876543210',
      settings: {
        smsNotifications: true,
        emailNotifications: false,
        preferredContactMethod: 'SMS',
      },
    } as any);

    await sendNotification({
      userId: 'parent-123',
      type: 'ATTENDANCE' as any,
      title: 'Test Notification',
      message: 'Test message',
      channels: ['SMS' as any],
    });

    // Verify logMessage was called
    expect(logMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'SMS',
        recipient: '+919876543210',
        userId: 'parent-123',
      })
    );

    // Verify updateMessageStatus was called after successful send
    expect(updateMessageStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'sms-123',
        status: 'SENT',
      })
    );
  });

  it('should log failed message attempts', async () => {
    const { sendSMSWithRetry } = await import('../msg91-service');
    
    // Mock failed SMS send
    vi.mocked(sendSMSWithRetry).mockResolvedValue({
      success: false,
      error: 'Invalid phone number',
      errorCode: '104',
    });

    // Mock message logging
    const logMessageSpy = vi.spyOn(messageLoggingService, 'logMessage');
    const updateMessageStatusSpy = vi.spyOn(messageLoggingService, 'updateMessageStatus');

    logMessageSpy.mockResolvedValue({
      id: 'log-456',
      channel: 'SMS' as any,
      recipient: 'invalid-number',
      status: 'QUEUED' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    updateMessageStatusSpy.mockResolvedValue({} as any);

    // Import and call the communication service
    const { sendNotification } = await import('../communication-service');

    // Mock user preferences
    vi.mocked(db.parent.findUnique).mockResolvedValue({
      id: 'parent-456',
      email: 'parent@example.com',
      phone: 'invalid-number',
      settings: {
        smsNotifications: true,
        emailNotifications: false,
        preferredContactMethod: 'SMS',
      },
    } as any);

    await sendNotification({
      userId: 'parent-456',
      type: 'ATTENDANCE' as any,
      title: 'Test Notification',
      message: 'Test message',
      channels: ['SMS' as any],
    });

    // Verify updateMessageStatus was called with FAILED status
    expect(updateMessageStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'log-456',
        status: 'FAILED',
        errorCode: '104',
        errorMessage: 'Invalid phone number',
      })
    );
  });
});

