/**
 * API Route for nightly FeeInvoiceSummary recalculation.
 *
 * FeeInvoiceSummary rows are also kept in sync on payments, discounts,
 * and enrollment changes (see fee-invoice-service.ts callers), but recurring
 * fees (Monthly/Quarterly/Semi-Annual) accrue more "due" amount purely with
 * the passage of time, with no discrete event to hook. This sweep catches
 * that drift so dashboard/finance "pending fees" stays current even for
 * schools with no payment activity on a given day.
 *
 * Vercel Cron invokes via GET with an auto-injected `Authorization: Bearer
 * $CRON_SECRET` header (see cleanup-sessions/subscription-renewal for the
 * same pattern in this codebase). POST is also wired up, for manual runs.
 *
 * Vercel Cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/recalculate-fee-invoices",
 *     "schedule": "0 4 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncFeeInvoiceSummariesForSchool } from "@/lib/services/fee-invoice-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && forwardedProto !== "https") {
    return false;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

async function runRecalculation() {
  const timestamp = new Date();
  const schools = await db.school.findMany({ select: { id: true, name: true } });

  let totalStudentsProcessed = 0;
  const perSchool: Array<{ schoolId: string; name: string; studentsProcessed: number }> = [];

  for (const school of schools) {
    try {
      const { studentsProcessed } = await syncFeeInvoiceSummariesForSchool(school.id);
      totalStudentsProcessed += studentsProcessed;
      perSchool.push({ schoolId: school.id, name: school.name, studentsProcessed });
    } catch (schoolError) {
      console.error(`[cron/recalculate-fee-invoices] Failed for school ${school.id}:`, schoolError);
      perSchool.push({ schoolId: school.id, name: school.name, studentsProcessed: 0 });
    }
  }

  console.log(
    `✅ Fee invoice recalculation completed: ${totalStudentsProcessed} students across ${schools.length} schools`
  );

  return {
    success: true,
    schoolsProcessed: schools.length,
    totalStudentsProcessed,
    perSchool,
    timestamp: timestamp.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron/recalculate-fee-invoices] CRON_SECRET environment variable is not configured");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRecalculation();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Fee invoice recalculation error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron/recalculate-fee-invoices] CRON_SECRET environment variable is not configured");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRecalculation();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Fee invoice recalculation error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
