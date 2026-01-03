import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAllReceiptAuditLogs, exportAuditLogsToCSV } from "@/lib/services/receipt-audit-service";
import { AuditAction } from "@prisma/client";

export async function GET(request: NextRequest) {
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
        { success: false, error: "Only administrators can export audit logs" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") as AuditAction | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filters (no limit for export)
    const filters: any = {
      limit: 10000, // Export up to 10,000 records
      offset: 0,
    };

    if (action) {
      filters.action = action;
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    // Fetch audit logs
    const result = await getAllReceiptAuditLogs(filters);

    // Convert to CSV
    const csv = exportAuditLogsToCSV(result.logs);

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="receipt-audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting receipt audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}
