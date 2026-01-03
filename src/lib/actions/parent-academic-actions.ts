"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

/**
 * Get all academic information for a child
 */
export async function getChildAcademicProcess(childId: string) {
  // Verify the current user is a parent
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!parent) {
    redirect("/login");
  }
  
  // Verify the child belongs to this parent
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId
    }
  });
  
  if (!parentChild) {
    redirect("/parent");
  }
  
  // Get student details with current enrollment
  const student = await db.student.findUnique({
    where: {
      id: childId
    },
    include: {
      user: true,
      enrollments: {
        orderBy: {
          enrollDate: 'desc'
        },
        take: 1,
        include: {
          class: true,
          section: true
        }
      }
    }
  });
  
  if (!student) {
    redirect("/parent");
  }
  
  const currentEnrollment = student.enrollments[0];
  
  // Get subjects for current class
// Define interfaces for strongly typed data
interface Teacher {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
    code: string;
    teachers: Teacher[];
}

let subjects: Subject[] = [];
  
  if (currentEnrollment) {
    const subjectClasses = await db.subjectClass.findMany({
      where: {
        classId: currentEnrollment.classId
      },
      include: {
        subject: {
          include: {
            teachers: {
              include: {
                teacher: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    subjects = subjectClasses.map(sc => ({
      id: sc.subject.id,
      name: sc.subject.name,
      code: sc.subject.code,
      teachers: sc.subject.teachers.map(teacher => ({
        id: teacher.teacher.id,
        name: `${teacher.teacher.user.firstName} ${teacher.teacher.user.lastName}`
      }))
    }));
  }
  
  // Get syllabus information with curriculum completion
  const syllabusItems = await db.syllabus.findMany({
    where: {
      subject: {
        classes: {
          some: {
            classId: currentEnrollment?.classId
          }
        }
      }
    },
    include: {
      subject: true,
      units: {
        include: {
          lessons: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  });
  
  // Calculate curriculum completion for each subject
  const curriculumCompletion = syllabusItems.map(syllabus => {
    const totalUnits = syllabus.units.length;
    const totalLessons = syllabus.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
    
    // For now, we'll calculate completion based on current date vs academic year
    // In a real system, this would track actual lesson completion
    const academicYearStart = currentEnrollment?.enrollDate || new Date();
    const now = new Date();
    const academicYearEnd = new Date(academicYearStart);
    academicYearEnd.setFullYear(academicYearEnd.getFullYear() + 1);
    
    const totalDays = Math.floor((academicYearEnd.getTime() - academicYearStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.floor((now.getTime() - academicYearStart.getTime()) / (1000 * 60 * 60 * 24));
    const completionPercentage = Math.min(100, Math.max(0, Math.floor((daysPassed / totalDays) * 100)));
    
    return {
      subjectId: syllabus.subject.id,
      subjectName: syllabus.subject.name,
      totalUnits,
      totalLessons,
      completionPercentage,
      completedUnits: Math.floor((completionPercentage / 100) * totalUnits),
      completedLessons: Math.floor((completionPercentage / 100) * totalLessons)
    };
  });
  
  // Get recent homework/assignments
  const assignments = await db.assignment.findMany({
    where: {
      classes: {
        some: {
          classId: currentEnrollment?.classId
        }
      }
    },
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: childId
        }
      }
    },
    orderBy: {
      dueDate: 'desc'
    },
    take: 10
  });
  
  // Get timetable
  const timetable = await db.timetableSlot.findMany({
    where: {
      classId: currentEnrollment?.classId,
      sectionId: currentEnrollment?.sectionId
    },
    include: {
      subjectTeacher: {
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      },
      room: true
    },
    orderBy: [
      { day: 'asc' },
      { startTime: 'asc' }
    ]
  });
  
  return {
    student,
    currentEnrollment,
    subjects,
    syllabusItems,
    assignments,
    timetable,
    curriculumCompletion
  };
}

/**
 * Get class schedule for a child (weekly timetable)
 */
export async function getClassSchedule(childId: string) {
  // Verify the current user is a parent
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!parent) {
    redirect("/login");
  }
  
  // Verify the child belongs to this parent
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId
    }
  });
  
  if (!parentChild) {
    redirect("/parent");
  }
  
  // Get student's current enrollment
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId: childId,
      status: "ACTIVE"
    },
    include: {
      class: true,
      section: true
    },
    orderBy: {
      enrollDate: 'desc'
    }
  });
  
  if (!enrollment) {
    return {
      schedule: [],
      enrollment: null
    };
  }
  
  // Get timetable slots for the class and section
  const schedule = await db.timetableSlot.findMany({
    where: {
      classId: enrollment.classId,
      sectionId: enrollment.sectionId
    },
    include: {
      subjectTeacher: {
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      },
      room: true
    },
    orderBy: [
      { day: 'asc' },
      { startTime: 'asc' }
    ]
  });
  
  return {
    schedule,
    enrollment
  };
}

/**
 * Get homework/assignments for a child with status filtering
 */
export async function getHomework(
  childId: string, 
  filters?: {
    status?: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED' | 'ALL';
    subjectId?: string;
    fromDate?: Date;
    toDate?: Date;
  }
) {
  // Verify the current user is a parent
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!parent) {
    redirect("/login");
  }
  
  // Verify the child belongs to this parent
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId
    }
  });
  
  if (!parentChild) {
    redirect("/parent");
  }
  
  // Get student's current enrollment
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId: childId,
      status: "ACTIVE"
    },
    orderBy: {
      enrollDate: 'desc'
    }
  });
  
  if (!enrollment) {
    return {
      homework: [],
      enrollment: null
    };
  }
  
  // Build where clause for assignments
  const whereClause: any = {
    classes: {
      some: {
        classId: enrollment.classId
      }
    }
  };
  
  // Add subject filter if provided
  if (filters?.subjectId) {
    whereClause.subjectId = filters.subjectId;
  }
  
  // Add date range filters if provided
  if (filters?.fromDate) {
    whereClause.dueDate = {
      ...whereClause.dueDate,
      gte: filters.fromDate
    };
  }
  
  if (filters?.toDate) {
    whereClause.dueDate = {
      ...whereClause.dueDate,
      lte: filters.toDate
    };
  }
  
  // Get assignments with submissions
  const assignments = await db.assignment.findMany({
    where: whereClause,
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: childId
        }
      }
    },
    orderBy: {
      dueDate: 'desc'
    }
  });
  
  // Filter by status if provided
  let filteredAssignments = assignments;
  if (filters?.status && filters.status !== 'ALL') {
    filteredAssignments = assignments.filter(assignment => {
      const submission = assignment.submissions[0];
      
      if (!submission) {
        // No submission - check if it's overdue
        const now = new Date();
        const isOverdue = assignment.dueDate < now;
        return filters.status === 'PENDING' || (filters.status === 'LATE' && isOverdue);
      }
      
      return submission.status === filters.status;
    });
  }
  
  return {
    homework: filteredAssignments,
    enrollment
  };
}

/**
 * Get full timetable for a child for a specific week
 */
export async function getFullTimetable(childId: string, week?: Date) {
  // Verify the current user is a parent
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!parent) {
    redirect("/login");
  }
  
  // Verify the child belongs to this parent
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId
    }
  });
  
  if (!parentChild) {
    redirect("/parent");
  }
  
  // Get student's current enrollment
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      studentId: childId,
      status: "ACTIVE"
    },
    include: {
      class: true,
      section: true
    },
    orderBy: {
      enrollDate: 'desc'
    }
  });
  
  if (!enrollment) {
    return {
      timetable: [],
      enrollment: null,
      weekStart: week || new Date(),
      weekEnd: week || new Date()
    };
  }
  
  // Calculate week start and end dates
  const weekStart = week ? new Date(week) : new Date();
  weekStart.setHours(0, 0, 0, 0);
  const dayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  weekStart.setDate(diff);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);
  
  // Get timetable slots for the class and section
  const timetable = await db.timetableSlot.findMany({
    where: {
      classId: enrollment.classId,
      sectionId: enrollment.sectionId
    },
    include: {
      subjectTeacher: {
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      },
      room: true,
      timetable: true
    },
    orderBy: [
      { day: 'asc' },
      { startTime: 'asc' }
    ]
  });
  
  return {
    timetable,
    enrollment,
    weekStart,
    weekEnd
  };
}

/**
 * Get subject progress for a child
 */
export async function getChildSubjectProgress(childId: string, subjectId: string) {
  // Verify the current user is a parent
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/login");
  }
  
  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    redirect("/login");
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  if (!parent) {
    redirect("/login");
  }
  
  // Verify the child belongs to this parent
  const parentChild = await db.studentParent.findFirst({
    where: {
      parentId: parent.id,
      studentId: childId
    }
  });
  
  if (!parentChild) {
    redirect("/parent");
  }
  
  // Get subject details
  const subject = await db.subject.findUnique({
    where: {
      id: subjectId
    }
  });
  
  if (!subject) {
    redirect("/parent/academics/overview");
  }
  
  // Get syllabus units and lessons
  const syllabus = await db.syllabus.findFirst({
    where: {
      subjectId: subjectId
    },
    include: {
      units: {
        include: {
          lessons: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  });
  
  // Get exam results for this subject
  const examResults = await db.examResult.findMany({
    where: {
      studentId: childId,
      exam: {
        subjectId: subjectId
      }
    },
    include: {
      exam: {
        include: {
          examType: true
        }
      }
    },
    orderBy: {
      exam: {
        examDate: 'desc'
      }
    }
  });
  
  // Get assignments for this subject
  const assignments = await db.assignmentSubmission.findMany({
    where: {
      studentId: childId,
      assignment: {
        subjectId: subjectId
      }
    },
    include: {
      assignment: true
    },
    orderBy: {
      assignment: {
        dueDate: 'desc'
      }
    }
  });
  
  return {
    subject,
    syllabus,
    examResults,
    assignments,
    student: {
      id: childId
    }
  };
}
