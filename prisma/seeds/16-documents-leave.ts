import { prisma, faker, log } from './helpers';

export async function seedDocumentsAndCerts(schoolId: string, adminUserId: string, teacherUserIds: string[], studentUserIds: string[], studentIds: string[]) {
    log('📄', 'Creating documents and certificates...');
    // Document Types
    const dtNames = ['Marksheet', 'Transfer Certificate', 'Character Certificate', 'ID Card', 'Medical Certificate', 'Attendance Report'];
    const dtIds: string[] = [];
    for (const name of dtNames) {
        const dt = await prisma.documentType.create({ data: { schoolId, name, description: `${name} document type` } });
        dtIds.push(dt.id);
    }

    // Documents
    for (let i = 0; i < 10; i++) {
        await prisma.document.create({
            data: { schoolId, title: `${dtNames[i % 6]} - Student ${i + 1}`, description: faker.lorem.sentence(), fileName: `doc_${i + 1}.pdf`, fileUrl: `/documents/doc_${i + 1}.pdf`, fileType: 'application/pdf', fileSize: faker.number.int({ min: 50000, max: 500000 }), userId: studentUserIds[i % studentUserIds.length], documentTypeId: dtIds[i % 6], category: faker.helpers.arrayElement(['CERTIFICATE', 'ID_PROOF', 'OTHER'] as const), isPublic: false },
        });
    }

    // Certificate Templates
    const certTemplateIds: string[] = [];
    const certTypes: Array<'ACHIEVEMENT' | 'COMPLETION' | 'MERIT' | 'BONAFIDE' | 'TRANSFER' | 'CHARACTER'> = ['ACHIEVEMENT', 'COMPLETION', 'MERIT', 'BONAFIDE', 'TRANSFER', 'CHARACTER'];
    for (let i = 0; i < certTypes.length; i++) {
        const ct = await prisma.certificateTemplate.create({
            data: { schoolId, name: `${certTypes[i]} Certificate`, description: `Default ${certTypes[i].toLowerCase()} certificate template`, type: certTypes[i], layout: JSON.stringify({ margins: { top: 50, bottom: 50, left: 40, right: 40 } }), styling: JSON.stringify({ fontFamily: 'serif', titleSize: 32, bodySize: 14 }), content: `This is to certify that {{studentName}} of Class {{class}} has been awarded this certificate...`, mergeFields: JSON.stringify(['studentName', 'class', 'date', 'achievement']), pageSize: 'A4', orientation: 'LANDSCAPE', isActive: true, isDefault: i === 0, createdBy: adminUserId },
        });
        certTemplateIds.push(ct.id);
    }

    // Generated Certificates
    for (let i = 0; i < 8; i++) {
        await prisma.generatedCertificate.create({
            data: { schoolId, certificateNumber: `CERT-2024-${String(i + 1).padStart(4, '0')}`, templateId: certTemplateIds[i % certTemplateIds.length], studentId: studentIds[i], studentName: `Student ${i + 1}`, data: JSON.stringify({ achievement: faker.lorem.words(3), class: `Class ${9 + Math.floor(i / 5)}` }), verificationCode: `VER-${faker.string.alphanumeric(8).toUpperCase()}`, isVerified: true, status: 'ACTIVE', issuedBy: adminUserId },
        });
    }

    return { certTemplateIds };
}

export async function seedLeaveAndMeetings(schoolId: string, teacherUserIds: string[], teacherIds: string[], parentIds: string[]) {
    log('🏖️', 'Creating leave applications and meetings...');
    for (let i = 0; i < 8; i++) {
        await prisma.leaveApplication.create({
            data: { schoolId, applicantId: i < 4 ? teacherUserIds[i] : teacherUserIds[i - 4], applicantType: 'TEACHER', fromDate: faker.date.soon({ days: 10 }), toDate: faker.date.soon({ days: 13 }), reason: faker.helpers.arrayElement(['Medical leave', 'Family emergency', 'Personal work', 'Training/Workshop']), status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED', 'APPROVED'] as const) },
        });
    }

    for (let i = 0; i < 5; i++) {
        await prisma.parentMeeting.create({
            data: { schoolId, title: `Meeting with Parent ${i + 1}`, description: faker.lorem.sentence(), parentId: parentIds[i], teacherId: teacherIds[i], scheduledDate: faker.date.soon({ days: 14 }), duration: 30, status: faker.helpers.arrayElement(['SCHEDULED', 'COMPLETED', 'SCHEDULED'] as const), location: 'Conference Room', notes: faker.lorem.sentence() },
        });
    }
}
