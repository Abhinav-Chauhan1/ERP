import { prisma, faker, log, SeedContext } from './helpers';

export async function seedSchool(): Promise<Pick<SeedContext, 'schoolId'>> {
    log('🏫', 'Creating school...');
    const school = await prisma.school.create({
        data: {
            name: 'Delhi Public School, Vasant Kunj',
            schoolCode: 'DPSVK2024',
            plan: 'DOMINATE',
            status: 'ACTIVE',
            isOnboarded: true,
            phone: '+91-11-26134567',
            email: 'info@dpsvk.edu.in',
            domain: 'dpsvk.edu.in',
            address: '12, Sector B, Vasant Kunj, New Delhi - 110070',
        },
    });

    await prisma.schoolSettings.create({
        data: {
            schoolId: school.id,
            onboardingCompleted: true,
            onboardingStep: 5,
            schoolName: school.name,
            schoolAddress: '12, Sector B, Vasant Kunj, New Delhi - 110070',
            schoolPhone: '+91-11-26134567',
            schoolEmail: 'info@dpsvk.edu.in',
            board: 'CBSE',
            timezone: 'Asia/Kolkata',
            currentAcademicYear: '2024-2025',
            currentTerm: 'Term 1',
            defaultGradingScale: 'GRADE_POINT',
            passingGrade: 33,
            attendanceThreshold: 75,
            emailEnabled: true,
            smsEnabled: true,
            whatsappEnabled: false,
            language: 'en',
            dateFormat: 'dmy',
            primaryColor: '#1e40af',
            defaultTheme: 'LIGHT',
            defaultColorTheme: 'blue',
        },
    });

    await prisma.schoolPermissions.create({
        data: {
            schoolId: school.id,
            manageStudents: true,
            manageTeachers: true,
            manageParents: true,
            manageAdmins: true,
            manageClasses: true,
            manageSubjects: true,
            manageSyllabus: true,
            manageExams: true,
            manageAssignments: true,
            manageAttendance: true,
            generateReportCards: true,
            messagingSystem: true,
            notificationSystem: true,
            announcementSystem: true,
            feeManagement: true,
            paymentProcessing: true,
            financialReports: true,
            libraryManagement: true,
            transportManagement: true,
            hostelManagement: true,
            alumniManagement: true,
            certificateGeneration: true,
            backupRestore: true,
            dataExport: true,
            auditLogs: true,
        },
    });



    return { schoolId: school.id };
}
