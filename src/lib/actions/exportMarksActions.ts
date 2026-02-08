"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export interface ExportMarksInput {
  examId: string;
  classId?: string;
  sectionId?: string;
  format: "excel" | "csv";
}

export interface ExportResult {
  success: boolean;
  data?: {
    filename: string;
    content: string; // Base64 encoded for Excel, plain text for CSV
    mimeType: string;
  };
  error?: string;
}

interface StudentMarkData {
  studentId: string;
  rollNumber: string;
  studentName: string;
  theoryMarks: number | null;
  practicalMarks: number | null;
  internalMarks: number | null;
  totalMarks: number | null;
  percentage: number | null;
  grade: string | null;
  status: string;
  remarks: string | null;
}

/**
 * Export marks to Excel or CSV format
 */
export async function exportMarksToFile(
  input: ExportMarksInput
): Promise<ExportResult> {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get current user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get exam details with school isolation
    const exam = await db.exam.findUnique({
      where: { 
        id: input.examId,
        schoolId, // Add school isolation
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        examType: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
        subjectMarkConfig: true,
      },
    });

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
      };
    }

    // Build query filters with school isolation
    const whereClause: any = {
      examId: input.examId,
      schoolId, // Add school isolation
    };

    // If class and section are provided, filter by enrollment
    if (input.classId || input.sectionId) {
      whereClause.student = {
        schoolId, // Add school isolation
        enrollments: {
          some: {
            ...(input.classId && { classId: input.classId }),
            ...(input.sectionId && { sectionId: input.sectionId }),
            status: "ACTIVE",
          },
        },
      };
    }

    // Fetch exam results with student details
    const examResults = await db.examResult.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          rollNumber: "asc",
        },
      },
    });

    // Format data for export
    const exportData: StudentMarkData[] = examResults.map((result) => ({
      studentId: result.studentId,
      rollNumber: result.student.rollNumber || "",
      studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
      theoryMarks: result.theoryMarks,
      practicalMarks: result.practicalMarks,
      internalMarks: result.internalMarks,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      status: result.isAbsent ? "Absent" : "Present",
      remarks: result.remarks,
    }));

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const subjectName = exam.subject.name.replace(/\s+/g, "_");

    // Get class and section names from filters if provided
    let className = "All";
    let sectionName = "All";

    if (input.classId) {
      const classData = await db.class.findUnique({
        where: { id: input.classId },
        select: { name: true },
      });
      className = classData?.name.replace(/\s+/g, "_") || "All";
    }

    if (input.sectionId) {
      const sectionData = await db.classSection.findUnique({
        where: { id: input.sectionId },
        select: { name: true },
      });
      sectionName = sectionData?.name.replace(/\s+/g, "_") || "All";
    }

    const filename = `Marks_${subjectName}_${className}_${sectionName}_${timestamp}`;

    if (input.format === "csv") {
      // Generate CSV
      const csvContent = await generateCSV(exportData, exam, input.classId, input.sectionId);

      return {
        success: true,
        data: {
          filename: `${filename}.csv`,
          content: csvContent,
          mimeType: "text/csv",
        },
      };
    } else {
      // Generate Excel (return data for client-side generation)
      // We'll return the data and let the client generate the Excel file
      // This is because xlsx library works better on the client side

      // Get class and section names for metadata
      let classNameForMetadata = "All Classes";
      let sectionNameForMetadata = "All Sections";

      if (input.classId) {
        const classData = await db.class.findUnique({
          where: { id: input.classId },
          select: { name: true },
        });
        classNameForMetadata = classData?.name || "All Classes";
      }

      if (input.sectionId) {
        const sectionData = await db.classSection.findUnique({
          where: { id: input.sectionId },
          select: { name: true },
        });
        sectionNameForMetadata = sectionData?.name || "All Sections";
      }

      return {
        success: true,
        data: {
          filename: `${filename}.xlsx`,
          content: JSON.stringify({
            data: exportData,
            metadata: {
              examName: `${exam.examType.name} - ${exam.subject.name}`,
              class: classNameForMetadata,
              section: sectionNameForMetadata,
              term: exam.term.name,
              academicYear: exam.term.academicYear.name,
              totalMarks: exam.totalMarks,
              exportDate: new Date().toISOString(),
            },
          }),
          mimeType: "application/json", // Client will convert to Excel
        },
      };
    }
  } catch (error) {
    console.error("Error exporting marks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export marks",
    };
  }
}

/**
 * Generate CSV content from marks data
 */
async function generateCSV(data: StudentMarkData[], exam: any, classId?: string, sectionId?: string): Promise<string> {
  // Get class and section names if IDs are provided
  let className = "All Classes";
  let sectionName = "All Sections";

  if (classId) {
    const classData = await db.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });
    className = classData?.name || "All Classes";
  }

  if (sectionId) {
    const sectionData = await db.classSection.findUnique({
      where: { id: sectionId },
      select: { name: true },
    });
    sectionName = sectionData?.name || "All Sections";
  }

  // Define headers
  const headers = [
    "Student ID",
    "Roll Number",
    "Student Name",
    "Theory Marks",
    "Practical Marks",
    "Internal Marks",
    "Total Marks",
    "Percentage",
    "Grade",
    "Status",
    "Remarks",
  ];

  // Create CSV rows
  const rows = data.map((row) => [
    row.studentId,
    row.rollNumber,
    row.studentName,
    row.theoryMarks !== null ? row.theoryMarks.toString() : "",
    row.practicalMarks !== null ? row.practicalMarks.toString() : "",
    row.internalMarks !== null ? row.internalMarks.toString() : "",
    row.totalMarks !== null ? row.totalMarks.toString() : "",
    row.percentage !== null ? row.percentage.toFixed(2) : "",
    row.grade || "",
    row.status,
    row.remarks || "",
  ]);

  // Add metadata header
  const metadata = [
    [`Exam: ${exam.examType.name} - ${exam.subject.name}`],
    [`Class: ${className}`],
    [`Section: ${sectionName}`],
    [`Term: ${exam.term.name}`],
    [`Academic Year: ${exam.term.academicYear.name}`],
    [`Total Marks: ${exam.totalMarks}`],
    [`Export Date: ${new Date().toLocaleDateString()}`],
    [], // Empty row
  ];

  // Combine metadata, headers, and data
  const allRows = [
    ...metadata,
    headers,
    ...rows,
  ];

  // Convert to CSV format
  return allRows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    )
    .join("\n");
}

/**
 * Get available exams for export
 */
export async function getExamsForExport() {
  try {
    // CRITICAL: Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const exams = await db.exam.findMany({
      where: {
        schoolId, // Add school isolation
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        examType: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        examDate: "desc",
      },
    });

    return {
      success: true,
      data: exams,
    };
  } catch (error) {
    console.error("Error fetching exams for export:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exams",
    };
  }
}
