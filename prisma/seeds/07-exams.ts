import { prisma, faker, log } from './helpers';

export async function seedExams(schoolId: string, subjectIds: string[], teacherIds: string[], studentIds: string[], term1Id: string, term2Id: string, classIds: string[]) {
    log('📋', 'Creating exams and results...');
    const etNames = [
        { name: 'Unit Test', weight: 10, canRetest: true },
        { name: 'Mid-Term Exam', weight: 30, canRetest: false },
        { name: 'Final Exam', weight: 50, canRetest: false },
        { name: 'Practical Exam', weight: 10, canRetest: true },
    ];
    const examTypeIds: string[] = [];
    for (const et of etNames) {
        const e = await prisma.examType.create({
            data: { schoolId, name: et.name, description: et.name, weight: et.weight, isActive: true, includeInGradeCard: true, canRetest: et.canRetest },
        });
        examTypeIds.push(e.id);
    }

    // Grade Scale
    const grades = [
        { grade: 'A1', min: 91, max: 100, gpa: 10 }, { grade: 'A2', min: 81, max: 90, gpa: 9 },
        { grade: 'B1', min: 71, max: 80, gpa: 8 }, { grade: 'B2', min: 61, max: 70, gpa: 7 },
        { grade: 'C1', min: 51, max: 60, gpa: 6 }, { grade: 'C2', min: 41, max: 50, gpa: 5 },
        { grade: 'D', min: 33, max: 40, gpa: 4 }, { grade: 'E1', min: 21, max: 32, gpa: 0 },
        { grade: 'E2', min: 0, max: 20, gpa: 0 },
    ];
    for (const g of grades) {
        await prisma.gradeScale.create({ data: { schoolId, boardType: 'CBSE', grade: g.grade, minMarks: g.min, maxMarks: g.max, gpa: g.gpa, gradePoint: g.gpa, description: `Grade ${g.grade}`, isActive: true } });
    }

    // AssessmentRules
    await prisma.assessmentRule.create({ data: { schoolId, name: 'Best of Unit Tests', classId: classIds[0], ruleType: 'BEST_OF', examTypes: [examTypeIds[0]], count: 2, weight: 1.0 } });
    await prisma.assessmentRule.create({ data: { schoolId, name: 'Average Mid+Final', ruleType: 'WEIGHTED_AVERAGE', examTypes: [examTypeIds[1], examTypeIds[2]], weight: 1.0 } });

    // Exams
    const examIds: string[] = [];
    for (let si = 0; si < 5; si++) {
        const subNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
        for (let eti = 0; eti < 2; eti++) {
            // First batch (Unit Tests) = past dates, Second batch (Mid-Terms) = future dates
            const examDate = eti === 0
                ? faker.date.between({ from: '2024-07-01', to: '2024-09-30' })
                : faker.date.between({ from: '2026-04-01', to: '2026-06-30' });
            const exam = await prisma.exam.create({
                data: {
                    schoolId, title: `${subNames[si]} ${etNames[eti].name}`, examTypeId: examTypeIds[eti], subjectId: subjectIds[si], classId: classIds[si % classIds.length], termId: eti === 0 ? term1Id : term2Id,
                    examDate,
                    startTime: new Date('2024-01-01T09:00:00'), endTime: new Date('2024-01-01T12:00:00'),
                    totalMarks: 100, passingMarks: 33, creatorId: teacherIds[si % teacherIds.length],
                },
            });
            examIds.push(exam.id);

            // SubjectMarkConfig
            await prisma.subjectMarkConfig.create({
                data: { schoolId, examId: exam.id, subjectId: subjectIds[si], theoryMaxMarks: 80, practicalMaxMarks: 20, totalMarks: 100 },
            });
        }
    }

    // Results for all students for first 3 exams
    for (let ei = 0; ei < 3; ei++) {
        for (let si = 0; si < 10; si++) {
            const marks = faker.number.int({ min: 25, max: 98 });
            const grade = marks >= 91 ? 'A1' : marks >= 81 ? 'A2' : marks >= 71 ? 'B1' : marks >= 61 ? 'B2' : marks >= 51 ? 'C1' : marks >= 41 ? 'C2' : marks >= 33 ? 'D' : 'E1';
            await prisma.examResult.create({
                data: { schoolId, examId: examIds[ei], studentId: studentIds[si], marks, theoryMarks: Math.round(marks * 0.8), practicalMarks: Math.round(marks * 0.2), grade, percentage: marks, remarks: marks >= 70 ? 'Good performance' : marks >= 33 ? 'Satisfactory' : 'Needs improvement' },
            });
        }
    }

    return { examTypeIds, examIds };
}
