/**
 * Receipt Report Scheduler
 * 
 * Handles automated scheduling and delivery of receipt reports.
 * Supports daily, weekly, and monthly report generation.
 */

import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, formatReportAsHTML, formatReportAsText } from "./receipt-report-service";
import { db } from "@/lib/db";

interface ReportSchedule {
  id: string;
  type: "daily" | "weekly" | "monthly";
  enabled: boolean;
  recipients: string[]; // Email addresses
  time: string; // HH:MM format
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Send report via email
 */
async function sendReportEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<void> {
  try {
    // Import email service dynamically
    const { sendEmail } = await import("@/lib/services/email-service");

    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject,
        html: htmlContent,
        text: textContent,
      });
    }

    console.log(`Report sent to ${recipients.length} recipients`);
  } catch (error) {
    console.error("Error sending report email:", error);
    throw error;
  }
}

/**
 * Generate and send daily report
 */
export async function runDailyReport(recipients: string[]): Promise<void> {
  try {
    console.log("Generating daily receipt report...");

    const report = await generateDailyReport();
    const htmlContent = formatReportAsHTML(report);
    const textContent = formatReportAsText(report);

    const subject = `Daily Receipt Verification Report - ${new Date().toLocaleDateString("en-IN")}`;

    await sendReportEmail(recipients, subject, htmlContent, textContent);

    console.log("Daily report sent successfully");
  } catch (error) {
    console.error("Error running daily report:", error);
    throw error;
  }
}

/**
 * Generate and send weekly report
 */
export async function runWeeklyReport(recipients: string[]): Promise<void> {
  try {
    console.log("Generating weekly receipt report...");

    const report = await generateWeeklyReport();
    const htmlContent = formatReportAsHTML(report);
    const textContent = formatReportAsText(report);

    const subject = `Weekly Receipt Verification Report - Week of ${report.startDate.toLocaleDateString("en-IN")}`;

    await sendReportEmail(recipients, subject, htmlContent, textContent);

    console.log("Weekly report sent successfully");
  } catch (error) {
    console.error("Error running weekly report:", error);
    throw error;
  }
}

/**
 * Generate and send monthly report
 */
export async function runMonthlyReport(recipients: string[]): Promise<void> {
  try {
    console.log("Generating monthly receipt report...");

    const report = await generateMonthlyReport();
    const htmlContent = formatReportAsHTML(report);
    const textContent = formatReportAsText(report);

    const subject = `Monthly Receipt Collection Report - ${report.startDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;

    await sendReportEmail(recipients, subject, htmlContent, textContent);

    console.log("Monthly report sent successfully");
  } catch (error) {
    console.error("Error running monthly report:", error);
    throw error;
  }
}

/**
 * Get report schedules from database
 */
export async function getReportSchedules(): Promise<ReportSchedule[]> {
  try {
    // For now, return default schedules
    // In production, these would be stored in database
    return [
      {
        id: "daily-report",
        type: "daily",
        enabled: true,
        recipients: [], // To be configured by admin
        time: "09:00", // 9 AM
      },
      {
        id: "weekly-report",
        type: "weekly",
        enabled: true,
        recipients: [], // To be configured by admin
        time: "09:00", // Monday 9 AM
      },
      {
        id: "monthly-report",
        type: "monthly",
        enabled: true,
        recipients: [], // To be configured by admin
        time: "09:00", // 1st of month 9 AM
      },
    ];
  } catch (error) {
    console.error("Error getting report schedules:", error);
    return [];
  }
}

/**
 * Update report schedule
 */
export async function updateReportSchedule(
  scheduleId: string,
  updates: Partial<ReportSchedule>
): Promise<void> {
  try {
    // In production, this would update the database
    console.log(`Updating schedule ${scheduleId}:`, updates);
  } catch (error) {
    console.error("Error updating report schedule:", error);
    throw error;
  }
}

/**
 * Run scheduled reports (called by cron job)
 */
export async function runScheduledReports(): Promise<void> {
  try {
    const schedules = await getReportSchedules();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDate = now.getDate();

    for (const schedule of schedules) {
      if (!schedule.enabled || schedule.recipients.length === 0) {
        continue;
      }

      const [hour, minute] = schedule.time.split(":").map(Number);

      // Check if it's time to run this report
      const isTimeToRun = currentHour === hour && currentMinute === minute;

      if (!isTimeToRun) {
        continue;
      }

      try {
        switch (schedule.type) {
          case "daily":
            await runDailyReport(schedule.recipients);
            break;

          case "weekly":
            // Run on Monday (day 1)
            if (currentDay === 1) {
              await runWeeklyReport(schedule.recipients);
            }
            break;

          case "monthly":
            // Run on 1st of month
            if (currentDate === 1) {
              await runMonthlyReport(schedule.recipients);
            }
            break;
        }
      } catch (error) {
        console.error(`Error running ${schedule.type} report:`, error);
        // Continue with other reports even if one fails
      }
    }
  } catch (error) {
    console.error("Error running scheduled reports:", error);
  }
}
