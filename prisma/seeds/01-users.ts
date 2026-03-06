import { prisma, faker, log, SeedContext } from './helpers';
import bcrypt from 'bcryptjs';

const indianFirstNames = { male: ['Aarav', 'Vihaan', 'Arjun', 'Rohan', 'Karan', 'Dev', 'Rishi', 'Aditya', 'Sai', 'Krishna', 'Rahul', 'Ankit', 'Prateek', 'Nikhil', 'Vivek', 'Amit', 'Raj', 'Sameer', 'Akash', 'Mohit'], female: ['Ananya', 'Priya', 'Ishita', 'Kavya', 'Meera', 'Diya', 'Saanvi', 'Aisha', 'Riya', 'Sneha', 'Pooja', 'Neha', 'Shruti', 'Tanvi', 'Divya', 'Anjali', 'Ritika', 'Sakshi', 'Simran', 'Nisha'] };
const indianLastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Reddy', 'Joshi', 'Mehta', 'Agarwal', 'Chauhan', 'Mishra', 'Pandey', 'Dubey', 'Tiwari', 'Saxena', 'Yadav', 'Choudhary', 'Thakur', 'Bhatia'];

function indianName(gender: 'male' | 'female') {
    const first = faker.helpers.arrayElement(indianFirstNames[gender]);
    const last = faker.helpers.arrayElement(indianLastNames);
    return { first, last, full: `${first} ${last}` };
}

export async function seedUsers(schoolId: string): Promise<Omit<SeedContext, 'schoolId' | 'academicYearId' | 'term1Id' | 'term2Id' | 'departmentIds' | 'classIds' | 'sectionIds' | 'subjectIds' | 'subjectTeacherIds' | 'classRoomIds' | 'examTypeIds' | 'examIds' | 'assignmentIds' | 'feeStructureId' | 'feeTypeIds' | 'syllabusId' | 'syllabusUnitIds' | 'moduleIds' | 'subModuleIds' | 'eventIds' | 'courseIds' | 'courseModuleIds' | 'courseLessonIds' | 'hostelIds' | 'hostelRoomIds' | 'allocationIds' | 'bookIds' | 'routeIds' | 'studentRouteIds' | 'questionBankIds' | 'onlineExamIds' | 'calendarCategoryIds' | 'calendarEventIds' | 'certTemplateIds' | 'timetableId' | 'enrollmentIds'>> {
    log('👥', 'Creating users...');

    // Hash passwords
    const adminPwHash = await bcrypt.hash('Admin@123', 12);
    const teacherPwHash = await bcrypt.hash('Teacher@123', 12);
    const studentPwHash = await bcrypt.hash('Student@123', 12);
    const parentPwHash = await bcrypt.hash('Parent@123', 12);
    const superAdminPwHash = await bcrypt.hash('SuperAdmin@123', 12);

    // Super Admin
    const superAdminUser = await prisma.user.create({
        data: { email: 'superadmin@dpsvk.edu.in', firstName: 'Super', lastName: 'Admin', name: 'Super Admin', phone: '+91-9000000000', role: 'SUPER_ADMIN', active: true, passwordHash: superAdminPwHash, emailVerified: new Date() },
    });
    await prisma.userSchool.create({ data: { userId: superAdminUser.id, schoolId, role: 'SUPER_ADMIN', isActive: true } });

    // Admin
    const adminName = indianName('male');
    const adminUser = await prisma.user.create({
        data: { email: 'admin@dpsvk.edu.in', firstName: adminName.first, lastName: adminName.last, name: adminName.full, phone: '+91-9876543210', role: 'ADMIN', active: true, passwordHash: adminPwHash, emailVerified: new Date() },
    });
    const admin = await prisma.administrator.create({ data: { schoolId, userId: adminUser.id, position: 'Principal' } });
    await prisma.userSchool.create({ data: { userId: adminUser.id, schoolId, role: 'ADMIN', isActive: true } });

    // 10 Teachers
    const teacherUserIds: string[] = [];
    const teacherIds: string[] = [];
    const teacherSubjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Hindi', 'Biology', 'Computer Science', 'History', 'Geography', 'Economics'];
    const qualifications = ['M.Sc. Mathematics', 'Ph.D. Physics', 'M.Sc. Chemistry', 'M.A. English', 'M.A. Hindi', 'M.Sc. Biology', 'M.Tech CS', 'M.A. History', 'M.A. Geography', 'M.A. Economics'];

    for (let i = 0; i < 10; i++) {
        const g = i % 2 === 0 ? 'male' : 'female';
        const n = indianName(g as 'male' | 'female');
        const u = await prisma.user.create({
            data: { email: `teacher${i + 1}@dpsvk.edu.in`, firstName: n.first, lastName: n.last, name: n.full, phone: `+91-98765${String(i).padStart(5, '0')}`, role: 'TEACHER', active: true, passwordHash: teacherPwHash, emailVerified: new Date() },
        });
        teacherUserIds.push(u.id);
        await prisma.userSchool.create({ data: { userId: u.id, schoolId, role: 'TEACHER', isActive: true } });
        const t = await prisma.teacher.create({
            data: { schoolId, userId: u.id, employeeId: `EMP${String(i + 1).padStart(3, '0')}`, qualification: qualifications[i], joinDate: faker.date.between({ from: '2018-04-01', to: '2023-07-01' }), salary: faker.number.int({ min: 35000, max: 85000 }) },
        });
        teacherIds.push(t.id);
        await prisma.teacherSettings.create({
            data: { schoolId, teacherId: t.id, emailNotifications: true, smsNotifications: faker.datatype.boolean(), theme: faker.helpers.arrayElement(['LIGHT', 'DARK', 'SYSTEM']), language: 'en' },
        });
        await prisma.salaryStructure.create({
            data: { schoolId, teacherId: t.id, basic: faker.number.int({ min: 25000, max: 55000 }), hra: faker.number.int({ min: 5000, max: 15000 }), da: faker.number.int({ min: 3000, max: 8000 }), travelAllowance: faker.number.int({ min: 1000, max: 5000 }), providentFund: faker.number.int({ min: 2000, max: 6000 }), professionalTax: 200, tds: faker.number.int({ min: 0, max: 5000 }) },
        });
    }

    // 20 Students
    const studentUserIds: string[] = [];
    const studentIds: string[] = [];
    for (let i = 0; i < 20; i++) {
        const g = i % 2 === 0 ? 'male' : 'female';
        const n = indianName(g as 'male' | 'female');
        const u = await prisma.user.create({
            data: { email: `student${i + 1}@dpsvk.edu.in`, firstName: n.first, lastName: n.last, name: n.full, phone: `+91-87654${String(i).padStart(5, '0')}`, role: 'STUDENT', active: true, passwordHash: studentPwHash, emailVerified: new Date() },
        });
        studentUserIds.push(u.id);
        await prisma.userSchool.create({ data: { userId: u.id, schoolId, role: 'STUDENT', isActive: true } });
        const s = await prisma.student.create({
            data: {
                schoolId, userId: u.id, admissionId: `ADM2024${String(i + 1).padStart(3, '0')}`,
                admissionDate: new Date('2024-04-01'), rollNumber: `${Math.floor(i / 5) + 9}${String.fromCharCode(65 + (i % 2))}${String((i % 5) + 1).padStart(3, '0')}`,
                dateOfBirth: faker.date.between({ from: '2008-01-01', to: '2011-12-31' }),
                gender: g === 'male' ? 'Male' : 'Female',
                address: faker.location.streetAddress() + ', New Delhi',
                bloodGroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-']),
                emergencyContact: `+91-98765${String(i + 30).padStart(5, '0')}`,
                nationality: 'Indian', religion: faker.helpers.arrayElement(['Hindu', 'Muslim', 'Sikh', 'Christian']),
            },
        });
        studentIds.push(s.id);
        await prisma.studentSettings.create({
            data: { schoolId, studentId: s.id, emailNotifications: true, assignmentReminders: true, examReminders: true, attendanceAlerts: true, profileVisibility: 'PRIVATE', theme: faker.helpers.arrayElement(['LIGHT', 'DARK']), language: 'en' },
        });
    }

    // 10 Parents
    const parentUserIds: string[] = [];
    const parentIds: string[] = [];
    for (let i = 0; i < 10; i++) {
        const g = i % 2 === 0 ? 'male' : 'female';
        const n = indianName(g as 'male' | 'female');
        const u = await prisma.user.create({
            data: { email: `parent${i + 1}@gmail.com`, firstName: n.first, lastName: n.last, name: n.full, phone: `+91-76543${String(i).padStart(5, '0')}`, role: 'PARENT', active: true, passwordHash: parentPwHash, emailVerified: new Date() },
        });
        parentUserIds.push(u.id);
        await prisma.userSchool.create({ data: { userId: u.id, schoolId, role: 'PARENT', isActive: true } });
        const p = await prisma.parent.create({
            data: { schoolId, userId: u.id, occupation: faker.helpers.arrayElement(['Engineer', 'Doctor', 'Business Owner', 'Teacher', 'Government Officer', 'Lawyer', 'CA', 'IT Professional']), relation: g === 'male' ? 'Father' : 'Mother' },
        });
        parentIds.push(p.id);
        await prisma.parentSettings.create({
            data: { schoolId, parentId: p.id, emailNotifications: true, smsNotifications: true, pushNotifications: true, feeReminders: true, attendanceAlerts: true, examResultNotifications: true, preferredContactMethod: 'EMAIL', notificationFrequency: 'IMMEDIATE', theme: 'LIGHT', language: 'en' },
        });
    }

    // Student-Parent relationships (each parent has 2 students)
    for (let i = 0; i < 10; i++) {
        await prisma.studentParent.create({ data: { schoolId, studentId: studentIds[i * 2], parentId: parentIds[i], isPrimary: true } });
        await prisma.studentParent.create({ data: { schoolId, studentId: studentIds[i * 2 + 1], parentId: parentIds[i], isPrimary: true } });
    }

    return { adminUserId: adminUser.id, adminId: admin.id, superAdminUserId: superAdminUser.id, teacherUserIds, teacherIds, studentUserIds, studentIds, parentUserIds, parentIds };
}
