"use server";

import { db } from "@/lib/db";

interface SubjectPerformanceFilters {
  termId: string;
  classId?: string;
  sectionId?: string;
}

interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

interface SubjectStats {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  absentStudents: number;
  passPercentage: number;
  gradeDistribution: GradeDistribution[];
}

export async function getSubjectPerformanceFilters() {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const [classes, terms] = await Promise.all([
      db.class.findMany({
        where: { schoolId }, // Add school isolation
        include: {
          sections: true,
          academicYear: true,
        },
        orderBy: { name: "asc" },
      }),
      db.term.findMany({
        where: { schoolId }, // Add school isolation
        include: {
          academicYear: true,
        },
        orderBy: { startDate: "desc" },
      }),
    ]);

    return {
      success: true,
      data: {
        classes,
        terms,
        sections: [],
      },
    };
  } catch (error) {
    console.error("Error fetching subject performance filters:", error);
    return { success: false, error: "Failed to fetch filter options" };
  }
}

export async function getSubjectPerformanceReport(filters: SubjectPerformanceFilters) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { termId, classId, sectionId } = filters;

    // Build the where clause for exam results with school isolation
    const whereClause: any = {
      schoolId, // Add school isolation
      exam: {
        termId,
        schoolId, // Add school isolation
      },
    };

    // If class or section is specified, filter by enrolled students
    if (classId || sectionId) {
      const enrollmentWhere: any = {
        schoolId, // Add school isolation
      };
      if (classId) enrollmentWhere.classId = classId;
      if (sectionId) enrollmentWhere.sectionId = sectionId;

      const enrollments = await db.classEnrollment.findMany({
        where: enrollmentWhere,
        select: { studentId: true },
      });

      const studentIds = enrollments.map((e) => e.studentId);
      whereClause.studentId = { in: studentIds };
    }

    // Fetch all exam results for the term
    const examResults = await db.examResult.findMany({
      where: whereClause,
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // Group results by subject
    const subjectMap = new Map<string, any[]>();

    examResults.forEach((result) => {
      const subjectId = result.exam.subjectId;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, []);
      }
      subjectMap.get(subjectId)!.push(result);
    });

    // Calculate statistics for each subject
    const subjectStats: SubjectStats[] = [];

    for (const [subjectId, results] of subjectMap.entries()) {
      if (results.length === 0) continue;

      const subject = results[0].exam.subject;

      // Filter out absent students for calculations
      const presentResults = results.filter((r) => !r.isAbsent);
      const absentCount = results.filter((r) => r.isAbsent).length;

      if (presentResults.length === 0) {
        // All students absent
        subjectStats.push({
          subjectId,
          subjectName: subject.name,
          subjectCode: subject.code,
          averageMarks: 0,
          highestMarks: 0,
          lowestMarks: 0,
          totalStudents: results.length,
          passedStudents: 0,
          failedStudents: 0,
          absentStudents: absentCount,
          passPercentage: 0,
          gradeDistribution: [],
        });
        continue;
      }

      // Calculate statistics
      const marks = presentResults.map((r) => r.totalMarks || r.marks);
      const averageMarks = marks.reduce((sum, m) => sum + m, 0) / marks.length;
      const highestMarks = Math.max(...marks);
      const lowestMarks = Math.min(...marks);

      // Get passing marks from the first exam (assuming all exams for same subject have same passing marks)
      const passingMarks = results[0].exam.passingMarks;
      const passedStudents = presentResults.filter((r) => (r.totalMarks || r.marks) >= passingMarks).length;
      const failedStudents = presentResults.length - passedStudents;
      const passPercentage = (passedStudents / presentResults.length) * 100;

      // Calculate grade distribution
      const gradeCount = new Map<string, number>();
      presentResults.forEach((result) => {
        const grade = result.grade || "N/A";
        gradeCount.set(grade, (gradeCount.get(grade) || 0) + 1);
      });

      const gradeDistribution: GradeDistribution[] = Array.from(gradeCount.entries())
        .map(([grade, count]) => ({
          grade,
          count,
          percentage: (count / presentResults.length) * 100,
        }))
        .sort((a, b) => {
          // Sort grades in order: A+, A, B+, B, C+, C, D, F
          const gradeOrder = ["A+", "A", "B+", "B", "C+", "C", "D", "F", "N/A"];
          return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
        });

      subjectStats.push({
        subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        averageMarks,
        highestMarks,
        lowestMarks,
        totalStudents: results.length,
        passedStudents,
        failedStudents,
        absentStudents: absentCount,
        passPercentage,
        gradeDistribution,
      });
    }

    // Sort by subject name
    subjectStats.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    return {
      success: true,
      data: subjectStats,
    };
  } catch (error) {
    console.error("Error fetching subject performance report:", error);
    return { success: false, error: "Failed to fetch performance report" };
  }
}

export async function exportSubjectPerformanceToPDF(filters: SubjectPerformanceFilters) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get the performance data
    const result = await getSubjectPerformanceReport(filters);

    if (!result.success || !result.data) {
      return { success: false, error: "Failed to fetch performance data" };
    }

    // Get filter details for the report header with school isolation
    const [term, classInfo, sectionInfo] = await Promise.all([
      db.term.findUnique({
        where: { id: filters.termId, schoolId }, // Add school isolation
        include: { academicYear: true },
      }),
      filters.classId
        ? db.class.findUnique({ where: { id: filters.classId, schoolId } }) // Add school isolation
        : null,
      filters.sectionId
        ? db.classSection.findUnique({ where: { id: filters.sectionId, schoolId } }) // Add school isolation
        : null,
    ]);

    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Add report header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Subject Performance Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let headerY = 25;
    doc.text(`Term: ${term?.name || 'All Terms'}`, 14, headerY);
    doc.text(`Academic Year: ${term?.academicYear?.name || 'N/A'}`, 14, headerY + 6);
    if (classInfo) {
      doc.text(`Class: ${classInfo.name}${sectionInfo ? ` - ${sectionInfo.name}` : ''}`, 14, headerY + 12);
    }
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, headerY);

    // Prepare table data
    const tableData = result.data.map((subject: SubjectStats) => [
      subject.subjectCode,
      subject.subjectName,
      subject.totalStudents.toString(),
      subject.averageMarks.toFixed(1),
      subject.highestMarks.toString(),
      subject.lowestMarks.toString(),
      subject.passedStudents.toString(),
      subject.failedStudents.toString(),
      subject.absentStudents.toString(),
      `${subject.passPercentage.toFixed(1)}%`,
    ]);

    // Add statistics table
    autoTable(doc, {
      startY: headerY + 20,
      head: [[
        'Code', 'Subject', 'Total', 'Avg', 'Highest', 'Lowest',
        'Passed', 'Failed', 'Absent', 'Pass %'
      ]],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
        9: { cellWidth: 20 },
      },
    });

    // Add grade distribution section if there's space
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    if (finalY < 150) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Grade Distribution Summary', 14, finalY + 15);

      // Show grade distribution for top 3 subjects
      let gradeY = finalY + 25;
      result.data.slice(0, 3).forEach((subject: SubjectStats) => {
        if (subject.gradeDistribution.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${subject.subjectName}:`, 14, gradeY);
          doc.setFont('helvetica', 'normal');
          const gradeText = subject.gradeDistribution
            .map(g => `${g.grade}: ${g.count} (${g.percentage.toFixed(0)}%)`)
            .join('  |  ');
          doc.text(gradeText, 60, gradeY);
          gradeY += 8;
        }
      });
    }

    // Convert to base64
    const pdfBase64 = doc.output('datauristring');
    const filename = `subject-performance-${term?.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;

    return {
      success: true,
      data: {
        base64: pdfBase64,
        filename,
        mimeType: 'application/pdf',
      },
    };
  } catch (error) {
    console.error("Error exporting subject performance to PDF:", error);
    return { success: false, error: "Failed to export PDF" };
  }
}

export async function exportSubjectPerformanceToExcel(filters: SubjectPerformanceFilters) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get the performance data
    const result = await getSubjectPerformanceReport(filters);

    if (!result.success || !result.data) {
      return { success: false, error: "Failed to fetch performance data" };
    }

    // Get filter details for the report header with school isolation
    const [term, classInfo, sectionInfo] = await Promise.all([
      db.term.findUnique({
        where: { id: filters.termId, schoolId }, // Add school isolation
        include: { academicYear: true },
      }),
      filters.classId
        ? db.class.findUnique({ where: { id: filters.classId, schoolId } }) // Add school isolation
        : null,
      filters.sectionId
        ? db.classSection.findUnique({ where: { id: filters.sectionId, schoolId } }) // Add school isolation
        : null,
    ]);

    // Import ExcelJS dynamically
    const ExcelJS = (await import('exceljs')).default;

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SikshaMitra';
    workbook.created = new Date();

    // Create main worksheet
    const mainSheet = workbook.addWorksheet('Subject Performance');

    // Add header info
    mainSheet.addRow(['Subject Performance Report']);
    mainSheet.addRow([`Term: ${term?.name || 'All Terms'}`]);
    mainSheet.addRow([`Academic Year: ${term?.academicYear?.name || 'N/A'}`]);
    if (classInfo) {
      mainSheet.addRow([`Class: ${classInfo.name}${sectionInfo ? ` - ${sectionInfo.name}` : ''}`]);
    }
    mainSheet.addRow([`Generated: ${new Date().toLocaleDateString()}`]);
    mainSheet.addRow([]); // Empty row

    // Add table headers
    const headerRow = mainSheet.addRow([
      'Subject Code', 'Subject Name', 'Total Students', 'Average Marks',
      'Highest Marks', 'Lowest Marks', 'Passed', 'Failed', 'Absent', 'Pass %'
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };

    // Add data rows
    result.data.forEach((subject: SubjectStats) => {
      mainSheet.addRow([
        subject.subjectCode,
        subject.subjectName,
        subject.totalStudents,
        Number(subject.averageMarks.toFixed(1)),
        subject.highestMarks,
        subject.lowestMarks,
        subject.passedStudents,
        subject.failedStudents,
        subject.absentStudents,
        Number(subject.passPercentage.toFixed(1)),
      ]);
    });

    // Set column widths
    mainSheet.columns = [
      { width: 15 }, // Subject Code
      { width: 30 }, // Subject Name
      { width: 15 }, // Total Students
      { width: 15 }, // Average Marks
      { width: 15 }, // Highest Marks
      { width: 15 }, // Lowest Marks
      { width: 10 }, // Passed
      { width: 10 }, // Failed
      { width: 10 }, // Absent
      { width: 10 }, // Pass %
    ];

    // Create Grade Distribution sheet
    const gradeSheet = workbook.addWorksheet('Grade Distribution');
    const gradeHeaderRow = gradeSheet.addRow(['Subject', 'Grade', 'Count', 'Percentage']);
    gradeHeaderRow.font = { bold: true };
    gradeHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };

    result.data.forEach((subject: SubjectStats) => {
      subject.gradeDistribution.forEach((grade) => {
        gradeSheet.addRow([
          subject.subjectName,
          grade.grade,
          grade.count,
          Number(grade.percentage.toFixed(1)),
        ]);
      });
    });

    gradeSheet.columns = [
      { width: 30 }, // Subject
      { width: 10 }, // Grade
      { width: 10 }, // Count
      { width: 15 }, // Percentage
    ];

    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Convert to base64
    const base64 = Buffer.from(excelBuffer).toString('base64');
    const filename = `subject-performance-${term?.name.replace(/\s+/g, "-")}-${Date.now()}.xlsx`;

    return {
      success: true,
      data: {
        base64: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };
  } catch (error) {
    console.error("Error exporting subject performance to Excel:", error);
    return { success: false, error: "Failed to export Excel" };
  }
}
