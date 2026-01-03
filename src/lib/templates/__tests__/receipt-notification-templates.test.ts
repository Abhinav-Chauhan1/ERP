/**
 * Tests for Receipt Notification Templates
 */

import { describe, it, expect } from "vitest";
import {
  getVerificationSuccessEmailTemplate,
  getRejectionEmailTemplate,
  getVerificationSuccessNotification,
  getRejectionNotification,
} from "../receipt-notification-templates";

describe("Receipt Notification Templates", () => {
  const mockVerificationData = {
    studentName: "John Doe",
    receiptReference: "RCP-20231225-0001",
    feeStructureName: "Tuition Fee - Term 1",
    amount: 5000,
    remainingBalance: 2000,
    paymentDate: "December 25, 2023",
  };

  const mockRejectionData = {
    studentName: "Jane Smith",
    receiptReference: "RCP-20231225-0002",
    feeStructureName: "Tuition Fee - Term 1",
    amount: 5000,
    rejectionReason: "Receipt image is unclear. Please upload a clearer image.",
    paymentDate: "December 25, 2023",
  };

  describe("getVerificationSuccessEmailTemplate", () => {
    it("should generate email template with all required fields", () => {
      const result = getVerificationSuccessEmailTemplate(mockVerificationData);

      expect(result.subject).toContain(mockVerificationData.receiptReference);
      expect(result.html).toContain(mockVerificationData.studentName);
      expect(result.html).toContain(mockVerificationData.receiptReference);
      expect(result.html).toContain(mockVerificationData.feeStructureName);
      expect(result.html).toContain("5,000.00");
      expect(result.html).toContain("2,000.00");
      expect(result.text).toContain(mockVerificationData.studentName);
      expect(result.text).toContain(mockVerificationData.receiptReference);
    });

    it("should include remaining balance message when balance > 0", () => {
      const result = getVerificationSuccessEmailTemplate(mockVerificationData);

      expect(result.html).toContain("remaining balance");
      expect(result.text).toContain("remaining balance");
    });

    it("should include completion message when balance = 0", () => {
      const dataWithZeroBalance = {
        ...mockVerificationData,
        remainingBalance: 0,
      };
      const result = getVerificationSuccessEmailTemplate(dataWithZeroBalance);

      expect(result.html).toContain("Congratulations");
      expect(result.html).toContain("complete");
      expect(result.text).toContain("Congratulations");
    });
  });

  describe("getRejectionEmailTemplate", () => {
    it("should generate email template with all required fields", () => {
      const result = getRejectionEmailTemplate(mockRejectionData);

      expect(result.subject).toContain(mockRejectionData.receiptReference);
      expect(result.html).toContain(mockRejectionData.studentName);
      expect(result.html).toContain(mockRejectionData.receiptReference);
      expect(result.html).toContain(mockRejectionData.feeStructureName);
      expect(result.html).toContain(mockRejectionData.rejectionReason);
      expect(result.text).toContain(mockRejectionData.studentName);
      expect(result.text).toContain(mockRejectionData.rejectionReason);
    });

    it("should include action required section", () => {
      const result = getRejectionEmailTemplate(mockRejectionData);

      expect(result.html).toContain("Action Required");
      expect(result.html).toContain("Upload New Receipt");
      expect(result.text).toContain("ACTION REQUIRED");
    });
  });

  describe("getVerificationSuccessNotification", () => {
    it("should generate in-app notification with correct structure", () => {
      const result = getVerificationSuccessNotification(mockVerificationData);

      expect(result.title).toBe("Payment Receipt Verified");
      expect(result.message).toContain(mockVerificationData.receiptReference);
      expect(result.message).toContain(mockVerificationData.feeStructureName);
      expect(result.message).toContain("5,000.00");
      expect(result.message).toContain("2,000.00");
      expect(result.type).toBe("RECEIPT_VERIFIED");
      expect(result.link).toBe("/student/fees/receipts");
    });
  });

  describe("getRejectionNotification", () => {
    it("should generate in-app notification with correct structure", () => {
      const result = getRejectionNotification(mockRejectionData);

      expect(result.title).toBe("Payment Receipt Rejected");
      expect(result.message).toContain(mockRejectionData.receiptReference);
      expect(result.message).toContain(mockRejectionData.feeStructureName);
      expect(result.message).toContain(mockRejectionData.rejectionReason);
      expect(result.type).toBe("RECEIPT_REJECTED");
      expect(result.link).toBe("/student/fees/upload-receipt");
    });
  });
});
