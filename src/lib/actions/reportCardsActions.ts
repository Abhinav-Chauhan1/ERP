"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
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
import { calculateGrade } from "../utils/grade-calculator";
import {
  aggregateMultiTermReportCardData,
  type MultiTermReportCardData,
} from "../services/report-card-data-aggregation";
import {
  generateCBSEReportCardPDF,
  generateBatchCBSEReportCards,
} from "../services/report-card-cbse-renderer";

// Get all report cards with optional filtering — scoped to school
export const getReportCards = withSchoolAuthAction(
  async (
    schoolId: string,
    _userId: string,
    _role: string,
    filters?: { published?: boolean; termId?: string; classId?: string }
  ) => {
    try {
      const where: any = { schoolId };

      if (filters?.published !== undefined) {
        where.isPublished = filters.published;
      }
      if (filters?.termId) {
        where.termId = filters.termId;
      }
      if (filters?.classId) {
        where.student = {
          enrollments: {
            some: { classId: filters.classId, status: "ACTIVE" },
          },
        };
      }

      const reportCards = await db.reportCard.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              enrollments: {
                where: { status: "ACTIVE" },
                include: { class: true, section: true },
              },
            },
          },
          term: { include: { academicYear: true } },
        },
        orderBy: { isPublished: "asc" },
      });

      const formattedReportCards = reportCards.map((rc) => {
        const currentEnrollment = rc.student.enrollments[0];
        return {
          id: rc.id,
          studentId: rc.studentId,
          studentName: `${rc.student.user.firstName} ${rc.student.user.lastName}`,
          studentAdmissionId: rc.student.admissionId,
          termId: rc.termId,
          term: rc.term?.name ?? "",
          academicYear: rc.term?.academicYear.name ?? "",
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
        error: error instanceof Error ? error.message : "Failed to fetch report cards",
      };
    }
  }
);

// Get a single report card by ID — ownership verified via schoolId
export const getReportCardById = withSchoolAuthAction(
  async (schoolId: string, _userId: string, _role: string, id: string) => {
    try {
      // Single query — no double-fetch
      const reportCard = await db.reportCard.findUnique({
        where: { id, schoolId },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, avatar: true } },
              enrollments: {
                where: { status: "ACTIVE" },
                include: { class: true, section: true },
              },
            },
          },
          term: {
            include: {
              academicYear: true,
              exams: {
                include: {
                  subject: true,
                  results: { where: { schoolId } },
                },
              },
            },
          },
        },
      });

      if (!reportCard) {
        return { success: false, error: "Report card not found" };
      }

      // Group exam results by subject
      const subjectResults: Record<string, any> = {};
      reportCard.term?.exams.forEach((exam) => {
        const result = exam.results.find((r) => r.studentId === reportCard.studentId);
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

      Object.values(subjectResults).forEach((subject: any) => {
        if (subject.totalMarks > 0) {
          subject.percentage = (subject.obtainedMarks / subject.totalMarks) * 100;
          subject.grade = calculateGrade(subject.percentage);
        }
      });

      const currentEnrollment = reportCard.student.enrollments[0];

      return {
        success: true,
        data: {
          id: reportCard.id,
          studentId: reportCard.studentId,
          studentName: `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`,
          studentAdmissionId: reportCard.student.admissionId,
          studentAvatar: reportCard.student.user.avatar,
          termId: reportCard.termId,
          term: reportCard.term?.name ?? "",
          academicYear: reportCard.term?.academicYear.name ?? "",
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
        },
      };
    } catch (error) {
      console.error("Error fetching report card:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch report card",
      };
    }
  }
);

// Create a new report card — schoolId injected from auth context
export const createReportCard = withSchoolAuthAction(
  async (schoolId: string, _userId: string, _role: string, data: ReportCardCreateValues) => {
    try {
      const term = await db.term.findUnique({
        where: { id: data.termId, schoolId },
        select: { academicYearId: true },
      });
      const academicYearId = term?.academicYearId;

      const existingReportCard = await db.reportCard.findUnique({
        where: {
          studentId_termId_academicYearId: {
            studentId: data.studentId,
            termId: data.termId,
            academicYearId: academicYearId ?? "",
          },
        },
      });

      if (existingReportCard) {
        return {
          success: false,
          error: "A report card already exists for this student and term",
        };
      }

      const reportCard = await db.reportCard.create({
        data: {
          studentId: data.studentId,
          termId: data.termId,
          academicYearId,
          totalMarks: data.totalMarks,
          averageMarks: data.averageMarks,
          percentage: data.percentage,
          grade: data.grade,
          rank: data.rank,
          attendance: data.attendance,
          schoolId,
        },
      });

      revalidatePath("/admin/assessment/report-cards");
      return { success: true, data: reportCard };
    } catch (error) {
      console.error("Error creating report card:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create report card",
      };
    }
  }
);

// Generate report card for a student — schoolId from auth context
export const generateReportCard = withSchoolAuthAction(
  async (
    schoolId: string,
    _userId: string,
    _role: string,
    studentId: string,
    termId: string,
    academicYearId?: string
  ) => {
    try {
      const {
        aggregateReportCardData,
        calculateResultStatus,
      } = await import("@/lib/services/report-card-data-aggregation");

      // Verify student belongs to this school
      const student = await db.student.findUnique({
        where: { id: studentId, schoolId },
        select: { id: true },
      });

      if (!student) {
        return { success: false, error: "Student not found" };
      }

      let resolvedAcademicYearId = academicYearId;
      if (!resolvedAcademicYearId) {
        const term = await db.term.findUnique({
          where: { id: termId, schoolId },
          select: { academicYearId: true },
        });
        resolvedAcademicYearId = term?.academicYearId;
      }

      const existingReportCard = await db.reportCard.findUnique({
        where: {
          studentId_termId_academicYearId: {
            studentId,
            termId,
            academicYearId: resolvedAcademicYearId ?? "",
          },
        },
      });

      const reportCardData = await aggregateReportCardData(studentId, termId);

      if (reportCardData.subjects.length === 0) {
        return {
          success: false,
          error: "No exam results found for this student in the selected term",
        };
      }

      const { overallPerformance, attendance, coScholastic } = reportCardData;
      const presentSubjectsCount = reportCardData.subjects.filter((s) => !s.isAbsent).length;
      const coScholasticData = coScholastic.length > 0 ? coScholastic : null;
      const resultStatus = calculateResultStatus(reportCardData.subjects as any);

      let reportCard;
      if (existingReportCard) {
        reportCard = await db.reportCard.update({
          where: { id: existingReportCard.id },
          data: {
            totalMarks: overallPerformance.totalMarks,
            averageMarks: overallPerformance.obtainedMarks / presentSubjectsCount || 0,
            percentage: overallPerformance.percentage,
            grade: overallPerformance.grade,
            attendance: attendance.percentage,
            coScholasticData: coScholasticData as any,
            resultStatus,
            templateId:
              (reportCardData.student as any).reportCardTemplateId ||
              existingReportCard.templateId,
          },
        });
      } else {
        reportCard = await db.reportCard.create({
          data: {
            studentId,
            termId,
            academicYearId: resolvedAcademicYearId,
            schoolId,
            totalMarks: overallPerformance.totalMarks,
            averageMarks: overallPerformance.obtainedMarks / presentSubjectsCount || 0,
            percentage: overallPerformance.percentage,
            grade: overallPerformance.grade,
            attendance: attendance.percentage,
            coScholasticData: coScholasticData as any,
            resultStatus,
            templateId: (reportCardData.student as any).reportCardTemplateId,
          },
        });
      }

      revalidatePath("/admin/assessment/report-cards");
      return { success: true, data: reportCard };
    } catch (error) {
      console.error("Error generating report card:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report card",
      };
    }
  }
);

// Update report card remarks — ownership verified via schoolId
export const updateReportCardRemarks = withSchoolAuthAction(
  async (schoolId: string, _userId: string, _role: string, data: ReportCardRemarksValues) => {
    try {
      // Verify ownership before updating
      const existing = await db.reportCard.findUnique({
        where: { id: data.id, schoolId },
        select: { id: true },
      });

      if (!existing) {
        return { success: false, error: "Report card not found" };
      }

      const reportCard = await db.reportCard.update({
        where: { id: data.id, schoolId },
        data: {
          teacherRemarks: data.teacherRemarks,
          principalRemarks: data.principalRemarks,
        },
      });

      revalidatePath("/admin/assessment/report-cards");
      revalidatePath(`/admin/assessment/report-cards/${data.id}`);
      return { success: true, data: reportCard };
    } catch (error) {
      console.error("Error updating report card remarks:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update report card remarks",
      };
    }
  }
);

// Publish a report card — ownership verified via schoolId
export const publishReportCard = withSchoolAuthAction(
  async (schoolId: string, _userId: string, _role: string, data: ReportCardPublishValues) => {
    try {
      // Verify ownership before publishing
      const reportCard = await db.reportCard.findUnique({
        where: { id: data.id, schoolId },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              parents: {
                include: {
                  parent: {
                    include: {
                      user: { select: { firstName: true, lastName: true, email: true } },
                    },
                  },
                },
              },
            },
          },
          term: { include: { academicYear: true } },
        },
      });

      if (!reportCard) {
        return { success: false, error: "Report card not found" };
      }

      if (reportCard.isPublished) {
        return { success: false, error: "Report card is already published" };
      }

      const updatedReportCard = await db.reportCard.update({
        where: { id: data.id, schoolId },
        data: { isPublished: true, publishDate: new Date() },
      });

      if (data.sendNotification) {
        try {
          await db.notification.create({
            data: {
              userId: reportCard.student.userId,
              title: "Report Card Published",
              message: `Your report card for ${reportCard.term?.name ?? ""} (${reportCard.term?.academicYear.name ?? ""}) has been published and is now available for viewing.`,
              type: "ACADEMIC",
              isRead: false,
              schoolId,
            },
          });

          // M-11: batch parent notifications with createMany instead of N sequential creates
          if (reportCard.student.parents.length > 0) {
            const studentName = `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`;
            await db.notification.createMany({
              data: reportCard.student.parents.map((sp) => ({
                userId: sp.parent.userId,
                title: "Report Card Published",
                message: `Report card for ${studentName} - ${reportCard.term?.name ?? ""} (${reportCard.term?.academicYear.name ?? ""}) has been published.`,
                type: "ACADEMIC" as const,
                isRead: false,
                schoolId,
              })),
            });
          }

          const { sendEmail, isEmailConfigured } = await import("@/lib/services/email-service");

          if (isEmailConfigured()) {
            const studentName = `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`;
            const termName = reportCard.term?.name ?? "";
            const academicYear = reportCard.term?.academicYear.name ?? "";

            if (reportCard.student.user.email) {
              await sendEmail({
                to: reportCard.student.user.email,
                subject: `Report Card Published - ${termName} (${academicYear})`,
                html: `<h1>Report Card Published</h1><p>Dear ${studentName},</p><p>Your report card for <strong>${termName}</strong> (${academicYear}) has been published.</p>`,
              });
            }

            for (const studentParent of reportCard.student.parents) {
              if (studentParent.parent.user.email) {
                await sendEmail({
                  to: studentParent.parent.user.email,
                  subject: `Report Card Published for ${studentName}`,
                  html: `<h1>Report Card Published</h1><p>Dear ${studentParent.parent.user.firstName} ${studentParent.parent.user.lastName},</p><p>The report card for <strong>${studentName}</strong> for ${termName} (${academicYear}) has been published.</p>`,
                });
              }
            }
          }
        } catch (notificationError) {
          console.error("Error sending notifications:", notificationError);
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
        error: error instanceof Error ? error.message : "Failed to publish report card",
      };
    }
  }
);

// Batch publish report cards — validates ALL ids belong to this school before processing any
export const batchPublishReportCards = withSchoolAuthAction(
  async (
    schoolId: string,
    _userId: string,
    _role: string,
    reportCardIds: string[],
    sendNotification = false
  ) => {
    try {
      // Verify ALL ids belong to this school before processing any
      const count = await db.reportCard.count({
        where: { id: { in: reportCardIds }, schoolId },
      });

      if (count !== reportCardIds.length) {
        return {
          success: false,
          error: "One or more report cards do not belong to this school",
        };
      }

      const results = {
        successful: [] as string[],
        failed: [] as { id: string; error: string }[],
      };

      // M-9: process in parallel batches instead of sequential awaits
      const CONCURRENCY = 5;
      for (let i = 0; i < reportCardIds.length; i += CONCURRENCY) {
        const batch = reportCardIds.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map((id) => publishReportCard({ id, sendNotification }))
        );
        batchResults.forEach((result, idx) => {
          const id = batch[idx];
          if (result.success) {
            results.successful.push(id);
          } else {
            results.failed.push({ id, error: (result as any).error || "Unknown error" });
          }
        });
      }

      revalidatePath("/admin/assessment/report-cards");
      revalidatePath("/student/assessments/report-cards");
      revalidatePath("/parent/performance/reports");

      return {
        success: true,
        data: results,
        message: `Published ${results.successful.length} report cards. ${results.failed.length} failed.`,
      };
    } catch (error) {
      console.error("Error batch publishing report cards:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to batch publish report cards",
      };
    }
  }
);

// Calculate class ranks for a particular term — scoped to school
export const calculateClassRanks = withSchoolAuthAction(
  async (schoolId: string, _userId: string, _role: string, termId: string, classId: string) => {
    try {
      const reportCards = await db.reportCard.findMany({
        where: {
          schoolId,
          termId,
          student: {
            enrollments: {
              some: { classId, status: "ACTIVE" },
            },
          },
        },
        orderBy: { percentage: "desc" },
      });

      // M-10: batch all rank updates in a single transaction instead of N sequential UPDATEs
      await db.$transaction(
        reportCards.map((rc, i) =>
          db.reportCard.update({
            where: { id: rc.id, schoolId },
            data: { rank: i + 1 },
          })
        )
      );

      revalidatePath("/admin/assessment/report-cards");
      return { success: true, message: "Class ranks calculated successfully" };
    } catch (error) {
      console.error("Error calculating class ranks:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to calculate class ranks",
      };
    }
  }
);

// Get terms and classes for filters — scoped to school
export const getReportCardFilters = withSchoolAuthAction(
  async (schoolId: string) => {
    try {
      const [terms, classes, sections] = await Promise.all([
        db.term.findMany({
          where: { schoolId },
          orderBy: { startDate: "desc" },
          include: { academicYear: true },
        }),
        db.class.findMany({
          where: { schoolId },
          orderBy: { name: "asc" },
          include: { academicYear: true },
        }),
        db.classSection.findMany({
          where: { schoolId },
          orderBy: { name: "asc" },
          include: { class: true },
        }),
      ]);

      return { success: true, data: { terms, classes, sections } };
    } catch (error) {
      console.error("Error fetching report card filters:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch filters",
      };
    }
  }
);

// Get students for report card generation — scoped to school
export const getStudentsForReportCard = withSchoolAuthAction(
  async (schoolId: string) => {
    try {
      const students = await db.student.findMany({
        where: { schoolId },
        select: {
          id: true,
          admissionId: true,
          rollNumber: true,
          user: { select: { firstName: true, lastName: true } },
          enrollments: {
            where: { status: "ACTIVE", schoolId },
            include: { class: true, section: true },
          },
        },
        orderBy: [{ user: { firstName: "asc" } }],
      });

      const formattedStudents = students.map((student) => {
        const currentEnrollment = student.enrollments[0];
        return {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          admissionId: student.admissionId,
          rollNumber: student.rollNumber || "",
          class: currentEnrollment?.class.name || "",
          section: currentEnrollment?.section.name || "",
        };
      });

      return { success: true, data: formattedStudents };
    } catch (error) {
      console.error("Error fetching students:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch students",
      };
    }
  }
);

// Get report card templates — scoped to school
export const getReportCardTemplates = withSchoolAuthAction(
  async (schoolId: string) => {
    try {
      const templates = await db.reportCardTemplate.findMany({
        where: { schoolId },
        select: { id: true, name: true, cbseLevel: true, isDefault: true },
        orderBy: { name: "asc" },
      });
      return { success: true, data: templates };
    } catch (error) {
      console.error("Error fetching report card templates:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch templates",
      };
    }
  }
);

/**
 * Get detailed attendance data for a student and term
 */
export async function getAttendanceForReportCard(studentId: string, termId: string) {
  try {
    // Auth check — no school-specific filter needed here as attendance calculator handles it
    await requireSchoolAccess();

    const attendanceData = await calculateAttendanceForTerm(studentId, termId);

    return {
      success: true,
      data: {
        ...attendanceData,
        displayText: formatAttendanceForDisplay(attendanceData),
      },
    };
  } catch (error) {
    console.error("Error fetching attendance for report card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attendance data",
    };
  }
}

// ---------------------------------------------------------------------------
// CBSE Multi-Term Report Card Actions
// ---------------------------------------------------------------------------

/**
 * Generate a single CBSE multi-term report card PDF.
 */
export async function generateCBSEReportCardAction(params: {
  studentId: string;
  academicYearId: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string;
  affiliationNo?: string;
  schoolCode?: string;
}) {
  try {
    // Auth + school scope check
    const { schoolId } = await requireSchoolAccess();

    // Verify student belongs to this school
    if (schoolId) {
      const student = await db.student.findUnique({
        where: { id: params.studentId, schoolId },
        select: { id: true },
      });
      if (!student) {
        return { success: false, error: "Student not found" };
      }
    }

    const data = await aggregateMultiTermReportCardData(
      params.studentId,
      params.academicYearId,
    );

    const { db: dbInst } = await import("@/lib/db");
    // Use session schoolId (already verified above) instead of data.student.schoolId
    const lookupSchoolId = schoolId || data.student.schoolId;
    const school = await dbInst.school.findUnique({
      where: { id: lookupSchoolId },
      select: {
        name: true,
        logo: true,
        phone: true,
        email: true,
        address: true,
        schoolCode: true,
        metadata: true,
      },
    });

    let logoUrl = params.schoolLogo ?? school?.logo ?? undefined;

    if (!logoUrl) {
      const schoolSettings = await dbInst.schoolSettings.findFirst({
        where: { schoolId: lookupSchoolId },
        select: { schoolLogo: true },
      });
      logoUrl = schoolSettings?.schoolLogo ?? undefined;
    }

    if (logoUrl && !logoUrl.startsWith("http") && !logoUrl.startsWith("data:")) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
      logoUrl = `${baseUrl}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
    }

    if (logoUrl && logoUrl.startsWith("http")) {
      try {
        const res = await fetch(logoUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const contentType = res.headers.get("content-type") || "image/png";
          logoUrl = `data:${contentType};base64,${Buffer.from(buf).toString("base64")}`;
        }
      } catch {
        logoUrl = undefined;
      }
    }

    const meta = school?.metadata as Record<string, string> | null;
    const affiliationNo = params.affiliationNo ?? meta?.affiliationNo ?? undefined;

    let cbseLevel: "CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR" | undefined;
    if (data.templateId) {
      const tpl = await dbInst.reportCardTemplate.findUnique({
        where: { id: data.templateId },
        select: { cbseLevel: true },
      });
      if (tpl?.cbseLevel) {
        cbseLevel = tpl.cbseLevel as typeof cbseLevel;
      }
    }

    const pdfBuffer = await generateCBSEReportCardPDF(data, {
      schoolName: params.schoolName ?? school?.name ?? undefined,
      schoolAddress: params.schoolAddress ?? school?.address ?? undefined,
      schoolPhone: params.schoolPhone ?? school?.phone ?? undefined,
      schoolEmail: params.schoolEmail ?? school?.email ?? undefined,
      schoolLogo: logoUrl,
      affiliationNo,
      schoolCode: params.schoolCode ?? school?.schoolCode ?? undefined,
      cbseLevel,
    });

    return {
      success: true,
      pdfBase64: pdfBuffer.toString("base64"),
      fileName: `CBSE_Report_Card_${data.student.name.replace(/\s+/g, "_")}_${data.academicYear}.pdf`,
    };
  } catch (error) {
    console.error("Error generating CBSE report card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate CBSE report card",
    };
  }
}

/**
 * Generate CBSE report cards in batch for multiple students.
 */
export async function generateBatchCBSEReportCardsAction(params: {
  studentIds: string[];
  academicYearId: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string;
  affiliationNo?: string;
  schoolCode?: string;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();

    // Verify all students belong to this school
    if (schoolId && params.studentIds.length > 0) {
      const count = await db.student.count({
        where: { id: { in: params.studentIds }, schoolId },
      });
      if (count !== params.studentIds.length) {
        return { success: false, error: "One or more students do not belong to this school" };
      }
    }

    const dataList: MultiTermReportCardData[] = await Promise.all(
      params.studentIds.map((sid) =>
        aggregateMultiTermReportCardData(sid, params.academicYearId),
      ),
    );

    let resolvedSchoolName = params.schoolName;
    let resolvedAddress = params.schoolAddress;
    let resolvedPhone = params.schoolPhone;
    let resolvedEmail = params.schoolEmail;
    let resolvedLogo = params.schoolLogo;
    let resolvedAffiliation = params.affiliationNo;
    let resolvedCode = params.schoolCode;

    if (dataList.length > 0) {
      const { db: dbInst } = await import("@/lib/db");
      // Use session schoolId instead of dataList[0].student.schoolId
      const lookupSchoolId = schoolId || dataList[0].student.schoolId;
      const school = await dbInst.school.findUnique({
        where: { id: lookupSchoolId },
        select: { name: true, logo: true, phone: true, email: true, address: true, schoolCode: true, metadata: true },
      });
      const ss = await dbInst.schoolSettings.findFirst({
        where: { schoolId: lookupSchoolId },
        select: { schoolName: true, schoolAddress: true, schoolPhone: true, schoolEmail: true, schoolLogo: true, affiliationNumber: true },
      });
      if (school || ss) {
        const meta = school?.metadata as Record<string, string> | null;
        resolvedSchoolName ??= school?.name || ss?.schoolName || undefined;
        resolvedAddress    ??= school?.address || ss?.schoolAddress || undefined;
        resolvedPhone      ??= school?.phone || ss?.schoolPhone || undefined;
        resolvedEmail      ??= school?.email || ss?.schoolEmail || undefined;
        resolvedCode       ??= school?.schoolCode || undefined;
        resolvedAffiliation ??= ss?.affiliationNumber ?? meta?.affiliationNo ?? undefined;
        if (!resolvedLogo) {
          let logoUrl = school?.logo ?? ss?.schoolLogo ?? undefined;
          if (logoUrl && !logoUrl.startsWith("http") && !logoUrl.startsWith("data:")) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
            logoUrl = `${baseUrl}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
          }
          resolvedLogo = logoUrl;
        }
      }
    }

    const pdfBuffer = await generateBatchCBSEReportCards(dataList, {
      schoolName: resolvedSchoolName,
      schoolAddress: resolvedAddress,
      schoolPhone: resolvedPhone,
      schoolEmail: resolvedEmail,
      schoolLogo: resolvedLogo,
      affiliationNo: resolvedAffiliation,
      schoolCode: resolvedCode,
    });

    return {
      success: true,
      pdfBase64: pdfBuffer.toString("base64"),
      fileName: `CBSE_Report_Cards_Batch_${params.academicYearId}.pdf`,
    };
  } catch (error) {
    console.error("Error generating batch CBSE report cards:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate batch CBSE report cards",
    };
  }
}

/**
 * Preview a CBSE report card — returns data the UI can render without triggering a download.
 */
export async function previewCBSEReportCardAction(params: {
  studentId: string;
  academicYearId: string;
  schoolName?: string;
  schoolAddress?: string;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();

    if (schoolId) {
      const student = await db.student.findUnique({
        where: { id: params.studentId, schoolId },
        select: { id: true },
      });
      if (!student) {
        return { success: false, error: "Student not found" };
      }
    }

    const data = await aggregateMultiTermReportCardData(
      params.studentId,
      params.academicYearId,
    );

    const pdfBuffer = await generateCBSEReportCardPDF(data, {
      schoolName: params.schoolName,
      schoolAddress: params.schoolAddress,
    });

    return {
      success: true,
      pdfBase64: pdfBuffer.toString("base64"),
      reportData: {
        studentName: data.student.name,
        className: data.student.class,
        section: data.student.section,
        academicYear: data.academicYear,
        resultStatus: data.resultStatus,
        percentage: data.overallPerformance.percentage,
      },
    };
  } catch (error) {
    console.error("Error previewing CBSE report card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to preview CBSE report card",
    };
  }
}
