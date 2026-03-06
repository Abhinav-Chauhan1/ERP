import { prisma, faker, log } from './helpers';

export async function seedQuestionBank(schoolId: string, subjectIds: string[], teacherIds: string[], classIds: string[], studentIds: string[]) {
    log('❓', 'Creating question bank and online exams...');
    const questionBankIds: string[] = [];
    const topics = ['Algebra', 'Mechanics', 'Organic Chemistry', 'Genetics', 'Grammar'];

    for (let si = 0; si < 5; si++) {
        for (let q = 0; q < 5; q++) {
            const qb = await prisma.questionBank.create({
                data: { schoolId, question: faker.lorem.sentence() + '?', questionType: faker.helpers.arrayElement(['MCQ', 'TRUE_FALSE', 'ESSAY'] as const), options: JSON.stringify({ a: faker.lorem.words(3), b: faker.lorem.words(3), c: faker.lorem.words(3), d: faker.lorem.words(3) }), correctAnswer: faker.helpers.arrayElement(['a', 'b', 'c', 'd']), marks: faker.helpers.arrayElement([1, 2, 3, 5]), subjectId: subjectIds[si], topic: topics[si], difficulty: faker.helpers.arrayElement(['EASY', 'MEDIUM', 'HARD'] as const), createdBy: teacherIds[si] },
            });
            questionBankIds.push(qb.id);
        }
    }

    const onlineExamIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const oe = await prisma.onlineExam.create({
            data: { schoolId, title: `Online ${topics[i]} Test`, subjectId: subjectIds[i], classId: classIds[0], duration: 60, totalMarks: 50, questions: JSON.stringify(questionBankIds.slice(i * 5, (i + 1) * 5).map((id, idx) => ({ id, marks: 10, order: idx + 1 }))), startTime: faker.date.soon({ days: 7 }), endTime: faker.date.soon({ days: 8 }), instructions: 'Attempt all questions', createdBy: teacherIds[i] },
        });
        onlineExamIds.push(oe.id);

        for (let s = 0; s < 5; s++) {
            await prisma.examAttempt.create({
                data: { schoolId, examId: oe.id, studentId: studentIds[i * 5 + s], answers: JSON.stringify([0, 1, 2, 0, 1]), score: faker.number.float({ min: 20, max: 50, fractionDigits: 1 }), startedAt: faker.date.recent({ days: 3 }), submittedAt: faker.date.recent({ days: 2 }), status: 'SUBMITTED' },
            });
        }
    }

    return { questionBankIds, onlineExamIds };
}

export async function seedCommunication(schoolId: string, adminUserId: string, adminId: string, teacherUserIds: string[], studentUserIds: string[], parentUserIds: string[]) {
    log('💬', 'Creating communication data...');
    // Messages
    for (let i = 0; i < 10; i++) {
        await prisma.message.create({
            data: { schoolId, senderId: teacherUserIds[i % teacherUserIds.length], recipientId: parentUserIds[i % parentUserIds.length], subject: faker.helpers.arrayElement(['Homework Update', 'Performance Report', 'Meeting Reminder', 'Fee Reminder']), content: faker.lorem.paragraph(), isRead: faker.datatype.boolean({ probability: 0.7 }) },
        });
    }

    // Announcements
    for (let i = 0; i < 5; i++) {
        await prisma.announcement.create({
            data: { schoolId, title: faker.helpers.arrayElement(['Annual Day Celebration', 'Winter Break Notice', 'PTM Schedule', 'Sports Day Registration', 'Science Exhibition']), content: faker.lorem.paragraph(), publisherId: adminId, targetAudience: ['TEACHER', 'STUDENT', 'PARENT'], isActive: true },
        });
    }

    // Notifications
    const notifTypes = ['ACADEMIC', 'FEE', 'ATTENDANCE', 'EXAM', 'GENERAL'];
    for (let i = 0; i < 15; i++) {
        await prisma.notification.create({
            data: { schoolId, userId: faker.helpers.arrayElement([...studentUserIds, ...parentUserIds, ...teacherUserIds]), title: faker.lorem.words(4), message: faker.lorem.sentence(), type: notifTypes[i % 5], isRead: faker.datatype.boolean({ probability: 0.5 }), link: faker.datatype.boolean({ probability: 0.3 }) ? '/dashboard' : undefined },
        });
    }

    // MessageTemplate (10 templates)
    const templateTypes: Array<'SMS' | 'EMAIL' | 'WHATSAPP'> = ['SMS', 'EMAIL', 'WHATSAPP'];
    const templateCategories = ['fee_reminder', 'attendance_alert', 'exam_notification', 'general_update', 'admission_update'];
    for (let i = 0; i < 10; i++) {
        await prisma.messageTemplate.create({
            data: { schoolId, name: `Template ${i + 1} - ${templateCategories[i % 5]}`, type: templateTypes[i % 3], category: templateCategories[i % 5], subject: `${templateCategories[i % 5].replace(/_/g, ' ')} notification`, body: `Dear {{name}}, ${faker.lorem.sentence()} Regards, DPS Vasant Kunj`, variables: JSON.stringify(['name', 'date', 'amount']), isActive: true, createdBy: adminUserId },
        });
    }

    // MessageHistory
    for (let i = 0; i < 5; i++) {
        await prisma.messageHistory.create({
            data: { schoolId, messageType: templateTypes[i % 3], subject: faker.lorem.words(4), body: faker.lorem.paragraph(), recipientCount: faker.number.int({ min: 10, max: 100 }), sentCount: faker.number.int({ min: 8, max: 95 }), failedCount: faker.number.int({ min: 0, max: 5 }), status: 'SENT', recipientSelection: JSON.stringify({ roles: ['PARENT'], classes: ['Class 9'] }), sentBy: adminUserId, sentAt: faker.date.recent({ days: 30 }) },
        });
    }

    // MessageLog
    for (let i = 0; i < 8; i++) {
        await prisma.messageLog.create({
            data: { schoolId, channel: faker.helpers.arrayElement(['EMAIL', 'SMS', 'IN_APP'] as const), recipient: faker.internet.email(), userId: parentUserIds[i % parentUserIds.length], status: faker.helpers.arrayElement(['SENT', 'DELIVERED', 'READ', 'FAILED'] as const), sentAt: faker.date.recent({ days: 14 }) },
        });
    }

    // CommunicationErrorLog
    for (let i = 0; i < 3; i++) {
        await prisma.communicationErrorLog.create({
            data: { schoolId, message: faker.lorem.sentence(), category: faker.helpers.arrayElement(['NETWORK', 'RATE_LIMIT', 'VALIDATION'] as const), severity: faker.helpers.arrayElement(['LOW', 'MEDIUM'] as const), channel: 'SMS', errorCode: `ERR_${faker.string.numeric(3)}`, resolved: faker.datatype.boolean() },
        });
    }
}
