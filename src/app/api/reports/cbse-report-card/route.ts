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
 * School settings (name, address, logo, etc.) are auto-fetched from the DB.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get("studentId");
    const studentIds = searchParams.get("studentIds"); // comma-separated for batch
    const academicYearId = searchParams.get("academicYearId");

    if (!academicYearId) {
      return NextResponse.json(
        { error: "academicYearId is required" },
        { status: 400 },
      );
    }

    let pdfBuffer: Buffer;
    let fileName: string;

    if (studentIds) {
      // Batch mode
      const ids = studentIds.split(",").map((s) => s.trim());
      const dataList = await Promise.all(
        ids.map((id) => aggregateMultiTermReportCardData(id, academicYearId)),
      );

      // Fetch school settings from first student's school
      const schoolSettings = dataList.length > 0
        ? await db.schoolSettings.findUnique({
            where: { schoolId: dataList[0].student.schoolId },
            select: {
              schoolName: true, schoolAddress: true, schoolPhone: true,
              schoolEmail: true, schoolWebsite: true, schoolLogo: true,
              affiliationNumber: true, schoolCode: true,
            },
          })
        : null;

      pdfBuffer = await generateBatchCBSEReportCards(dataList, {
        schoolName: schoolSettings?.schoolName ?? undefined,
        schoolAddress: schoolSettings?.schoolAddress ?? undefined,
        schoolPhone: schoolSettings?.schoolPhone ?? undefined,
        schoolEmail: schoolSettings?.schoolEmail ?? undefined,
        schoolWebsite: schoolSettings?.schoolWebsite ?? undefined,
        schoolLogo: schoolSettings?.schoolLogo ?? undefined,
        affiliationNo: schoolSettings?.affiliationNumber ?? undefined,
        schoolCode: schoolSettings?.schoolCode ?? undefined,
      });
      fileName = `CBSE_Report_Cards_Batch.pdf`;

    } else if (studentId) {
      // Single student
      const data = await aggregateMultiTermReportCardData(studentId, academicYearId);

      // Fetch school settings
      const schoolSettings = await db.schoolSettings.findUnique({
        where: { schoolId: data.student.schoolId },
        select: {
          schoolName: true, schoolAddress: true, schoolPhone: true,
          schoolEmail: true, schoolWebsite: true, schoolLogo: true,
          affiliationNumber: true, schoolCode: true,
        },
      });

      // Resolve cbseLevel from assigned template
      let cbseLevel: "CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR" | undefined;
      if (data.templateId) {
        const tpl = await db.reportCardTemplate.findUnique({
          where: { id: data.templateId },
          select: { cbseLevel: true },
        });
        if (tpl?.cbseLevel) cbseLevel = tpl.cbseLevel as typeof cbseLevel;
      }

      pdfBuffer = await generateCBSEReportCardPDF(data, {
        schoolName: schoolSettings?.schoolName ?? undefined,
        schoolAddress: schoolSettings?.schoolAddress ?? undefined,
        schoolPhone: schoolSettings?.schoolPhone ?? undefined,
        schoolEmail: schoolSettings?.schoolEmail ?? undefined,
        schoolWebsite: schoolSettings?.schoolWebsite ?? undefined,
        schoolLogo: schoolSettings?.schoolLogo ?? undefined,
        affiliationNo: schoolSettings?.affiliationNumber ?? undefined,
        schoolCode: schoolSettings?.schoolCode ?? undefined,
        cbseLevel,
      });
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
        error: error instanceof Error ? error.message : "Failed to generate report card",
      },
      { status: 500 },
    );
  }
}
