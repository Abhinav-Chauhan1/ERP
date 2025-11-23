"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  LeaveApplicationFormValues, 
  LeaveApplicationUpdateFormValues,
  LeaveApprovalFormValues
} from "../schemaValidation/leaveApplicationsSchemaValidation";

// Create a new leave application
export async function createLeaveApplication(data: LeaveApplicationFormValues) {
  try {
    // Validate applicant exists based on type
    if (data.applicantType === "STUDENT") {
      const student = await db.student.findUnique({
        where: { id: data.applicantId }
      });
      if (!student) {
        return { success: false, error: "Student not found" };
      }
    } else if (data.applicantType === "TEACHER") {
      const teacher = await db.teacher.findUnique({
        where: { id: data.applicantId }
      });
      if (!teacher) {
        return { success: false, error: "Teacher not found" };
      }
    }

    // Check for overlapping leave applications
    const overlappingLeave = await db.leaveApplication.findFirst({
      where: {
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
    console.error("Error creating leave application:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create leave application" 
    };
  }
}

// Update an existing leave application
export async function updateLeaveApplication(data: LeaveApplicationUpdateFormValues) {
  try {
    // Check if the leave application exists
    const existingApplication = await db.leaveApplication.findUnique({
      where: { id: data.id }
    });

    if (!existingApplication) {
      return { success: false, error: "Leave application not found" };
    }

    // If status is not being changed from PENDING, check for overlapping leave applications
    if (existingApplication.status === "PENDING" && data.status === "PENDING") {
      const overlappingLeave = await db.leaveApplication.findFirst({
        where: {
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
      where: { id: data.id },
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
}

// Approve or reject a leave application
export async function processLeaveApplication(data: LeaveApprovalFormValues) {
  try {
    // Check if the leave application exists
    const existingApplication = await db.leaveApplication.findUnique({
      where: { id: data.id }
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

    const leaveApplication = await db.leaveApplication.update({
      where: { id: data.id },
      data: {
        status: data.status,
        approvedById: data.approvedById,
        approvedOn: new Date(),
        remarks: data.remarks,
      }
    });
    
    // If leave is approved, automatically mark attendance as LEAVE
    if (data.status === "APPROVED") {
      const { fromDate, toDate, applicantId, applicantType } = existingApplication;
      
      // Calculate all dates between fromDate and toDate (inclusive)
      const dates = [];
      const currentDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Mark attendance for each date
      if (applicantType === "STUDENT") {
        // Get the student's section
        const studentEnrollment = await db.classEnrollment.findFirst({
          where: {
            studentId: applicantId,
            status: "ACTIVE"
          }
        });
        
        if (studentEnrollment) {
          for (const date of dates) {
            // Check if attendance record already exists
            const existingAttendance = await db.studentAttendance.findFirst({
              where: {
                studentId: applicantId,
                date: date,
                sectionId: studentEnrollment.sectionId
              }
            });

            if (existingAttendance) {
              await db.studentAttendance.update({
                where: { id: existingAttendance.id },
                data: {
                  status: "LEAVE",
                  reason: existingApplication.reason,
                  markedBy: data.approvedById,
                }
              });
            } else {
              await db.studentAttendance.create({
                data: {
                  studentId: applicantId,
                  date: date,
                  sectionId: studentEnrollment.sectionId,
                  status: "LEAVE",
                  reason: existingApplication.reason,
                  markedBy: data.approvedById,
                }
              });
            }
          }
        }
      } else if (applicantType === "TEACHER") {
        for (const date of dates) {
          // Check if attendance record already exists
          const existingAttendance = await db.teacherAttendance.findFirst({
            where: {
              teacherId: applicantId,
              date: date
            }
          });

          if (existingAttendance) {
            await db.teacherAttendance.update({
              where: { id: existingAttendance.id },
              data: {
                status: "LEAVE",
                reason: existingApplication.reason,
                markedBy: data.approvedById,
              }
            });
          } else {
            await db.teacherAttendance.create({
              data: {
                teacherId: applicantId,
                date: date,
                status: "LEAVE",
                reason: existingApplication.reason,
                markedBy: data.approvedById,
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
}

// Delete a leave application
export async function deleteLeaveApplication(id: string) {
  try {
    // Check if the leave application exists
    const existingApplication = await db.leaveApplication.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      return { success: false, error: "Leave application not found" };
    }

    // Only allow deletion of pending leave applications
    if (existingApplication.status !== "PENDING") {
      return { 
        success: false, 
        error: "Only pending leave applications can be deleted" 
      };
    }

    await db.leaveApplication.delete({
      where: { id }
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
}

// Get all leave applications
export async function getLeaveApplications(
  status?: string,
  applicantType?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const where: any = {};
    
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    if (applicantType && applicantType !== "ALL") {
      where.applicantType = applicantType;
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
        where: { id: { in: studentIds } },
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
              section: true
            }
          }
        }
      }) : Promise.resolve([]),
      teacherIds.length > 0 ? db.teacher.findMany({
        where: { id: { in: teacherIds } },
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
}

// Get a single leave application by ID
export async function getLeaveApplicationById(id: string) {
  try {
    const leaveApplication = await db.leaveApplication.findUnique({
      where: { id }
    });

    if (!leaveApplication) {
      return { success: false, error: "Leave application not found" };
    }

    let applicantDetails = null;
    
    if (leaveApplication.applicantType === "STUDENT") {
      const student = await db.student.findUnique({
        where: { id: leaveApplication.applicantId },
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
            where: { status: "ACTIVE" },
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
      const teacher = await db.teacher.findUnique({
        where: { id: leaveApplication.applicantId },
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
}

// Get leave applications for a specific student or teacher
export async function getLeaveApplicationsForEntity(entityId: string, entityType: string) {
  try {
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
