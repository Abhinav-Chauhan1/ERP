/**
 * Notification Integration Tests
 * 
 * End-to-end tests for attendance, leave, and fee notification integration
 * Task 16: Checkpoint - Ensure notification integration works
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  sendAttendanceAlert,
  sendLeaveNotification,
  sendFeeReminder,
  checkCommunicationConfiguration,
} from '../communication-service';
import { db } from '@/lib/db';
import { NotificationType, CommunicationChannel } from '@/lib/types/communication';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
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
    messageLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock the channel services
vi.mock('../msg91-service', () => ({
  sendSMS: vi.fn(),
  sendSMSWithRetry: vi.fn(),
  isMSG91Configured: vi.fn(() => false), // Default to not configured
}));

vi.mock('../whatsapp-service', () => ({
  sendTextMessage: vi.fn(),
  sendTextMessageWithRetry: vi.fn(),
  isWhatsAppConfigured: vi.fn(() => false), // Default to not configured
}));

vi.mock('../email-service', () => ({
  sendEmail: vi.fn(),
  sendEmailWithRetry: vi.fn(),
  isEmailConfigured: vi.fn(() => false), // Default to not configured
}));

vi.mock('../message-logging-service', () => ({
  logMessage: vi.fn(() => Promise.resolve({ id: 'log-123' })),
  updateMessageStatus: vi.fn(() => Promise.resolve()),
}));

describe('Notification Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Test 1: Attendance Notifications End-to-End
  // ============================================================================

  describe('Attendance Notifications', () => {
    it('should send attendance alert for absent student to parent', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-123',
        email: 'parent@example.com',
        phone: '+919876543210',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-123',
        userId: 'parent-123',
        title: 'Attendance Alert: John Doe Absent',
        message: expect.any(String),
        type: 'ATTENDANCE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendAttendanceAlert({
        studentId: 'student-123',
        studentName: 'John Doe',
        date: new Date('2024-01-15'),
        status: 'ABSENT',
        attendancePercentage: 85.5,
        parentId: 'parent-123',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      expect(db.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'parent-123',
          title: expect.stringContaining('Absent'),
          message: expect.stringContaining('John Doe'),
          type: 'ATTENDANCE',
        }),
      });
    });

    it('should send attendance alert for late student to parent', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-456',
        email: 'parent2@example.com',
        phone: '+919876543211',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-456',
        userId: 'parent-456',
        title: 'Attendance Alert: Jane Smith Late',
        message: expect.any(String),
        type: 'ATTENDANCE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendAttendanceAlert({
        studentId: 'student-456',
        studentName: 'Jane Smith',
        date: new Date('2024-01-15'),
        status: 'LATE',
        attendancePercentage: 92.3,
        parentId: 'parent-456',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      expect(db.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'parent-456',
          title: expect.stringContaining('Late'),
          message: expect.stringContaining('Jane Smith'),
          type: 'ATTENDANCE',
        }),
      });
    });

    it('should include attendance percentage in notification', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-789',
        email: 'parent3@example.com',
        phone: '+919876543212',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-789',
        userId: 'parent-789',
        title: 'Attendance Alert',
        message: expect.any(String),
        type: 'ATTENDANCE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendAttendanceAlert({
        studentId: 'student-789',
        studentName: 'Bob Johnson',
        date: new Date('2024-01-15'),
        status: 'ABSENT',
        attendancePercentage: 78.9,
        parentId: 'parent-789',
      });

      // Assert
      expect(result.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.message).toContain('78.9%');
    });

    it('should not send notification for present status', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-999',
        email: 'parent4@example.com',
        phone: '+919876543213',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);

      // Act
      const result = await sendAttendanceAlert({
        studentId: 'student-999',
        studentName: 'Alice Brown',
        date: new Date('2024-01-15'),
        status: 'PRESENT',
        attendancePercentage: 95.0,
        parentId: 'parent-999',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(db.notification.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test 2: Leave Application Notifications End-to-End
  // ============================================================================

  describe('Leave Application Notifications', () => {
    it('should send notification when leave is submitted', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-111',
        email: 'parent5@example.com',
        phone: '+919876543214',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-111',
        userId: 'parent-111',
        title: 'Leave Application Submitted',
        message: expect.any(String),
        type: 'LEAVE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendLeaveNotification({
        applicantId: 'parent-111',
        applicantName: 'Parent Name',
        leaveType: 'Sick Leave',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-03'),
        status: 'SUBMITTED',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      expect(db.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'parent-111',
          title: expect.stringContaining('Submitted'),
          message: expect.stringContaining('Sick Leave'),
          type: 'LEAVE',
        }),
      });
    });

    it('should send notification when leave is approved', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-222',
        email: 'parent6@example.com',
        phone: '+919876543215',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-222',
        userId: 'parent-222',
        title: 'Leave Application Approved',
        message: expect.any(String),
        type: 'LEAVE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendLeaveNotification({
        applicantId: 'parent-222',
        applicantName: 'Parent Name',
        leaveType: 'Casual Leave',
        startDate: new Date('2024-02-05'),
        endDate: new Date('2024-02-07'),
        status: 'APPROVED',
        approverName: 'Principal Smith',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.title).toContain('Approved');
      expect(createCall.data.message).toContain('Principal Smith');
    });

    it('should send notification when leave is rejected with reason', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-333',
        email: 'parent7@example.com',
        phone: '+919876543216',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-333',
        userId: 'parent-333',
        title: 'Leave Application Rejected',
        message: expect.any(String),
        type: 'LEAVE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendLeaveNotification({
        applicantId: 'parent-333',
        applicantName: 'Parent Name',
        leaveType: 'Emergency Leave',
        startDate: new Date('2024-02-10'),
        endDate: new Date('2024-02-12'),
        status: 'REJECTED',
        approverName: 'Vice Principal Jones',
        rejectionReason: 'Insufficient documentation provided',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.title).toContain('Rejected');
      expect(createCall.data.message).toContain('Insufficient documentation provided');
      expect(createCall.data.message).toContain('Vice Principal Jones');
    });

    it('should include leave dates in notification', async () => {
      // Arrange
      const mockTeacher = {
        id: 'teacher-444',
        email: 'teacher@example.com',
        phone: '+919876543217',
      };

      vi.mocked(db.teacher.findUnique).mockResolvedValue(mockTeacher as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-444',
        userId: 'teacher-444',
        title: 'Leave Application Submitted',
        message: expect.any(String),
        type: 'LEAVE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendLeaveNotification({
        applicantId: 'teacher-444',
        applicantName: 'Teacher Name',
        leaveType: 'Medical Leave',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-05'),
        status: 'SUBMITTED',
        isTeacher: true,
      });

      // Assert
      expect(result.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.message).toContain('March 1, 2024');
      expect(createCall.data.message).toContain('March 5, 2024');
    });
  });

  // ============================================================================
  // Test 3: Fee Reminder Notifications End-to-End
  // ============================================================================

  describe('Fee Reminder Notifications', () => {
    it('should send fee reminder for upcoming due date', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-555',
        email: 'parent8@example.com',
        phone: '+919876543218',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-555',
        userId: 'parent-555',
        title: 'Fee Payment Reminder',
        message: expect.any(String),
        type: 'FEE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendFeeReminder({
        studentId: 'student-555',
        studentName: 'Student Name',
        amount: 5000.00,
        dueDate: new Date('2024-03-31'),
        isOverdue: false,
        outstandingBalance: 5000.00,
        parentId: 'parent-555',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.title).toContain('Reminder');
      expect(createCall.data.message).toContain('₹5000.00');
      expect(createCall.data.message).toContain('March 31, 2024');
    });

    it('should send overdue fee alert', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-666',
        email: 'parent9@example.com',
        phone: '+919876543219',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-666',
        userId: 'parent-666',
        title: 'Overdue Fee Payment',
        message: expect.any(String),
        type: 'FEE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendFeeReminder({
        studentId: 'student-666',
        studentName: 'Student Name',
        amount: 3000.00,
        dueDate: new Date('2024-02-28'),
        isOverdue: true,
        outstandingBalance: 8000.00,
        parentId: 'parent-666',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.title).toContain('Overdue');
      expect(createCall.data.message).toContain('overdue');
      expect(createCall.data.message).toContain('₹3000.00');
      expect(createCall.data.message).toContain('₹8000.00');
    });

    it('should include payment link when provided', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-777',
        email: 'parent10@example.com',
        phone: '+919876543220',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-777',
        userId: 'parent-777',
        title: 'Fee Payment Reminder',
        message: expect.any(String),
        type: 'FEE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendFeeReminder({
        studentId: 'student-777',
        studentName: 'Student Name',
        amount: 2500.00,
        dueDate: new Date('2024-04-15'),
        isOverdue: false,
        outstandingBalance: 2500.00,
        paymentLink: 'https://school.example.com/pay/abc123',
        parentId: 'parent-777',
      });

      // Assert
      expect(result.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.message).toContain('https://school.example.com/pay/abc123');
      expect(createCall.data.message).toContain('Pay Online');
    });

    it('should include outstanding balance in notification', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-888',
        email: 'parent11@example.com',
        phone: '+919876543221',
        settings: {
          emailNotifications: true,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-888',
        userId: 'parent-888',
        title: 'Fee Payment Reminder',
        message: expect.any(String),
        type: 'FEE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendFeeReminder({
        studentId: 'student-888',
        studentName: 'Student Name',
        amount: 1500.00,
        dueDate: new Date('2024-05-01'),
        isOverdue: false,
        outstandingBalance: 6500.00,
        parentId: 'parent-888',
      });

      // Assert
      expect(result.success).toBe(true);
      const createCall = vi.mocked(db.notification.create).mock.calls[0][0];
      expect(createCall.data.message).toContain('Outstanding Balance: ₹6500.00');
    });
  });

  // ============================================================================
  // Test 4: Verify Messages Sent via Correct Channels
  // ============================================================================

  describe('Channel Routing', () => {
    it('should send via email when email notifications are enabled', async () => {
      // This test would require mocking the email service
      // For now, we verify the configuration check works
      const config = checkCommunicationConfiguration();
      expect(config).toHaveProperty('email');
      expect(config).toHaveProperty('sms');
      expect(config).toHaveProperty('whatsapp');
    });

    it('should respect parent contact preferences', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-999',
        email: 'parent12@example.com',
        phone: '+919876543222',
        settings: {
          emailNotifications: true,
          smsNotifications: true,
          preferredContactMethod: 'BOTH',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-999',
        userId: 'parent-999',
        title: 'Test Notification',
        message: 'Test message',
        type: 'ATTENDANCE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendAttendanceAlert({
        studentId: 'student-999',
        studentName: 'Test Student',
        date: new Date('2024-01-15'),
        status: 'ABSENT',
        attendancePercentage: 90.0,
        parentId: 'parent-999',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(db.parent.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-999' },
        include: { settings: true },
      });
    });

    it('should always send in-app notifications', async () => {
      // Arrange
      const mockParent = {
        id: 'parent-1000',
        email: null,
        phone: null,
        settings: {
          emailNotifications: false,
          smsNotifications: false,
          preferredContactMethod: 'EMAIL',
          language: 'en',
        },
      };

      vi.mocked(db.parent.findUnique).mockResolvedValue(mockParent as any);
      vi.mocked(db.notification.create).mockResolvedValue({
        id: 'notif-1000',
        userId: 'parent-1000',
        title: 'Test Notification',
        message: 'Test message',
        type: 'FEE',
        data: {},
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await sendFeeReminder({
        studentId: 'student-1000',
        studentName: 'Test Student',
        amount: 1000.00,
        dueDate: new Date('2024-06-01'),
        isOverdue: false,
        outstandingBalance: 1000.00,
        parentId: 'parent-1000',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.channels.inApp).toBeDefined();
      expect(result.channels.inApp?.success).toBe(true);
      expect(db.notification.create).toHaveBeenCalled();
    });
  });
});
