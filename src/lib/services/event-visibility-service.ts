/**
 * Event Visibility Service
 *
 * Provides role-based filtering and visibility rule evaluation for calendar events.
 * Implements class/section-based filtering and parent-child relationship filtering.
 *
 * Performance: All context data is batch-fetched once per request, then used for
 * in-memory filtering — no per-event DB queries.
 */

import { CalendarEvent, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { sortEvents, SortOptions } from '@/lib/utils/calendar-sorting';

export interface UserContext {
  userId: string;
  role: UserRole;
  teacherId?: string;
  studentId?: string;
  parentId?: string;
}

export interface EventFilterOptions {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  searchTerm?: string;
  sortOptions?: SortOptions;
}

/** Resolved context used for in-memory visibility checks — fetched once per request. */
interface ResolvedVisibilityContext {
  userContext: UserContext;
  // Sets for O(1) lookup
  classIds: Set<string>;
  sectionIds: Set<string>;
  subjectIds: Set<string>;
  childrenStudentIds: string[];          // for parents
  childrenClassIds: Map<string, Set<string>>; // studentId → classIds
  childrenSubjectIds: Map<string, Set<string>>; // studentId → subjectIds
}

/**
 * Gets the user context including role-specific IDs.
 * Single query with includes instead of separate lookups.
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      teacher: { select: { id: true } },
      student: { select: { id: true } },
      parent: { select: { id: true } },
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    role: user.role,
    teacherId: user.teacher?.id,
    studentId: user.student?.id,
    parentId: user.parent?.id,
  };
}

/**
 * Batch-fetches all data needed for visibility checks in parallel.
 * Called once per request — replaces per-event DB queries.
 */
async function buildVisibilityContext(userContext: UserContext): Promise<ResolvedVisibilityContext> {
  const ctx: ResolvedVisibilityContext = {
    userContext,
    classIds: new Set(),
    sectionIds: new Set(),
    subjectIds: new Set(),
    childrenStudentIds: [],
    childrenClassIds: new Map(),
    childrenSubjectIds: new Map(),
  };

  if (userContext.role === UserRole.TEACHER && userContext.teacherId) {
    const [classTeachers, subjectTeachers] = await Promise.all([
      db.classTeacher.findMany({ where: { teacherId: userContext.teacherId }, select: { classId: true } }),
      db.subjectTeacher.findMany({ where: { teacherId: userContext.teacherId }, select: { subjectId: true } }),
    ]);
    classTeachers.forEach(ct => ctx.classIds.add(ct.classId));
    subjectTeachers.forEach(st => ctx.subjectIds.add(st.subjectId));
  }

  if (userContext.role === UserRole.STUDENT && userContext.studentId) {
    const enrollments = await db.classEnrollment.findMany({
      where: { studentId: userContext.studentId, status: 'ACTIVE' },
      select: { classId: true, sectionId: true },
    });
    enrollments.forEach(e => { ctx.classIds.add(e.classId); ctx.sectionIds.add(e.sectionId); });

    // Batch-fetch subjects for student's classes
    const classIds = Array.from(ctx.classIds);
    if (classIds.length > 0) {
      const subjectClasses = await db.subjectClass.findMany({
        where: { classId: { in: classIds } },
        select: { subjectId: true },
      });
      subjectClasses.forEach(sc => ctx.subjectIds.add(sc.subjectId));
    }
  }

  if (userContext.role === UserRole.PARENT && userContext.parentId) {
    const studentParents = await db.studentParent.findMany({
      where: { parentId: userContext.parentId },
      select: { studentId: true },
    });
    ctx.childrenStudentIds = studentParents.map(sp => sp.studentId);

    if (ctx.childrenStudentIds.length > 0) {
      // Batch-fetch all children's enrollments in one query
      const allEnrollments = await db.classEnrollment.findMany({
        where: { studentId: { in: ctx.childrenStudentIds }, status: 'ACTIVE' },
        select: { studentId: true, classId: true, sectionId: true },
      });

      const allClassIds = [...new Set(allEnrollments.map(e => e.classId))];

      // Batch-fetch subjects for all children's classes
      const subjectClasses = allClassIds.length > 0
        ? await db.subjectClass.findMany({ where: { classId: { in: allClassIds } }, select: { classId: true, subjectId: true } })
        : [];

      const classSubjectMap = new Map<string, Set<string>>();
      subjectClasses.forEach(sc => {
        if (!classSubjectMap.has(sc.classId)) classSubjectMap.set(sc.classId, new Set());
        classSubjectMap.get(sc.classId)!.add(sc.subjectId);
      });

      for (const studentId of ctx.childrenStudentIds) {
        const childEnrollments = allEnrollments.filter(e => e.studentId === studentId);
        const childClassIds = new Set(childEnrollments.map(e => e.classId));
        ctx.childrenClassIds.set(studentId, childClassIds);

        const childSubjectIds = new Set<string>();
        childClassIds.forEach(cid => {
          classSubjectMap.get(cid)?.forEach(sid => childSubjectIds.add(sid));
        });
        ctx.childrenSubjectIds.set(studentId, childSubjectIds);
      }
    }
  }

  return ctx;
}

/**
 * Checks visibility for a single event using pre-fetched context — no DB queries.
 */
function isEventVisibleSync(event: CalendarEvent, ctx: ResolvedVisibilityContext): boolean {
  const { userContext } = ctx;

  if (userContext.role === UserRole.ADMIN) return true;

  if (!event.visibleToRoles.includes(userContext.role.toString())) return false;

  // No class/section restrictions → visible to all with the role
  const hasClassRestriction = event.visibleToClasses.length > 0;
  const hasSectionRestriction = event.visibleToSections.length > 0;

  if (!hasClassRestriction && !hasSectionRestriction) return true;

  switch (userContext.role) {
    case UserRole.TEACHER: {
      if (hasClassRestriction) {
        const matches = event.visibleToClasses.some(cid => ctx.classIds.has(cid));
        if (!matches) return false;
      }
      return true;
    }

    case UserRole.STUDENT: {
      if (hasClassRestriction) {
        const matches = event.visibleToClasses.some(cid => ctx.classIds.has(cid));
        if (!matches) return false;
      }
      if (hasSectionRestriction) {
        const matches = event.visibleToSections.some(sid => ctx.sectionIds.has(sid));
        if (!matches) return false;
      }
      return true;
    }

    case UserRole.PARENT: {
      // Visible if any child would see it
      for (const childId of ctx.childrenStudentIds) {
        const childClasses = ctx.childrenClassIds.get(childId) ?? new Set();
        if (hasClassRestriction && !event.visibleToClasses.some(cid => childClasses.has(cid))) continue;
        return true;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Gets calendar events for a specific user with visibility filtering.
 * Batch-fetches all context data once, then filters in memory.
 */
export async function getEventsForUser(
  userId: string,
  options: EventFilterOptions = {}
): Promise<CalendarEvent[]> {
  const userContext = await getUserContext(userId);
  if (!userContext) throw new Error('User not found');

  const where: any = {};

  if (options.startDate || options.endDate) {
    where.AND = [];
    if (options.startDate) where.AND.push({ endDate: { gte: options.startDate } });
    if (options.endDate) where.AND.push({ startDate: { lte: options.endDate } });
  }

  if (options.categoryIds?.length) where.categoryId = { in: options.categoryIds };

  if (options.searchTerm) {
    where.OR = [
      { title: { contains: options.searchTerm, mode: 'insensitive' } },
      { description: { contains: options.searchTerm, mode: 'insensitive' } },
      { location: { contains: options.searchTerm, mode: 'insensitive' } },
    ];
  }

  // For admin: no visibility filtering needed, skip context build
  if (userContext.role === UserRole.ADMIN) {
    const events = await db.calendarEvent.findMany({
      where,
      include: { category: true },
      orderBy: { startDate: 'asc' },
    });
    return options.sortOptions ? sortEvents(events as any, options.sortOptions) : events as any;
  }

  // Add role filter at DB level to reduce result set before in-memory filtering
  where.visibleToRoles = { has: userContext.role.toString() };

  // Fetch events and build visibility context in parallel
  const [events, visCtx] = await Promise.all([
    db.calendarEvent.findMany({
      where,
      include: { category: true },
      orderBy: { startDate: 'asc' },
    }),
    buildVisibilityContext(userContext),
  ]);

  const visibleEvents = (events as any[]).filter(e => isEventVisibleSync(e, visCtx));

  return options.sortOptions ? sortEvents(visibleEvents, options.sortOptions) : visibleEvents;
}

/**
 * Gets calendar events for a parent filtered by specific child.
 */
export async function getEventsForParentChild(
  parentId: string,
  studentId: string,
  options: EventFilterOptions = {}
): Promise<CalendarEvent[]> {
  const relationship = await db.studentParent.findFirst({ where: { parentId, studentId } });
  if (!relationship) throw new Error('Parent-child relationship not found');

  const studentUser = await db.student.findUnique({ where: { id: studentId }, select: { userId: true } });
  if (!studentUser) throw new Error('Student not found');

  return getEventsForUser(studentUser.userId, options);
}

// Keep for backward compatibility / debugging
export async function isEventVisibleToUser(event: CalendarEvent, userContext: UserContext): Promise<boolean> {
  const ctx = await buildVisibilityContext(userContext);
  return isEventVisibleSync(event, ctx);
}

export async function filterEventsByVisibility(events: CalendarEvent[], userContext: UserContext): Promise<CalendarEvent[]> {
  const ctx = await buildVisibilityContext(userContext);
  return events.filter(e => isEventVisibleSync(e, ctx));
}

export async function evaluateVisibilityRules(eventId: string, userId: string) {
  const event = await db.calendarEvent.findUnique({ where: { id: eventId }, include: { category: true } });
  if (!event) return { isVisible: false, reason: 'Event not found', appliedRules: [] };

  const userContext = await getUserContext(userId);
  if (!userContext) return { isVisible: false, reason: 'User not found', appliedRules: [] };

  if (userContext.role === UserRole.ADMIN) return { isVisible: true, reason: 'User is admin', appliedRules: ['Admin can see all events'] };

  const ctx = await buildVisibilityContext(userContext);
  const isVisible = isEventVisibleSync(event as any, ctx);
  return { isVisible, reason: isVisible ? 'All visibility rules passed' : 'Failed visibility check', appliedRules: [] };
}
