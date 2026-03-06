import { prisma, faker, log } from './helpers';

export async function seedReportCards(schoolId: string, studentIds: string[], term1Id: string, examIds: string[], subjectIds: string[], adminUserId: string) {
    log('📊', 'Creating report cards and co-scholastic data...');
    // ReportCardTemplate
    const rct = await prisma.reportCardTemplate.create({
        data: { schoolId, name: 'CBSE Report Card', description: 'Standard CBSE format', type: 'CBSE', pageSize: 'A4', orientation: 'PORTRAIT', sections: JSON.stringify([{ type: 'marks', label: 'Scholastic Areas' }, { type: 'co_scholastic', label: 'Co-Scholastic Areas' }]), styling: JSON.stringify({ fontFamily: 'Arial', fontSize: 12, headerColor: '#1e40af' }), isActive: true, isDefault: true, createdBy: adminUserId },
    });

    // Co-Scholastic Activities
    const activities = ['Work Education', 'Art Education', 'Health & Physical Education', 'Discipline'];
    const activityIds: string[] = [];
    for (const a of activities) {
        const act = await prisma.coScholasticActivity.create({
            data: { schoolId, name: a, assessmentType: 'CO_SCHOLASTIC', maxMarks: 5, isActive: true },
        });
        activityIds.push(act.id);
    }

    for (let si = 0; si < 15; si++) {
        const pct = faker.number.int({ min: 40, max: 98 });
        const grade = pct >= 91 ? 'A1' : pct >= 81 ? 'A2' : pct >= 71 ? 'B1' : pct >= 61 ? 'B2' : pct >= 51 ? 'C1' : pct >= 41 ? 'C2' : 'D';
        await prisma.reportCard.create({
            data: { schoolId, studentId: studentIds[si], termId: term1Id, templateId: rct.id, totalMarks: pct * 5, averageMarks: pct, percentage: pct, grade, rank: si + 1, attendance: faker.number.float({ min: 75, max: 100, fractionDigits: 1 }), teacherRemarks: faker.helpers.arrayElement(['Excellent progress', 'Good performance', 'Consistent effort', 'Shows promise']), principalRemarks: 'Keep it up!', isPublished: true, publishDate: new Date('2024-10-15') },
        });

        // Co-scholastic grades
        for (const actId of activityIds) {
            await prisma.coScholasticGrade.create({
                data: { schoolId, activityId: actId, studentId: studentIds[si], termId: term1Id, grade: faker.helpers.arrayElement(['A', 'B', 'C']), marks: faker.number.int({ min: 3, max: 5 }) },
            });
        }
    }
}
