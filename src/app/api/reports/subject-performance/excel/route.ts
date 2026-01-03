import { NextRequest, NextResponse } from "next/server";
import { getSubjectPerformanceReport } from "@/lib/actions/subjectPerformanceActions";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termId = searchParams.get("termId");
    const classId = searchParams.get("classId") || undefined;
    const sectionId = searchParams.get("sectionId") || undefined;

    if (!termId) {
      return NextResponse.json(
        { error: "Term ID is required" },
        { status: 400 }
      );
    }

    // Get the performance data
    const result = await getSubjectPerformanceReport({
      termId,
      classId,
      sectionId,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: "Failed to fetch performance data" },
        { status: 500 }
      );
    }

    // Get filter details for the report header
    const [term, classInfo, sectionInfo] = await Promise.all([
      db.term.findUnique({
        where: { id: termId },
        include: { academicYear: true },
      }),
      classId ? db.class.findUnique({ where: { id: classId } }) : null,
      sectionId
        ? db.classSection.findUnique({ where: { id: sectionId } })
        : null,
    ]);

    // Generate CSV data (simplified Excel format)
    const csv = generateCSV(result.data, {
      term: term?.name || "",
      academicYear: term?.academicYear.name || "",
      class: classInfo?.name || "All Classes",
      section: sectionInfo?.name || "All Sections",
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subject-performance-${term?.name.replace(/\s+/g, "-")}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel" },
      { status: 500 }
    );
  }
}

function generateCSV(
  data: any[],
  metadata: { term: string; academicYear: string; class: string; section: string }
): string {
  const lines: string[] = [];

  // Header information
  lines.push("Subject-wise Performance Report");
  lines.push(`Academic Year: ${metadata.academicYear}`);
  lines.push(`Term: ${metadata.term}`);
  lines.push(`Class: ${metadata.class}`);
  lines.push(`Section: ${metadata.section}`);
  lines.push(`Generated on: ${new Date().toLocaleDateString()}`);
  lines.push(""); // Empty line

  // Main data table
  lines.push(
    "Subject Name,Subject Code,Average Marks,Highest Marks,Lowest Marks,Total Students,Passed Students,Failed Students,Absent Students,Pass Percentage"
  );

  data.forEach((subject) => {
    lines.push(
      [
        subject.subjectName,
        subject.subjectCode,
        subject.averageMarks.toFixed(2),
        subject.highestMarks.toFixed(2),
        subject.lowestMarks.toFixed(2),
        subject.totalStudents,
        subject.passedStudents,
        subject.failedStudents,
        subject.absentStudents,
        subject.passPercentage.toFixed(2) + "%",
      ].join(",")
    );
  });

  lines.push(""); // Empty line
  lines.push(""); // Empty line

  // Grade distribution for each subject
  lines.push("Grade Distribution by Subject");
  lines.push(""); // Empty line

  data.forEach((subject) => {
    lines.push(`Subject: ${subject.subjectName} (${subject.subjectCode})`);
    lines.push("Grade,Count,Percentage");
    
    subject.gradeDistribution.forEach((grade: any) => {
      lines.push(
        [
          grade.grade,
          grade.count,
          grade.percentage.toFixed(2) + "%",
        ].join(",")
      );
    });
    
    lines.push(""); // Empty line between subjects
  });

  return lines.join("\n");
}
