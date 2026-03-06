import { prisma, faker, log } from './helpers';

export async function seedCalendarAndEvents(schoolId: string, adminUserId: string, studentUserIds: string[], teacherUserIds: string[]) {
    log('📅', 'Creating calendar and events...');

    // Calendar categories
    const catData = [
        { name: 'Holiday', color: '#ef4444', icon: 'Calendar', order: 1 },
        { name: 'Exam', color: '#f59e0b', icon: 'FileText', order: 2 },
        { name: 'Assignment Deadline', color: '#8b5cf6', icon: 'ClipboardList', order: 3 },
        { name: 'Meeting', color: '#3b82f6', icon: 'Users', order: 4 },
        { name: 'School Event', color: '#10b981', icon: 'Star', order: 5 },
        { name: 'Sports', color: '#f97316', icon: 'Trophy', order: 6 },
    ];
    const calendarCategoryIds: string[] = [];
    for (const c of catData) {
        const cat = await prisma.calendarEventCategory.create({ data: { schoolId, ...c } });
        calendarCategoryIds.push(cat.id);
    }

    // Calendar events
    const calendarEventIds: string[] = [];
    const calEvents = [
        { title: 'Republic Day', catIdx: 0, start: '2025-01-26', end: '2025-01-26', allDay: true },
        { title: 'Mid-Term Exams', catIdx: 1, start: '2024-09-15', end: '2024-09-25', allDay: false },
        { title: 'Math Assignment Due', catIdx: 2, start: '2024-08-20', end: '2024-08-20', allDay: false },
        { title: 'PTM', catIdx: 3, start: '2024-10-05', end: '2024-10-05', allDay: false },
        { title: 'Annual Function', catIdx: 4, start: '2024-12-20', end: '2024-12-21', allDay: false },
        { title: 'Inter-School Cricket', catIdx: 5, start: '2024-11-10', end: '2024-11-12', allDay: false },
        { title: 'Diwali Break', catIdx: 0, start: '2024-10-28', end: '2024-11-04', allDay: true },
        { title: 'Final Exams', catIdx: 1, start: '2025-02-15', end: '2025-02-28', allDay: false },
        { title: 'Science Exhibition', catIdx: 4, start: '2024-11-20', end: '2024-11-20', allDay: false },
        { title: 'Staff Meeting', catIdx: 3, start: '2024-09-05', end: '2024-09-05', allDay: false },
    ];
    for (const ev of calEvents) {
        const ce = await prisma.calendarEvent.create({
            data: { schoolId, title: ev.title, description: `${ev.title} event`, categoryId: calendarCategoryIds[ev.catIdx], startDate: new Date(ev.start), endDate: new Date(ev.end), isAllDay: ev.allDay, visibleToRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], visibleToClasses: [], visibleToSections: [], createdBy: adminUserId },
        });
        calendarEventIds.push(ce.id);
    }

    // Event notes and reminders
    for (let i = 0; i < 5; i++) {
        await prisma.eventNote.create({ data: { schoolId, eventId: calendarEventIds[i], userId: adminUserId, content: faker.lorem.sentence() } });
        await prisma.eventReminder.create({ data: { schoolId, eventId: calendarEventIds[i], userId: adminUserId, reminderTime: faker.date.soon({ days: 3 }), reminderType: 'IN_APP', isSent: false } });
    }

    // User calendar preferences
    for (const uid of [adminUserId, ...teacherUserIds.slice(0, 3)]) {
        await prisma.userCalendarPreferences.create({
            data: { schoolId, userId: uid, defaultView: faker.helpers.arrayElement(['month', 'week', 'day']), defaultReminderTime: 1440, reminderTypes: ['IN_APP', 'EMAIL'] },
        });
    }

    // Events (legacy model)
    const eventIds: string[] = [];
    const legacyEvents = [
        { title: 'Annual Sports Day', type: 'Academic', category: 'SCHOOL_EVENT' as const },
        { title: 'Science Fair 2024', type: 'Academic', category: 'SCHOOL_EVENT' as const },
        { title: 'Parent-Teacher Conference', type: 'Academic', category: 'PARENT_TEACHER_CONFERENCE' as const },
        { title: 'Teacher Workshop', type: 'Professional', category: 'PROFESSIONAL_DEVELOPMENT' as const },
        { title: 'Cultural Program', type: 'Cultural', category: 'SCHOOL_EVENT' as const },
    ];
    for (const ev of legacyEvents) {
        const e = await prisma.event.create({
            data: { schoolId, title: ev.title, description: faker.lorem.paragraph(), startDate: faker.date.soon({ days: 30 }), endDate: faker.date.soon({ days: 31 }), location: 'School Auditorium', organizer: 'DPS Vasant Kunj', type: ev.type, category: ev.category, status: 'UPCOMING', maxParticipants: faker.number.int({ min: 50, max: 500 }), isPublic: true },
        });
        eventIds.push(e.id);
    }

    // Participants & RSVPs
    for (let i = 0; i < eventIds.length; i++) {
        for (let u = 0; u < 3; u++) {
            const uid = u < 2 ? studentUserIds[u + i * 2] : teacherUserIds[i % teacherUserIds.length];
            await prisma.eventParticipant.create({ data: { schoolId, eventId: eventIds[i], userId: uid, role: u < 2 ? 'ATTENDEE' : 'ORGANIZER' } });
            await prisma.eventRSVP.create({ data: { schoolId, eventId: eventIds[i], userId: uid, status: faker.helpers.arrayElement(['ACCEPTED', 'PENDING', 'MAYBE'] as const) } });
        }
    }

    return { calendarCategoryIds, calendarEventIds, eventIds };
}
