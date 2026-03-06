import { prisma, faker, log } from './helpers';

export async function seedSyllabus(schoolId: string, subjectIds: string[], adminUserId: string) {
    log('📖', 'Creating syllabus, modules, and submodules...');
    const syllabusIds: string[] = [];
    const syllabusUnitIds: string[] = [];
    const moduleIds: string[] = [];
    const subModuleIds: string[] = [];

    // Create syllabus for first 5 subjects
    for (let si = 0; si < 5; si++) {
        const subNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
        const syl = await prisma.syllabus.create({
            data: { schoolId, title: `${subNames[si]} - Class 10 Syllabus`, description: `Comprehensive CBSE ${subNames[si]} syllabus`, subjectId: subjectIds[si], createdBy: adminUserId, status: 'PUBLISHED', isActive: true },
        });
        syllabusIds.push(syl.id);

        const units = si === 0
            ? ['Algebra', 'Geometry', 'Trigonometry', 'Statistics']
            : si === 1
                ? ['Mechanics', 'Thermodynamics', 'Optics', 'Electricity']
                : si === 2
                    ? ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry']
                    : si === 3
                        ? ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology']
                        : ['Literature', 'Grammar', 'Writing Skills'];

        for (let u = 0; u < units.length; u++) {
            const unit = await prisma.syllabusUnit.create({
                data: { schoolId, title: units[u], description: `Unit on ${units[u]}`, syllabusId: syl.id, order: u + 1 },
            });
            syllabusUnitIds.push(unit.id);

            // Module per unit
            const mod = await prisma.module.create({
                data: { schoolId, title: `Chapter ${u + 1}: ${units[u]}`, description: `Detailed study of ${units[u]}`, chapterNumber: u + 1, order: u + 1, syllabusId: syl.id },
            });
            moduleIds.push(mod.id);

            // 2 SubModules per module
            for (let sm = 0; sm < 2; sm++) {
                const sub = await prisma.subModule.create({
                    data: { schoolId, title: `${units[u]} - Part ${sm + 1}`, description: `Subtopic ${sm + 1}`, order: sm + 1, moduleId: mod.id },
                });
                subModuleIds.push(sub.id);
            }


        }
    }

    return { syllabusId: syllabusIds[0], syllabusUnitIds, moduleIds, subModuleIds };
}
