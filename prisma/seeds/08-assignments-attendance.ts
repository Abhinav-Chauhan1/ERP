import { prisma, faker, log } from './helpers';

export async function seedAssignments(schoolId: string, subjectIds: string[], teacherIds: string[], classIds: string[], studentIds: string[]) {
    log('📄', 'Creating assignments...');
    const assignmentIds: string[] = [];
    const titles = [
        ['Algebraic Expressions Problem Set', 'Quadratic Equations Worksheet', 'Statistics Project', 'Trigonometric Identities'],
        ['Newton\'s Laws Lab Report', 'Wave Motion Analysis', 'Optics Experiment', 'Electricity Circuit Design'],
        ['Organic Reactions Assignment', 'Periodic Table Research', 'Chemical Bonding Essay'],
        ['Cell Division Diagram', 'Genetics Case Study', 'Ecology Field Report'],
        ['Shakespeare Essay', 'Grammar Exercises Set', 'Creative Writing Portfolio'],
    ];

    for (let si = 0; si < 5; si++) {
        for (let ai = 0; ai < titles[si].length; ai++) {
            const a = await prisma.assignment.create({
                data: { schoolId, title: titles[si][ai], description: faker.lorem.sentence(), subjectId: subjectIds[si], assignedDate: faker.date.between({ from: '2024-04-15', to: '2024-08-15' }), dueDate: faker.date.between({ from: '2024-05-01', to: '2024-09-15' }), totalMarks: faker.helpers.arrayElement([20, 25, 30, 50]), creatorId: teacherIds[si], instructions: faker.lorem.sentence() },
            });
            assignmentIds.push(a.id);
            await prisma.assignmentClass.create({ data: { schoolId, assignmentId: a.id, classId: classIds[0] } });
            if (ai < 2) await prisma.assignmentClass.create({ data: { schoolId, assignmentId: a.id, classId: classIds[1] } });
        }
    }

    // Submissions for first 10 students on first 5 assignments
    for (let ai = 0; ai < 5; ai++) {
        for (let si = 0; si < 10; si++) {
            const status = faker.helpers.arrayElement(['SUBMITTED', 'GRADED', 'GRADED', 'GRADED']) as 'SUBMITTED' | 'GRADED';
            await prisma.assignmentSubmission.create({
                data: { schoolId, assignmentId: assignmentIds[ai], studentId: studentIds[si], submissionDate: faker.date.recent({ days: 30 }), content: 'Completed assignment', marks: status === 'GRADED' ? faker.number.int({ min: 10, max: 30 }) : undefined, feedback: status === 'GRADED' ? faker.helpers.arrayElement(['Good work', 'Excellent!', 'Needs improvement', 'Well done']) : undefined, status },
            });
        }
    }

    return { assignmentIds };
}

export async function seedAttendance(schoolId: string, studentIds: string[], sectionIds: string[], teacherIds: string[], teacherUserIds: string[], adminUserId: string) {
    log('✅', 'Creating attendance records...');
    // 10 days of attendance for first 10 students
    for (let d = 1; d <= 10; d++) {
        const date = new Date(`2024-08-${String(d).padStart(2, '0')}`);
        for (let si = 0; si < 10; si++) {
            const secIdx = Math.floor(si / 5) * 2;
            await prisma.studentAttendance.create({
                data: { schoolId, studentId: studentIds[si], date, sectionId: sectionIds[secIdx], status: faker.helpers.weightedArrayElement([{ value: 'PRESENT' as const, weight: 80 }, { value: 'ABSENT' as const, weight: 10 }, { value: 'LATE' as const, weight: 10 }]), reason: faker.datatype.boolean({ probability: 0.1 }) ? 'Sick' : undefined, markedBy: teacherUserIds[0] },
            });
        }
        // Teacher attendance
        for (let ti = 0; ti < 5; ti++) {
            await prisma.teacherAttendance.create({
                data: { schoolId, teacherId: teacherIds[ti], date, status: faker.helpers.weightedArrayElement([{ value: 'PRESENT' as const, weight: 90 }, { value: 'ABSENT' as const, weight: 5 }, { value: 'LEAVE' as const, weight: 5 }]), markedBy: adminUserId },
            });
        }
    }
}
