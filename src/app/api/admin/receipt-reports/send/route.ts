import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  runDailyReport,
  runWeeklyReport,
  runMonthlyReport,
} from "@/lib/services/receipt-report-scheduler";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user in database
    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can send reports" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { type, recipients } = body;

    if (!type || !["daily", "weekly", "monthly"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid report type. Must be daily, weekly, or monthly." },
        { status: 400 }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Recipients array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    // Send report
    try {
      switch (type) {
        case "daily":
          await runDailyReport(recipients);
          break;
        case "weekly":
          await runWeeklyReport(recipients);
          break;
        case "monthly":
          await runMonthlyReport(recipients);
          break;
      }

      return NextResponse.json({
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} report sent to ${recipients.length} recipient(s)`,
      });
    } catch (emailError) {
      console.error("Error sending report email:", emailError);
      return NextResponse.json(
        { success: false, error: "Failed to send report email. Please check email service configuration." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send report" },
      { status: 500 }
    );
  }
}
