import { prisma, faker, log } from './helpers';

export async function seedAcademics(schoolId: string) {
    log('📅', 'Creating academic year and terms...');
    const ay = await prisma.academicYear.create({
        data: { schoolId, name: '2024-2025', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isCurrent: true },
    });
    const t1 = await prisma.term.create({ data: { schoolId, name: 'Term 1', academicYearId: ay.id, startDate: new Date('2024-04-01'), endDate: new Date('2024-09-30') } });
    const t2 = await prisma.term.create({ data: { schoolId, name: 'Term 2', academicYearId: ay.id, startDate: new Date('2024-10-01'), endDate: new Date('2025-03-31') } });

    log('🏢', 'Creating departments...');
    const deptNames = ['Mathematics', 'Science', 'Languages', 'Social Studies', 'Computer Science', 'Arts & Music', 'Physical Education', 'Commerce'];
    const deptIds: string[] = [];
    for (const name of deptNames) {
        const d = await prisma.department.create({ data: { schoolId, name, description: `${name} Department` } });
        deptIds.push(d.id);
    }

    log('🏫', 'Creating classes and sections...');
    const classIds: string[] = [];
    const sectionIds: string[] = [];
    for (const grade of ['Class 9', 'Class 10', 'Class 11', 'Class 12']) {
        const c = await prisma.class.create({ data: { schoolId, name: grade, academicYearId: ay.id } });
        classIds.push(c.id);
        for (const sec of ['Section A', 'Section B']) {
            const s = await prisma.classSection.create({ data: { schoolId, name: sec, classId: c.id, capacity: 40 } });
            sectionIds.push(s.id);
        }
    }

    log('🚪', 'Creating classrooms...');
    const roomNames = ['Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202', 'Room 203', 'Physics Lab', 'Chemistry Lab', 'Biology Lab', 'Computer Lab', 'Library Hall', 'Art Room'];
    const classRoomIds: string[] = [];
    for (let i = 0; i < roomNames.length; i++) {
        const r = await prisma.classRoom.create({
            data: { schoolId, name: roomNames[i], capacity: roomNames[i].includes('Lab') ? 30 : 45, building: roomNames[i].includes('Lab') ? 'Science Block' : 'Main Building', floor: `${Math.floor(i / 3) + 1}st Floor`, description: `${roomNames[i]}` },
        });
        classRoomIds.push(r.id);
    }

    return { academicYearId: ay.id, term1Id: t1.id, term2Id: t2.id, departmentIds: deptIds, classIds, sectionIds, classRoomIds };
}
