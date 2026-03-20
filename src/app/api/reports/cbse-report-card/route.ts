

import { NextRequest, NextResponse } from "next/server";
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
    const schoolName = searchParams.get("schoolName") ?? undefined;
    const schoolAddress = searchParams.get("schoolAddress") ?? undefined;
    const affiliationNo = searchParams.get("affiliationNo") ?? undefined;
    const schoolCode = searchParams.get("schoolCode") ?? undefined;

    if (!academicYearId) {
      return NextResponse.json(
        { error: "academicYearId is required" },
        { status: 400 },
      );
    }

    const options = { schoolName, schoolAddress, affiliationNo, schoolCode };

    let pdfBuffer: Buffer;
    let fileName: string;

    if (studentIds) {
      // Batch mode
      const ids = studentIds.split(",").map((s) => s.trim());
      const dataList = await Promise.all(
        ids.map((id) => aggregateMultiTermReportCardData(id, academicYearId)),
      );
      pdfBuffer = await generateBatchCBSEReportCards(dataList, options);
      fileName = `CBSE_Report_Cards_Batch.pdf`;
    } else if (studentId) {
      // Single student
      const data = await aggregateMultiTermReportCardData(
        studentId,
        academicYearId,
      );
      pdfBuffer = await generateCBSEReportCardPDF(data, options);
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
