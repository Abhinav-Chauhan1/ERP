import { prisma, faker, log } from './helpers';

export async function seedOnlineLearning(schoolId: string, teacherIds: string[], subjectIds: string[], classIds: string[], studentIds: string[]) {
    log('🎓', 'Creating online learning data...');
    const courseIds: string[] = [];
    const courseModuleIds: string[] = [];
    const courseLessonIds: string[] = [];

    const courseInfo = [
        { title: 'Advanced Mathematics', subIdx: 0, level: 'ADVANCED' as const },
        { title: 'Introduction to Physics', subIdx: 1, level: 'BEGINNER' as const },
        { title: 'Chemistry Fundamentals', subIdx: 2, level: 'INTERMEDIATE' as const },
    ];

    for (let ci = 0; ci < 3; ci++) {
        const c = await prisma.course.create({
            data: { schoolId, title: courseInfo[ci].title, description: faker.lorem.paragraph(), subjectId: subjectIds[courseInfo[ci].subIdx], classId: classIds[0], teacherId: teacherIds[ci], level: courseInfo[ci].level, status: 'PUBLISHED', isPublished: true, publishedAt: new Date('2024-05-01'), duration: faker.number.int({ min: 20, max: 40 }) },
        });
        courseIds.push(c.id);

        // 3 modules per course
        for (let m = 0; m < 3; m++) {
            const mod = await prisma.courseModule.create({
                data: { schoolId, courseId: c.id, title: `Module ${m + 1}: ${faker.lorem.words(3)}`, description: faker.lorem.sentence(), sequence: m + 1, duration: faker.number.int({ min: 5, max: 15 }) },
            });
            courseModuleIds.push(mod.id);

            // 2 lessons per module
            for (let l = 0; l < 2; l++) {
                const lesson = await prisma.courseLesson.create({
                    data: { schoolId, moduleId: mod.id, title: `Lesson ${l + 1}: ${faker.lorem.words(3)}`, description: faker.lorem.sentence(), sequence: l + 1, duration: faker.number.int({ min: 15, max: 45 }), lessonType: faker.helpers.arrayElement(['TEXT', 'VIDEO', 'DOCUMENT'] as const) },
                });
                courseLessonIds.push(lesson.id);

                // Course content
                await prisma.courseContent.create({
                    data: { schoolId, lessonId: lesson.id, contentType: faker.helpers.arrayElement(['TEXT', 'VIDEO', 'PDF'] as const), title: faker.lorem.words(3), content: faker.lorem.paragraphs(2), sequence: 1, isDownloadable: true },
                });

                // Quiz for first lesson of each module
                if (l === 0) {
                    const quiz = await prisma.lessonQuiz.create({
                        data: { schoolId, lessonId: lesson.id, title: `Quiz: ${faker.lorem.words(3)}`, questions: JSON.stringify([{ q: 'What is the main concept?', options: ['A', 'B', 'C', 'D'], answer: 0 }, { q: 'True or False?', options: ['True', 'False'], answer: 0 }]), passingScore: 70, maxAttempts: 3 },
                    });

                    // Quiz attempts for 2 students
                    for (let si = 0; si < 2; si++) {
                        await prisma.quizAttempt.create({
                            data: { schoolId, quizId: quiz.id, studentId: studentIds[si + ci * 2], answers: JSON.stringify([0, 1]), score: faker.number.float({ min: 50, max: 100, fractionDigits: 1 }), isPassed: true, submittedAt: faker.date.recent({ days: 14 }), timeSpent: faker.number.int({ min: 120, max: 600 }) },
                        });
                    }
                }
            }
        }

        // Enrollments for 5 students per course
        for (let e = 0; e < 5; e++) {
            const enrollment = await prisma.courseEnrollment.create({
                data: { schoolId, courseId: c.id, studentId: studentIds[ci * 5 + e], progress: faker.number.float({ min: 10, max: 100, fractionDigits: 1 }), status: 'ACTIVE', lastAccessedAt: faker.date.recent({ days: 7 }) },
            });

            // Lesson progress
            for (let lp = 0; lp < 2; lp++) {
                await prisma.lessonProgress.create({
                    data: { schoolId, enrollmentId: enrollment.id, lessonId: courseLessonIds[ci * 6 + lp], status: faker.helpers.arrayElement(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const), progress: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }), timeSpent: faker.number.int({ min: 0, max: 1800 }) },
                });
            }
        }

        // Discussions for each course
        for (let d = 0; d < 2; d++) {
            const disc = await prisma.courseDiscussion.create({
                data: { schoolId, courseId: c.id, studentId: studentIds[ci * 3 + d], title: faker.lorem.sentence(), content: faker.lorem.paragraph(), viewCount: faker.number.int({ min: 5, max: 50 }) },
            });
            await prisma.discussionReply.create({
                data: { schoolId, discussionId: disc.id, userId: teacherIds[ci], userType: 'TEACHER', content: faker.lorem.paragraph(), isAnswer: true },
            });
        }
    }

    return { courseIds, courseModuleIds, courseLessonIds };
}
