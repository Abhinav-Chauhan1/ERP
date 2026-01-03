/**
 * Event Visibility Service
 * 
 * Provides role-based filtering and visibility rule evaluation for calendar events.
 * Implements class/section-based filtering and parent-child relationship filtering.
 * 
 * Requirements: 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4
 */

import { PrismaClient, CalendarEvent, UserRole } from '@prisma/client';
import { sortEvents, SortOptions } from '@/lib/utils/calendar-sorting';

const prisma = new PrismaClient();

// Types for user context
export interface UserContext {
  userId: string;
  role: UserRole;
  teacherId?: string;
  studentId?: string;
  parentId?: string;
}

// Types for filtering options
export interface EventFilterOptions {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  searchTerm?: string;
  sortOptions?: SortOptions;
}

/**
 * Gets the user context including role-specific IDs
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacher: true,
      student: true,
      parent: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
    teacherId: user.teacher?.id,
    studentId: user.student?.id,
    parentId: user.parent?.id
  };
}

/**
 * Gets class IDs for a student
 */
async function getStudentClassIds(studentId: string): Promise<string[]> {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      studentId,
      status: 'ACTIVE'
    },
    select: {
      classId: true
    }
  });

  return enrollments.map(e => e.classId);
}

/**
 * Gets section IDs for a student
 */
async function getStudentSectionIds(studentId: string): Promise<string[]> {
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      studentId,
      status: 'ACTIVE'
    },
    select: {
      sectionId: true
    }
  });

  return enrollments.map(e => e.sectionId);
}

/**
 * Gets subject IDs that a student is enrolled in
 */
async function getStudentSubjectIds(studentId: string): Promise<string[]> {
  // Get student's classes
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      studentId,
      status: 'ACTIVE'
    },
    select: {
      classId: true
    }
  });

  const classIds = enrollments.map(e => e.classId);

  // Get subjects for those classes
  const subjectClasses = await prisma.subjectClass.findMany({
    where: {
      classId: { in: classIds }
    },
    select: {
      subjectId: true
    }
  });

  return subjectClasses.map(sc => sc.subjectId);
}

/**
 * Gets subject IDs that a teacher teaches
 */
async function getTeacherSubjectIds(teacherId: string): Promise<string[]> {
  const subjectTeachers = await prisma.subjectTeacher.findMany({
    where: {
      teacherId
    },
    select: {
      subjectId: true
    }
  });

  return subjectTeachers.map(st => st.subjectId);
}

/**
 * Gets class IDs that a teacher teaches
 */
async function getTeacherClassIds(teacherId: string): Promise<string[]> {
  const classTeachers = await prisma.classTeacher.findMany({
    where: {
      teacherId
    },
    select: {
      classId: true
    }
  });

  return classTeachers.map(ct => ct.classId);
}

/**
 * Gets student IDs for a parent's children
 */
async function getParentChildrenIds(parentId: string): Promise<string[]> {
  const studentParents = await prisma.studentParent.findMany({
    where: {
      parentId
    },
    select: {
      studentId: true
    }
  });

  return studentParents.map(sp => sp.studentId);
}

/**
 * Checks if an event is visible to a specific user based on role and relationships
 * 
 * Requirement 1.2: Restrict event access to specified user roles
 * Requirement 2.1: Display all events visible to teachers
 * Requirement 3.1: Display events relevant to student's class and section
 * Requirement 4.1: Display events for all registered children
 */
export async function isEventVisibleToUser(
  event: CalendarEvent,
  userContext: UserContext
): Promise<boolean> {
  // Admin can see all events
  if (userContext.role === UserRole.ADMIN) {
    return true;
  }

  // Check if event is visible to user's role
  const roleString = userContext.role.toString();
  if (!event.visibleToRoles.includes(roleString)) {
    return false;
  }

  // If event has no class/section restrictions, it's visible to all users with the role
  if (event.visibleToClasses.length === 0 && event.visibleToSections.length === 0) {
    // For source-based events, apply additional filtering
    if (event.sourceType && event.sourceId) {
      return await isSourceEventVisibleToUser(event, userContext);
    }
    return true;
  }

  // Apply role-specific filtering
  switch (userContext.role) {
    case UserRole.TEACHER:
      return await isEventVisibleToTeacher(event, userContext);
    
    case UserRole.STUDENT:
      return await isEventVisibleToStudent(event, userContext);
    
    case UserRole.PARENT:
      return await isEventVisibleToParent(event, userContext);
    
    default:
      return false;
  }
}

/**
 * Checks if an event is visible to a teacher
 * 
 * Requirement 2.1: Display all events visible to teachers including holidays, exams, meetings, and school events
 * Requirement 2.2: Highlight exams for subjects they teach
 * Requirement 2.3: Display assignments they have created
 */
async function isEventVisibleToTeacher(
  event: CalendarEvent,
  userContext: UserContext
): Promise<boolean> {
  if (!userContext.teacherId) {
    return false;
  }

  // Check class/section restrictions
  if (event.visibleToClasses.length > 0) {
    const teacherClassIds = await getTeacherClassIds(userContext.teacherId);
    const hasClassMatch = event.visibleToClasses.some(classId => 
      teacherClassIds.includes(classId)
    );
    if (!hasClassMatch) {
      return false;
    }
  }

  // For exam events, check if teacher teaches the subject
  if (event.sourceType === 'EXAM' && event.sourceId) {
    const exam = await prisma.exam.findUnique({
      where: { id: event.sourceId },
      select: { subjectId: true }
    });
    
    if (exam) {
      const teacherSubjectIds = await getTeacherSubjectIds(userContext.teacherId);
      return teacherSubjectIds.includes(exam.subjectId);
    }
  }

  // For assignment events, check if teacher created it
  if (event.sourceType === 'ASSIGNMENT' && event.sourceId) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: event.sourceId },
      select: { creatorId: true }
    });
    
    if (assignment) {
      return assignment.creatorId === userContext.teacherId;
    }
  }

  // For meeting events, check if teacher is a participant
  if (event.sourceType === 'MEETING' && event.sourceId) {
    const meeting = await prisma.parentMeeting.findUnique({
      where: { id: event.sourceId },
      select: { teacherId: true }
    });
    
    if (meeting) {
      return meeting.teacherId === userContext.teacherId;
    }
  }

  return true;
}

/**
 * Checks if an event is visible to a student
 * 
 * Requirement 3.1: Display events relevant to their class and section
 * Requirement 3.2: Show only exams for their enrolled subjects
 * Requirement 3.3: Display assignments assigned to their class
 */
async function isEventVisibleToStudent(
  event: CalendarEvent,
  userContext: UserContext
): Promise<boolean> {
  if (!userContext.studentId) {
    return false;
  }

  // Check class restrictions
  if (event.visibleToClasses.length > 0) {
    const studentClassIds = await getStudentClassIds(userContext.studentId);
    const hasClassMatch = event.visibleToClasses.some(classId => 
      studentClassIds.includes(classId)
    );
    if (!hasClassMatch) {
      return false;
    }
  }

  // Check section restrictions
  if (event.visibleToSections.length > 0) {
    const studentSectionIds = await getStudentSectionIds(userContext.studentId);
    const hasSectionMatch = event.visibleToSections.some(sectionId => 
      studentSectionIds.includes(sectionId)
    );
    if (!hasSectionMatch) {
      return false;
    }
  }

  // For exam events, check if student is enrolled in the subject
  if (event.sourceType === 'EXAM' && event.sourceId) {
    const exam = await prisma.exam.findUnique({
      where: { id: event.sourceId },
      select: { subjectId: true }
    });
    
    if (exam) {
      const studentSubjectIds = await getStudentSubjectIds(userContext.studentId);
      return studentSubjectIds.includes(exam.subjectId);
    }
  }

  // For assignment events, check if student's class is assigned
  if (event.sourceType === 'ASSIGNMENT' && event.sourceId) {
    const assignmentClasses = await prisma.assignmentClass.findMany({
      where: { assignmentId: event.sourceId },
      select: { classId: true }
    });
    
    const assignedClassIds = assignmentClasses.map(ac => ac.classId);
    const studentClassIds = await getStudentClassIds(userContext.studentId);
    
    return assignedClassIds.some(classId => studentClassIds.includes(classId));
  }

  return true;
}

/**
 * Checks if an event is visible to a parent
 * 
 * Requirement 4.1: Display events for all their registered children
 * Requirement 4.2: Provide a filter to view events for specific children
 * Requirement 4.3: Highlight meetings scheduled for their children
 * Requirement 4.4: Display exams for all subjects of their children
 */
async function isEventVisibleToParent(
  event: CalendarEvent,
  userContext: UserContext
): Promise<boolean> {
  if (!userContext.parentId) {
    return false;
  }

  // Get all children of the parent
  const childrenIds = await getParentChildrenIds(userContext.parentId);
  
  if (childrenIds.length === 0) {
    return false;
  }

  // Check if event is visible to any of the children
  for (const childId of childrenIds) {
    const childContext: UserContext = {
      userId: userContext.userId,
      role: UserRole.STUDENT,
      studentId: childId
    };
    
    const visibleToChild = await isEventVisibleToStudent(event, childContext);
    if (visibleToChild) {
      return true;
    }
  }

  // For meeting events, check if any child is involved
  if (event.sourceType === 'MEETING' && event.sourceId) {
    const meeting = await prisma.parentMeeting.findUnique({
      where: { id: event.sourceId },
      select: { parentId: true }
    });
    
    if (meeting && meeting.parentId === userContext.parentId) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a source-based event is visible to a user
 */
async function isSourceEventVisibleToUser(
  event: CalendarEvent,
  userContext: UserContext
): Promise<boolean> {
  if (!event.sourceType || !event.sourceId) {
    return true;
  }

  switch (event.sourceType) {
    case 'EXAM':
      return await isExamEventVisible(event.sourceId, userContext);
    
    case 'ASSIGNMENT':
      return await isAssignmentEventVisible(event.sourceId, userContext);
    
    case 'MEETING':
      return await isMeetingEventVisible(event.sourceId, userContext);
    
    default:
      return true;
  }
}

/**
 * Checks if an exam event is visible to a user
 */
async function isExamEventVisible(
  examId: string,
  userContext: UserContext
): Promise<boolean> {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { subjectId: true }
  });

  if (!exam) {
    return false;
  }

  if (userContext.role === UserRole.TEACHER && userContext.teacherId) {
    const teacherSubjectIds = await getTeacherSubjectIds(userContext.teacherId);
    return teacherSubjectIds.includes(exam.subjectId);
  }

  if (userContext.role === UserRole.STUDENT && userContext.studentId) {
    const studentSubjectIds = await getStudentSubjectIds(userContext.studentId);
    return studentSubjectIds.includes(exam.subjectId);
  }

  if (userContext.role === UserRole.PARENT && userContext.parentId) {
    const childrenIds = await getParentChildrenIds(userContext.parentId);
    for (const childId of childrenIds) {
      const studentSubjectIds = await getStudentSubjectIds(childId);
      if (studentSubjectIds.includes(exam.subjectId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if an assignment event is visible to a user
 */
async function isAssignmentEventVisible(
  assignmentId: string,
  userContext: UserContext
): Promise<boolean> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { creatorId: true }
  });

  if (!assignment) {
    return false;
  }

  if (userContext.role === UserRole.TEACHER && userContext.teacherId) {
    return assignment.creatorId === userContext.teacherId;
  }

  if (userContext.role === UserRole.STUDENT && userContext.studentId) {
    const assignmentClasses = await prisma.assignmentClass.findMany({
      where: { assignmentId },
      select: { classId: true }
    });
    
    const assignedClassIds = assignmentClasses.map(ac => ac.classId);
    const studentClassIds = await getStudentClassIds(userContext.studentId);
    
    return assignedClassIds.some(classId => studentClassIds.includes(classId));
  }

  if (userContext.role === UserRole.PARENT && userContext.parentId) {
    const childrenIds = await getParentChildrenIds(userContext.parentId);
    const assignmentClasses = await prisma.assignmentClass.findMany({
      where: { assignmentId },
      select: { classId: true }
    });
    
    const assignedClassIds = assignmentClasses.map(ac => ac.classId);
    
    for (const childId of childrenIds) {
      const studentClassIds = await getStudentClassIds(childId);
      if (assignedClassIds.some(classId => studentClassIds.includes(classId))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a meeting event is visible to a user
 */
async function isMeetingEventVisible(
  meetingId: string,
  userContext: UserContext
): Promise<boolean> {
  const meeting = await prisma.parentMeeting.findUnique({
    where: { id: meetingId },
    select: {
      teacherId: true,
      parentId: true
    }
  });

  if (!meeting) {
    return false;
  }

  if (userContext.role === UserRole.TEACHER && userContext.teacherId) {
    return meeting.teacherId === userContext.teacherId;
  }

  if (userContext.role === UserRole.PARENT && userContext.parentId) {
    return meeting.parentId === userContext.parentId;
  }

  return false;
}

/**
 * Filters a list of events based on user visibility
 */
export async function filterEventsByVisibility(
  events: CalendarEvent[],
  userContext: UserContext
): Promise<CalendarEvent[]> {
  const visibleEvents: CalendarEvent[] = [];

  for (const event of events) {
    const isVisible = await isEventVisibleToUser(event, userContext);
    if (isVisible) {
      visibleEvents.push(event);
    }
  }

  return visibleEvents;
}

/**
 * Gets calendar events for a specific user with visibility filtering
 * 
 * This is the main function to use for retrieving events for a user.
 * It applies all visibility rules based on the user's role and relationships.
 * 
 * Requirement 3.4: Sort events chronologically with nearest events first
 */
export async function getEventsForUser(
  userId: string,
  options: EventFilterOptions = {}
): Promise<CalendarEvent[]> {
  // Get user context
  const userContext = await getUserContext(userId);
  if (!userContext) {
    throw new Error('User not found');
  }

  // Build base query
  const where: any = {};

  // Date range filter
  if (options.startDate || options.endDate) {
    where.AND = [];
    if (options.startDate) {
      where.AND.push({ endDate: { gte: options.startDate } });
    }
    if (options.endDate) {
      where.AND.push({ startDate: { lte: options.endDate } });
    }
  }

  // Category filter
  if (options.categoryIds && options.categoryIds.length > 0) {
    where.categoryId = { in: options.categoryIds };
  }

  // Search filter
  if (options.searchTerm) {
    where.OR = [
      { title: { contains: options.searchTerm, mode: 'insensitive' } },
      { description: { contains: options.searchTerm, mode: 'insensitive' } },
      { location: { contains: options.searchTerm, mode: 'insensitive' } }
    ];
  }

  // For admin, return all events matching filters
  if (userContext.role === UserRole.ADMIN) {
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        category: true,
        notes: true,
        reminders: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });
    
    // Apply custom sorting if provided
    if (options.sortOptions) {
      return sortEvents(events, options.sortOptions);
    }
    
    return events;
  }

  // For other roles, add role filter
  where.visibleToRoles = { has: userContext.role.toString() };

  // Get events
  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      category: true,
      notes: true,
      reminders: true
    },
    orderBy: {
      startDate: 'asc'
    }
  });

  // Apply visibility filtering
  const visibleEvents = await filterEventsByVisibility(events, userContext);
  
  // Apply custom sorting if provided
  if (options.sortOptions) {
    return sortEvents(visibleEvents, options.sortOptions);
  }
  
  return visibleEvents;
}

/**
 * Gets calendar events for a parent filtered by specific child
 * 
 * Requirement 4.2: Provide a filter to view events for specific children
 */
export async function getEventsForParentChild(
  parentId: string,
  studentId: string,
  options: EventFilterOptions = {}
): Promise<CalendarEvent[]> {
  // Verify parent-child relationship
  const relationship = await prisma.studentParent.findFirst({
    where: {
      parentId,
      studentId
    }
  });

  if (!relationship) {
    throw new Error('Parent-child relationship not found');
  }

  // Get events as if the user is the student
  const studentUser = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true }
  });

  if (!studentUser) {
    throw new Error('Student not found');
  }

  return await getEventsForUser(studentUser.userId, options);
}

/**
 * Helper function to evaluate visibility rules for a single event
 * Used for testing and debugging
 */
export async function evaluateVisibilityRules(
  eventId: string,
  userId: string
): Promise<{
  isVisible: boolean;
  reason: string;
  appliedRules: string[];
}> {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: {
      category: true
    }
  });

  if (!event) {
    return {
      isVisible: false,
      reason: 'Event not found',
      appliedRules: []
    };
  }

  const userContext = await getUserContext(userId);
  if (!userContext) {
    return {
      isVisible: false,
      reason: 'User not found',
      appliedRules: []
    };
  }

  const appliedRules: string[] = [];

  // Check admin rule
  if (userContext.role === UserRole.ADMIN) {
    appliedRules.push('Admin can see all events');
    return {
      isVisible: true,
      reason: 'User is admin',
      appliedRules
    };
  }

  // Check role visibility
  const roleString = userContext.role.toString();
  if (!event.visibleToRoles.includes(roleString)) {
    appliedRules.push(`Event not visible to role: ${roleString}`);
    return {
      isVisible: false,
      reason: `Event not visible to role: ${roleString}`,
      appliedRules
    };
  }
  appliedRules.push(`Event visible to role: ${roleString}`);

  // Check visibility
  const isVisible = await isEventVisibleToUser(event, userContext);

  return {
    isVisible,
    reason: isVisible ? 'All visibility rules passed' : 'Failed relationship-based filtering',
    appliedRules
  };
}
