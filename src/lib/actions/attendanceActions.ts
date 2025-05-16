"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  StudentAttendanceFormValues, 
  BulkStudentAttendanceFormValues,
  StudentAttendanceUpdateFormValues, 
  TeacherAttendanceFormValues,
  BulkTeacherAttendanceFormValues,
  TeacherAttendanceUpdateFormValues,
  AttendanceReportFormValues
} from "../schemaValidation/attendanceSchemaValidation";

// Student Attendance Actions
export async function markStudentAttendance(data: StudentAttendanceFormValues, userId: string) {
  try {
    // Check if student exists
    const student = await db.student.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check if section exists
    const section = await db.classSection.findUnique({
      where: { id: data.sectionId }
    });

    if (!section) {
      return { success: false, error: "Class section not found" };
    }

    // Check if attendance record already exists for this student on this date
    const existingAttendance = await db.studentAttendance.findFirst({
      where: {
        studentId: data.studentId,
        date: data.date,
        sectionId: data.sectionId
      }
    });

    let attendance;

    if (existingAttendance) {
      // Update existing record
      attendance = await db.studentAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: data.status,
          reason: data.reason,
          markedBy: userId,
        }
      });
    } else {
      // Create new record
      attendance = await db.studentAttendance.create({
        data: {
          studentId: data.studentId,
          date: data.date,
          sectionId: data.sectionId,
          status: data.status,
          reason: data.reason,
          markedBy: userId,
        }
      });
    }
    
    revalidatePath("/admin/attendance/students");
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error marking student attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to mark student attendance" 
    };
  }
}

export async function markBulkStudentAttendance(data: BulkStudentAttendanceFormValues, userId: string) {
  try {
    // Check if section exists
    const section = await db.classSection.findUnique({
      where: { id: data.sectionId }
    });

    if (!section) {
      return { success: false, error: "Class section not found" };
    }

    const results = [];
    
    // Process each record
    for (const record of data.attendanceRecords) {
      // Check if attendance record already exists
      const existingAttendance = await db.studentAttendance.findFirst({
        where: {
          studentId: record.studentId,
          date: data.date,
          sectionId: data.sectionId
        }
      });

      let attendance;

      if (existingAttendance) {
        // Update existing record
        attendance = await db.studentAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: record.status,
            reason: record.reason,
            markedBy: userId,
          }
        });
      } else {
        // Create new record
        attendance = await db.studentAttendance.create({
          data: {
            studentId: record.studentId,
            date: data.date,
            sectionId: data.sectionId,
            status: record.status,
            reason: record.reason,
            markedBy: userId,
          }
        });
      }
      
      results.push(attendance);
    }
    
    revalidatePath("/admin/attendance/students");
    return { success: true, data: results };
  } catch (error) {
    console.error("Error marking bulk student attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to mark bulk student attendance" 
    };
  }
}

export async function updateStudentAttendance(data: StudentAttendanceUpdateFormValues, userId: string) {
  try {
    const attendance = await db.studentAttendance.update({
      where: { id: data.id },
      data: {
        status: data.status,
        reason: data.reason,
        markedBy: userId,
      }
    });
    
    revalidatePath("/admin/attendance/students");
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error updating student attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update student attendance" 
    };
  }
}

export async function deleteStudentAttendance(id: string) {
  try {
    await db.studentAttendance.delete({
      where: { id }
    });
    
    revalidatePath("/admin/attendance/students");
    return { success: true };
  } catch (error) {
    console.error("Error deleting student attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete student attendance" 
    };
  }
}

export async function getStudentAttendanceByDate(date: Date, sectionId: string) {
  try {
    // Get all students in the section
    const studentsInSection = await db.classEnrollment.findMany({
      where: {
        sectionId: sectionId,
        status: "ACTIVE"
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              }
            }
          }
        }
      }
    });

    // Get attendance records for the date and section
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        date: date,
        sectionId: sectionId
      }
    });

    // Map students to their attendance records
    const result = studentsInSection.map(enrollment => {
      const attendanceRecord = attendanceRecords.find(record => 
        record.studentId === enrollment.studentId
      );
      
      return {
        id: enrollment.studentId,
        rollNumber: enrollment.rollNumber || enrollment.student.rollNumber,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        avatar: enrollment.student.user.avatar,
        attendanceId: attendanceRecord?.id || null,
        status: attendanceRecord?.status || "ABSENT",
        reason: attendanceRecord?.reason || "",
      };
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch student attendance" 
    };
  }
}

export async function getStudentAttendanceReport(data: AttendanceReportFormValues) {
  try {
    const { entityId, sectionId, startDate, endDate } = data;
    
    // Build query based on parameters
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (entityId) {
      where.studentId = entityId;
    }
    
    if (sectionId) {
      where.sectionId = sectionId;
    }

    // Get attendance records
    const attendanceRecords = await db.studentAttendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        section: {
          include: {
            class: true
          }
        }
      },
      orderBy: [
        { date: 'asc' }
      ]
    });

    // Group records by student if needed
    if (!entityId) {
      // Group by student
      const groupedByStudent: Record<string, any> = {};
      
      attendanceRecords.forEach(record => {
        const studentId = record.studentId;
        
        if (!groupedByStudent[studentId]) {
          groupedByStudent[studentId] = {
            studentId,
            studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
            records: [],
            summary: {
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              halfDay: 0,
              leave: 0
            }
          };
        }
        
        groupedByStudent[studentId].records.push({
          id: record.id,
          date: record.date,
          status: record.status,
          reason: record.reason,
          section: `${record.section.class.name} - ${record.section.name}`
        });
        
        // Update summary
        groupedByStudent[studentId].summary.total++;
        switch (record.status) {
          case "PRESENT":
            groupedByStudent[studentId].summary.present++;
            break;
          case "ABSENT":
            groupedByStudent[studentId].summary.absent++;
            break;
          case "LATE":
            groupedByStudent[studentId].summary.late++;
            break;
          case "HALF_DAY":
            groupedByStudent[studentId].summary.halfDay++;
            break;
          case "LEAVE":
            groupedByStudent[studentId].summary.leave++;
            break;
        }
      });
      
      return { 
        success: true, 
        data: Object.values(groupedByStudent),
        summary: calculateAttendanceSummary(attendanceRecords)
      };
    } else {
      // Individual student report
      return { 
        success: true, 
        data: attendanceRecords,
        summary: calculateAttendanceSummary(attendanceRecords)
      };
    }
  } catch (error) {
    console.error("Error generating student attendance report:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate student attendance report" 
    };
  }
}

// Teacher Attendance Actions
export async function markTeacherAttendance(data: TeacherAttendanceFormValues, userId: string) {
  try {
    // Check if teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: data.teacherId }
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Check if attendance record already exists for this teacher on this date
    const existingAttendance = await db.teacherAttendance.findFirst({
      where: {
        teacherId: data.teacherId,
        date: data.date
      }
    });

    let attendance;

    if (existingAttendance) {
      // Update existing record
      attendance = await db.teacherAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: data.status,
          reason: data.reason,
          markedBy: userId,
        }
      });
    } else {
      // Create new record
      attendance = await db.teacherAttendance.create({
        data: {
          teacherId: data.teacherId,
          date: data.date,
          status: data.status,
          reason: data.reason,
          markedBy: userId,
        }
      });
    }
    
    revalidatePath("/admin/attendance/teachers");
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error marking teacher attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to mark teacher attendance" 
    };
  }
}

export async function markBulkTeacherAttendance(data: BulkTeacherAttendanceFormValues, userId: string) {
  try {
    const results = [];
    
    // Process each record
    for (const record of data.attendanceRecords) {
      // Check if attendance record already exists
      const existingAttendance = await db.teacherAttendance.findFirst({
        where: {
          teacherId: record.teacherId,
          date: data.date
        }
      });

      let attendance;

      if (existingAttendance) {
        // Update existing record
        attendance = await db.teacherAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: record.status,
            reason: record.reason,
            markedBy: userId,
          }
        });
      } else {
        // Create new record
        attendance = await db.teacherAttendance.create({
          data: {
            teacherId: record.teacherId,
            date: data.date,
            status: record.status,
            reason: record.reason,
            markedBy: userId,
          }
        });
      }
      
      results.push(attendance);
    }
    
    revalidatePath("/admin/attendance/teachers");
    return { success: true, data: results };
  } catch (error) {
    console.error("Error marking bulk teacher attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to mark bulk teacher attendance" 
    };
  }
}

export async function updateTeacherAttendance(data: TeacherAttendanceUpdateFormValues, userId: string) {
  try {
    const attendance = await db.teacherAttendance.update({
      where: { id: data.id },
      data: {
        status: data.status,
        reason: data.reason,
        markedBy: userId,
      }
    });
    
    revalidatePath("/admin/attendance/teachers");
    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error updating teacher attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update teacher attendance" 
    };
  }
}

export async function deleteTeacherAttendance(id: string) {
  try {
    await db.teacherAttendance.delete({
      where: { id }
    });
    
    revalidatePath("/admin/attendance/teachers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting teacher attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete teacher attendance" 
    };
  }
}

export async function getTeacherAttendanceByDate(date: Date) {
  try {
    // Get all teachers
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    // Get attendance records for the date
    const attendanceRecords = await db.teacherAttendance.findMany({
      where: {
        date: date
      }
    });

    // Map teachers to their attendance records
    const result = teachers.map(teacher => {
      const attendanceRecord = attendanceRecords.find(record => 
        record.teacherId === teacher.id
      );
      
      return {
        id: teacher.id,
        employeeId: teacher.employeeId,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        avatar: teacher.user.avatar,
        attendanceId: attendanceRecord?.id || null,
        status: attendanceRecord?.status || "ABSENT",
        reason: attendanceRecord?.reason || "",
      };
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching teacher attendance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch teacher attendance" 
    };
  }
}

export async function getTeacherAttendanceReport(data: AttendanceReportFormValues) {
  try {
    const { entityId, startDate, endDate } = data;
    
    // Build query based on parameters
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (entityId) {
      where.teacherId = entityId;
    }

    // Get attendance records
    const attendanceRecords = await db.teacherAttendance.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' }
      ]
    });

    // Group records by teacher if needed
    if (!entityId) {
      // Group by teacher
      const groupedByTeacher: Record<string, any> = {};
      
      attendanceRecords.forEach(record => {
        const teacherId = record.teacherId;
        
        if (!groupedByTeacher[teacherId]) {
          groupedByTeacher[teacherId] = {
            teacherId,
            teacherName: `${record.teacher.user.firstName} ${record.teacher.user.lastName}`,
            employeeId: record.teacher.employeeId,
            records: [],
            summary: {
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              halfDay: 0,
              leave: 0
            }
          };
        }
        
        groupedByTeacher[teacherId].records.push({
          id: record.id,
          date: record.date,
          status: record.status,
          reason: record.reason
        });
        
        // Update summary
        groupedByTeacher[teacherId].summary.total++;
        switch (record.status) {
          case "PRESENT":
            groupedByTeacher[teacherId].summary.present++;
            break;
          case "ABSENT":
            groupedByTeacher[teacherId].summary.absent++;
            break;
          case "LATE":
            groupedByTeacher[teacherId].summary.late++;
            break;
          case "HALF_DAY":
            groupedByTeacher[teacherId].summary.halfDay++;
            break;
          case "LEAVE":
            groupedByTeacher[teacherId].summary.leave++;
            break;
        }
      });
      
      return { 
        success: true, 
        data: Object.values(groupedByTeacher),
        summary: calculateAttendanceSummary(attendanceRecords)
      };
    } else {
      // Individual teacher report
      return { 
        success: true, 
        data: attendanceRecords,
        summary: calculateAttendanceSummary(attendanceRecords)
      };
    }
  } catch (error) {
    console.error("Error generating teacher attendance report:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate teacher attendance report" 
    };
  }
}

// Helper Functions
function calculateAttendanceSummary(records: any[]) {
  const summary = {
    total: records.length,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    presentPercentage: 0
  };
  
  records.forEach(record => {
    switch (record.status) {
      case "PRESENT":
        summary.present++;
        break;
      case "ABSENT":
        summary.absent++;
        break;
      case "LATE":
        summary.late++;
        break;
      case "HALF_DAY":
        summary.halfDay++;
        break;
      case "LEAVE":
        summary.leave++;
        break;
    }
  });
  
  // Calculate percentages
  summary.presentPercentage = summary.total > 0 
    ? ((summary.present + summary.late + (summary.halfDay * 0.5)) / summary.total) * 100 
    : 0;
  
  return summary;
}

// Section and Class data for dropdowns
export async function getClassSectionsForDropdown() {
  try {
    const currentAcademicYear = await db.academicYear.findFirst({
      where: { isCurrent: true }
    });

    if (!currentAcademicYear) {
      return { success: false, error: "No current academic year found" };
    }

    const classes = await db.class.findMany({
      where: {
        academicYearId: currentAcademicYear.id
      },
      include: {
        sections: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedData = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      sections: cls.sections.map(section => ({
        id: section.id,
        name: section.name,
        fullName: `${cls.name} - ${section.name}`
      }))
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching class sections:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch class sections" 
    };
  }
}

export async function getTeachersForDropdown() {
  try {
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    const formattedData = teachers.map(teacher => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      employeeId: teacher.employeeId
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch teachers" 
    };
  }
}

export async function getStudentsForDropdown(sectionId?: string) {
  try {
    const where: any = {};
    
    if (sectionId) {
      where.sectionId = sectionId;
      where.status = "ACTIVE";
    }

    const enrollments = await db.classEnrollment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        class: true,
        section: true
      },
      orderBy: [
        {
          student: {
            user: {
              firstName: 'asc'
            }
          }
        }
      ]
    });

    const formattedData = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      rollNumber: enrollment.rollNumber || enrollment.student.rollNumber,
      class: enrollment.class.name,
      section: enrollment.section.name
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch students" 
    };
  }
}
