"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";

export async function getStudentProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) throw new Error("School context required");

  const dbUser = await db.user.findFirst({
    where: {
      id: session.user.id,
      // User might not have schoolId directly usually, but Student does.
      // But we are finding USER here.
      // We should check if the student associated with this user belongs to the school.
    },
    include: {
      student: {
        where: {
          schoolId
        },
        include: {
          user: true,
          enrollments: {
            include: {
              class: true,
              section: true,
            },
            orderBy: {
              enrollDate: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!dbUser || !dbUser.student) {
    throw new Error("Student profile not found");
  }

  return dbUser.student;
}

export async function getStudentDashboardData() {
  const student = await getStudentProfile();
  const currentDate = new Date();

  // Get attendance data for the current month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const attendanceData = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
      date: {
        gte: startOfMonth,
      },
    },
  });

  // Calculate attendance percentage
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(a => a.status === "PRESENT").length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Get upcoming exams
  const upcomingExams = await db.exam.findMany({
    where: {
      examDate: {
        gte: currentDate,
      },
      subject: {
        classes: {
          some: {
            class: {
              enrollments: {
                some: {
                  studentId: student.id,
                },
              },
            },
          },
        },
      },
    },
    include: {
      subject: true,
      examType: true,
    },
    take: 5,
    orderBy: {
      examDate: "asc",
    },
  });

  // Get pending assignments
  const pendingAssignments = await db.assignment.findMany({
    where: {
      dueDate: {
        gte: currentDate,
      },
      classes: {
        some: {
          class: {
            enrollments: {
              some: {
                studentId: student.id,
              },
            },
          },
        },
      },
      submissions: {
        none: {
          studentId: student.id,
        },
      },
    },
    include: {
      subject: true,
    },
    take: 5,
    orderBy: {
      dueDate: "asc",
    },
  });

  // Get recent announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { targetAudience: { has: "STUDENT" } },
        { targetAudience: { has: "ALL" } },
      ],
    },
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      publisher: {
        include: {
          user: true,
        },
      },
    },
  });

  return {
    student,
    attendancePercentage,
    upcomingExams,
    pendingAssignments,
    recentAnnouncements,
  };
}

export async function getStudentSubjectPerformance(studentId: string) {
  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return [];

  const session = await auth();
  if (!session?.user?.id) return [];

  // Verify authorization: User must be the student OR have valid permissions
  // For now, let's enforce that the user IS the student, or rely on studentId filtering if strict.
  // Weak check: just ensure student belongs to school.
  // Stronger check: ensure student.userId === session.user.id (if student role).

  // Checking if the target student belongs to the school
  const targetStudent = await db.student.findFirst({
    where: { id: studentId, schoolId },
    select: { userId: true }
  });

  if (!targetStudent) return [];

  // If student, they can only view their own performance
  if (session.user.role === "STUDENT" && targetStudent.userId !== session.user.id) {
    return [];
  }

  // Get the student's current class enrollment
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      schoolId,
    },
    include: {
      class: true,
    },
    orderBy: {
      enrollDate: "desc",
    },
  });

  if (!enrollment) {
    return [];
  }

  // Get subjects for the student's class
  const subjectClasses = await db.subjectClass.findMany({
    where: {
      classId: enrollment.classId,
    },
    include: {
      subject: true,
    },
  });

  const subjects = subjectClasses.map(sc => sc.subject);

  // Calculate performance for each subject
  const performance = await Promise.all(
    subjects.map(async (subject) => {
      // Get exam results for this subject
      const examResults = await db.examResult.findMany({
        where: {
          studentId,
          exam: {
            subjectId: subject.id,
          },
        },
        include: {
          exam: true,
        },
      });

      // Calculate average percentage for exams
      const totalMarks = examResults.reduce((sum, result) => sum + result.marks, 0);
      const totalPossibleMarks = examResults.reduce((sum, result) => sum + result.exam.totalMarks, 0);

      const percentage = totalPossibleMarks > 0
        ? Math.round((totalMarks / totalPossibleMarks) * 100)
        : 0;

      return {
        subject: subject.name,
        subjectId: subject.id,
        percentage,
        examCount: examResults.length,
      };
    })
  );

  return performance;
}

export async function getStudentTodaySchedule(studentId: string) {
  const { schoolId } = await requireSchoolAccess();
  if (!schoolId) return [];

  // Get the current day of the week
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const today = days[new Date().getDay()];

  // Get the student's current enrollment
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      schoolId,
    },
    include: {
      class: true,
      section: true,
    },
    orderBy: {
      enrollDate: "desc",
    },
  });

  if (!enrollment) {
    return [];
  }

  // Get the active timetable
  const activeTimetable = await db.timetable.findFirst({
    where: {
      isActive: true,
      effectiveFrom: {
        lte: new Date(),
      },
      effectiveTo: {
        gte: new Date(),
      },
    },
  });

  if (!activeTimetable) {
    return [];
  }

  // Get today's schedule
  const schedule = await db.timetableSlot.findMany({
    where: {
      timetableId: activeTimetable.id,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      day: today as any,
    },
    include: {
      subjectTeacher: {
        include: {
          subject: true,
          teacher: {
            include: {
              user: true,
            },
          },
        },
      },
      room: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Format the schedule data
  return schedule.map(slot => ({
    id: slot.id,
    subject: slot.subjectTeacher.subject.name,
    teacher: slot.subjectTeacher.teacher,
    teacherName: `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`,
    room: slot.room?.name || "Not assigned",
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

export async function updateStudentProfile(studentId: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
}) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Update user information
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: { user: true },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Verify ownership (IDOR check)
    // Only allow update if the session user owns this student record
    if (student.userId !== session.user.id) {
      // Also allow admins/teachers? The function name implies student updating OWN profile.
      // Safe bet: Restrict to owner for now.
      return { success: false, error: "Unauthorized access" };
    }

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Update user fields
    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;

    await db.user.update({
      where: { id: student.userId },
      data: updateData,
    });

    // Update student-specific fields
    const studentUpdateData: any = {};
    if (data.dateOfBirth) studentUpdateData.dateOfBirth = data.dateOfBirth;
    if (data.address) studentUpdateData.address = data.address;

    if (Object.keys(studentUpdateData).length > 0) {
      await db.student.update({
        where: { id: studentId },
        data: studentUpdateData,
      });
    }

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating student profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
