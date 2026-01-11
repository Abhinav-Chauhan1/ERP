/**
 * Promotion Audit Logging Tests
 * 
 * Tests to verify audit logging for promotion operations
 * 
 * Requirements: 14.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditAction } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    promotionHistory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((header: string) => {
      if (header === "x-forwarded-for") return "192.168.1.1";
      if (header === "user-agent") return "Mozilla/5.0";
      return null;
    }),
  })),
}));

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logAudit } from "@/lib/utils/audit-log";

describe("Promotion Audit Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Bulk Promotion Execution", () => {
    it("should log bulk promotion with all required details", async () => {
      const userId = "admin-123";
      const historyId = "promo-hist-456";

      await logAudit({
        userId,
        action: AuditAction.CREATE,
        resource: "PROMOTION",
        resourceId: historyId,
        changes: {
          operation: "BULK_PROMOTION",
          sourceClass: "Grade 10",
          sourceSection: "A",
          sourceAcademicYear: "2023-2024",
          targetClass: "Grade 11",
          targetSection: "A",
          targetAcademicYear: "2024-2025",
          totalStudents: 50,
          promoted: 48,
          excluded: 2,
          failed: 0,
          rollNumberStrategy: "auto",
          notificationsEnabled: true,
        },
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          action: AuditAction.CREATE,
          resource: "PROMOTION",
          resourceId: historyId,
          changes: expect.objectContaining({
            operation: "BULK_PROMOTION",
            sourceClass: "Grade 10",
            targetClass: "Grade 11",
            totalStudents: 50,
            promoted: 48,
          }),
        }),
      });
    });

    it("should include IP address and user agent", async () => {
      const userId = "admin-123";

      await logAudit({
        userId,
        action: AuditAction.CREATE,
        resource: "PROMOTION",
        changes: {
          operation: "BULK_PROMOTION",
        },
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      });
    });
  });

  describe("Promotion Rollback", () => {
    it("should log promotion rollback with reason", async () => {
      const userId = "admin-123";
      const historyId = "promo-hist-456";
      const reason = "Incorrect target class selected";

      await logAudit({
        userId,
        action: AuditAction.DELETE,
        resource: "PROMOTION",
        resourceId: historyId,
        changes: {
          operation: "PROMOTION_ROLLBACK",
          reason,
          studentsAffected: 48,
          sourceClass: "Grade 10",
          targetClass: "Grade 11",
        },
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          action: AuditAction.DELETE,
          resource: "PROMOTION",
          resourceId: historyId,
          changes: expect.objectContaining({
            operation: "PROMOTION_ROLLBACK",
            reason,
            studentsAffected: 48,
          }),
        }),
      });
    });
  });

  describe("View Promotion History", () => {
    it("should log viewing promotion history with filters", async () => {
      const userId = "admin-123";

      await logAudit({
        userId,
        action: AuditAction.VIEW,
        resource: "PROMOTION_HISTORY",
        changes: {
          operation: "VIEW_PROMOTION_HISTORY",
          filters: {
            academicYear: "2023-2024",
            classId: "class-123",
          },
          resultCount: 15,
        },
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          action: AuditAction.VIEW,
          resource: "PROMOTION_HISTORY",
          changes: expect.objectContaining({
            operation: "VIEW_PROMOTION_HISTORY",
            resultCount: 15,
          }),
        }),
      });
    });
  });

  describe("View Promotion Details", () => {
    it("should log viewing specific promotion details", async () => {
      const userId = "admin-123";
      const historyId = "promo-hist-456";

      await logAudit({
        userId,
        action: AuditAction.VIEW,
        resource: "PROMOTION_HISTORY",
        resourceId: historyId,
        changes: {
          operation: "VIEW_PROMOTION_DETAILS",
          studentCount: 48,
        },
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          action: AuditAction.VIEW,
          resource: "PROMOTION_HISTORY",
          resourceId: historyId,
          changes: expect.objectContaining({
            operation: "VIEW_PROMOTION_DETAILS",
            studentCount: 48,
          }),
        }),
      });
    });
  });

  describe("Error Handling", () => {
    it("should not throw error if audit logging fails", async () => {
      vi.mocked(db.auditLog.create).mockRejectedValueOnce(
        new Error("Database error")
      );

      // Should not throw
      await expect(
        logAudit({
          userId: "admin-123",
          action: AuditAction.CREATE,
          resource: "PROMOTION",
          changes: { operation: "TEST" },
        })
      ).resolves.not.toThrow();
    });
  });
});
