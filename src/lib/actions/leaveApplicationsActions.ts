"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  LeaveApplicationFormValues,
  LeaveApplicationUpdateFormValues,
  LeaveApprovalFormValues
} from "../schemaValidation/leaveApplicationsSchemaValidation";
import { sendLeaveNotification } from "@/lib/services/communication-service";
import { currentUser } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/utils/permissions";
import { PermissionAction } from "@prisma/client";
import { withSchoolAuthAction } from "../auth/security-wrapper";

// Create a new leave application
export const createLeaveApplication = withSchoolAuthAction(async (schoolId, userId, userRole, data: LeaveApplicationFormValues) => {
  try {
    // Security check: Ensure user is applying for themselves OR has permission to apply for others
    let isAuthorized = false;

    // Check if applying for self
    if (data.applicantType === "STUDENT" && userRole === "STUDENT") {
      const student = await db.student.findUnique({
        where: { userId: userId, schoolId }
      });
      if (student && student.id === data.applicantId) {
        isAuthorized = true;
      }
    } else if (data.applicantType === "TEACHER" && userRole === "TEACHER") {
      const teacher = await db.teacher.findUnique({
        where: { userId: userId, schoolId }
      });
      if (teacher && teacher.id === data.applicantId) {
        isAuthorized = true;
      }
    }

    // If not self, check for admin permissions
    if (!isAuthorized) {
      const hasPerm = await hasPermission(userId, "ATTENDANCE", PermissionAction.UPDATE);
      if (hasPerm) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized to create leave application for this user" };
    }

    // Validate applicant exists based on type
    let applicantName = '';
    let applicantUserId = '';

    if (data.applicantType === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: data.applicantId, schoolId },
        include: { user: true },
      });
      if (!student) {
        return { success: false, error: "Student not found" };
      }
      applicantName = `${student.user.firstName} ${student.user.lastName}`;
      applicantUserId = student.userId;
    } else if (data.applicantType === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { id: data.applicantId, schoolId },
        include: { user: true },
      });
      if (!teacher) {
        return { success: false, error: "Teacher not found" };
      }
      applicantName = `${teacher.user.firstName} ${teacher.user.lastName}`;
      applicantUserId = teacher.userId;
    }

    // Check for overlapping leave applications
    const overlappingLeave = await db.leaveApplication.findFirst({
      where: {
        schoolId,
        applicantId: data.applicantId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            fromDate: { lte: data.toDate },
            toDate: { gte: data.fromDate }
          }
        ]
      }
    });

    if (overlappingLeave) {
      return {
        success: false,
        error: "There is already an approved or pending leave application for this period"
      };
    }

    const leaveApplication = await db.leaveApplication.create({
      data: {
        schoolId,
        applicantId: data.applicantId,
        applicantType: data.applicantType,
        fromDate: data.fromDate,
        toDate: data.toDate,
        reason: data.reason,
        status: data.status,
        remarks: data.remarks,
      }
    });

    // Send notification for leave submission
    try {
      await sendLeaveNotification({
        applicantId: applicantUserId,
        applicantName,
        leaveType: data.reason || 'Leave',
        startDate: data.fromDate,
        endDate: data.toDate,
        status: 'SUBMITTED',
        isTeacher: data.applicantType === 'TEACHER',
      }).catch(error => {
        console.error('Failed to send leave submission notification:', error);
      });

      // If teacher leave, notify administrators
      if (data.applicantType === 'TEACHER') {
        const admins = await db.user.findMany({
          where: {
            role: 'ADMIN',
            userSchools: {
              some: {
                schoolId,
                isActive: true
              }
            }
          },
        });

        for (const admin of admins) {
          await sendLeaveNotification({
            applicantId: admin.id,
            applicantName: `Admin (${admin.firstName} ${admin.lastName})`,
            leaveType: `Teacher Leave: ${applicantName}`,
            startDate: data.fromDate,
            endDate: data.toDate,
            status: 'SUBMITTED',
            isTeacher: false,
          }).catch(error => {
            console.error('Failed to send admin notification:', error);
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending leave notification:', notificationError);
    }

    revalidatePath("/admin/attendance/leave-applications");
    return { success: true, data: leaveApplication };
  } catch (error) {
    console.error("Error creating leave application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create leave application"
    };
  }
});

// Update an existing leave application
export const updateLeaveApplication = withSchoolAuthAction(async (schoolId, userId, userRole, data: LeaveApplicationUpdateFormValues) => {
  try {
    // Check if the leave application exists and belongs to the school
    const existingApplication = await db.leaveApplication.findFirst({
      where: { id: data.id, schoolId }
    });

    if (!existingApplication) {
      return { success: false, error: "Leave application not found" };
    }

    // Security check: Owner or Admin
    let isAuthorized = false;

    // Check ownership
    if (existingApplication.applicantType === "STUDENT") {
      const student = await db.student.findUnique({
        where: { userId: userId, schoolId }
      });
      if (student && student.id === existingApplication.applicantId) isAuthorized = true;
    } else if (existingApplication.applicantType === "TEACHER") {
      const teacher = await db.teacher.findUnique({
        where: { userId: userId, schoolId }
      });
      if (teacher && teacher.id === existingApplication.applicantId) isAuthorized = true;
    }

    // If not owner, check permission
    if (!isAuthorized) {
      const hasPerm = await hasPermission(userId, "ATTENDANCE", PermissionAction.UPDATE);
      if (hasPerm) isAuthorized = true;
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized" };
    }

    // If status is not being changed from PENDING, check for overlapping leave applications
    if (existingApplication.status === "PENDING" && data.status === "PENDING") {
      const overlappingLeave = await db.leaveApplication.findFirst({
        where: {
          schoolId,
          applicantId: data.applicantId,
          id: { not: data.id },
          status: { in: ["PENDING", "APPROVED"] },
          OR: [
            {
              fromDate: { lte: data.toDate },
              toDate: { gte: data.fromDate }
            }
          ]
        }
      });

      if (overlappingLeave) {
        return {
          success: false,
          error: "There is already an approved or pending leave application for this period"
        };
      }
    }

    const leaveApplication = await db.leaveApplication.update({
      where: { id: data.id, schoolId },
      data: {
        applicantId: data.applicantId,
        applicantType: data.applicantType,
        fromDate: data.fromDate,
        toDate: data.toDate,
        reason: data.reason,
        status: data.status,
        remarks: data.remarks,
      }
    });

    revalidatePath("/admin/attendance/leave-applications");
    return { success: true, data: leaveApplication };
  } catch (error) {
    console.error("Error updating leave application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update leave application"
    };
  }
});

// Approve or reject a leave application
export const processLeaveApplication = withSchoolAuthAction(async (schoolId, userId, userRole, data: LeaveApprovalFormValues) => {
  try {
    // Strict Permission Check: Only authorized roles can approve/reject
    const hasPerm = await hasPermission(userId, "ATTENDANCE", PermissionAction.UPDATE);
    if (!hasPerm) {
      return { success: false, error: "Insufficient permissions to process leave applications" };
    }

    // Check if the leave application exists and belongs to the school
    const existingApplication = await db.leaveApplication.findFirst({
      where: { id: data.id, schoolId }
    });

    if (!existingApplication) {
      return { success: false, error: "Leave application not found" };
    }

    if (existingApplication.status !== "PENDING") {
      return {
        success: false,
        error: "Only pending leave applications can be processed"
      };
    }

    // Get applicant details for notification
    let applicantName = '';
    let applicantUserId = '';

    if (existingApplication.applicantType === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: existingApplication.applicantId, schoolId },
        include: { user: true },
      });
      if (student) {
        applicantName = `${student.user.firstName} ${student.user.lastName}`;
        applicantUserId = student.userId;
      }
    } else if (existingApplication.applicantType === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { id: existingApplication.applicantId, schoolId },
        include: { user: true },
      });
      if (teacher) {
        applicantName = `${teacher.user.firstName} ${teacher.user.lastName}`;
        applicantUserId = teacher.userId;
      }
    }

    // Get approver name
    let approverName = '';
    // Use current user as approver
    const approverId = userId;

    const approver = await db.user.findUnique({
      where: { id: approverId },
    });
    if (approver) {
      approverName = `${approver.firstName} ${approver.lastName}`;
    }

    const leaveApplication = await db.leaveApplication.update({
      where: { id: data.id, schoolId },
      data: {
        status: data.status,
        approvedById: approverId,
        approvedOn: new Date(),
        remarks: data.remarks,
      }
    });

    // Send notification for approval/rejection
    try {
      await sendLeaveNotification({
        applicantId: applicantUserId,
        applicantName,
        leaveType: existingApplication.reason || 'Leave',
        startDate: existingApplication.fromDate,
        endDate: existingApplication.toDate,
        status: data.status,
        approverName,
        rejectionReason: data.status === 'REJECTED' ? data.remarks : undefined,
        isTeacher: existingApplication.applicantType === 'TEACHER',
      }).catch(error => {
        console.error('Failed to send leave status notification:', error);
      });
    } catch (notificationError) {
      console.error('Error sending leave notification:', notificationError);
    }

    // If leave is approved, automatically mark attendance as LEAVE
    if (data.status === "APPROVED") {
      const { fromDate, toDate, applicantId, applicantType } = existingApplication;

      const dates = [];
      const currentDate = new Date(fromDate);
      const endDate = new Date(toDate);

      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (applicantType === "STUDENT") {
        const studentEnrollment = await db.classEnrollment.findFirst({
          where: {
            schoolId,
            studentId: applicantId,
            status: "ACTIVE"
          }
        });

        if (studentEnrollment) {
          for (const date of dates) {
            const existingAttendance = await db.studentAttendance.findFirst({
              where: {
                schoolId,
                studentId: applicantId,
                date: date,
                sectionId: studentEnrollment.sectionId
              }
            });

            if (existingAttendance) {
              await db.studentAttendance.update({
                where: { id: existingAttendance.id, schoolId },
                data: {
                  status: "LEAVE",
                  reason: existingApplication.reason,
                  markedBy: approverId,
                }
              });
            } else {
              await db.studentAttendance.create({
                data: {
                  schoolId,
                  studentId: applicantId,
                  date: date,
                  sectionId: studentEnrollment.sectionId,
                  status: "LEAVE",
                  reason: existingApplication.reason,
                  markedBy: approverId,
                }
              });
            }
          }
        }
      } else if (applicantType === "TEACHER") {
        for (const date of dates) {
          const existingAttendance = await db.teacherAttendance.findFirst({
            where: {
              schoolId,
              teacherId: applicantId,
              date: date
            }
          });

          if (existingAttendance) {
            await db.teacherAttendance.update({
              where: { id: existingAttendance.id, schoolId },
              data: {
                status: "LEAVE",
                reason: existingApplication.reason,
                markedBy: approverId,
              }
            });
          } else {
            await db.teacherAttendance.create({
              data: {
                schoolId,
                teacherId: applicantId,
                date: date,
                status: "LEAVE",
                reason: existingApplication.reason,
                markedBy: approverId,
              }
            });
          }
        }
      }
    }

    revalidatePath("/admin/attendance/leave-applications");
    return { success: true, data: leaveApplication };
  } catch (error) {
    console.error("Error processing leave application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process leave application"
    };
  }
});

// Delete a leave application
export const deleteLeaveApplication = withSchoolAuthAction(async (schoolId, userId, userRole, id: string) => {
  try {
    const existingApplication = await db.leaveApplication.findFirst({
      where: { id, schoolId }
    });

    if (!existingApplication) {
      return { success: false, error: "Leave application not found" };
    }

    // Security: Owner OR Permission
    let isAuthorized = false;

    // Check ownership
    if (existingApplication.applicantType === "STUDENT") {
      const student = await db.student.findUnique({
        where: { userId: userId, schoolId }
      });
      if (student && student.id === existingApplication.applicantId) isAuthorized = true;
    } else if (existingApplication.applicantType === "TEACHER") {
      const teacher = await db.teacher.findUnique({
        where: { userId: userId, schoolId }
      });
      if (teacher && teacher.id === existingApplication.applicantId) isAuthorized = true;
    }

    if (!isAuthorized) {
      const hasPerm = await hasPermission(userId, "ATTENDANCE", PermissionAction.DELETE);
      if (hasPerm) isAuthorized = true;
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized" };
    }

    // Only allow deletion of pending leave applications
    if (existingApplication.status !== "PENDING") {
      return {
        success: false,
        error: "Only pending leave applications can be deleted"
      };
    }

    await db.leaveApplication.delete({
      where: { id, schoolId }
    });

    revalidatePath("/admin/attendance/leave-applications");
    return { success: true };
  } catch (error) {
    console.error("Error deleting leave application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete leave application"
    };
  }
});

// Get all leave applications
export const getLeaveApplications = withSchoolAuthAction(async (
  schoolId, userId, userRole,
  status?: string,
  applicantType?: string,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const where: any = { schoolId };

    const hasPerm = await hasPermission(userId, "ATTENDANCE", PermissionAction.READ);

    if (!hasPerm) {
      // Limit to own applications
      const student = await db.student.findUnique({
        where: { userId: userId, schoolId }
      });
      const teacher = await db.teacher.findUnique({
        where: { userId: userId, schoolId }
      });

      if (student) {
        where.applicantType = "STUDENT";
        where.applicantId = student.id;
      } else if (teacher) {
        where.applicantType = "TEACHER";
        where.applicantId = teacher.id;
      } else {
        return { success: false, error: "Unauthorized" };
      }
    } else {
      // Normal filters for admins
      if (applicantType && applicantType !== "ALL") {
        where.applicantType = applicantType;
      }
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (startDate && endDate) {
      where.OR = [
        {
          fromDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          toDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          AND: [
            { fromDate: { lte: startDate } },
            { toDate: { gte: endDate } }
          ]
        }
      ];
    } else if (startDate) {
      where.fromDate = { gte: startDate };
    } else if (endDate) {
      where.toDate = { lte: endDate };
    }

    const leaveApplications = await db.leaveApplication.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { fromDate: 'desc' }
      ]
    });

    // Fetch applicant details (optimized to prevent N+1 query)
    // Separate student and teacher IDs
    const studentIds = leaveApplications
      .filter(app => app.applicantType === "STUDENT")
      .map(app => app.applicantId);
    const teacherIds = leaveApplications
      .filter(app => app.applicantType === "TEACHER")
      .map(app => app.applicantId);

    // Batch fetch all students and teachers
    const [students, teachers] = await Promise.all([
      studentIds.length > 0 ? db.student.findMany({
        where: { id: { in: studentIds }, schoolId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          enrollments: {
            where: { status: "ACTIVE", schoolId },
            include: {
              class: true,
              section: true
            }
          }
        }
      }) : Promise.resolve([]),
      teacherIds.length > 0 ? db.teacher.findMany({
        where: { id: { in: teacherIds }, schoolId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            }
          }
        }
      }) : Promise.resolve([])
    ]);

    // Create lookup maps
    const studentMap = new Map(students.map(s => [s.id, s]));
    const teacherMap = new Map(teachers.map(t => [t.id, t]));

    // Enhance applications with applicant details
    const enhancedApplications = leaveApplications.map((app) => {
      let applicantDetails = null;

      if (app.applicantType === "STUDENT") {
        const student = studentMap.get(app.applicantId);
        if (student) {
          applicantDetails = {
            name: `${student.user.firstName} ${student.user.lastName}`,
            avatar: student.user.avatar,
            id: student.admissionId,
            class: student.enrollments[0]?.class.name,
            section: student.enrollments[0]?.section.name,
          };
        }
      } else if (app.applicantType === "TEACHER") {
        const teacher = teacherMap.get(app.applicantId);
        if (teacher) {
          applicantDetails = {
            name: `${teacher.user.firstName} ${teacher.user.lastName}`,
            avatar: teacher.user.avatar,
            id: teacher.employeeId,
          };
        }
      }

      return {
        ...app,
        applicant: applicantDetails,
        duration: Math.round((new Date(app.toDate).getTime() - new Date(app.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      };
    });

    return { success: true, data: enhancedApplications };
  } catch (error) {
    console.error("Error fetching leave applications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch leave applications"
    };
  }
});

// Get a single leave application by ID
export const getLeaveApplicationById = withSchoolAuthAction(async (schoolId, userId, userRole, id: string) => {
  try {
    const leaveApplication = await db.leaveApplication.findFirst({
      where: { id, schoolId }
    });

    if (!leaveApplication) {
      return { success: false, error: "Leave application not found" };
    }

    // Security Check: Owner or Admin
    let isAuthorized = false;

    // Check permission
    const hasPerm = await hasPermission(userId, "ATTENDANCE", PermissionAction.READ);
    if (hasPerm) isAuthorized = true;

    // Check ownership if not admin
    if (!isAuthorized) {
      if (leaveApplication.applicantType === "STUDENT") {
        const student = await db.student.findUnique({
          where: { userId: userId, schoolId }
        });
        if (student && student.id === leaveApplication.applicantId) isAuthorized = true;
      } else if (leaveApplication.applicantType === "TEACHER") {
        const teacher = await db.teacher.findUnique({
          where: { userId: userId, schoolId }
        });
        if (teacher && teacher.id === leaveApplication.applicantId) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized" };
    }

    let applicantDetails = null;

    if (leaveApplication.applicantType === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: leaveApplication.applicantId, schoolId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            }
          },
          enrollments: {
            where: { status: "ACTIVE", schoolId },
            include: {
              class: true,
              section: true
            }
          }
        }
      });

      if (student) {
        applicantDetails = {
          name: `${student.user.firstName} ${student.user.lastName}`,
          avatar: student.user.avatar,
          id: student.admissionId,
          email: student.user.email,
          class: student.enrollments[0]?.class.name,
          section: student.enrollments[0]?.section.name,
        };
      }
    } else if (leaveApplication.applicantType === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { id: leaveApplication.applicantId, schoolId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            }
          }
        }
      });

      if (teacher) {
        applicantDetails = {
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          avatar: teacher.user.avatar,
          id: teacher.employeeId,
          email: teacher.user.email,
        };
      }
    }

    // Get approver details if available
    let approverDetails = null;
    if (leaveApplication.approvedById) {
      const approver = await db.user.findUnique({
        where: { id: leaveApplication.approvedById },
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        }
      });

      if (approver) {
        approverDetails = {
          name: `${approver.firstName} ${approver.lastName}`,
          avatar: approver.avatar,
        };
      }
    }

    const result = {
      ...leaveApplication,
      applicant: applicantDetails,
      approver: approverDetails,
      duration: Math.round((new Date(leaveApplication.toDate).getTime() - new Date(leaveApplication.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching leave application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch leave application"
    };
  }
});

// Get leave applications for a specific student or teacher
export async function getLeaveApplicationsForEntity(entityId: string, entityType: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Security Check: Owner or Admin
    let isAuthorized = false;

    // Check permission
    const hasPerm = await hasPermission(user.id, "ATTENDANCE", PermissionAction.READ);
    if (hasPerm) isAuthorized = true;

    // Check ownership if not admin
    if (!isAuthorized) {
      if (entityType === "STUDENT") {
        const student = await db.student.findUnique({ where: { userId: user.id } });
        if (student && student.id === entityId) isAuthorized = true;
      } else if (entityType === "TEACHER") {
        const teacher = await db.teacher.findUnique({ where: { userId: user.id } });
        if (teacher && teacher.id === entityId) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized" };
    }

    const leaveApplications = await db.leaveApplication.findMany({
      where: {
        applicantId: entityId,
        applicantType: entityType
      },
      orderBy: [
        { status: 'asc' },
        { fromDate: 'desc' }
      ]
    });

    return { success: true, data: leaveApplications };
  } catch (error) {
    console.error("Error fetching leave applications for entity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch leave applications"
    };
  }
}
