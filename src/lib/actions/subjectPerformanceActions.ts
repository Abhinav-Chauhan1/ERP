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
    const [classes, terms] = await Promise.all([
      db.class.findMany({
        include: {
          sections: true,
          academicYear: true,
        },
        orderBy: { name: "asc" },
      }),
      db.term.findMany({
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
    const { termId, classId, sectionId } = filters;

    // Build the where clause for exam results
    const whereClause: any = {
      exam: {
        termId,
      },
    };

    // If class or section is specified, filter by enrolled students
    if (classId || sectionId) {
      const enrollmentWhere: any = {};
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
    // Get the performance data
    const result = await getSubjectPerformanceReport(filters);
    
    if (!result.success || !result.data) {
      return { success: false, error: "Failed to fetch performance data" };
    }

    // Get filter details for the report header
    const [term, classInfo, sectionInfo] = await Promise.all([
      db.term.findUnique({
        where: { id: filters.termId },
        include: { academicYear: true },
      }),
      filters.classId
        ? db.class.findUnique({ where: { id: filters.classId } })
        : null,
      filters.sectionId
        ? db.classSection.findUnique({ where: { id: filters.sectionId } })
        : null,
    ]);

    // In a real implementation, you would generate a PDF here
    // For now, we'll return a placeholder URL
    const filename = `subject-performance-${term?.name.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
    
    // TODO: Implement actual PDF generation using a library like jsPDF or puppeteer
    // This is a placeholder implementation
    
    return {
      success: true,
      data: {
        url: `/api/reports/subject-performance/pdf?termId=${filters.termId}&classId=${filters.classId || ""}&sectionId=${filters.sectionId || ""}`,
        filename,
      },
    };
  } catch (error) {
    console.error("Error exporting subject performance to PDF:", error);
    return { success: false, error: "Failed to export PDF" };
  }
}

export async function exportSubjectPerformanceToExcel(filters: SubjectPerformanceFilters) {
  try {
    // Get the performance data
    const result = await getSubjectPerformanceReport(filters);
    
    if (!result.success || !result.data) {
      return { success: false, error: "Failed to fetch performance data" };
    }

    // Get filter details for the report header
    const [term, classInfo, sectionInfo] = await Promise.all([
      db.term.findUnique({
        where: { id: filters.termId },
        include: { academicYear: true },
      }),
      filters.classId
        ? db.class.findUnique({ where: { id: filters.classId } })
        : null,
      filters.sectionId
        ? db.classSection.findUnique({ where: { id: filters.sectionId } })
        : null,
    ]);

    // In a real implementation, you would generate an Excel file here
    // For now, we'll return a placeholder URL
    const filename = `subject-performance-${term?.name.replace(/\s+/g, "-")}-${Date.now()}.xlsx`;
    
    // TODO: Implement actual Excel generation using a library like xlsx
    // This is a placeholder implementation
    
    return {
      success: true,
      data: {
        url: `/api/reports/subject-performance/excel?termId=${filters.termId}&classId=${filters.classId || ""}&sectionId=${filters.sectionId || ""}`,
        filename,
      },
    };
  } catch (error) {
    console.error("Error exporting subject performance to Excel:", error);
    return { success: false, error: "Failed to export Excel" };
  }
}
