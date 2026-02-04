/**
 * Meeting Calendar Integration Service
 * 
 * Automatically creates, updates, and deletes calendar events when parent-teacher meetings are modified.
 * 
 * Requirements: 10.3, 10.4, 10.5
 */

import { ParentMeeting, EventSourceType, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents
} from './calendar-service';

/**
 * Creates calendar events for all meeting participants (parent and teacher)
 * Requirement 10.3: Automatically create calendar events for all participants
 */
export async function createCalendarEventFromMeeting(
  meeting: ParentMeeting & {
    parent: {
      id: string;
      userId: string;
      user: { id: string; firstName: string; lastName: string };
    };
    teacher: {
      id: string;
      userId: string;
      user: { id: string; firstName: string; lastName: string };
    };
  },
  createdBy: string
): Promise<void> {
  try {
    // Get the meeting category
    const meetingCategory = await db.calendarEventCategory.findFirst({
      where: { name: 'Meeting' }
    });

    if (!meetingCategory) {
      console.error('Meeting category not found in calendar system');
      return;
    }

    // Build event title
    const title = `Parent-Teacher Meeting: ${meeting.title}`;
    
    // Build event description
    const description = meeting.description 
      ? `${meeting.description}\n\nParent: ${meeting.parent.user.firstName} ${meeting.parent.user.lastName}\nTeacher: ${meeting.teacher.user.firstName} ${meeting.teacher.user.lastName}\nStatus: ${meeting.status}`
      : `Parent: ${meeting.parent.user.firstName} ${meeting.parent.user.lastName}\nTeacher: ${meeting.teacher.user.firstName} ${meeting.teacher.user.lastName}\nStatus: ${meeting.status}`;

    // Calculate end time based on duration
    const endDate = meeting.duration 
      ? new Date(meeting.scheduledDate.getTime() + meeting.duration * 60000)
      : new Date(meeting.scheduledDate.getTime() + 30 * 60000); // Default 30 minutes

    // Meetings should only be visible to the specific parent, teacher, and admins
    // We don't use visibleToRoles for meetings since they're participant-specific
    const visibleToRoles = [UserRole.ADMIN];

    // Create the calendar event
    // Note: For meetings, we create a single event but the visibility service
    // will filter it based on the sourceId matching the meeting participants
    await createCalendarEvent({
      title,
      description,
      categoryId: meetingCategory.id,
      startDate: meeting.scheduledDate,
      endDate,
      isAllDay: false,
      location: meeting.location || undefined,
      visibleToRoles,
      visibleToClasses: [], // Meetings are not class-specific
      visibleToSections: [], // Meetings are not section-specific
      sourceType: EventSourceType.MEETING,
      sourceId: meeting.id,
      isRecurring: false,
      createdBy,
      schoolId: meeting.schoolId // Add required schoolId
    });

    console.log(`Calendar event created for meeting: ${meeting.id}`);
  } catch (error) {
    console.error('Error creating calendar event from meeting:', error);
    // Don't throw - we don't want to fail meeting creation if calendar event fails
  }
}

/**
 * Updates the calendar event when a meeting is updated
 * Requirement 10.4: Synchronize changes to the corresponding calendar event
 */
export async function updateCalendarEventFromMeeting(
  meeting: ParentMeeting & {
    parent: {
      id: string;
      userId: string;
      user: { id: string; firstName: string; lastName: string };
    };
    teacher: {
      id: string;
      userId: string;
      user: { id: string; firstName: string; lastName: string };
    };
  }
): Promise<void> {
  try {
    // Find the existing calendar event for this meeting
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.MEETING,
      sourceId: meeting.id
    });

    if (existingEvents.length === 0) {
      console.warn(`No calendar event found for meeting: ${meeting.id}`);
      return;
    }

    const existingEvent = existingEvents[0];

    // Get the meeting category
    const meetingCategory = await db.calendarEventCategory.findFirst({
      where: { name: 'Meeting' }
    });

    if (!meetingCategory) {
      console.error('Meeting category not found in calendar system');
      return;
    }

    // Build updated event title
    const title = `Parent-Teacher Meeting: ${meeting.title}`;
    
    // Build updated event description
    const description = meeting.description 
      ? `${meeting.description}\n\nParent: ${meeting.parent.user.firstName} ${meeting.parent.user.lastName}\nTeacher: ${meeting.teacher.user.firstName} ${meeting.teacher.user.lastName}\nStatus: ${meeting.status}`
      : `Parent: ${meeting.parent.user.firstName} ${meeting.parent.user.lastName}\nTeacher: ${meeting.teacher.user.firstName} ${meeting.teacher.user.lastName}\nStatus: ${meeting.status}`;

    // Calculate end time based on duration
    const endDate = meeting.duration 
      ? new Date(meeting.scheduledDate.getTime() + meeting.duration * 60000)
      : new Date(meeting.scheduledDate.getTime() + 30 * 60000); // Default 30 minutes

    // Update the calendar event
    await updateCalendarEvent(
      existingEvent.id,
      {
        title,
        description,
        categoryId: meetingCategory.id,
        startDate: meeting.scheduledDate,
        endDate,
        location: meeting.location || undefined,
        visibleToRoles: [UserRole.ADMIN]
      },
      'single'
    );

    console.log(`Calendar event updated for meeting: ${meeting.id}`);
  } catch (error) {
    console.error('Error updating calendar event from meeting:', error);
    // Don't throw - we don't want to fail meeting update if calendar event fails
  }
}

/**
 * Deletes the calendar event when a meeting is deleted
 * Requirement 10.5: Remove the associated calendar event from all user calendars
 */
export async function deleteCalendarEventFromMeeting(meetingId: string): Promise<void> {
  try {
    // Find the existing calendar event for this meeting
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.MEETING,
      sourceId: meetingId
    });

    if (existingEvents.length === 0) {
      console.warn(`No calendar event found for meeting: ${meetingId}`);
      return;
    }

    // Delete all calendar events associated with this meeting
    for (const event of existingEvents) {
      await deleteCalendarEvent(event.id, 'single');
    }

    console.log(`Calendar event(s) deleted for meeting: ${meetingId}`);
  } catch (error) {
    console.error('Error deleting calendar event from meeting:', error);
    // Don't throw - we don't want to fail meeting deletion if calendar event fails
  }
}

/**
 * Synchronizes an existing meeting with the calendar system
 * Useful for migrating existing meetings to the calendar system
 */
export async function syncMeetingToCalendar(
  meetingId: string,
  createdBy: string
): Promise<void> {
  try {
    // Get the meeting with all necessary relations
    const meeting = await db.parentMeeting.findUnique({
      where: { id: meetingId },
      include: {
        parent: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!meeting) {
      throw new Error(`Meeting not found: ${meetingId}`);
    }

    // Check if calendar event already exists
    const existingEvents = await getCalendarEvents({
      sourceType: EventSourceType.MEETING,
      sourceId: meetingId
    });

    if (existingEvents.length > 0) {
      console.log(`Calendar event already exists for meeting: ${meetingId}`);
      return;
    }

    // Create the calendar event
    await createCalendarEventFromMeeting(meeting as any, createdBy);
  } catch (error) {
    console.error('Error syncing meeting to calendar:', error);
    throw error;
  }
}
