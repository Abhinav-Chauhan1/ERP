import { NextRequest, NextResponse } from "next/server";
import { getSubjectPerformanceReport } from "@/lib/actions/subjectPerformanceActions";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Get school context first
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

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

    // Get filter details for the report header - CRITICAL: Filter by school
    const [term, classInfo, sectionInfo] = await Promise.all([
      db.term.findFirst({
        where: { 
          id: termId,
          schoolId, // CRITICAL: Ensure term belongs to current school
        },
        include: { academicYear: true },
      }),
      classId ? db.class.findFirst({ 
        where: { 
          id: classId,
          schoolId, // CRITICAL: Ensure class belongs to current school
        } 
      }) : null,
      sectionId
        ? db.classSection.findFirst({ 
            where: { 
              id: sectionId,
              schoolId, // CRITICAL: Ensure section belongs to current school
            } 
          })
        : null,
    ]);

    // Generate HTML for PDF
    const html = generatePDFHTML(result.data, {
      term: term?.name || "",
      academicYear: term?.academicYear.name || "",
      class: classInfo?.name || "All Classes",
      section: sectionInfo?.name || "All Sections",
    });

    // In a production environment, you would use a library like puppeteer or jsPDF
    // to convert HTML to PDF. For now, we'll return the HTML as a simple PDF-like response
    
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="subject-performance-${term?.name.replace(/\s+/g, "-")}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function generatePDFHTML(
  data: any[],
  metadata: { term: string; academicYear: string; class: string; section: string }
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Subject-wise Performance Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .subject-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .subject-header {
      background-color: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #3b82f6;
      margin-bottom: 15px;
    }
    .subject-header h2 {
      margin: 0;
      font-size: 18px;
    }
    .subject-header p {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .stat-detail {
      font-size: 11px;
      color: #999;
      margin-top: 5px;
    }
    .grade-distribution {
      margin-top: 20px;
    }
    .grade-distribution h3 {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .grade-bar {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .grade-label {
      width: 80px;
      font-size: 12px;
      font-weight: 500;
    }
    .grade-bar-container {
      flex: 1;
      height: 24px;
      background-color: #f5f5f5;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    .grade-bar-fill {
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-size: 11px;
      font-weight: 500;
      color: white;
    }
    .grade-a { background-color: #22c55e; }
    .grade-b { background-color: #3b82f6; }
    .grade-c { background-color: #eab308; }
    .grade-d { background-color: #f97316; }
    .grade-f { background-color: #ef4444; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    @media print {
      body { margin: 20px; }
      .subject-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Subject-wise Performance Report</h1>
    <p><strong>Academic Year:</strong> ${metadata.academicYear} | <strong>Term:</strong> ${metadata.term}</p>
    <p><strong>Class:</strong> ${metadata.class} | <strong>Section:</strong> ${metadata.section}</p>
    <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  ${data
    .map(
      (subject) => `
    <div class="subject-section">
      <div class="subject-header">
        <h2>${subject.subjectName}</h2>
        <p>Code: ${subject.subjectCode} | Pass Rate: ${subject.passPercentage.toFixed(1)}%</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Average Marks</div>
          <div class="stat-value">${subject.averageMarks.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Highest Marks</div>
          <div class="stat-value" style="color: #22c55e;">${subject.highestMarks.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Lowest Marks</div>
          <div class="stat-value" style="color: #ef4444;">${subject.lowestMarks.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${subject.totalStudents}</div>
          <div class="stat-detail">
            ${subject.passedStudents} passed, ${subject.failedStudents} failed
            ${subject.absentStudents > 0 ? `, ${subject.absentStudents} absent` : ""}
          </div>
        </div>
      </div>

      <div class="grade-distribution">
        <h3>Grade Distribution</h3>
        ${subject.gradeDistribution
          .map(
            (grade: any) => `
          <div class="grade-bar">
            <div class="grade-label">Grade ${grade.grade}</div>
            <div class="grade-bar-container">
              <div class="grade-bar-fill grade-${grade.grade.toLowerCase().charAt(0)}" style="width: ${grade.percentage}%">
                ${grade.count} students (${grade.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `
    )
    .join("")}

  <div class="footer">
    <p>This is an automatically generated report. For any queries, please contact the administration.</p>
  </div>
</body>
</html>
  `;
}
