"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DayOfWeek } from "@prisma/client";
import { z } from "zod";

/**
 * Get the current student's academic details including enrollment information
 */
export async function getStudentAcademicDetails() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser || dbUser.role !== "STUDENT") {
    throw new Error("Not a student account");
  }

  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id,
    },
    include: {
      enrollments: {
        orderBy: {
          enrollDate: "desc",
        },
        take: 1,
        include: {
          class: {
            include: {
              academicYear: true,
            },
          },
          section: true,
        },
      },
    },
  });

  if (!student || student.enrollments.length === 0) {
    throw new Error("No active enrollment found");
  }

  return {
    student,
    currentEnrollment: student.enrollments[0],
  };
}

/**
 * Get all subjects for the student's current class
 */
export async function getStudentSubjects() {
  const { student, currentEnrollment } = await getStudentAcademicDetails();

  const subjects = await db.subjectClass.findMany({
    where: {
      classId: currentEnrollment.classId,
    },
    include: {
      subject: {
        include: {
          department: true,
          syllabus: {
            include: {
              units: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
          teachers: {
            include: {
              teacher: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return subjects.map((subjectClass) => ({
    id: subjectClass.subject.id,
    name: subjectClass.subject.name,
    code: subjectClass.subject.code,
    description: subjectClass.subject.description,
    department: subjectClass.subject.department?.name || "General",
    hasSyllabus: subjectClass.subject.syllabus.length > 0,
    syllabus: subjectClass.subject.syllabus[0] || null,
    teachers: subjectClass.subject.teachers.map((relation) => ({
      id: relation.teacher.id,
      name: `${relation.teacher.user.firstName} ${relation.teacher.user.lastName}`,
    })),
  }));
}

/**
 * Get detailed information about a specific subject
 */
export async function getSubjectDetails(subjectId: string) {
  const { student, currentEnrollment } = await getStudentAcademicDetails();

  // Verify that this subject belongs to the student's class
  const subjectClass = await db.subjectClass.findFirst({
    where: {
      subjectId,
      classId: currentEnrollment.classId,
    },
  });

  if (!subjectClass) {
    throw new Error("Subject not found or not enrolled");
  }

  const subject = await db.subject.findUnique({
    where: {
      id: subjectId,
    },
    include: {
      department: true,
      syllabus: {
        include: {
          units: {
            orderBy: {
              order: "asc",
            },
            include: {
              lessons: true,
            },
          },
          modules: {
            orderBy: {
              chapterNumber: "asc",
            },
            include: {
              subModules: {
                orderBy: {
                  order: "asc",
                },
                include: {
                  documents: {
                    orderBy: {
                      order: "asc",
                    },
                  },
                  progress: {
                    where: {
                      teacherId: currentEnrollment.classId, // Using classId as a proxy for teacher tracking
                    },
                  },
                },
              },
              documents: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
        },
      },
      teachers: {
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
      },
      lessons: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  // Get assignments for this subject
  const assignments = await db.assignment.findMany({
    where: {
      subjectId,
      classes: {
        some: {
          classId: currentEnrollment.classId,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    include: {
      submissions: {
        where: {
          studentId: student.id,
        },
      },
    },
  });

  // Get exams for this subject
  const exams = await db.exam.findMany({
    where: {
      subjectId,
      subject: {
        classes: {
          some: {
            classId: currentEnrollment.classId,
          },
        },
      },
    },
    orderBy: {
      examDate: "asc",
    },
    include: {
      examType: true,
      results: {
        where: {
          studentId: student.id,
        },
      },
    },
  });

  return {
    subject: {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      department: subject.department?.name || "General",
    },
    syllabus: subject.syllabus[0] || null,
    teachers: subject.teachers.map((relation) => ({
      id: relation.teacher.id,
      name: `${relation.teacher.user.firstName} ${relation.teacher.user.lastName}`,
      email: relation.teacher.user.email,
    })),
    lessons: subject.lessons,
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      status: assignment.submissions[0]?.status || "PENDING",
      submissionId: assignment.submissions[0]?.id || null,
    })),
    exams: exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      examDate: exam.examDate,
      examType: exam.examType.name,
      totalMarks: exam.totalMarks,
      result: exam.results[0] || null,
    })),
  };
}

/**
 * Get the student's schedule/timetable
 */
export async function getStudentTimetable() {
  const { student, currentEnrollment } = await getStudentAcademicDetails();

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
    return {
      timetable: null,
      slots: [],
    };
  }

  // Get all slots for this student's class and section
  const slots = await db.timetableSlot.findMany({
    where: {
      timetableId: activeTimetable.id,
      classId: currentEnrollment.classId,
      sectionId: currentEnrollment.sectionId,
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
    orderBy: [
      {
        day: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });

  // Group slots by day
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const slotsByDay = days.map((day) => {
    const daySlots = slots.filter((slot) => slot.day === day);
    return {
      day,
      slots: daySlots.map((slot) => ({
        id: slot.id,
        subject: slot.subjectTeacher.subject.name,
        subjectCode: slot.subjectTeacher.subject.code,
        teacher: `${slot.subjectTeacher.teacher.user.firstName} ${slot.subjectTeacher.teacher.user.lastName}`,
        teacherId: slot.subjectTeacher.teacher.id,
        room: slot.room?.name || "Not assigned",
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    };
  });

  return {
    timetable: activeTimetable,
    days: slotsByDay,
  };
}

/**
 * Get all lesson materials for a subject
 */
export async function getSubjectMaterials(subjectId: string) {
  const { student, currentEnrollment } = await getStudentAcademicDetails();

  // Verify that this subject belongs to the student's class
  const subjectClass = await db.subjectClass.findFirst({
    where: {
      subjectId,
      classId: currentEnrollment.classId,
    },
  });

  if (!subjectClass) {
    throw new Error("Subject not found or not enrolled");
  }

  const lessons = await db.lesson.findMany({
    where: {
      subjectId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    content: lesson.content,
    resources: lesson.resources,
    duration: lesson.duration,
    createdAt: lesson.createdAt,
  }));
}

/**
 * Get the curriculum/syllabus structure for a specific subject
 */
export async function getSubjectCurriculum(subjectId: string) {
  const { student, currentEnrollment } = await getStudentAcademicDetails();

  // Verify that this subject belongs to the student's class
  const subjectClass = await db.subjectClass.findFirst({
    where: {
      subjectId,
      classId: currentEnrollment.classId,
    },
  });

  if (!subjectClass) {
    throw new Error("Subject not found or not enrolled");
  }

  const syllabus = await db.syllabus.findFirst({
    where: {
      subjectId,
    },
    include: {
      units: {
        orderBy: {
          order: "asc",
        },
        include: {
          lessons: true,
        },
      },
    },
  });

  if (!syllabus) {
    return null;
  }

  return {
    id: syllabus.id,
    title: syllabus.title,
    description: syllabus.description,
    document: syllabus.document,
    units: syllabus.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description,
      order: unit.order,
      lessons: unit.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
      })),
    })),
  };
}
