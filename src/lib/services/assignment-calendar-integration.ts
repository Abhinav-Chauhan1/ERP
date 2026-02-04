/**
 * Assignment Calendar Integration Service
 * 
 * Automatically creates, updates, and deletes calendar events when assignments are modified.
 * 
 * Requirements: 10.2, 10.4, 10.5
 */

import { Assignment, EventSourceType, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents
} from './calendar-service';

/**
 * Creates a calendar event from an assignment
 * Requirement 10.2: Automatically generate a calendar event with assignment details
 */
export async function createCalendarEventFromAssignment(
  assignment: Assignment & {
    subject: { id: string; name: string };
    classes: Array<{ classId: string; class: { id: string; name: string } }>;
  },
  createdBy: string
): Promise<void> {
  try {
    // Get the assignment category
    const assignmentCategory = await db.calendarEventCategory.findFirst({
      where: { name: 'Assignment' }
    });

    if (!assignmentCategory) {
      console.error('Assignment category not found in calendar system');
      return;
    }

    // Build event title
    const title = `Assignment Due: ${assignment.title}`;
    
    // Build event description
    const description = assignment.instructions 
      ? `${assignment.description || assignment.title}\n\nInstructions: ${assignment.instructions}\n\nTotal Marks: ${assignment.totalMarks}`
      : `${assignment.description || assignment.title}\n\nTotal Marks: ${assignment.totalMarks}`;

    // Determine visibility
    // Assignments should be visible to students in assigned classes, the teacher who created it, and parents
    const visibleToRoles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
    
    // Get class IDs from the assignment
    const visibleToClasses: string[] = assignment.classes.map(c => c.classId);
    const visibleToSections: string[] = []; // Assignments are typically class-level, not section-specific

    // Create the calendar event
    // Use dueDate as both start and end date since it's a deadline
    await createCalendarEvent({
      title,
      description,
      categoryId: assignmentCategory.id,
      startDate: assignment.dueDate,
      endDate: assignment.dueDate,
      isAllDay: true, // Assignments are typically all-day events (deadlines)
      location: undefined,
      visibleToRoles,
      visibleToClasses,
      visibleToSections,
      sourceType: EventSourceType.ASSIGNMENT,
      sourceId: assignment.id,
      isRecurring: false,
      createdBy,
      schoolId: assignment.schoolId // Add required schoolId
    });

    console.log(`Calendar event created for assignment: ${assignment.id}`);
  } catch (error) {
    console.error('Error creating calendar event from assignment:', error);
    // Don't throw - we don't want to fail assignment creation if calendar event fails
  }
}

/**
 * Updates the calendar event when an assignment is updated
 * Requirement 10.4: Synchronize changes to the corresponding calendar event
 */
export async function updateCalendarEventFromAssignment(
  assignment: Assignment & {
    subject: { id: string; name: string };
    classes: Array<{ classId: string; class: { id: string; name: string } }>;
  }
): Promise<void> {
  try {
    // Find the existing calendar event for this assignment
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.ASSIGNMENT,
      sourceId: assignment.id
    });

    if (existingEvents.length === 0) {
      console.warn(`No calendar event found for assignment: ${assignment.id}`);
      return;
    }

    const existingEvent = existingEvents[0];

    // Get the assignment category
    const assignmentCategory = await db.calendarEventCategory.findFirst({
      where: { name: 'Assignment' }
    });

    if (!assignmentCategory) {
      console.error('Assignment category not found in calendar system');
      return;
    }

    // Build updated event title
    const title = `Assignment Due: ${assignment.title}`;
    
    // Build updated event description
    const description = assignment.instructions 
      ? `${assignment.description || assignment.title}\n\nInstructions: ${assignment.instructions}\n\nTotal Marks: ${assignment.totalMarks}`
      : `${assignment.description || assignment.title}\n\nTotal Marks: ${assignment.totalMarks}`;

    // Determine visibility
    const visibleToRoles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
    
    // Get class IDs from the assignment
    const visibleToClasses: string[] = assignment.classes.map(c => c.classId);
    const visibleToSections: string[] = [];

    // Update the calendar event
    await updateCalendarEvent(
      existingEvent.id,
      {
        title,
        description,
        categoryId: assignmentCategory.id,
        startDate: assignment.dueDate,
        endDate: assignment.dueDate,
        visibleToRoles,
        visibleToClasses,
        visibleToSections
      },
      'single'
    );

    console.log(`Calendar event updated for assignment: ${assignment.id}`);
  } catch (error) {
    console.error('Error updating calendar event from assignment:', error);
    // Don't throw - we don't want to fail assignment update if calendar event fails
  }
}

/**
 * Deletes the calendar event when an assignment is deleted
 * Requirement 10.5: Remove the associated calendar event from all user calendars
 */
export async function deleteCalendarEventFromAssignment(assignmentId: string): Promise<void> {
  try {
    // Find the existing calendar event for this assignment
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.ASSIGNMENT,
      sourceId: assignmentId
    });

    if (existingEvents.length === 0) {
      console.warn(`No calendar event found for assignment: ${assignmentId}`);
      return;
    }

    // Delete all calendar events associated with this assignment
    for (const event of existingEvents) {
      await deleteCalendarEvent(event.id, 'single');
    }

    console.log(`Calendar event(s) deleted for assignment: ${assignmentId}`);
  } catch (error) {
    console.error('Error deleting calendar event from assignment:', error);
    // Don't throw - we don't want to fail assignment deletion if calendar event fails
  }
}

/**
 * Synchronizes an existing assignment with the calendar system
 * Useful for migrating existing assignments to the calendar system
 */
export async function syncAssignmentToCalendar(
  assignmentId: string,
  createdBy: string
): Promise<void> {
  try {
    // Get the assignment with all necessary relations
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: true,
        classes: {
          include: {
            class: true
          }
        }
      }
    });

    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    // Check if calendar event already exists
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.ASSIGNMENT,
      sourceId: assignmentId
    });

    if (existingEvents.length > 0) {
      console.log(`Calendar event already exists for assignment: ${assignmentId}`);
      return;
    }

    // Create the calendar event
    await createCalendarEventFromAssignment(assignment, createdBy);
  } catch (error) {
    console.error('Error syncing assignment to calendar:', error);
    throw error;
  }
}
