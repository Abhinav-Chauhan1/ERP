import { prisma, faker, log } from './helpers';

export async function seedAdmissions(schoolId: string, classIds: string[]) {
    log('🎓', 'Creating admissions data...');
    const applicationIds: string[] = [];
    for (let i = 0; i < 10; i++) {
        const gender = i % 2 === 0 ? 'Male' : 'Female';
        const app = await prisma.admissionApplication.create({
            data: { schoolId, applicationNumber: `APP-2024-${String(i + 1).padStart(4, '0')}`, studentName: faker.person.fullName(), dateOfBirth: faker.date.between({ from: '2008-01-01', to: '2012-12-31' }), gender, parentName: faker.person.fullName(), parentEmail: faker.internet.email(), parentPhone: `+91-${faker.string.numeric(10)}`, address: faker.location.streetAddress() + ', New Delhi', previousSchool: faker.helpers.arrayElement(['Kendriya Vidyalaya', 'DAV School', 'Ryan International', undefined]), appliedClassId: classIds[i % 4], nationality: 'Indian', motherTongue: faker.helpers.arrayElement(['Hindi', 'English', 'Punjabi', 'Bengali']), bloodGroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+']), fatherName: faker.person.fullName(), fatherOccupation: faker.helpers.arrayElement(['Engineer', 'Doctor', 'Business', 'Government']), fatherPhone: `+91-${faker.string.numeric(10)}`, motherName: faker.person.fullName(), motherOccupation: faker.helpers.arrayElement(['Teacher', 'Homemaker', 'Doctor', 'IT Professional']), status: faker.helpers.arrayElement(['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED'] as const) },
        });
        applicationIds.push(app.id);
        await prisma.applicationDocument.create({
            data: { schoolId, applicationId: app.id, type: 'BIRTH_CERTIFICATE', url: `/uploads/app_${i}_birth_cert.pdf`, filename: `birth_certificate_${i}.pdf` },
        });
    }

    // Merit List
    const mlConfig = await prisma.meritListConfig.create({
        data: { schoolId, name: 'Class 9 Merit', appliedClassId: classIds[0], criteria: JSON.stringify({ academic: 60, entrance_test: 30, extracurricular: 10 }), isActive: true },
    });
    const ml = await prisma.meritList.create({
        data: { schoolId, configId: mlConfig.id, appliedClassId: classIds[0], totalApplications: 10, generatedBy: 'System' },
    });
    for (let i = 0; i < 5; i++) {
        await prisma.meritListEntry.create({
            data: { schoolId, meritListId: ml.id, applicationId: applicationIds[i], rank: i + 1, score: faker.number.float({ min: 60, max: 98, fractionDigits: 1 }) },
        });
    }
}

export async function seedAlumni(schoolId: string, studentIds: string[], enrollmentIds: string[], adminUserId: string) {
    log('🎓', 'Creating alumni data...');
    // Create alumni for last 3 students
    for (let i = 17; i < 20; i++) {
        await prisma.alumni.create({
            data: { schoolId, studentId: studentIds[i], graduationDate: new Date('2024-03-31'), finalClass: 'Class 12', finalSection: 'Section A', finalAcademicYear: '2023-2024', currentOccupation: faker.helpers.arrayElement(['Software Engineer', 'Medical Student', 'CA Intern', undefined]), currentEmployer: faker.helpers.arrayElement(['TCS', 'AIIMS', undefined]), currentCity: faker.helpers.arrayElement(['Delhi', 'Mumbai', 'Bangalore']), currentCountry: 'India', currentEmail: faker.internet.email(), higherEducation: faker.helpers.arrayElement(['B.Tech', 'MBBS', 'B.Com', 'B.Sc']), collegeName: faker.helpers.arrayElement(['IIT Delhi', 'AIIMS', 'SRCC', 'St. Stephens']), allowCommunication: true, createdBy: adminUserId },
        });
    }

    // Promotion history
    const ph = await prisma.promotionHistory.create({
        data: { schoolId, sourceAcademicYear: '2023-2024', sourceClass: 'Class 9', targetAcademicYear: '2024-2025', targetClass: 'Class 10', totalStudents: 5, promotedStudents: 4, excludedStudents: 0, failedStudents: 1, executedBy: adminUserId, notes: 'Annual promotion cycle' },
    });
    for (let i = 0; i < 5; i++) {
        await prisma.promotionRecord.create({
            data: { schoolId, historyId: ph.id, studentId: studentIds[i], previousEnrollmentId: enrollmentIds[i], newEnrollmentId: i < 4 ? enrollmentIds[i] : undefined, status: i < 4 ? 'PROMOTED' : 'FAILED', reason: i >= 4 ? 'Failed minimum passing criteria' : undefined },
        });
    }
}
