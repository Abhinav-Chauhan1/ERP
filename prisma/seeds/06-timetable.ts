import { prisma, log } from './helpers';

export async function seedTimetable(schoolId: string, classIds: string[], sectionIds: string[], subjectTeacherIds: string[], classRoomIds: string[]) {
    log('🕐', 'Creating timetable...');
    const tt = await prisma.timetable.create({
        data: { schoolId, name: 'Academic Year 2024-25 Timetable', description: 'Main school timetable', effectiveFrom: new Date('2024-04-01'), isActive: true },
    });
    const config = await prisma.timetableConfig.create({
        data: { schoolId, name: 'Regular Schedule', daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'], isActive: true },
    });

    const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Lunch', 'Period 5', 'Period 6', 'Period 7'];
    const times = [['08:00', '08:45'], ['08:45', '09:30'], ['09:30', '10:15'], ['10:15', '11:00'], ['11:00', '11:30'], ['11:30', '12:15'], ['12:15', '13:00'], ['13:00', '13:45']];
    for (let i = 0; i < periods.length; i++) {
        await prisma.timetablePeriod.create({
            data: { schoolId, name: periods[i], startTime: new Date(`2024-01-01T${times[i][0]}:00`), endTime: new Date(`2024-01-01T${times[i][1]}:00`), order: i + 1, configId: config.id },
        });
    }

    const days: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'> = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    // Create slots for first 2 classes, 6 periods per day (skip lunch)
    for (let ci = 0; ci < 2; ci++) {
        for (const day of days) {
            for (let p = 0; p < 6; p++) {
                const stIdx = (ci * 3 + p) % subjectTeacherIds.length;
                const t = times[p < 4 ? p : p + 1];
                await prisma.timetableSlot.create({
                    data: { schoolId, timetableId: tt.id, classId: classIds[ci], sectionId: sectionIds[ci * 2], subjectTeacherId: subjectTeacherIds[stIdx], roomId: classRoomIds[ci % classRoomIds.length], day, startTime: new Date(`2024-01-01T${t[0]}:00`), endTime: new Date(`2024-01-01T${t[1]}:00`) },
                });
            }
        }
    }

    return { timetableId: tt.id };
}
