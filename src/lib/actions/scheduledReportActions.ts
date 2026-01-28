"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ReportConfig } from "./reportBuilderActions";
import { requireSchoolAccess, withSchoolId } from "@/lib/auth/tenant";

export interface ScheduledReportInput {
  name: string;
  description?: string;
  dataSource: string;
  selectedFields: string[];
  filters: any[];
  sorting: any[];
  frequency: "daily" | "weekly" | "monthly";
  scheduleTime: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  recipients: string[];
  exportFormat: "pdf" | "excel" | "csv";
}

/**
 * Calculate next run time based on schedule configuration
 */
function calculateNextRunTime(
  frequency: string,
  scheduleTime: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(":").map(Number);

  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case "daily":
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      // Set to the specified day of week
      const currentDay = nextRun.getDay();
      const targetDay = dayOfWeek ?? 0;
      let daysUntilTarget = targetDay - currentDay;

      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7;
      }

      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;

    case "monthly":
      // Set to the specified day of month
      const targetDate = dayOfMonth ?? 1;
      nextRun.setDate(targetDate);

      // If date has passed this month, move to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }

  return nextRun;
}

/**
 * Create a new scheduled report
 */
export async function createScheduledReport(input: ScheduledReportInput) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    if (!input.name || !input.dataSource || input.selectedFields.length === 0) {
      return { success: false, error: "Invalid report configuration" };
    }

    if (!input.recipients || input.recipients.length === 0) {
      return { success: false, error: "At least one recipient is required" };
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = input.recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return { success: false, error: `Invalid email addresses: ${invalidEmails.join(", ")}` };
    }

    // Calculate next run time
    const nextRunAt = calculateNextRunTime(
      input.frequency,
      input.scheduleTime,
      input.dayOfWeek,
      input.dayOfMonth
    );

    // Create scheduled report
    const scheduledReport = await prisma.scheduledReport.create({
      data: withSchoolId({
        name: input.name,
        description: input.description,
        dataSource: input.dataSource,
        selectedFields: JSON.stringify(input.selectedFields),
        filters: JSON.stringify(input.filters),
        sorting: JSON.stringify(input.sorting),
        frequency: input.frequency,
        scheduleTime: input.scheduleTime,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        recipients: JSON.stringify(input.recipients),
        exportFormat: input.exportFormat,
        nextRunAt,
        createdBy: userId,
      }, schoolId),
    });

    revalidatePath("/admin/reports");
    return { success: true, data: scheduledReport };
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    return { success: false, error: "Failed to create scheduled report" };
  }
}

/**
 * Get all scheduled reports
 */
export async function getScheduledReports() {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const reports = await prisma.scheduledReport.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON fields
    const parsedReports = reports.map((report) => ({
      ...report,
      selectedFields: JSON.parse(report.selectedFields),
      filters: JSON.parse(report.filters),
      sorting: JSON.parse(report.sorting),
      recipients: JSON.parse(report.recipients),
    }));

    return { success: true, data: parsedReports };
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return { success: false, error: "Failed to fetch scheduled reports" };
  }
}

/**
 * Get a single scheduled report by ID
 */
export async function getScheduledReport(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const report = await prisma.scheduledReport.findFirst({
      where: { id, schoolId },
    });

    if (!report) {
      return { success: false, error: "Scheduled report not found" };
    }

    // Parse JSON fields
    const parsedReport = {
      ...report,
      selectedFields: JSON.parse(report.selectedFields),
      filters: JSON.parse(report.filters),
      sorting: JSON.parse(report.sorting),
      recipients: JSON.parse(report.recipients),
    };

    return { success: true, data: parsedReport };
  } catch (error) {
    console.error("Error fetching scheduled report:", error);
    return { success: false, error: "Failed to fetch scheduled report" };
  }
}

/**
 * Update a scheduled report
 */
export async function updateScheduledReport(id: string, input: ScheduledReportInput) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    if (!input.name || !input.dataSource || input.selectedFields.length === 0) {
      return { success: false, error: "Invalid report configuration" };
    }

    if (!input.recipients || input.recipients.length === 0) {
      return { success: false, error: "At least one recipient is required" };
    }

    // Calculate next run time
    const nextRunAt = calculateNextRunTime(
      input.frequency,
      input.scheduleTime,
      input.dayOfWeek,
      input.dayOfMonth
    );

    // Verify ownership
    const report = await prisma.scheduledReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) return { success: false, error: "Scheduled report not found" };

    // Update scheduled report
    const scheduledReport = await prisma.scheduledReport.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        dataSource: input.dataSource,
        selectedFields: JSON.stringify(input.selectedFields),
        filters: JSON.stringify(input.filters),
        sorting: JSON.stringify(input.sorting),
        frequency: input.frequency,
        scheduleTime: input.scheduleTime,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        recipients: JSON.stringify(input.recipients),
        exportFormat: input.exportFormat,
        nextRunAt,
      },
    });

    revalidatePath("/admin/reports");
    return { success: true, data: scheduledReport };
  } catch (error) {
    console.error("Error updating scheduled report:", error);
    return { success: false, error: "Failed to update scheduled report" };
  }
}

/**
 * Delete a scheduled report
 */
export async function deleteScheduledReport(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const report = await prisma.scheduledReport.findFirst({
      where: { id, schoolId },
    });
    if (!report) return { success: false, error: "Scheduled report not found" };

    await prisma.scheduledReport.delete({
      where: { id },
    });

    revalidatePath("/admin/reports");
    return { success: true, message: "Scheduled report deleted successfully" };
  } catch (error) {
    console.error("Error deleting scheduled report:", error);
    return { success: false, error: "Failed to delete scheduled report" };
  }
}

/**
 * Toggle active status of a scheduled report
 */
export async function toggleScheduledReportStatus(id: string, active: boolean) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const report = await prisma.scheduledReport.findFirst({
      where: { id, schoolId },
    });

    if (!report) {
      return { success: false, error: "Scheduled report not found" };
    }

    // Recalculate next run time if activating
    let nextRunAt = report.nextRunAt;
    if (active && !report.active) {
      nextRunAt = calculateNextRunTime(
        report.frequency,
        report.scheduleTime,
        report.dayOfWeek ?? undefined,
        report.dayOfMonth ?? undefined
      );
    }

    await prisma.scheduledReport.update({
      where: { id },
      data: { active, nextRunAt },
    });

    revalidatePath("/admin/reports");
    return { success: true, message: `Scheduled report ${active ? "activated" : "deactivated"} successfully` };
  } catch (error) {
    console.error("Error toggling scheduled report status:", error);
    return { success: false, error: "Failed to toggle scheduled report status" };
  }
}

/**
 * Update last run time and calculate next run time
 */
export async function updateScheduledReportRunTime(id: string) {
  try {
    const report = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!report) {
      return { success: false, error: "Scheduled report not found" };
    }

    const nextRunAt = calculateNextRunTime(
      report.frequency,
      report.scheduleTime,
      report.dayOfWeek ?? undefined,
      report.dayOfMonth ?? undefined
    );

    await prisma.scheduledReport.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating scheduled report run time:", error);
    return { success: false, error: "Failed to update run time" };
  }
}
