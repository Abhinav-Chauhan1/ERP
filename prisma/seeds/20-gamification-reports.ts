import { prisma, faker, log } from './helpers';

export async function seedGamification(schoolId: string, studentIds: string[]) {
    log('🎮', 'Creating gamification data...');
    // Student Achievements
    const achCategories: Array<'ACADEMIC' | 'ATTENDANCE' | 'PARTICIPATION' | 'STREAK' | 'SPECIAL'> = ['ACADEMIC', 'ATTENDANCE', 'PARTICIPATION', 'STREAK', 'SPECIAL'];
    const achTitles = ['First A+', 'Perfect Attendance Week', '5 Discussions', '10-Day Streak', 'Science Fair Winner', 'Math Olympiad', 'Book Worm (10 Books)', '100% Attendance Month', 'Top Scorer', 'Quiz Master'];
    for (let i = 0; i < 10; i++) {
        for (let a = 0; a < 3; a++) {
            const idx = (i + a) % achTitles.length;
            await prisma.studentAchievement.create({
                data: { schoolId, studentId: studentIds[i], title: achTitles[idx], description: `Achievement: ${achTitles[idx]}`, category: achCategories[idx % 5], points: faker.helpers.arrayElement([10, 25, 50, 100]), rarity: faker.helpers.arrayElement(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const), icon: faker.helpers.arrayElement(['Star', 'Trophy', 'Medal', 'Award', 'Fire']), unlocked: faker.datatype.boolean({ probability: 0.7 }), unlockedAt: faker.datatype.boolean({ probability: 0.7 }) ? faker.date.recent({ days: 60 }) : undefined, progress: faker.number.int({ min: 0, max: 10 }), maxProgress: 10 },
            });
        }
    }

    // Student XP Levels
    for (let i = 0; i < 15; i++) {
        await prisma.studentXPLevel.create({
            data: { schoolId, studentId: studentIds[i], totalXP: faker.number.int({ min: 50, max: 2000 }), level: faker.number.int({ min: 1, max: 10 }), currentLevelXP: faker.number.int({ min: 0, max: 100 }), xpToNextLevel: 100, streak: faker.number.int({ min: 0, max: 30 }), lastActivityDate: faker.date.recent({ days: 3 }) },
        });
    }

    // Student Notes
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
    for (let i = 0; i < 10; i++) {
        for (let n = 0; n < 2; n++) {
            await prisma.studentNote.create({
                data: { schoolId, studentId: studentIds[i], title: faker.lorem.words({ min: 3, max: 6 }), content: faker.lorem.paragraphs(2), subject: subjects[(i + n) % 5], tags: [subjects[(i + n) % 5].toLowerCase(), 'notes'], folder: faker.helpers.arrayElement(['Class Notes', 'Revision', 'Important', undefined]) },
            });
        }
    }

    // Flashcard Decks and Cards
    for (let i = 0; i < 5; i++) {
        const deck = await prisma.flashcardDeck.create({
            data: { schoolId, studentId: studentIds[i], name: `${subjects[i]} Flash Cards`, description: `Review cards for ${subjects[i]}`, subject: subjects[i] },
        });
        for (let c = 0; c < 5; c++) {
            await prisma.flashcard.create({
                data: { schoolId, deckId: deck.id, studentId: studentIds[i], front: faker.lorem.sentence(), back: faker.lorem.sentence(), difficulty: faker.helpers.arrayElement(['EASY', 'MEDIUM', 'HARD'] as const), correctCount: faker.number.int({ min: 0, max: 10 }), incorrectCount: faker.number.int({ min: 0, max: 5 }), lastReviewed: faker.date.recent({ days: 7 }), tags: [subjects[i].toLowerCase()] },
            });
        }
    }

    // Mind Maps
    for (let i = 0; i < 5; i++) {
        await prisma.mindMap.create({
            data: { schoolId, studentId: studentIds[i], title: `${subjects[i]} Concept Map`, subject: subjects[i], nodes: JSON.stringify([{ id: '1', label: subjects[i], x: 400, y: 300 }, { id: '2', label: 'Topic 1', x: 200, y: 200 }, { id: '3', label: 'Topic 2', x: 600, y: 200 }]), connections: JSON.stringify([{ from: '1', to: '2' }, { from: '1', to: '3' }]) },
        });
    }

    // Lesson Content
    const lessonContentIds: string[] = [];
    for (let i = 0; i < 10; i++) {
        const lc = await prisma.lessonContent.create({
            data: { schoolId, title: `${subjects[i % 5]} - Lesson Content ${i + 1}`, type: faker.helpers.arrayElement(['VIDEO', 'TEXT', 'AUDIO', 'INTERACTIVE'] as const), content: faker.lorem.paragraphs(2), duration: faker.number.int({ min: 15, max: 60 }), order: i + 1 },
        });
        lessonContentIds.push(lc.id);
    }

    // Student Content Progress
    for (let i = 0; i < 10; i++) {
        for (let c = 0; c < 3; c++) {
            await prisma.studentContentProgress.create({
                data: { schoolId, studentId: studentIds[i], contentId: lessonContentIds[(i + c) % lessonContentIds.length], status: faker.helpers.arrayElement(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const), progress: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }), timeSpent: faker.number.int({ min: 0, max: 3600 }), completed: faker.datatype.boolean({ probability: 0.4 }), completedAt: faker.datatype.boolean({ probability: 0.4 }) ? faker.date.recent({ days: 14 }) : undefined, lastAccessedAt: faker.date.recent({ days: 3 }) },
            });
        }
    }
}

export async function seedReports(schoolId: string, adminUserId: string) {
    log('📊', 'Creating reports data...');
    // Saved Report Configs
    const reportSources = ['students', 'fees', 'attendance', 'exams', 'teachers'];
    for (let i = 0; i < 5; i++) {
        await prisma.savedReportConfig.create({
            data: { schoolId, name: `${reportSources[i].charAt(0).toUpperCase() + reportSources[i].slice(1)} Report`, description: `Custom ${reportSources[i]} report`, dataSource: reportSources[i], selectedFields: ['name', 'class', 'status', 'date'], filters: JSON.stringify({ status: 'ACTIVE' }), sorting: JSON.stringify({ field: 'name', direction: 'asc' }), userId: adminUserId },
        });
    }

    // Scheduled Reports
    for (let i = 0; i < 3; i++) {
        await prisma.scheduledReport.create({
            data: { schoolId, name: `Weekly ${reportSources[i]} Report`, description: `Auto-generated weekly ${reportSources[i]} report`, dataSource: reportSources[i], selectedFields: JSON.stringify(['name', 'status', 'date']), filters: JSON.stringify({ active: true }), sorting: JSON.stringify({ field: 'date', dir: 'desc' }), frequency: 'WEEKLY', scheduleTime: '08:00', dayOfWeek: 1, recipients: JSON.stringify(['admin@dpsvk.edu.in']), exportFormat: 'pdf', active: true, createdBy: adminUserId, nextRunAt: faker.date.soon({ days: 7 }) },
        });
    }

    // Teacher Achievements (existing Achievement model)
    const teacherAchCats: Array<'AWARD' | 'CERTIFICATION' | 'PROFESSIONAL_DEVELOPMENT' | 'PUBLICATION' | 'RECOGNITION'> = ['AWARD', 'CERTIFICATION', 'PROFESSIONAL_DEVELOPMENT', 'PUBLICATION', 'RECOGNITION'];
    // We can't seed this without teacher IDs passed in, so we skip here (already seeded in main)
}
