"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  ReportCardCreateValues, 
  ReportCardUpdateValues, 
  ReportCardRemarksValues,
  ReportCardPublishValues 
} from "../schemaValidation/reportCardsSchemaValidation";

// Get all report cards with optional filtering
export async function getReportCards(filters?: { 
  published?: boolean, 
  termId?: string,
  classId?: string 
}) {
  try {
    // Build where clause based on filters
    const where: any = {};
    
    if (filters?.published !== undefined) {
      where.isPublished = filters.published;
    }
    
    if (filters?.termId) {
      where.termId = filters.termId;
    }
    
    if (filters?.classId) {
      where.student = {
        enrollments: {
          some: {
            classId: filters.classId,
            status: "ACTIVE"
          }
        }
      };
    }
    
    const reportCards = await db.reportCard.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            },
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                class: true,
                section: true,
              }
            }
          }
        },
        term: {
          include: {
            academicYear: true
          }
        }
      },
      orderBy: {
        isPublished: "asc",
      },
    });
    
    // Transform data to include student name, class, section
    const formattedReportCards = reportCards.map(rc => {
      const currentEnrollment = rc.student.enrollments[0];
      
      return {
        id: rc.id,
        studentId: rc.studentId,
        studentName: `${rc.student.user.firstName} ${rc.student.user.lastName}`,
        studentAdmissionId: rc.student.admissionId,
        termId: rc.termId,
        term: rc.term.name,
        academicYear: rc.term.academicYear.name,
        grade: currentEnrollment?.class.name || "",
        section: currentEnrollment?.section.name || "",
        totalMarks: rc.totalMarks,
        averageMarks: rc.averageMarks,
        percentage: rc.percentage,
        overallGrade: rc.grade,
        rank: rc.rank,
        attendance: rc.attendance,
        teacherRemarks: rc.teacherRemarks,
        principalRemarks: rc.principalRemarks,
        isPublished: rc.isPublished,
        publishDate: rc.publishDate,
        createdAt: rc.createdAt,
      };
    });
    
    return { success: true, data: formattedReportCards };
  } catch (error) {
    console.error("Error fetching report cards:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch report cards" 
    };
  }
}

// Get a single report card by ID
export async function getReportCardById(id: string) {
  try {
    // First fetch the basic report card to get the studentId
    const basicReportCard = await db.reportCard.findUnique({
      where: { id },
      select: {
        studentId: true
      }
    });
    
    if (!basicReportCard) {
      return { success: false, error: "Report card not found" };
    }
    
    // Now use the studentId for the full query
    const reportCard = await db.reportCard.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              }
            },
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                class: true,
                section: true,
              }
            }
          }
        },
        term: {
          include: {
            academicYear: true,
            exams: {
              where: {
                results: {
                  some: {
                    studentId: basicReportCard.studentId
                  }
                }
              },
              include: {
                subject: true,
                results: {
                  where: {
                    studentId: basicReportCard.studentId
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!reportCard) {
      return { success: false, error: "Report card not found" };
    }
    
    // Group exam results by subject
    const subjectResults: Record<string, any> = {};
    reportCard.term.exams.forEach(exam => {
      const result = exam.results[0]; // There should be only one result per student per exam
      
      if (!result) return;
      
      if (!subjectResults[exam.subject.id]) {
        subjectResults[exam.subject.id] = {
          subjectId: exam.subject.id,
          subject: exam.subject.name,
          exams: [],
          totalMarks: 0,
          obtainedMarks: 0,
          percentage: 0,
          grade: "",
        };
      }
      
      subjectResults[exam.subject.id].exams.push({
        examId: exam.id,
        examTitle: exam.title,
        totalMarks: exam.totalMarks,
        obtainedMarks: result.marks,
        percentage: (result.marks / exam.totalMarks) * 100,
        grade: result.grade || "",
        isAbsent: result.isAbsent,
      });
      
      if (!result.isAbsent) {
        subjectResults[exam.subject.id].totalMarks += exam.totalMarks;
        subjectResults[exam.subject.id].obtainedMarks += result.marks;
      }
    });
    
    // Calculate percentages and grades for each subject
    Object.values(subjectResults).forEach((subject: any) => {
      if (subject.totalMarks > 0) {
        subject.percentage = (subject.obtainedMarks / subject.totalMarks) * 100;
        // Simplified grade assignment - could be more complex based on your grading system
        if (subject.percentage >= 90) subject.grade = "A+";
        else if (subject.percentage >= 80) subject.grade = "A";
        else if (subject.percentage >= 70) subject.grade = "B+";
        else if (subject.percentage >= 60) subject.grade = "B";
        else if (subject.percentage >= 50) subject.grade = "C+";
        else if (subject.percentage >= 40) subject.grade = "C";
        else if (subject.percentage >= 33) subject.grade = "D";
        else subject.grade = "F";
      }
    });
    
    const currentEnrollment = reportCard.student.enrollments[0];
    
    const formattedReportCard = {
      id: reportCard.id,
      studentId: reportCard.studentId,
      studentName: `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`,
      studentAdmissionId: reportCard.student.admissionId,
      studentAvatar: reportCard.student.user.avatar,
      termId: reportCard.termId,
      term: reportCard.term.name,
      academicYear: reportCard.term.academicYear.name,
      grade: currentEnrollment?.class.name || "",
      section: currentEnrollment?.section.name || "",
      totalMarks: reportCard.totalMarks || 0,
      averageMarks: reportCard.averageMarks || 0,
      percentage: reportCard.percentage || 0,
      overallGrade: reportCard.grade || "",
      rank: reportCard.rank || 0,
      attendance: reportCard.attendance || 0,
      teacherRemarks: reportCard.teacherRemarks || "",
      principalRemarks: reportCard.principalRemarks || "",
      isPublished: reportCard.isPublished,
      publishDate: reportCard.publishDate,
      createdAt: reportCard.createdAt,
      subjectResults: Object.values(subjectResults),
    };
    
    return { success: true, data: formattedReportCard };
  } catch (error) {
    console.error("Error fetching report card:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch report card" 
    };
  }
}

// Create a new report card (usually generated from exam results)
export async function createReportCard(data: ReportCardCreateValues) {
  try {
    // Check if a report card already exists for this student and term
    const existingReportCard = await db.reportCard.findUnique({
      where: {
        studentId_termId: {
          studentId: data.studentId,
          termId: data.termId
        }
      }
    });

    if (existingReportCard) {
      return { 
        success: false, 
        error: "A report card already exists for this student and term" 
      };
    }

    // Create the report card
    const reportCard = await db.reportCard.create({
      data: {
        studentId: data.studentId,
        termId: data.termId,
        totalMarks: data.totalMarks,
        averageMarks: data.averageMarks,
        percentage: data.percentage,
        grade: data.grade,
        rank: data.rank,
        attendance: data.attendance,
      }
    });
    
    revalidatePath("/admin/assessment/report-cards");
    return { success: true, data: reportCard };
  } catch (error) {
    console.error("Error creating report card:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create report card" 
    };
  }
}

// Generate report card for a student
export async function generateReportCard(studentId: string, termId: string) {
  try {
    // Check if a report card already exists for this student and term
    const existingReportCard = await db.reportCard.findUnique({
      where: {
        studentId_termId: {
          studentId,
          termId
        }
      }
    });

    // Get all exam results for the student in the term
    const examResults = await db.examResult.findMany({
      where: {
        studentId,
        exam: {
          termId
        }
      },
      include: {
        exam: true
      }
    });

    if (examResults.length === 0) {
      return { 
        success: false, 
        error: "No exam results found for this student in the selected term" 
      };
    }

    // Calculate report card values
    const presentResults = examResults.filter(result => !result.isAbsent);
    const totalMarks = presentResults.reduce((sum, result) => sum + result.exam.totalMarks, 0);
    const obtainedMarks = presentResults.reduce((sum, result) => sum + result.marks, 0);
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    
    // Determine grade based on percentage
    let grade = "";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B+";
    else if (percentage >= 60) grade = "B";
    else if (percentage >= 50) grade = "C+";
    else if (percentage >= 40) grade = "C";
    else if (percentage >= 33) grade = "D";
    else grade = "F";

    // Calculate attendance (could be improved with actual attendance records)
    // This is a placeholder calculation
    const attendancePercentage = 
      (examResults.filter(result => !result.isAbsent).length / examResults.length) * 100;

    let reportCard;
    if (existingReportCard) {
      // Update existing report card
      reportCard = await db.reportCard.update({
        where: { id: existingReportCard.id },
        data: {
          totalMarks,
          averageMarks: totalMarks > 0 ? obtainedMarks / presentResults.length : 0,
          percentage,
          grade,
          attendance: attendancePercentage,
        }
      });
    } else {
      // Create new report card
      reportCard = await db.reportCard.create({
        data: {
          studentId,
          termId,
          totalMarks,
          averageMarks: totalMarks > 0 ? obtainedMarks / presentResults.length : 0,
          percentage,
          grade,
          attendance: attendancePercentage,
        }
      });
    }
    
    revalidatePath("/admin/assessment/report-cards");
    return { success: true, data: reportCard };
  } catch (error) {
    console.error("Error generating report card:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate report card" 
    };
  }
}

// Update report card remarks
export async function updateReportCardRemarks(data: ReportCardRemarksValues) {
  try {
    const reportCard = await db.reportCard.update({
      where: { id: data.id },
      data: {
        teacherRemarks: data.teacherRemarks,
        principalRemarks: data.principalRemarks,
      }
    });
    
    revalidatePath("/admin/assessment/report-cards");
    revalidatePath(`/admin/assessment/report-cards/${data.id}`);
    return { success: true, data: reportCard };
  } catch (error) {
    console.error("Error updating report card remarks:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update report card remarks" 
    };
  }
}

// Publish a report card
export async function publishReportCard(data: ReportCardPublishValues) {
  try {
    const reportCard = await db.reportCard.update({
      where: { id: data.id },
      data: {
        isPublished: true,
        publishDate: new Date(),
      }
    });
    
    if (data.sendNotification) {
      // In a real application, you would add logic here to send notifications
      // For example, create notifications, send emails, or SMS
      console.log("Notification would be sent for report card:", data.id);
    }
    
    revalidatePath("/admin/assessment/report-cards");
    revalidatePath(`/admin/assessment/report-cards/${data.id}`);
    return { success: true, data: reportCard };
  } catch (error) {
    console.error("Error publishing report card:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to publish report card" 
    };
  }
}

// Calculate class ranks for a particular term
export async function calculateClassRanks(termId: string, classId: string) {
  try {
    // Get all report cards for this term and class
    const reportCards = await db.reportCard.findMany({
      where: {
        termId,
        student: {
          enrollments: {
            some: {
              classId,
              status: "ACTIVE"
            }
          }
        }
      },
      orderBy: {
        percentage: 'desc'
      }
    });
    
    // Update rank for each report card
    for (let i = 0; i < reportCards.length; i++) {
      await db.reportCard.update({
        where: { id: reportCards[i].id },
        data: { rank: i + 1 }
      });
    }
    
    revalidatePath("/admin/assessment/report-cards");
    return { success: true, message: "Class ranks calculated successfully" };
  } catch (error) {
    console.error("Error calculating class ranks:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to calculate class ranks" 
    };
  }
}

// Get terms and classes for filters
export async function getReportCardFilters() {
  try {
    const [terms, classes] = await Promise.all([
      db.term.findMany({
        orderBy: { startDate: 'desc' },
        include: { academicYear: true }
      }),
      db.class.findMany({
        orderBy: { name: 'asc' },
        include: { academicYear: true }
      })
    ]);
    
    return { 
      success: true, 
      data: { 
        terms, 
        classes 
      } 
    };
  } catch (error) {
    console.error("Error fetching report card filters:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch filters" 
    };
  }
}

// Get students for report card generation
export async function getStudentsForReportCard() {
  try {
    const students = await db.student.findMany({
      select: {
        id: true,
        admissionId: true,
        rollNumber: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: true,
            section: true
          }
        }
      },
      orderBy: [
        { user: { firstName: 'asc' } }
      ]
    });
    
    // Transform the data for easier consumption in the UI
    const formattedStudents = students.map(student => {
      const currentEnrollment = student.enrollments[0];
      
      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        admissionId: student.admissionId,
        rollNumber: student.rollNumber || "",
        class: currentEnrollment?.class.name || "",
        section: currentEnrollment?.section.name || ""
      };
    });
    
    return { success: true, data: formattedStudents };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch students" 
    };
  }
}
