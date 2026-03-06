import { prisma, faker, log } from './helpers';

export async function seedSubjects(schoolId: string, departmentIds: string[], classIds: string[], sectionIds: string[], teacherIds: string[]) {
    log('📚', 'Creating subjects...');
    const subjectData = [
        { name: 'Mathematics', code: 'MATH', deptIdx: 0 },
        { name: 'Physics', code: 'PHY', deptIdx: 1 },
        { name: 'Chemistry', code: 'CHEM', deptIdx: 1 },
        { name: 'Biology', code: 'BIO', deptIdx: 1 },
        { name: 'English', code: 'ENG', deptIdx: 2 },
        { name: 'Hindi', code: 'HIN', deptIdx: 2 },
        { name: 'Computer Science', code: 'CS', deptIdx: 4 },
        { name: 'History', code: 'HIST', deptIdx: 3 },
        { name: 'Geography', code: 'GEO', deptIdx: 3 },
        { name: 'Economics', code: 'ECO', deptIdx: 7 },
    ];

    const subjectIds: string[] = [];
    for (const s of subjectData) {
        const sub = await prisma.subject.create({
            data: { schoolId, name: s.name, code: s.code, description: `${s.name} for senior secondary`, departmentId: departmentIds[s.deptIdx] },
        });
        subjectIds.push(sub.id);
    }

    // SubjectVariants for Math
    await prisma.subjectVariant.create({ data: { schoolId, subjectId: subjectIds[0], variantType: 'Standard', description: 'Standard Mathematics' } });
    await prisma.subjectVariant.create({ data: { schoolId, subjectId: subjectIds[0], variantType: 'Applied', description: 'Applied Mathematics' } });

    // SubjectGroup
    const sg = await prisma.subjectGroup.create({ data: { schoolId, name: 'Science Stream', code: 'SCI', description: 'PCM/PCB elective group' } });
    for (let i = 0; i < 4; i++) {
        await prisma.subjectGroupMapping.create({ data: { schoolId, groupId: sg.id, subjectId: subjectIds[i] } });
    }

    log('👨‍🏫', 'Assigning teachers to subjects...');
    const subjectTeacherIds: string[] = [];
    for (let i = 0; i < 10; i++) {
        const st = await prisma.subjectTeacher.create({ data: { schoolId, subjectId: subjectIds[i], teacherId: teacherIds[i] } });
        subjectTeacherIds.push(st.id);
    }

    log('📖', 'Assigning subjects to classes...');
    for (const classId of classIds) {
        for (const subjectId of subjectIds.slice(0, 7)) {
            await prisma.subjectClass.create({ data: { schoolId, subjectId, classId } });
        }
    }

    return { subjectIds, subjectTeacherIds };
}
