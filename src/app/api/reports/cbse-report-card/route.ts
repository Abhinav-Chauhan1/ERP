import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aggregateMultiTermReportCardData } from "@/lib/services/report-card-data-aggregation";
import {
  generateCBSEReportCardPDF,
  generateBatchCBSEReportCards,
} from "@/lib/services/report-card-cbse-renderer";

/**
 * GET /api/reports/cbse-report-card?studentId=...&academicYearId=...
 *
 * Streams a CBSE multi-term report card PDF back to the browser.
 * Supports both single and batch modes via query params.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");
    const studentIds = searchParams.get("studentIds"); // comma-separated for batch
    const academicYearId = searchParams.get("academicYearId");
    const affiliationNo = searchParams.get("affiliationNo") ?? undefined;
    const schoolCode = searchParams.get("schoolCode") ?? undefined;

    if (!academicYearId) {
      return NextResponse.json(
        { error: "academicYearId is required" },
        { status: 400 },
      );
    }

    /** Resolve school branding from DB for a given schoolId */
    async function resolveSchoolOptions(schoolId: string) {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { name: true, address: true, phone: true, email: true, logo: true, schoolCode: true, metadata: true },
      });
      const meta = school?.metadata as Record<string, string> | null;

      // Always fetch SchoolSettings for settings-only fields (affiliationNumber, schoolWebsite)
      const ss = await db.schoolSettings.findFirst({
        where: { schoolId },
        select: { schoolName: true, schoolAddress: true, schoolPhone: true, schoolEmail: true, schoolLogo: true, schoolWebsite: true, affiliationNumber: true },
      });

      // School model is authoritative (kept in sync by settingsActions)
      const resolvedName    = school?.name    || ss?.schoolName    || undefined;
      const resolvedAddress = school?.address || ss?.schoolAddress || undefined;
      const resolvedPhone   = school?.phone   || ss?.schoolPhone   || undefined;
      const resolvedEmail   = school?.email   || ss?.schoolEmail   || undefined;
      const resolvedCode    = school?.schoolCode || undefined;

      // Logo: prefer school.logo (R2 upload), fall back to SchoolSettings.schoolLogo
      let logoUrl = school?.logo ?? ss?.schoolLogo ?? undefined;
      if (logoUrl && !logoUrl.startsWith("http") && !logoUrl.startsWith("data:")) {
        const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
        logoUrl = `${base}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
      }
      return {
        schoolName:    resolvedName,
        schoolAddress: resolvedAddress,
        schoolPhone:   resolvedPhone,
        schoolEmail:   resolvedEmail,
        schoolWebsite: ss?.schoolWebsite ?? undefined,
        schoolLogo:    logoUrl,
        affiliationNo: affiliationNo ?? ss?.affiliationNumber ?? meta?.affiliationNo ?? undefined,
        schoolCode:    schoolCode ?? resolvedCode ?? undefined,
      };
    }

    let pdfBuffer: Buffer;
    let fileName: string;

    if (studentIds) {
      const ids = studentIds.split(",").map((s) => s.trim());
      const dataList = await Promise.all(
        ids.map((id) => aggregateMultiTermReportCardData(id, academicYearId)),
      );
      const opts = dataList.length > 0
        ? await resolveSchoolOptions(dataList[0].student.schoolId)
        : {};
      pdfBuffer = await generateBatchCBSEReportCards(dataList, opts);
      fileName = `CBSE_Report_Cards_Batch.pdf`;
    } else if (studentId) {
      const data = await aggregateMultiTermReportCardData(studentId, academicYearId);
      const opts = await resolveSchoolOptions(data.student.schoolId);
      pdfBuffer = await generateCBSEReportCardPDF(data, opts);
      fileName = `CBSE_Report_Card_${data.student.name.replace(/\s+/g, "_")}.pdf`;
    } else {
      return NextResponse.json(
        { error: "Either studentId or studentIds is required" },
        { status: 400 },
      );
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Error generating CBSE report card PDF:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate report card",
      },
      { status: 500 },
    );
  }
}
