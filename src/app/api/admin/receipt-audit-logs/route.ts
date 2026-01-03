import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAllReceiptAuditLogs } from "@/lib/services/receipt-audit-service";
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
        { success: false, error: "Only administrators can view audit logs" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") as AuditAction | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filters
    const filters: any = {
      limit,
      offset,
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

    return NextResponse.json({
      success: true,
      logs: result.logs,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Error fetching receipt audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
