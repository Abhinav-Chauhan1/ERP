"use server";

import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function getStudentProfile() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found");
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      student: {
        include: {
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
  // Get the student's current class enrollment
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
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
  // Get the current day of the week
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const today = days[new Date().getDay()];

  // Get the student's current enrollment
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
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
