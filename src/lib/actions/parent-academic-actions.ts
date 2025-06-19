"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
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
    where: {
      clerkId: clerkUser.id
    }
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
  
  // Get syllabus information
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
    timetable
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
    where: {
      clerkId: clerkUser.id
    }
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
