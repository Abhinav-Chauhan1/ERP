"use server";

import { db } from "@/lib/db";

export interface ConsolidatedMarkSheetFilters {
  examId?: string;
  classId?: string;
  sectionId?: string;
  termId?: string;
}

export interface StudentMarkData {
  studentId: string;
  studentName: string;
  admissionId: string;
  rollNumber: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    theoryMarks: number | null;
    practicalMarks: number | null;
    internalMarks: number | null;
    totalMarks: number | null;
    maxMarks: number;
    percentage: number | null;
    grade: string | null;
    isAbsent: boolean;
    isIncomplete: boolean;
  }[];
  overallTotal: number;
  overallMaxMarks: number;
  overallPercentage: number;
  overallGrade: string | null;
}

/**
 * Get consolidated mark sheet data for a class
 */
export async function getConsolidatedMarkSheet(filters: ConsolidatedMarkSheetFilters) {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    if (!filters.classId || !filters.sectionId) {
      return {
        success: false,
        error: "Class and section are required"
      };
    }

    // Build where clause for exams with school isolation
    const examWhere: any = {
      schoolId, // Add school isolation
    };

    if (filters.examId) {
      examWhere.id = filters.examId;
    }

    if (filters.termId) {
      examWhere.termId = filters.termId;
    }

    // Get all students in the class/section with school isolation
    const students = await db.student.findMany({
      where: {
        schoolId, // Add school isolation
        enrollments: {
          some: {
            classId: filters.classId,
            sectionId: filters.sectionId,
            status: "ACTIVE"
          }
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { rollNumber: 'asc' },
        { user: { firstName: 'asc' } }
      ]
    });

    // Get all exams for the filters
    const exams = await db.exam.findMany({
      where: examWhere,
      include: {
        subject: true,
        results: {
          where: {
            studentId: {
              in: students.map(s => s.id)
            }
          }
        }
      },
      orderBy: {
        subject: {
          name: 'asc'
        }
      }
    });

    // Get subject mark configurations
    const subjectConfigs = await db.subjectMarkConfig.findMany({
      where: {
        examId: {
          in: exams.map(e => e.id)
        }
      }
    });

    // Create a map of exam to config
    const configMap = new Map(
      subjectConfigs.map(config => [config.examId, config])
    );

    // Build consolidated data
    const consolidatedData: StudentMarkData[] = students.map(student => {
      const subjects = exams.map(exam => {
        const result = exam.results.find(r => r.studentId === student.id);
        const config = configMap.get(exam.id);

        const hasTheory = config?.theoryMaxMarks && config.theoryMaxMarks > 0;
        const hasPractical = config?.practicalMaxMarks && config.practicalMaxMarks > 0;
        const hasInternal = config?.internalMaxMarks && config.internalMaxMarks > 0;

        // Check if marks entry is incomplete
        const isIncomplete = !result || (
          !result.isAbsent && (
            (hasTheory && result.theoryMarks === null) ||
            (hasPractical && result.practicalMarks === null) ||
            (hasInternal && result.internalMarks === null)
          )
        );

        return {
          subjectId: exam.subject.id,
          subjectName: exam.subject.name,
          theoryMarks: result?.theoryMarks ?? null,
          practicalMarks: result?.practicalMarks ?? null,
          internalMarks: result?.internalMarks ?? null,
          totalMarks: result?.totalMarks ?? null,
          maxMarks: exam.totalMarks,
          percentage: result?.percentage ?? null,
          grade: result?.grade ?? null,
          isAbsent: result?.isAbsent ?? false,
          isIncomplete
        } as any;
      });

      // Calculate overall totals
      const overallTotal = subjects.reduce((sum, subject) => {
        if (!subject.isAbsent && subject.totalMarks !== null) {
          return sum + subject.totalMarks;
        }
        return sum;
      }, 0);

      const overallMaxMarks = subjects.reduce((sum, subject) => {
        if (!subject.isAbsent) {
          return sum + subject.maxMarks;
        }
        return sum;
      }, 0);

      const overallPercentage = overallMaxMarks > 0
        ? (overallTotal / overallMaxMarks) * 100
        : 0;

      // Simple grade calculation
      let overallGrade = null;
      if (overallPercentage >= 90) overallGrade = "A+";
      else if (overallPercentage >= 80) overallGrade = "A";
      else if (overallPercentage >= 70) overallGrade = "B+";
      else if (overallPercentage >= 60) overallGrade = "B";
      else if (overallPercentage >= 50) overallGrade = "C+";
      else if (overallPercentage >= 40) overallGrade = "C";
      else if (overallPercentage >= 33) overallGrade = "D";
      else overallGrade = "F";

      return {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        admissionId: student.admissionId,
        rollNumber: student.rollNumber || "",
        subjects,
        overallTotal,
        overallMaxMarks,
        overallPercentage,
        overallGrade
      };
    });

    // Get unique subjects for headers
    const uniqueSubjects = Array.from(
      new Map(
        exams.map(exam => [exam.subject.id, exam.subject.name])
      ).entries()
    ).map(([id, name]) => ({ id, name }));

    return {
      success: true,
      data: {
        students: consolidatedData,
        subjects: uniqueSubjects,
        totalStudents: students.length
      }
    };
  } catch (error) {
    console.error("Error fetching consolidated mark sheet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch consolidated mark sheet"
    };
  }
}

/**
 * Get filter options for consolidated mark sheet
 */
export async function getConsolidatedMarkSheetFilters() {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const [terms, classes, sections, exams] = await Promise.all([
      db.term.findMany({
        where: { schoolId }, // Add school isolation
        orderBy: { startDate: 'desc' },
        include: { academicYear: true }
      }),
      db.class.findMany({
        where: { schoolId }, // Add school isolation
        orderBy: { name: 'asc' },
        include: { academicYear: true }
      }),
      db.classSection.findMany({
        where: { schoolId }, // Add school isolation
        orderBy: { name: 'asc' }
      }),
      db.exam.findMany({
        where: { schoolId }, // Add school isolation
        orderBy: { examDate: 'desc' },
        include: {
          subject: true,
          term: {
            include: {
              academicYear: true
            }
          }
        },
        take: 50 // Limit to recent exams
      })
    ]);

    return {
      success: true,
      data: {
        terms,
        classes,
        sections,
        exams
      }
    };
  } catch (error) {
    console.error("Error fetching filters:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch filters"
    };
  }
}

/**
 * Export consolidated mark sheet to CSV format
 */
export async function exportConsolidatedMarkSheetCSV(filters: ConsolidatedMarkSheetFilters) {
  try {
    const result = await getConsolidatedMarkSheet(filters);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to fetch data"
      };
    }

    const { students, subjects } = result.data;

    // Build CSV header
    const headers = [
      "Roll No",
      "Admission ID",
      "Student Name",
      ...subjects.flatMap(subject => [
        `${subject.name} - Theory`,
        `${subject.name} - Practical`,
        `${subject.name} - Internal`,
        `${subject.name} - Total`,
        `${subject.name} - Grade`
      ]),
      "Overall Total",
      "Overall Percentage",
      "Overall Grade"
    ];

    // Build CSV rows
    const rows = students.map(student => {
      const subjectData = subjects.flatMap(subject => {
        const subjectResult = student.subjects.find(s => s.subjectId === subject.id);

        if (!subjectResult) {
          return ["-", "-", "-", "-", "-"];
        }

        if (subjectResult.isAbsent) {
          return ["AB", "AB", "AB", "AB", "AB"];
        }

        return [
          subjectResult.theoryMarks?.toFixed(1) ?? "-",
          subjectResult.practicalMarks?.toFixed(1) ?? "-",
          subjectResult.internalMarks?.toFixed(1) ?? "-",
          subjectResult.totalMarks?.toFixed(1) ?? "-",
          subjectResult.grade ?? "-"
        ];
      });

      return [
        student.rollNumber || "-",
        student.admissionId,
        student.studentName,
        ...subjectData,
        student.overallTotal.toFixed(1),
        student.overallPercentage.toFixed(2) + "%",
        student.overallGrade || "-"
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return {
      success: true,
      data: csvContent
    };
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export CSV"
    };
  }
}

/**
 * Get data formatted for Excel export
 */
export async function getConsolidatedMarkSheetForExcel(filters: ConsolidatedMarkSheetFilters) {
  try {
    const result = await getConsolidatedMarkSheet(filters);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to fetch data"
      };
    }

    const { students, subjects } = result.data;

    // Build header rows
    const headerRow1 = [
      "Roll No",
      "Admission ID",
      "Student Name",
      ...subjects.flatMap(subject => [subject.name, "", "", "", ""]),
      "Overall Total",
      "Overall %",
      "Grade"
    ];

    const headerRow2 = [
      "",
      "",
      "",
      ...subjects.flatMap(() => ["Theory", "Practical", "Internal", "Total", "Grade"]),
      "",
      "",
      ""
    ];

    // Build data rows
    const dataRows = students.map(student => {
      const subjectData = subjects.flatMap(subject => {
        const subjectResult = student.subjects.find(s => s.subjectId === subject.id);

        if (!subjectResult) {
          return ["-", "-", "-", "-", "-"];
        }

        if (subjectResult.isAbsent) {
          return ["AB", "AB", "AB", "AB", "AB"];
        }

        return [
          subjectResult.theoryMarks?.toFixed(1) ?? "-",
          subjectResult.practicalMarks?.toFixed(1) ?? "-",
          subjectResult.internalMarks?.toFixed(1) ?? "-",
          subjectResult.totalMarks?.toFixed(1) ?? "-",
          subjectResult.grade ?? "-"
        ];
      });

      return [
        student.rollNumber || "-",
        student.admissionId,
        student.studentName,
        ...subjectData,
        student.overallTotal.toFixed(1),
        student.overallPercentage.toFixed(2),
        student.overallGrade || "-"
      ];
    });

    return {
      success: true,
      data: {
        headerRow1,
        headerRow2,
        dataRows,
        subjects
      }
    };
  } catch (error) {
    console.error("Error preparing Excel data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to prepare Excel data"
    };
  }
}
