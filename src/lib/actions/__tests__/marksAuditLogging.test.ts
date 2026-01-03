/**
 * Integration tests for marks entry audit logging
 * 
 * Tests verify that audit logs are created correctly when marks are entered or modified.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { logCreate, logUpdate } from "@/lib/utils/audit-log";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === "x-forwarded-for") return "192.168.1.1";
      if (key === "user-agent") return "Mozilla/5.0";
      return null;
    }),
  })),
}));

describe("Marks Entry Audit Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create audit log when new marks are entered", async () => {
    const userId = "user123";
    const resourceId = "result123";
    const marksData = {
      examId: "exam123",
      studentId: "student123",
      theoryMarks: 85,
      practicalMarks: 18,
      internalMarks: 10,
      totalMarks: 113,
      percentage: 75.33,
      grade: "B+",
      isAbsent: false,
    };

    await logCreate(userId, "ExamResult", resourceId, marksData);

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        action: "CREATE",
        resource: "ExamResult",
        resourceId,
        changes: { created: marksData },
      }),
    });
  });

  it("should create audit log when marks are updated with before/after values", async () => {
    const userId = "user123";
    const resourceId = "result123";
    const beforeData = {
      theoryMarks: 80,
      practicalMarks: 15,
      internalMarks: 8,
      totalMarks: 103,
      percentage: 68.67,
      grade: "B",
      isAbsent: false,
    };
    const afterData = {
      theoryMarks: 85,
      practicalMarks: 18,
      internalMarks: 10,
      totalMarks: 113,
      percentage: 75.33,
      grade: "B+",
      isAbsent: false,
    };

    await logUpdate(userId, "ExamResult", resourceId, {
      before: beforeData,
      after: afterData,
    });

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        action: "UPDATE",
        resource: "ExamResult",
        resourceId,
        changes: {
          before: beforeData,
          after: afterData,
        },
      }),
    });
  });

  it("should capture IP address and user agent in audit log", async () => {
    const userId = "user123";
    const resourceId = "result123";

    await logCreate(userId, "ExamResult", resourceId, {});

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      }),
    });
  });

  it("should handle absent student marks entry", async () => {
    const userId = "user123";
    const resourceId = "result123";
    const marksData = {
      examId: "exam123",
      studentId: "student123",
      theoryMarks: null,
      practicalMarks: null,
      internalMarks: null,
      totalMarks: 0,
      percentage: 0,
      grade: null,
      isAbsent: true,
    };

    await logCreate(userId, "ExamResult", resourceId, marksData);

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        changes: { created: marksData },
      }),
    });
  });

  it("should track changes when student is marked absent after having marks", async () => {
    const userId = "user123";
    const resourceId = "result123";
    const beforeData = {
      theoryMarks: 85,
      practicalMarks: 18,
      internalMarks: 10,
      totalMarks: 113,
      percentage: 75.33,
      grade: "B+",
      isAbsent: false,
    };
    const afterData = {
      theoryMarks: null,
      practicalMarks: null,
      internalMarks: null,
      totalMarks: 0,
      percentage: 0,
      grade: null,
      isAbsent: true,
    };

    await logUpdate(userId, "ExamResult", resourceId, {
      before: beforeData,
      after: afterData,
    });

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        changes: {
          before: beforeData,
          after: afterData,
        },
      }),
    });
  });
});
