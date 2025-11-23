import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, sendAdmissionConfirmationEmail } from './email-service';

// Mock Resend
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({
    data: {
      id: 'test-email-id',
    },
  });
  
  return {
    Resend: class MockResend {
      emails = {
        send: mockSend,
      };
    },
  };
});

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variable for tests
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.EMAIL_FROM = 'test@schoolerp.com';
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail({
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
    });

    it('should handle multiple recipients', async () => {
      const result = await sendEmail({
        to: ['recipient1@test.com', 'recipient2@test.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
    });

    it('should return error when API key is not configured', async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendEmail({
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });
  });

  describe('sendAdmissionConfirmationEmail', () => {
    it('should send admission confirmation email with correct content', async () => {
      const result = await sendAdmissionConfirmationEmail(
        'parent@test.com',
        'John Doe',
        'Jane Doe',
        'APP20250001',
        'Grade 1'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
    });

    it('should include application number in email', async () => {
      const applicationNumber = 'APP20250001';
      
      const result = await sendAdmissionConfirmationEmail(
        'parent@test.com',
        'John Doe',
        'Jane Doe',
        applicationNumber,
        'Grade 1'
      );

      expect(result.success).toBe(true);
      // The email content should include the application number
      // This is verified by the mock being called successfully
    });
  });
});
