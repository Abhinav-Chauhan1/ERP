"use server";

import { db } from "@/lib/db";
// Update this import to use the server-specific auth
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Get all classes taught by the current teacher
 */
export async function getTeacherClasses() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get all classes taught by this teacher
    const teacherClasses = await db.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        class: {
          include: {
            academicYear: true,
            sections: true
          }
        }
      }
    });

    // Get subject teachers
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        subject: true,
        timetableSlots: {
          include: {
            class: true,
            section: true,
            room: true
          }
        }
      }
    });

    // Merge the data to create a comprehensive view
    const classData = await Promise.all(
      teacherClasses.map(async (teacherClass) => {
        // Get all subject classes for this class
        const subjectClasses = await db.subjectClass.findMany({
          where: {
            classId: teacherClass.classId,
            subject: {
              teachers: {
                some: {
                  teacherId: teacher.id
                }
              }
            }
          },
          include: {
            subject: true
          }
        });

        // Get student count
        const studentCount = await db.classEnrollment.count({
          where: {
            classId: teacherClass.classId,
            status: 'ACTIVE'
          }
        });

        // Get timetable information for this class
        const timetableSlots = await db.timetableSlot.findMany({
          where: {
            classId: teacherClass.classId,
            subjectTeacher: {
              teacherId: teacher.id
            }
          },
          include: {
            room: true
          }
        });

        // Format schedule days
        const scheduleDays = Array.from(new Set(timetableSlots.map(slot => slot.day))).join(", ");

        // Format schedule times
        const scheduleTimes = timetableSlots.length > 0
          ? `${formatTime(timetableSlots[0].startTime)} - ${formatTime(timetableSlots[0].endTime)}`
          : "Not scheduled";

        // Get current topic from the syllabus if available
        const subjects = subjectClasses.map(sc => sc.subject);
        const currentTopic = subjects.length > 0 ? "Current curriculum topic" : "No topic set";

        return {
          id: teacherClass.classId,
          name: teacherClass.class.name,
          section: teacherClass.class.sections.length > 0 ? teacherClass.class.sections[0].name : "",
          subject: subjects.length > 0 ? subjects[0].name : "Multiple subjects",
          studentCount,
          scheduleDay: scheduleDays || "Not scheduled",
          scheduleTime: scheduleTimes,
          roomName: timetableSlots.length > 0 && timetableSlots[0].room ? timetableSlots[0].room.name : "Not assigned",
          currentTopic,
          completionPercentage: 0, // This would need to be calculated from lessons/syllabus progress
          isClassHead: teacherClass.isClassHead
        };
      })
    );

    return { classes: classData };
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    throw new Error("Failed to fetch teacher classes");
  }
}

/**
 * Get detailed information about a specific class
 */
export async function getClassDetails(classId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify the teacher teaches this class
    const teacherClass = await db.classTeacher.findFirst({
      where: {
        classId,
        teacherId: teacher.id
      }
    });

    if (!teacherClass) {
      throw new Error("Class not found or you don't have access");
    }

    // Get class details
    const classDetails = await db.class.findUnique({
      where: {
        id: classId
      },
      include: {
        academicYear: true,
        sections: true,
        subjects: {
          include: {
            subject: true
          }
        },
        timetableSlots: {
          include: {
            room: true
          }
        }
      }
    });

    if (!classDetails) {
      throw new Error("Class not found");
    }

    // Get student enrollments
    const enrollments = await db.classEnrollment.findMany({
      where: {
        classId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        section: true
      }
    });

    // Get attendance data for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceToday = await db.studentAttendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        studentId: {
          in: enrollments.map(e => e.studentId)
        }
      }
    });

    // Get recent attendance data (last 3 sessions)
    const sections = classDetails.sections.map(s => s.id);
    const recentAttendance = await db.studentAttendance.groupBy({
      by: ['date', 'status', 'sectionId'],
      where: {
        sectionId: {
          in: sections
        }
      },
      _count: {
        studentId: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 3
    });

    // Format recent attendance
    const groupedAttendance = recentAttendance.reduce((acc, record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, present: 0, absent: 0, total: enrollments.length };
      }

      if (record.status === 'PRESENT') {
        acc[dateStr].present += record._count.studentId;
      } else if (record.status === 'ABSENT') {
        acc[dateStr].absent += record._count.studentId;
      }

      return acc;
    }, {} as Record<string, { date: string, present: number, absent: number, total: number }>);

    const formattedAttendance = Object.values(groupedAttendance);

    // Get assignment data
    const assignments = await db.assignment.findMany({
      where: {
        classes: {
          some: {
            classId
          }
        },
        creatorId: teacher.id
      },
      include: {
        submissions: true
      },
      orderBy: {
        dueDate: 'desc'
      },
      take: 5
    });

    // Format assignment data
    const formattedAssignments = assignments.map(assignment => {
      const totalSubmissions = assignment.submissions.length;
      const gradedSubmissions = assignment.submissions.filter(s => s.status === 'GRADED').length;
      const averageScore = assignment.submissions.length > 0
        ? assignment.submissions.reduce((sum, s) => sum + (s.marks || 0), 0) / totalSubmissions
        : 0;

      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate.toISOString().split('T')[0],
        totalMarks: assignment.totalMarks,
        submitted: totalSubmissions,
        graded: gradedSubmissions,
        averageScore: `${averageScore.toFixed(1)}/${assignment.totalMarks}`
      };
    });

    // Get exam data
    const exams = await db.exam.findMany({
      where: {
        subject: {
          classes: {
            some: {
              classId
            }
          }
        },
        creatorId: teacher.id
      },
      include: {
        examType: true,
        results: true
      },
      orderBy: {
        examDate: 'desc'
      },
      take: 5
    });

    // Format exam data
    const formattedExams = exams.map(exam => ({
      id: exam.id,
      title: exam.title,
      date: exam.examDate.toISOString().split('T')[0],
      type: exam.examType.name,
      duration: `${Math.round((exam.endTime.getTime() - exam.startTime.getTime()) / (1000 * 60))} minutes`,
      totalMarks: exam.totalMarks,
      status: exam.examDate > new Date() ? 'Upcoming' : 'Completed'
    }));

    // Format student data with performance and attendance info
    const formattedStudents = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get attendance percentage
        const attendanceRecords = await db.studentAttendance.findMany({
          where: {
            studentId: enrollment.studentId,
            sectionId: enrollment.sectionId
          }
        });

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT').length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        // Get latest assignment submission
        const latestSubmission = await db.assignmentSubmission.findFirst({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              classes: {
                some: {
                  classId
                }
              }
            }
          },
          include: {
            assignment: true
          },
          orderBy: {
            submissionDate: 'desc'
          }
        });

        let lastAssignmentStatus = 'No submissions';
        if (latestSubmission) {
          switch (latestSubmission.status) {
            case 'SUBMITTED':
              lastAssignmentStatus = 'Completed';
              break;
            case 'LATE':
              lastAssignmentStatus = 'Late';
              break;
            case 'PENDING':
              lastAssignmentStatus = 'Pending';
              break;
            case 'GRADED':
              lastAssignmentStatus = 'Graded';
              break;
            default:
              lastAssignmentStatus = 'Missing';
          }
        }

        // Calculate performance based on exam results and assignments
        const examResults = await db.examResult.findMany({
          where: {
            studentId: enrollment.studentId,
            exam: {
              subject: {
                classes: {
                  some: {
                    classId
                  }
                }
              }
            }
          },
          include: {
            exam: true
          }
        });

        let totalScore = 0;
        let totalMaxScore = 0;

        examResults.forEach(result => {
          totalScore += result.marks;
          totalMaxScore += result.exam.totalMarks;
        });

        const assignmentResults = await db.assignmentSubmission.findMany({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              classes: {
                some: {
                  classId
                }
              }
            },
            status: 'GRADED'
          },
          include: {
            assignment: true
          }
        });

        assignmentResults.forEach(result => {
          if (result.marks) {
            totalScore += result.marks;
            totalMaxScore += result.assignment.totalMarks;
          }
        });

        const performancePercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

        return {
          id: enrollment.student.id,
          name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
          rollNumber: enrollment.rollNumber || enrollment.student.rollNumber || '',
          attendance: attendancePercentage,
          performance: performancePercentage,
          lastAssignment: lastAssignmentStatus
        };
      })
    );

    // Format final class details
    const result = {
      id: classDetails.id,
      name: classDetails.name,
      subject: classDetails.subjects.length > 0 ? classDetails.subjects[0].subject.name : "Multiple subjects",
      room: classDetails.timetableSlots.length > 0 && classDetails.timetableSlots[0].room
        ? classDetails.timetableSlots[0].room.name : "Not assigned",
      schedule: formatSchedule(classDetails.timetableSlots),
      teacher: {
        id: teacher.id,
        name: await getTeacherName(teacher.id),
      },
      totalStudents: enrollments.length,
      presentToday: attendanceToday.filter(a => a.status === 'PRESENT').length,
      absentToday: attendanceToday.filter(a => a.status === 'ABSENT').length,
      currentTopic: "Current curriculum topic", // This would come from syllabus tracking
      nextTopic: "Next curriculum topic", // This would come from syllabus tracking
      upcomingAssessments: [
        ...formattedExams.filter(e => e.status === 'Upcoming').map(e => ({
          id: e.id,
          title: e.title,
          type: 'Exam',
          date: e.date
        })),
        ...formattedAssignments.filter(a => new Date(a.dueDate) > new Date()).map(a => ({
          id: a.id,
          title: a.title,
          type: 'Assignment',
          date: a.dueDate
        }))
      ],
      students: formattedStudents,
      recentAttendance: formattedAttendance,
      assignments: formattedAssignments,
      exams: formattedExams,
      // Add other details as needed
    };

    return result;
  } catch (error) {
    console.error("Error fetching class details:", error);
    throw new Error("Failed to fetch class details");
  }
}

/**
 * Take attendance for a class
 */
export async function markClassAttendance(classId: string, sectionId: string, attendanceData: {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';
  reason?: string;
}[]) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify the teacher has access to this class
    const teacherClass = await db.classTeacher.findFirst({
      where: {
        classId,
        teacherId: teacher.id
      }
    });

    if (!teacherClass) {
      throw new Error("You don't have permission to mark attendance for this class");
    }

    // Check if the section belongs to the class
    const section = await db.classSection.findFirst({
      where: {
        id: sectionId,
        classId
      }
    });

    if (!section) {
      throw new Error("Section not found or doesn't belong to this class");
    }

    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mark attendance for each student
    const attendanceRecords = await Promise.all(
      attendanceData.map(async (record) => {
        // Check if attendance already exists for today
        const existingAttendance = await db.studentAttendance.findFirst({
          where: {
            studentId: record.studentId,
            sectionId,
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        });

        if (existingAttendance) {
          // Update existing attendance
          return db.studentAttendance.update({
            where: {
              id: existingAttendance.id
            },
            data: {
              status: record.status,
              reason: record.reason,
              markedBy: teacher.id
            }
          });
        } else {
          // Create new attendance record
          return db.studentAttendance.create({
            data: {
              student: {
                connect: {
                  id: record.studentId
                }
              },
              section: {
                connect: {
                  id: sectionId
                }
              },
              date: today,
              status: record.status,
              reason: record.reason,
              markedBy: teacher.id
            }
          });
        }
      })
    );

    revalidatePath(`/teacher/teaching/classes/${classId}`);
    revalidatePath('/teacher/attendance/mark');

    return { success: true, count: attendanceRecords.length };
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw new Error("Failed to mark attendance");
  }
}

/**
 * Get students in a class section
 */
export async function getClassStudents(classId: string, sectionId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify the teacher teaches this class
    const teacherClass = await db.classTeacher.findFirst({
      where: {
        classId,
        teacherId: teacher.id
      }
    });

    if (!teacherClass) {
      throw new Error("Class not found or you don't have access");
    }

    // Build the query for enrollments
    const whereClause: any = {
      classId,
      status: 'ACTIVE'
    };

    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    // Get student enrollments
    const enrollments = await db.classEnrollment.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true
          }
        },
        section: true
      }
    });

    // Format the students data
    const students = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      rollNumber: enrollment.student.rollNumber || enrollment.student.rollNumber || '',
      section: enrollment.section.name,
      sectionId: enrollment.section.id
    }));

    return { students };
  } catch (error) {
    console.error("Error fetching class students:", error);
    throw new Error("Failed to fetch class students");
  }
}

/**
 * Get today's attendance for a class section
 */
export async function getTodayAttendance(classId: string, sectionId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          id: userId
        }
      }
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get students in the section
    const { students } = await getClassStudents(classId, sectionId);

    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance records
    const attendanceRecords = await db.studentAttendance.findMany({
      where: {
        sectionId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        studentId: {
          in: students.map(s => s.id)
        }
      }
    });

    // Map attendance records to students
    const studentsWithAttendance = students.map(student => {
      const attendanceRecord = attendanceRecords.find(record => record.studentId === student.id);
      return {
        ...student,
        attendance: attendanceRecord ? {
          status: attendanceRecord.status,
          date: attendanceRecord.date.toISOString().split('T')[0],
          reason: attendanceRecord.reason || undefined,
          lateMinutes: attendanceRecord.status === 'LATE' ? 0 : undefined // This field might not be in the schema
        } : {
          status: 'PRESENT' as const, // Default status
          date: today.toISOString().split('T')[0]
        }
      };
    });

    return { students: studentsWithAttendance };
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    throw new Error("Failed to fetch today's attendance");
  }
}

// Helper functions
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatSchedule(timetableSlots: any[]): string {
  if (timetableSlots.length === 0) return "Not scheduled";

  const days = Array.from(new Set(timetableSlots.map(slot => slot.day)));
  const formattedDays = days.join(", ");

  const times = timetableSlots.length > 0
    ? `(${formatTime(timetableSlots[0].startTime)} - ${formatTime(timetableSlots[0].endTime)})`
    : "";

  return `${formattedDays} ${times}`;
}

async function getTeacherName(teacherId: string): Promise<string> {
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true }
  });

  return teacher ? `${teacher.user.firstName} ${teacher.user.lastName}` : "Unknown Teacher";
}
