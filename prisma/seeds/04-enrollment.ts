import { prisma, log } from './helpers';

export async function seedEnrollment(schoolId: string, classIds: string[], sectionIds: string[], studentIds: string[], teacherIds: string[]) {
    log('📝', 'Enrolling students and assigning class teachers...');
    const enrollmentIds: string[] = [];
    // 20 students across 4 classes (5 per class), 2 sections per class
    for (let i = 0; i < 20; i++) {
        const classIdx = Math.floor(i / 5);
        const sectionIdx = classIdx * 2 + (i % 2);
        const e = await prisma.classEnrollment.create({
            data: { schoolId, studentId: studentIds[i], classId: classIds[classIdx], sectionId: sectionIds[sectionIdx], rollNumber: `${classIdx + 9}${String.fromCharCode(65 + (i % 2))}${String((Math.floor(i / 2) % 3) + 1).padStart(3, '0')}`, status: 'ACTIVE', enrollDate: new Date('2024-04-01') },
        });
        enrollmentIds.push(e.id);
    }

    // Class teachers (first 4 teachers as class heads)
    for (let i = 0; i < 4; i++) {
        await prisma.classTeacher.create({ data: { schoolId, classId: classIds[i], teacherId: teacherIds[i], isClassHead: true } });
    }

    return { enrollmentIds };
}
