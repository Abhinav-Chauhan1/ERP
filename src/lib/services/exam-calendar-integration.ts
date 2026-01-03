/**
 * Exam Calendar Integration Service
 * 
 * Automatically creates, updates, and deletes calendar events when exams are modified.
 * 
 * Requirements: 10.1, 10.4, 10.5
 */

import { Exam, EventSourceType, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents
} from './calendar-service';

/**
 * Creates a calendar event from an exam
 * Requirement 10.1: Automatically generate a calendar event with exam details
 */
export async function createCalendarEventFromExam(
  exam: Exam & {
    subject: { id: string; name: string };
    examType: { name: string };
    term: {
      academicYear: { id: string };
      class?: { id: string; sections: Array<{ id: string }> };
    };
  },
  createdBy: string
): Promise<void> {
  try {
    // Get the exam category
    const examCategory = await db.calendarEventCategory.findFirst({
      where: { name: 'Exam' }
    });

    if (!examCategory) {
      console.error('Exam category not found in calendar system');
      return;
    }

    // Build event title
    const title = `${exam.examType.name}: ${exam.subject.name}`;
    
    // Build event description
    const description = exam.instructions 
      ? `${exam.title}\n\nInstructions: ${exam.instructions}\n\nTotal Marks: ${exam.totalMarks}\nPassing Marks: ${exam.passingMarks}`
      : `${exam.title}\n\nTotal Marks: ${exam.totalMarks}\nPassing Marks: ${exam.passingMarks}`;

    // Determine visibility
    // Exams should be visible to students in the class, teachers teaching the subject, and parents
    const visibleToRoles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
    
    // Get class and section IDs if available
    const visibleToClasses: string[] = [];
    const visibleToSections: string[] = [];
    
    if (exam.term.class) {
      visibleToClasses.push(exam.term.class.id);
      visibleToSections.push(...exam.term.class.sections.map(s => s.id));
    }

    // Create the calendar event
    await createCalendarEvent({
      title,
      description,
      categoryId: examCategory.id,
      startDate: exam.startTime,
      endDate: exam.endTime,
      isAllDay: false,
      location: undefined, // Exams typically don't have location in the current schema
      visibleToRoles,
      visibleToClasses,
      visibleToSections,
      sourceType: EventSourceType.EXAM,
      sourceId: exam.id,
      isRecurring: false,
      createdBy
    });

    console.log(`Calendar event created for exam: ${exam.id}`);
  } catch (error) {
    console.error('Error creating calendar event from exam:', error);
    // Don't throw - we don't want to fail exam creation if calendar event fails
  }
}

/**
 * Updates the calendar event when an exam is updated
 * Requirement 10.4: Synchronize changes to the corresponding calendar event
 */
export async function updateCalendarEventFromExam(
  exam: Exam & {
    subject: { id: string; name: string };
    examType: { name: string };
    term: {
      academicYear: { id: string };
      class?: { id: string; sections: Array<{ id: string }> };
    };
  }
): Promise<void> {
  try {
    // Find the existing calendar event for this exam
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.EXAM,
      sourceId: exam.id
    });

    if (existingEvents.length === 0) {
      console.warn(`No calendar event found for exam: ${exam.id}`);
      return;
    }

    const existingEvent = existingEvents[0];

    // Get the exam category
    const examCategory = await db.calendarEventCategory.findFirst({
      where: { name: 'Exam' }
    });

    if (!examCategory) {
      console.error('Exam category not found in calendar system');
      return;
    }

    // Build updated event title
    const title = `${exam.examType.name}: ${exam.subject.name}`;
    
    // Build updated event description
    const description = exam.instructions 
      ? `${exam.title}\n\nInstructions: ${exam.instructions}\n\nTotal Marks: ${exam.totalMarks}\nPassing Marks: ${exam.passingMarks}`
      : `${exam.title}\n\nTotal Marks: ${exam.totalMarks}\nPassing Marks: ${exam.passingMarks}`;

    // Determine visibility
    const visibleToRoles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
    
    // Get class and section IDs if available
    const visibleToClasses: string[] = [];
    const visibleToSections: string[] = [];
    
    if (exam.term.class) {
      visibleToClasses.push(exam.term.class.id);
      visibleToSections.push(...exam.term.class.sections.map(s => s.id));
    }

    // Update the calendar event
    await updateCalendarEvent(
      existingEvent.id,
      {
        title,
        description,
        categoryId: examCategory.id,
        startDate: exam.startTime,
        endDate: exam.endTime,
        visibleToRoles,
        visibleToClasses,
        visibleToSections
      },
      'single'
    );

    console.log(`Calendar event updated for exam: ${exam.id}`);
  } catch (error) {
    console.error('Error updating calendar event from exam:', error);
    // Don't throw - we don't want to fail exam update if calendar event fails
  }
}

/**
 * Deletes the calendar event when an exam is deleted
 * Requirement 10.5: Remove the associated calendar event from all user calendars
 */
export async function deleteCalendarEventFromExam(examId: string): Promise<void> {
  try {
    // Find the existing calendar event for this exam
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.EXAM,
      sourceId: examId
    });

    if (existingEvents.length === 0) {
      console.warn(`No calendar event found for exam: ${examId}`);
      return;
    }

    // Delete all calendar events associated with this exam
    for (const event of existingEvents) {
      await deleteCalendarEvent(event.id, 'single');
    }

    console.log(`Calendar event(s) deleted for exam: ${examId}`);
  } catch (error) {
    console.error('Error deleting calendar event from exam:', error);
    // Don't throw - we don't want to fail exam deletion if calendar event fails
  }
}

/**
 * Synchronizes an existing exam with the calendar system
 * Useful for migrating existing exams to the calendar system
 */
export async function syncExamToCalendar(
  examId: string,
  createdBy: string
): Promise<void> {
  try {
    // Get the exam with all necessary relations
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        subject: true,
        examType: true,
        term: {
          include: {
            academicYear: true
          }
        }
      }
    });

    if (!exam) {
      throw new Error(`Exam not found: ${examId}`);
    }

    // Check if calendar event already exists
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.EXAM,
      sourceId: examId
    });

    if (existingEvents.length > 0) {
      console.log(`Calendar event already exists for exam: ${examId}`);
      return;
    }

    // Create the calendar event
    await createCalendarEventFromExam(exam as any, createdBy);
  } catch (error) {
    console.error('Error syncing exam to calendar:', error);
    throw error;
  }
}
