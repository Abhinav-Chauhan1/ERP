"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ReportCardCreateValues,
  ReportCardUpdateValues,
  ReportCardRemarksValues,
  ReportCardPublishValues
} from "../schemaValidation/reportCardsSchemaValidation";
import {
  calculateAttendanceForTerm,
  formatAttendanceForDisplay,
  type AttendanceData
} from "../utils/attendance-calculator";

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
      coScholasticData: reportCard.coScholasticData || null,
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
    // Import the aggregation service
    const { aggregateReportCardData } = await import("@/lib/services/report-card-data-aggregation");

    // Check if a report card already exists for this student and term
    const existingReportCard = await db.reportCard.findUnique({
      where: {
        studentId_termId: {
          studentId,
          termId
        }
      }
    });

    // Aggregate all report card data using the service
    const reportCardData = await aggregateReportCardData(studentId, termId);

    // Check if there are any exam results
    if (reportCardData.subjects.length === 0) {
      return {
        success: false,
        error: "No exam results found for this student in the selected term"
      };
    }

    // Extract values from aggregated data
    const { overallPerformance, attendance, coScholastic } = reportCardData;
    const presentSubjectsCount = reportCardData.subjects.filter(s => !s.isAbsent).length;

    // Format co-scholastic data for JSON storage
    const coScholasticData = coScholastic.length > 0 ? coScholastic : null;

    let reportCard;
    if (existingReportCard) {
      // Update existing report card
      reportCard = await db.reportCard.update({
        where: { id: existingReportCard.id },
        data: {
          totalMarks: overallPerformance.totalMarks,
          averageMarks: overallPerformance.obtainedMarks / presentSubjectsCount || 0,
          percentage: overallPerformance.percentage,
          grade: overallPerformance.grade,
          attendance: attendance.percentage,
          coScholasticData: coScholasticData as any,
          templateId: (reportCardData.student as any).reportCardTemplateId || existingReportCard.templateId,
        }
      });
    } else {
      // Create new report card
      reportCard = await db.reportCard.create({
        data: {
          studentId,
          termId,
          totalMarks: overallPerformance.totalMarks,
          averageMarks: overallPerformance.obtainedMarks / presentSubjectsCount || 0,
          percentage: overallPerformance.percentage,
          grade: overallPerformance.grade,
          attendance: attendance.percentage,
          coScholasticData: coScholasticData as any,
          templateId: (reportCardData.student as any).reportCardTemplateId,
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
    // Get report card with student and parent information
    const reportCard = await db.reportCard.findUnique({
      where: { id: data.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            parents: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                      }
                    }
                  }
                }
              }
            }
          }
        },
        term: {
          include: {
            academicYear: true
          }
        }
      }
    });

    if (!reportCard) {
      return {
        success: false,
        error: "Report card not found"
      };
    }

    // Check if already published
    if (reportCard.isPublished) {
      return {
        success: false,
        error: "Report card is already published"
      };
    }

    // Update report card to published
    const updatedReportCard = await db.reportCard.update({
      where: { id: data.id },
      data: {
        isPublished: true,
        publishDate: new Date(),
      }
    });

    // Send notifications if requested
    if (data.sendNotification) {
      try {
        // Create in-app notifications for student
        await db.notification.create({
          data: {
            userId: reportCard.student.userId,
            title: "Report Card Published",
            message: `Your report card for ${reportCard.term.name} (${reportCard.term.academicYear.name}) has been published and is now available for viewing.`,
            type: "ACADEMIC",
            isRead: false,
          }
        });

        // Create in-app notifications for all parents
        for (const studentParent of reportCard.student.parents) {
          await db.notification.create({
            data: {
              userId: studentParent.parent.userId,
              title: "Report Card Published",
              message: `Report card for ${reportCard.student.user.firstName} ${reportCard.student.user.lastName} - ${reportCard.term.name} (${reportCard.term.academicYear.name}) has been published.`,
              type: "ACADEMIC",
              isRead: false,
            }
          });
        }

        // Send email notifications using the email service
        const { sendEmail, isEmailConfigured } = await import('@/lib/services/email-service');

        if (isEmailConfigured()) {
          const studentName = `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`;
          const termName = reportCard.term.name;
          const academicYear = reportCard.term.academicYear.name;

          // Send email to student if they have an email
          if (reportCard.student.user.email) {
            await sendEmail({
              to: reportCard.student.user.email,
              subject: `Report Card Published - ${termName} (${academicYear})`,
              html: `
                <h1>Report Card Published</h1>
                <p>Dear ${studentName},</p>
                <p>Your report card for <strong>${termName}</strong> (${academicYear}) has been published and is now available for viewing.</p>
                <p>Please log in to the student portal to view your detailed results.</p>
                <br>
                <p>Best regards,<br>School Administration</p>
              `
            });
          }

          // Send email to parents
          for (const studentParent of reportCard.student.parents) {
            if (studentParent.parent.user.email) {
              await sendEmail({
                to: studentParent.parent.user.email,
                subject: `Report Card Published for ${studentName}`,
                html: `
                  <h1>Report Card Published</h1>
                  <p>Dear ${studentParent.parent.user.firstName} ${studentParent.parent.user.lastName},</p>
                  <p>The report card for <strong>${studentName}</strong> for ${termName} (${academicYear}) has been published.</p>
                  <p>Please log in to the parent portal to view the detailed results.</p>
                  <br>
                  <p>Best regards,<br>School Administration</p>
                `
              });
            }
          }
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Don't fail the publish operation if notifications fail
      }
    }

    revalidatePath("/admin/assessment/report-cards");
    revalidatePath(`/admin/assessment/report-cards/${data.id}`);
    revalidatePath("/student/assessments/report-cards");
    revalidatePath("/parent/performance/reports");

    return { success: true, data: updatedReportCard };
  } catch (error) {
    console.error("Error publishing report card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish report card"
    };
  }
}

// Batch publish report cards
export async function batchPublishReportCards(reportCardIds: string[], sendNotification = false) {
  try {
    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of reportCardIds) {
      const result = await publishReportCard({ id, sendNotification });

      if (result.success) {
        results.successful.push(id);
      } else {
        results.failed.push({ id, error: result.error || "Unknown error" });
      }
    }

    revalidatePath("/admin/assessment/report-cards");
    revalidatePath("/student/assessments/report-cards");
    revalidatePath("/parent/performance/reports");

    return {
      success: true,
      data: results,
      message: `Published ${results.successful.length} report cards. ${results.failed.length} failed.`
    };
  } catch (error) {
    console.error("Error batch publishing report cards:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to batch publish report cards"
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
    const [terms, classes, sections] = await Promise.all([
      db.term.findMany({
        orderBy: { startDate: 'desc' },
        include: { academicYear: true }
      }),
      db.class.findMany({
        orderBy: { name: 'asc' },
        include: { academicYear: true }
      }),
      db.classSection.findMany({
        orderBy: { name: 'asc' },
        include: { class: true }
      })
    ]);

    return {
      success: true,
      data: {
        terms,
        classes,
        sections
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

/**
 * Get detailed attendance data for a student and term
 * This is useful for displaying attendance breakdown in report cards
 */
export async function getAttendanceForReportCard(studentId: string, termId: string) {
  try {
    const attendanceData = await calculateAttendanceForTerm(studentId, termId);

    return {
      success: true,
      data: {
        ...attendanceData,
        displayText: formatAttendanceForDisplay(attendanceData),
      }
    };
  } catch (error) {
    console.error("Error fetching attendance for report card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attendance data"
    };
  }
}
