"use server";

import { db } from "@/lib/db";
import { getPaginationParams, createPaginationResult, ITEMS_PER_PAGE } from "@/lib/utils/pagination";
import { UserRole, AttendanceStatus } from "@prisma/client";

/**
 * Get paginated list of students
 */
export async function getStudentsList(params: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
  status?: string;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, search, classId, sectionId, status } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (classId || sectionId || status) {
      where.enrollments = {
        some: {
          ...(classId && { classId }),
          ...(sectionId && { sectionId }),
          ...(status && { status }),
        },
      };
    }

    // Get total count
    const total = await db.student.count({ where });

    // Get paginated data
    const students = await db.student.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            section: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    return createPaginationResult(students, total, page, limit);
  } catch (error) {
    console.error('Error fetching students list:', error);
    throw new Error('Failed to fetch students');
  }
}

/**
 * Get paginated list of teachers
 */
export async function getTeachersList(params: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  subjectId?: string;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, search, departmentId, subjectId } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (subjectId) {
      where.subjects = {
        some: {
          subjectId,
        },
      };
    }

    // Get total count
    const total = await db.teacher.count({ where });

    // Get paginated data
    const teachers = await db.teacher.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        departments: {
          take: 1,
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          take: 3,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    return createPaginationResult(teachers, total, page, limit);
  } catch (error) {
    console.error('Error fetching teachers list:', error);
    throw new Error('Failed to fetch teachers');
  }
}

/**
 * Get paginated list of parents
 */
export async function getParentsList(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, search } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Get total count
    const total = await db.parent.count({ where });

    // Get paginated data
    const parents = await db.parent.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        children: {
          take: 5,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    return createPaginationResult(parents, total, page, limit);
  } catch (error) {
    console.error('Error fetching parents list:', error);
    throw new Error('Failed to fetch parents');
  }
}

/**
 * Get paginated list of attendance records
 */
export async function getAttendanceList(params: {
  page?: number;
  limit?: number;
  classId?: string;
  sectionId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, classId, sectionId, startDate, endDate, status } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (classId || sectionId) {
      where.student = {
        enrollments: {
          some: {
            ...(classId && { classId }),
            ...(sectionId && { sectionId }),
            status: 'ACTIVE',
          },
        },
      };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await db.studentAttendance.count({ where });

    // Get paginated data
    const attendance = await db.studentAttendance.findMany({
      where,
      skip,
      take,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return createPaginationResult(attendance, total, page, limit);
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    throw new Error('Failed to fetch attendance records');
  }
}

/**
 * Get paginated list of fee payments
 */
export async function getFeePaymentsList(params: {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, studentId, status, startDate, endDate } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = startDate;
      if (endDate) where.paymentDate.lte = endDate;
    }

    // Get total count
    const total = await db.feePayment.count({ where });

    // Get paginated data
    const payments = await db.feePayment.findMany({
      where,
      skip,
      take,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return createPaginationResult(payments, total, page, limit);
  } catch (error) {
    console.error('Error fetching fee payments list:', error);
    throw new Error('Failed to fetch fee payments');
  }
}

/**
 * Get paginated list of exams
 */
export async function getExamsList(params: {
  page?: number;
  limit?: number;
  subjectId?: string;
  termId?: string;
  upcoming?: boolean;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, subjectId, termId, upcoming } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (termId) {
      where.termId = termId;
    }

    if (upcoming !== undefined) {
      const now = new Date();
      where.examDate = upcoming ? { gte: now } : { lt: now };
    }

    // Get total count
    const total = await db.exam.count({ where });

    // Get paginated data
    const exams = await db.exam.findMany({
      where,
      skip,
      take,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
        examType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        examDate: upcoming ? 'asc' : 'desc',
      },
    });

    return createPaginationResult(exams, total, page, limit);
  } catch (error) {
    console.error('Error fetching exams list:', error);
    throw new Error('Failed to fetch exams');
  }
}

/**
 * Get paginated list of assignments
 */
export async function getAssignmentsList(params: {
  page?: number;
  limit?: number;
  classId?: string;
  subjectId?: string;
  status?: string;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, classId, subjectId, status } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (classId) {
      where.classes = {
        some: {
          classId,
        },
      };
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await db.assignment.count({ where });

    // Get paginated data
    const assignments = await db.assignment.findMany({
      where,
      skip,
      take,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    return createPaginationResult(assignments, total, page, limit);
  } catch (error) {
    console.error('Error fetching assignments list:', error);
    throw new Error('Failed to fetch assignments');
  }
}

/**
 * Get paginated list of announcements
 */
export async function getAnnouncementsList(params: {
  page?: number;
  limit?: number;
  targetRole?: UserRole;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, targetRole } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (targetRole) {
      where.targetAudience = {
        has: targetRole,
      };
    }

    // Get total count
    const total = await db.announcement.count({ where });

    // Get paginated data
    const announcements = await db.announcement.findMany({
      where,
      skip,
      take,
      include: {
        publisher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return createPaginationResult(announcements, total, page, limit);
  } catch (error) {
    console.error('Error fetching announcements list:', error);
    throw new Error('Failed to fetch announcements');
  }
}

/**
 * Get paginated list of events
 */
export async function getEventsList(params: {
  page?: number;
  limit?: number;
  upcoming?: boolean;
  type?: string;
}) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const { page = 1, limit = ITEMS_PER_PAGE, upcoming, type } = params;
    const { skip, take } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      schoolId // Add school isolation
    };
    
    if (upcoming !== undefined) {
      const now = new Date();
      where.startDate = upcoming ? { gte: now } : { lt: now };
    }

    if (type) {
      where.type = type;
    }

    // Get total count
    const total = await db.event.count({ where });

    // Get paginated data
    const events = await db.event.findMany({
      where,
      skip,
      take,
      include: {
        participants: {
          take: 5,
        },
      },
      orderBy: {
        startDate: upcoming ? 'asc' : 'desc',
      },
    });

    return createPaginationResult(events, total, page, limit);
  } catch (error) {
    console.error('Error fetching events list:', error);
    throw new Error('Failed to fetch events');
  }
}
