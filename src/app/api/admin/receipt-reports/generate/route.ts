import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  formatReportAsHTML,
  formatReportAsText,
} from "@/lib/services/receipt-report-service";

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
        { success: false, error: "Only administrators can generate reports" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { type, format = "json", date } = body;

    if (!type || !["daily", "weekly", "monthly"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid report type. Must be daily, weekly, or monthly." },
        { status: 400 }
      );
    }

    // Generate report
    let report;
    const reportDate = date ? new Date(date) : new Date();

    switch (type) {
      case "daily":
        report = await generateDailyReport(reportDate);
        break;
      case "weekly":
        report = await generateWeeklyReport(reportDate);
        break;
      case "monthly":
        report = await generateMonthlyReport(reportDate);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Format response based on requested format
    if (format === "html") {
      const html = formatReportAsHTML(report);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      });
    } else if (format === "text") {
      const text = formatReportAsText(report);
      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } else {
      // Return JSON by default
      return NextResponse.json({
        success: true,
        report,
      });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
