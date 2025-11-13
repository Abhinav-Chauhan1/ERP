import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.document.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.parentMeeting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.message.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.scholarshipRecipient.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.feeStructureItem.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.feeType.deleteMany();
  await prisma.leaveApplication.deleteMany();
  await prisma.teacherAttendance.deleteMany();
  await prisma.studentAttendance.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignmentClass.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.gradeScale.deleteMany();
  await prisma.examType.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.timetablePeriod.deleteMany();
  await prisma.timetableConfig.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.syllabusUnit.deleteMany();
  await prisma.syllabus.deleteMany();
  await prisma.subjectClass.deleteMany();
  await prisma.subjectTeacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classEnrollment.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.classRoom.deleteMany();
  await prisma.classSection.deleteMany();
  await prisma.class.deleteMany();
  await prisma.department.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.parentSettings.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.studentSettings.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.administrator.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  // 1. Create System Settings
  console.log('⚙️  Creating system settings...');
  const systemSettings = await prisma.systemSettings.create({
    data: {
      schoolName: 'Springfield High School',
      schoolEmail: 'info@springfieldhigh.edu',
      schoolPhone: '+1-555-0100',
      schoolAddress: '123 Education Lane, Springfield, ST 12345',
      schoolWebsite: 'https://springfieldhigh.edu',
      timezone: 'America/New_York',
      gradingSystem: 'percentage',
      passingGrade: 50,
      emailNotifications: true,
      theme: 'light',
      primaryColor: '#3b82f6',
      language: 'en',
    },
  });

  // 2. Create Academic Year and Terms
  console.log('📅 Creating academic years and terms...');
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true,
    },
  });

  const term1 = await prisma.term.create({
    data: {
      name: 'Fall Semester',
      academicYearId: academicYear.id,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-20'),
    },
  });

  const term2 = await prisma.term.create({
    data: {
      name: 'Spring Semester',
      academicYearId: academicYear.id,
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-06-30'),
    },
  });

  // 3. Create Departments
  console.log('🏢 Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({ data: { name: 'Mathematics', description: 'Math and Statistics' } }),
    prisma.department.create({ data: { name: 'Science', description: 'Physics, Chemistry, Biology' } }),
    prisma.department.create({ data: { name: 'Languages', description: 'English, Spanish, French' } }),
    prisma.department.create({ data: { name: 'Social Studies', description: 'History, Geography, Civics' } }),
    prisma.department.create({ data: { name: 'Arts', description: 'Music, Drama, Visual Arts' } }),
  ]);

  // 4. Create Users (Admin, Teachers, Students, Parents)
  console.log('👥 Creating users...');
  
  // Admin Users
  const adminUser = await prisma.user.create({
    data: {
      clerkId: 'clerk_admin_001',
      email: 'admin@springfieldhigh.edu',
      firstName: 'John',
      lastName: 'Administrator',
      phone: '+1-555-0101',
      role: 'ADMIN',
      active: true,
    },
  });

  const admin = await prisma.administrator.create({
    data: {
      userId: adminUser.id,
      position: 'Principal',
      department: 'Administration',
    },
  });

  // Teacher Users
  const teacherUsers = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'clerk_teacher_001',
        email: 'sarah.johnson@springfieldhigh.edu',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1-555-0201',
        role: 'TEACHER',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_teacher_002',
        email: 'michael.chen@springfieldhigh.edu',
        firstName: 'Michael',
        lastName: 'Chen',
        phone: '+1-555-0202',
        role: 'TEACHER',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_teacher_003',
        email: 'emily.rodriguez@springfieldhigh.edu',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        phone: '+1-555-0203',
        role: 'TEACHER',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_teacher_004',
        email: 'david.williams@springfieldhigh.edu',
        firstName: 'David',
        lastName: 'Williams',
        phone: '+1-555-0204',
        role: 'TEACHER',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_teacher_005',
        email: 'lisa.anderson@springfieldhigh.edu',
        firstName: 'Lisa',
        lastName: 'Anderson',
        phone: '+1-555-0205',
        role: 'TEACHER',
      },
    }),
  ]);

  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        userId: teacherUsers[0].id,
        employeeId: 'EMP001',
        qualification: 'M.Sc. Mathematics',
        joinDate: new Date('2020-08-15'),
        salary: 55000,
      },
    }),
    prisma.teacher.create({
      data: {
        userId: teacherUsers[1].id,
        employeeId: 'EMP002',
        qualification: 'Ph.D. Physics',
        joinDate: new Date('2019-07-01'),
        salary: 62000,
      },
    }),
    prisma.teacher.create({
      data: {
        userId: teacherUsers[2].id,
        employeeId: 'EMP003',
        qualification: 'M.A. English Literature',
        joinDate: new Date('2021-09-01'),
        salary: 52000,
      },
    }),
    prisma.teacher.create({
      data: {
        userId: teacherUsers[3].id,
        employeeId: 'EMP004',
        qualification: 'M.Sc. Chemistry',
        joinDate: new Date('2018-08-20'),
        salary: 58000,
      },
    }),
    prisma.teacher.create({
      data: {
        userId: teacherUsers[4].id,
        employeeId: 'EMP005',
        qualification: 'M.A. History',
        joinDate: new Date('2022-01-10'),
        salary: 50000,
      },
    }),
  ]);

  // Parent Users
  const parentUsers = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'clerk_parent_001',
        email: 'robert.smith@email.com',
        firstName: 'Robert',
        lastName: 'Smith',
        phone: '+1-555-0301',
        role: 'PARENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_parent_002',
        email: 'jennifer.smith@email.com',
        firstName: 'Jennifer',
        lastName: 'Smith',
        phone: '+1-555-0302',
        role: 'PARENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_parent_003',
        email: 'james.brown@email.com',
        firstName: 'James',
        lastName: 'Brown',
        phone: '+1-555-0303',
        role: 'PARENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_parent_004',
        email: 'maria.garcia@email.com',
        firstName: 'Maria',
        lastName: 'Garcia',
        phone: '+1-555-0304',
        role: 'PARENT',
      },
    }),
  ]);

  const parents = await Promise.all([
    prisma.parent.create({
      data: {
        userId: parentUsers[0].id,
        occupation: 'Software Engineer',
        relation: 'Father',
      },
    }),
    prisma.parent.create({
      data: {
        userId: parentUsers[1].id,
        occupation: 'Teacher',
        relation: 'Mother',
      },
    }),
    prisma.parent.create({
      data: {
        userId: parentUsers[2].id,
        occupation: 'Business Owner',
        relation: 'Father',
      },
    }),
    prisma.parent.create({
      data: {
        userId: parentUsers[3].id,
        occupation: 'Nurse',
        relation: 'Mother',
      },
    }),
  ]);

  // Student Users
  const studentUsers = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'clerk_student_001',
        email: 'alex.smith@student.springfieldhigh.edu',
        firstName: 'Alex',
        lastName: 'Smith',
        phone: '+1-555-0401',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_student_002',
        email: 'emma.smith@student.springfieldhigh.edu',
        firstName: 'Emma',
        lastName: 'Smith',
        phone: '+1-555-0402',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_student_003',
        email: 'noah.brown@student.springfieldhigh.edu',
        firstName: 'Noah',
        lastName: 'Brown',
        phone: '+1-555-0403',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_student_004',
        email: 'sophia.garcia@student.springfieldhigh.edu',
        firstName: 'Sophia',
        lastName: 'Garcia',
        phone: '+1-555-0404',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_student_005',
        email: 'liam.johnson@student.springfieldhigh.edu',
        firstName: 'Liam',
        lastName: 'Johnson',
        phone: '+1-555-0405',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'clerk_student_006',
        email: 'olivia.martinez@student.springfieldhigh.edu',
        firstName: 'Olivia',
        lastName: 'Martinez',
        phone: '+1-555-0406',
        role: 'STUDENT',
      },
    }),
  ]);

  const students = await Promise.all([
    prisma.student.create({
      data: {
        userId: studentUsers[0].id,
        admissionId: 'ADM2024001',
        admissionDate: new Date('2024-08-15'),
        rollNumber: '10A001',
        dateOfBirth: new Date('2009-03-15'),
        gender: 'Male',
        address: '456 Oak Street, Springfield',
        bloodGroup: 'O+',
        emergencyContact: '+1-555-0301',
      },
    }),
    prisma.student.create({
      data: {
        userId: studentUsers[1].id,
        admissionId: 'ADM2024002',
        admissionDate: new Date('2024-08-15'),
        rollNumber: '10A002',
        dateOfBirth: new Date('2009-05-20'),
        gender: 'Female',
        address: '456 Oak Street, Springfield',
        bloodGroup: 'A+',
        emergencyContact: '+1-555-0302',
      },
    }),
    prisma.student.create({
      data: {
        userId: studentUsers[2].id,
        admissionId: 'ADM2024003',
        admissionDate: new Date('2024-08-15'),
        rollNumber: '10B001',
        dateOfBirth: new Date('2009-07-10'),
        gender: 'Male',
        address: '789 Pine Avenue, Springfield',
        bloodGroup: 'B+',
        emergencyContact: '+1-555-0303',
      },
    }),
    prisma.student.create({
      data: {
        userId: studentUsers[3].id,
        admissionId: 'ADM2024004',
        admissionDate: new Date('2024-08-15'),
        rollNumber: '10B002',
        dateOfBirth: new Date('2009-09-25'),
        gender: 'Female',
        address: '321 Maple Drive, Springfield',
        bloodGroup: 'AB+',
        emergencyContact: '+1-555-0304',
      },
    }),
    prisma.student.create({
      data: {
        userId: studentUsers[4].id,
        admissionId: 'ADM2023005',
        admissionDate: new Date('2023-08-20'),
        rollNumber: '11A001',
        dateOfBirth: new Date('2008-11-12'),
        gender: 'Male',
        address: '654 Elm Street, Springfield',
        bloodGroup: 'O-',
        emergencyContact: '+1-555-0305',
      },
    }),
    prisma.student.create({
      data: {
        userId: studentUsers[5].id,
        admissionId: 'ADM2023006',
        admissionDate: new Date('2023-08-20'),
        rollNumber: '11A002',
        dateOfBirth: new Date('2008-12-30'),
        gender: 'Female',
        address: '987 Cedar Lane, Springfield',
        bloodGroup: 'A-',
        emergencyContact: '+1-555-0306',
      },
    }),
  ]);

  // Create Student-Parent relationships
  console.log('👨‍👩‍👧‍👦 Creating student-parent relationships...');
  await Promise.all([
    prisma.studentParent.create({
      data: { studentId: students[0].id, parentId: parents[0].id, isPrimary: true },
    }),
    prisma.studentParent.create({
      data: { studentId: students[0].id, parentId: parents[1].id, isPrimary: false },
    }),
    prisma.studentParent.create({
      data: { studentId: students[1].id, parentId: parents[0].id, isPrimary: false },
    }),
    prisma.studentParent.create({
      data: { studentId: students[1].id, parentId: parents[1].id, isPrimary: true },
    }),
    prisma.studentParent.create({
      data: { studentId: students[2].id, parentId: parents[2].id, isPrimary: true },
    }),
    prisma.studentParent.create({
      data: { studentId: students[3].id, parentId: parents[3].id, isPrimary: true },
    }),
  ]);

  // 5. Create Classes and Sections
  console.log('🏫 Creating classes and sections...');
  const class10 = await prisma.class.create({
    data: {
      name: 'Grade 10',
      academicYearId: academicYear.id,
    },
  });

  const class11 = await prisma.class.create({
    data: {
      name: 'Grade 11',
      academicYearId: academicYear.id,
    },
  });

  const section10A = await prisma.classSection.create({
    data: {
      name: 'Section A',
      classId: class10.id,
      capacity: 30,
    },
  });

  const section10B = await prisma.classSection.create({
    data: {
      name: 'Section B',
      classId: class10.id,
      capacity: 30,
    },
  });

  const section11A = await prisma.classSection.create({
    data: {
      name: 'Section A',
      classId: class11.id,
      capacity: 30,
    },
  });

  // 6. Create Subjects
  console.log('📚 Creating subjects...');
  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Algebra, Geometry, Trigonometry',
        departmentId: departments[0].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: 'Physics',
        code: 'PHY101',
        description: 'Mechanics, Thermodynamics, Optics',
        departmentId: departments[1].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: 'Chemistry',
        code: 'CHEM101',
        description: 'Organic, Inorganic, Physical Chemistry',
        departmentId: departments[1].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: 'English',
        code: 'ENG101',
        description: 'Literature, Grammar, Composition',
        departmentId: departments[2].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: 'History',
        code: 'HIST101',
        description: 'World History, American History',
        departmentId: departments[3].id,
      },
    }),
  ]);

  // 7. Assign Teachers to Subjects
  console.log('👨‍🏫 Assigning teachers to subjects...');
  const subjectTeachers = await Promise.all([
    prisma.subjectTeacher.create({
      data: { subjectId: subjects[0].id, teacherId: teachers[0].id },
    }),
    prisma.subjectTeacher.create({
      data: { subjectId: subjects[1].id, teacherId: teachers[1].id },
    }),
    prisma.subjectTeacher.create({
      data: { subjectId: subjects[2].id, teacherId: teachers[3].id },
    }),
    prisma.subjectTeacher.create({
      data: { subjectId: subjects[3].id, teacherId: teachers[2].id },
    }),
    prisma.subjectTeacher.create({
      data: { subjectId: subjects[4].id, teacherId: teachers[4].id },
    }),
  ]);

  // 8. Assign Subjects to Classes
  console.log('📖 Assigning subjects to classes...');
  await Promise.all([
    prisma.subjectClass.create({
      data: { subjectId: subjects[0].id, classId: class10.id },
    }),
    prisma.subjectClass.create({
      data: { subjectId: subjects[1].id, classId: class10.id },
    }),
    prisma.subjectClass.create({
      data: { subjectId: subjects[2].id, classId: class10.id },
    }),
    prisma.subjectClass.create({
      data: { subjectId: subjects[3].id, classId: class10.id },
    }),
    prisma.subjectClass.create({
      data: { subjectId: subjects[4].id, classId: class10.id },
    }),
    prisma.subjectClass.create({
      data: { subjectId: subjects[0].id, classId: class11.id },
    }),
    prisma.subjectClass.create({
      data: { subjectId: subjects[1].id, classId: class11.id },
    }),
  ]);

  // 9. Assign Teachers to Classes
  console.log('🎓 Assigning teachers to classes...');
  await Promise.all([
    prisma.classTeacher.create({
      data: { classId: class10.id, teacherId: teachers[0].id, isClassHead: true },
    }),
    prisma.classTeacher.create({
      data: { classId: class11.id, teacherId: teachers[1].id, isClassHead: true },
    }),
  ]);

  // 10. Enroll Students in Classes
  console.log('📝 Enrolling students in classes...');
  await Promise.all([
    prisma.classEnrollment.create({
      data: {
        studentId: students[0].id,
        classId: class10.id,
        sectionId: section10A.id,
        rollNumber: '10A001',
        status: 'ACTIVE',
        enrollDate: new Date('2024-09-01'),
      },
    }),
    prisma.classEnrollment.create({
      data: {
        studentId: students[1].id,
        classId: class10.id,
        sectionId: section10A.id,
        rollNumber: '10A002',
        status: 'ACTIVE',
        enrollDate: new Date('2024-09-01'),
      },
    }),
    prisma.classEnrollment.create({
      data: {
        studentId: students[2].id,
        classId: class10.id,
        sectionId: section10B.id,
        rollNumber: '10B001',
        status: 'ACTIVE',
        enrollDate: new Date('2024-09-01'),
      },
    }),
    prisma.classEnrollment.create({
      data: {
        studentId: students[3].id,
        classId: class10.id,
        sectionId: section10B.id,
        rollNumber: '10B002',
        status: 'ACTIVE',
        enrollDate: new Date('2024-09-01'),
      },
    }),
    prisma.classEnrollment.create({
      data: {
        studentId: students[4].id,
        classId: class11.id,
        sectionId: section11A.id,
        rollNumber: '11A001',
        status: 'ACTIVE',
        enrollDate: new Date('2023-09-01'),
      },
    }),
    prisma.classEnrollment.create({
      data: {
        studentId: students[5].id,
        classId: class11.id,
        sectionId: section11A.id,
        rollNumber: '11A002',
        status: 'ACTIVE',
        enrollDate: new Date('2023-09-01'),
      },
    }),
  ]);

  // 11. Create Exam Types
  console.log('📋 Creating exam types...');
  const examTypes = await Promise.all([
    prisma.examType.create({
      data: {
        name: 'Mid-term Exam',
        description: 'Mid-semester examination',
        weight: 30,
        isActive: true,
        includeInGradeCard: true,
      },
    }),
    prisma.examType.create({
      data: {
        name: 'Final Exam',
        description: 'End of semester examination',
        weight: 50,
        isActive: true,
        includeInGradeCard: true,
      },
    }),
    prisma.examType.create({
      data: {
        name: 'Quiz',
        description: 'Short assessment',
        weight: 10,
        isActive: true,
        includeInGradeCard: true,
      },
    }),
  ]);

  // 12. Create Exams
  console.log('📝 Creating exams...');
  const exams = await Promise.all([
    prisma.exam.create({
      data: {
        title: 'Mathematics Mid-term',
        examTypeId: examTypes[0].id,
        subjectId: subjects[0].id,
        termId: term1.id,
        examDate: new Date('2024-10-15'),
        startTime: new Date('2024-10-15T09:00:00'),
        endTime: new Date('2024-10-15T11:00:00'),
        totalMarks: 100,
        passingMarks: 50,
        creatorId: teachers[0].id,
      },
    }),
    prisma.exam.create({
      data: {
        title: 'Physics Mid-term',
        examTypeId: examTypes[0].id,
        subjectId: subjects[1].id,
        termId: term1.id,
        examDate: new Date('2024-10-16'),
        startTime: new Date('2024-10-16T09:00:00'),
        endTime: new Date('2024-10-16T11:00:00'),
        totalMarks: 100,
        passingMarks: 50,
        creatorId: teachers[1].id,
      },
    }),
    prisma.exam.create({
      data: {
        title: 'English Final',
        examTypeId: examTypes[1].id,
        subjectId: subjects[3].id,
        termId: term1.id,
        examDate: new Date('2024-12-10'),
        startTime: new Date('2024-12-10T09:00:00'),
        endTime: new Date('2024-12-10T12:00:00'),
        totalMarks: 100,
        passingMarks: 50,
        creatorId: teachers[2].id,
      },
    }),
  ]);

  // 13. Create Exam Results
  console.log('📊 Creating exam results...');
  await Promise.all([
    prisma.examResult.create({
      data: {
        examId: exams[0].id,
        studentId: students[0].id,
        marks: 85,
        grade: 'A',
        remarks: 'Excellent performance',
      },
    }),
    prisma.examResult.create({
      data: {
        examId: exams[0].id,
        studentId: students[1].id,
        marks: 78,
        grade: 'B+',
        remarks: 'Good work',
      },
    }),
    prisma.examResult.create({
      data: {
        examId: exams[1].id,
        studentId: students[0].id,
        marks: 92,
        grade: 'A+',
        remarks: 'Outstanding',
      },
    }),
    prisma.examResult.create({
      data: {
        examId: exams[1].id,
        studentId: students[2].id,
        marks: 65,
        grade: 'C+',
        remarks: 'Satisfactory',
      },
    }),
  ]);

  // 14. Create Grade Scale
  console.log('📈 Creating grade scale...');
  await Promise.all([
    prisma.gradeScale.create({
      data: { grade: 'A+', minMarks: 90, maxMarks: 100, gpa: 4.0, description: 'Outstanding' },
    }),
    prisma.gradeScale.create({
      data: { grade: 'A', minMarks: 80, maxMarks: 89, gpa: 3.7, description: 'Excellent' },
    }),
    prisma.gradeScale.create({
      data: { grade: 'B+', minMarks: 70, maxMarks: 79, gpa: 3.3, description: 'Very Good' },
    }),
    prisma.gradeScale.create({
      data: { grade: 'B', minMarks: 60, maxMarks: 69, gpa: 3.0, description: 'Good' },
    }),
    prisma.gradeScale.create({
      data: { grade: 'C+', minMarks: 55, maxMarks: 59, gpa: 2.7, description: 'Above Average' },
    }),
    prisma.gradeScale.create({
      data: { grade: 'C', minMarks: 50, maxMarks: 54, gpa: 2.3, description: 'Average' },
    }),
    prisma.gradeScale.create({
      data: { grade: 'F', minMarks: 0, maxMarks: 49, gpa: 0.0, description: 'Fail' },
    }),
  ]);

  // 15. Create Assignments
  console.log('📄 Creating assignments...');
  const assignments = await Promise.all([
    prisma.assignment.create({
      data: {
        title: 'Algebra Problem Set',
        description: 'Complete exercises 1-20 from Chapter 5',
        subjectId: subjects[0].id,
        assignedDate: new Date('2024-09-15'),
        dueDate: new Date('2024-09-22'),
        totalMarks: 50,
        creatorId: teachers[0].id,
        instructions: 'Show all work. Submit handwritten or typed solutions.',
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Physics Lab Report',
        description: 'Write a report on the pendulum experiment',
        subjectId: subjects[1].id,
        assignedDate: new Date('2024-09-20'),
        dueDate: new Date('2024-09-27'),
        totalMarks: 30,
        creatorId: teachers[1].id,
        instructions: 'Include hypothesis, procedure, observations, and conclusion.',
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Essay on Shakespeare',
        description: 'Write a 500-word essay on Hamlet',
        subjectId: subjects[3].id,
        assignedDate: new Date('2024-09-18'),
        dueDate: new Date('2024-09-25'),
        totalMarks: 40,
        creatorId: teachers[2].id,
        instructions: 'Use MLA format. Include citations.',
      },
    }),
  ]);

  // Link assignments to classes
  await Promise.all([
    prisma.assignmentClass.create({
      data: { assignmentId: assignments[0].id, classId: class10.id },
    }),
    prisma.assignmentClass.create({
      data: { assignmentId: assignments[1].id, classId: class10.id },
    }),
    prisma.assignmentClass.create({
      data: { assignmentId: assignments[2].id, classId: class10.id },
    }),
  ]);

  // 16. Create Assignment Submissions
  console.log('✍️ Creating assignment submissions...');
  await Promise.all([
    prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignments[0].id,
        studentId: students[0].id,
        submissionDate: new Date('2024-09-21'),
        content: 'Completed all 20 problems',
        marks: 48,
        feedback: 'Excellent work!',
        status: 'GRADED',
      },
    }),
    prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignments[0].id,
        studentId: students[1].id,
        submissionDate: new Date('2024-09-22'),
        content: 'Completed all problems',
        marks: 42,
        feedback: 'Good effort',
        status: 'GRADED',
      },
    }),
    prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignments[1].id,
        studentId: students[0].id,
        submissionDate: new Date('2024-09-26'),
        content: 'Lab report submitted',
        status: 'SUBMITTED',
      },
    }),
  ]);

  // 17. Create Attendance Records
  console.log('✅ Creating attendance records...');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  await Promise.all([
    prisma.studentAttendance.create({
      data: {
        studentId: students[0].id,
        date: yesterday,
        sectionId: section10A.id,
        status: 'PRESENT',
        markedBy: teacherUsers[0].id,
      },
    }),
    prisma.studentAttendance.create({
      data: {
        studentId: students[1].id,
        date: yesterday,
        sectionId: section10A.id,
        status: 'PRESENT',
        markedBy: teacherUsers[0].id,
      },
    }),
    prisma.studentAttendance.create({
      data: {
        studentId: students[2].id,
        date: yesterday,
        sectionId: section10B.id,
        status: 'ABSENT',
        reason: 'Sick',
        markedBy: teacherUsers[0].id,
      },
    }),
    prisma.teacherAttendance.create({
      data: {
        teacherId: teachers[0].id,
        date: yesterday,
        status: 'PRESENT',
        markedBy: adminUser.id,
      },
    }),
    prisma.teacherAttendance.create({
      data: {
        teacherId: teachers[1].id,
        date: yesterday,
        status: 'PRESENT',
        markedBy: adminUser.id,
      },
    }),
  ]);

  // 18. Create Fee Types and Structure
  console.log('💰 Creating fee structure...');
  const feeTypes = await Promise.all([
    prisma.feeType.create({
      data: {
        name: 'Tuition Fee',
        description: 'Annual tuition fee',
        amount: 5000,
        frequency: 'ANNUAL',
        isOptional: false,
      },
    }),
    prisma.feeType.create({
      data: {
        name: 'Library Fee',
        description: 'Annual library access fee',
        amount: 200,
        frequency: 'ANNUAL',
        isOptional: false,
      },
    }),
    prisma.feeType.create({
      data: {
        name: 'Sports Fee',
        description: 'Sports and athletics fee',
        amount: 300,
        frequency: 'ANNUAL',
        isOptional: true,
      },
    }),
    prisma.feeType.create({
      data: {
        name: 'Lab Fee',
        description: 'Science laboratory fee',
        amount: 400,
        frequency: 'ANNUAL',
        isOptional: false,
      },
    }),
  ]);

  const feeStructure = await prisma.feeStructure.create({
    data: {
      name: '2024-2025 Fee Structure',
      academicYearId: academicYear.id,
      applicableClasses: 'Grade 10, Grade 11',
      description: 'Standard fee structure for academic year 2024-2025',
      validFrom: new Date('2024-09-01'),
      isActive: true,
    },
  });

  await Promise.all([
    prisma.feeStructureItem.create({
      data: {
        feeStructureId: feeStructure.id,
        feeTypeId: feeTypes[0].id,
        amount: 5000,
        dueDate: new Date('2024-10-01'),
      },
    }),
    prisma.feeStructureItem.create({
      data: {
        feeStructureId: feeStructure.id,
        feeTypeId: feeTypes[1].id,
        amount: 200,
        dueDate: new Date('2024-10-01'),
      },
    }),
    prisma.feeStructureItem.create({
      data: {
        feeStructureId: feeStructure.id,
        feeTypeId: feeTypes[2].id,
        amount: 300,
        dueDate: new Date('2024-10-01'),
      },
    }),
    prisma.feeStructureItem.create({
      data: {
        feeStructureId: feeStructure.id,
        feeTypeId: feeTypes[3].id,
        amount: 400,
        dueDate: new Date('2024-10-01'),
      },
    }),
  ]);

  // 19. Create Fee Payments
  console.log('💳 Creating fee payments...');
  await Promise.all([
    prisma.feePayment.create({
      data: {
        studentId: students[0].id,
        feeStructureId: feeStructure.id,
        amount: 5900,
        paidAmount: 5900,
        balance: 0,
        paymentDate: new Date('2024-09-15'),
        paymentMethod: 'BANK_TRANSFER',
        transactionId: 'TXN001',
        receiptNumber: 'RCP001',
        status: 'COMPLETED',
      },
    }),
    prisma.feePayment.create({
      data: {
        studentId: students[1].id,
        feeStructureId: feeStructure.id,
        amount: 5900,
        paidAmount: 3000,
        balance: 2900,
        paymentDate: new Date('2024-09-20'),
        paymentMethod: 'CASH',
        receiptNumber: 'RCP002',
        status: 'PARTIAL',
      },
    }),
    prisma.feePayment.create({
      data: {
        studentId: students[2].id,
        feeStructureId: feeStructure.id,
        amount: 5900,
        paidAmount: 0,
        balance: 5900,
        paymentDate: new Date('2024-09-01'),
        paymentMethod: 'CASH',
        status: 'PENDING',
      },
    }),
  ]);

  // 20. Create Scholarships
  console.log('🎓 Creating scholarships...');
  const scholarship = await prisma.scholarship.create({
    data: {
      name: 'Merit Scholarship',
      description: 'For students with excellent academic performance',
      amount: 2000,
      percentage: 50,
      criteria: 'GPA above 3.5',
      duration: '1 Academic Year',
      fundedBy: 'School Foundation',
    },
  });

  await prisma.scholarshipRecipient.create({
    data: {
      scholarshipId: scholarship.id,
      studentId: students[0].id,
      awardDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      amount: 2000,
      status: 'Active',
    },
  });

  // 21. Create Budget and Expenses
  console.log('📊 Creating budget and expenses...');
  const budget = await prisma.budget.create({
    data: {
      title: 'Academic Year 2024-2025 Budget',
      description: 'Annual budget for operations',
      academicYearId: academicYear.id,
      category: 'Operations',
      allocatedAmount: 500000,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      status: 'Active',
    },
  });

  await Promise.all([
    prisma.expense.create({
      data: {
        title: 'Office Supplies',
        description: 'Stationery and office materials',
        amount: 1500,
        date: new Date('2024-09-10'),
        category: 'Supplies',
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'COMPLETED',
        paidTo: 'Office Depot',
        receiptNumber: 'EXP001',
        budgetId: budget.id,
      },
    }),
    prisma.expense.create({
      data: {
        title: 'Lab Equipment',
        description: 'Chemistry lab equipment',
        amount: 5000,
        date: new Date('2024-09-15'),
        category: 'Equipment',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'COMPLETED',
        paidTo: 'Science Supply Co.',
        receiptNumber: 'EXP002',
        budgetId: budget.id,
      },
    }),
  ]);

  // 22. Create Payroll
  console.log('💵 Creating payroll records...');
  await Promise.all([
    prisma.payroll.create({
      data: {
        teacherId: teachers[0].id,
        month: 9,
        year: 2024,
        basicSalary: 55000,
        allowances: 5000,
        deductions: 3000,
        netSalary: 57000,
        paymentDate: new Date('2024-09-30'),
        paymentMethod: 'BANK_TRANSFER',
        transactionId: 'PAY001',
        status: 'COMPLETED',
      },
    }),
    prisma.payroll.create({
      data: {
        teacherId: teachers[1].id,
        month: 9,
        year: 2024,
        basicSalary: 62000,
        allowances: 5000,
        deductions: 3500,
        netSalary: 63500,
        paymentDate: new Date('2024-09-30'),
        paymentMethod: 'BANK_TRANSFER',
        transactionId: 'PAY002',
        status: 'COMPLETED',
      },
    }),
  ]);

  // 23. Create Messages
  console.log('💬 Creating messages...');
  await Promise.all([
    prisma.message.create({
      data: {
        senderId: teacherUsers[0].id,
        recipientId: parentUsers[0].id,
        subject: 'Student Progress Update',
        content: 'Alex is doing excellent in Mathematics. Keep up the good work!',
        isRead: true,
        readAt: new Date('2024-09-16'),
      },
    }),
    prisma.message.create({
      data: {
        senderId: adminUser.id,
        recipientId: teacherUsers[0].id,
        subject: 'Staff Meeting',
        content: 'Please attend the staff meeting on Friday at 3 PM.',
        isRead: false,
      },
    }),
  ]);

  // 24. Create Announcements
  console.log('📢 Creating announcements...');
  await Promise.all([
    prisma.announcement.create({
      data: {
        title: 'School Reopening',
        content: 'School will reopen on September 1st, 2024. All students are expected to attend.',
        publisherId: admin.id,
        targetAudience: ['STUDENT', 'PARENT', 'TEACHER'],
        startDate: new Date('2024-08-15'),
        isActive: true,
      },
    }),
    prisma.announcement.create({
      data: {
        title: 'Parent-Teacher Meeting',
        content: 'Parent-teacher meeting scheduled for October 15th, 2024.',
        publisherId: admin.id,
        targetAudience: ['PARENT', 'TEACHER'],
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-15'),
        isActive: true,
      },
    }),
  ]);

  // 25. Create Notifications
  console.log('🔔 Creating notifications...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: studentUsers[0].id,
        title: 'Assignment Due',
        message: 'Your Algebra assignment is due tomorrow',
        type: 'WARNING',
        isRead: false,
        updatedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId: parentUsers[0].id,
        title: 'Fee Payment Reminder',
        message: 'Please complete the fee payment by October 1st',
        type: 'INFO',
        isRead: false,
        updatedAt: new Date(),
      },
    }),
  ]);

  // 26. Create Parent Meetings
  console.log('👨‍👩‍👧 Creating parent meetings...');
  await Promise.all([
    prisma.parentMeeting.create({
      data: {
        title: 'Discuss Academic Progress',
        description: 'Meeting to discuss Alex\'s academic performance',
        parentId: parents[0].id,
        teacherId: teachers[0].id,
        scheduledDate: new Date('2024-10-20T14:00:00'),
        duration: 30,
        status: 'SCHEDULED',
        location: 'Room 101',
      },
    }),
    prisma.parentMeeting.create({
      data: {
        title: 'Behavioral Discussion',
        description: 'Meeting to discuss student behavior',
        parentId: parents[2].id,
        teacherId: teachers[1].id,
        scheduledDate: new Date('2024-10-22T15:00:00'),
        duration: 30,
        status: 'SCHEDULED',
        location: 'Room 102',
      },
    }),
  ]);

  // 27. Create Document Types and Documents
  console.log('📁 Creating documents...');
  const docType = await prisma.documentType.create({
    data: {
      name: 'Academic Records',
      description: 'Student academic records and transcripts',
    },
  });

  await Promise.all([
    prisma.document.create({
      data: {
        title: 'Student Handbook 2024-2025',
        description: 'Official student handbook',
        fileName: 'student-handbook-2024.pdf',
        fileUrl: '/documents/student-handbook-2024.pdf',
        fileType: 'application/pdf',
        fileSize: 2048000,
        userId: adminUser.id,
        documentTypeId: docType.id,
        isPublic: true,
        tags: 'handbook,rules,policies',
      },
    }),
    prisma.document.create({
      data: {
        title: 'Academic Calendar',
        description: '2024-2025 Academic Calendar',
        fileName: 'academic-calendar-2024.pdf',
        fileUrl: '/documents/academic-calendar-2024.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        userId: adminUser.id,
        isPublic: true,
        tags: 'calendar,schedule',
      },
    }),
  ]);

  // 28. Create Events
  console.log('🎉 Creating events...');
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Annual Sports Day',
        description: 'School annual sports competition',
        startDate: new Date('2024-11-15T08:00:00'),
        endDate: new Date('2024-11-15T17:00:00'),
        location: 'School Sports Ground',
        organizer: 'Sports Department',
        type: 'Sports',
        status: 'UPCOMING',
        maxParticipants: 200,
        registrationDeadline: new Date('2024-11-10'),
        isPublic: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Science Fair',
        description: 'Annual science project exhibition',
        startDate: new Date('2024-12-05T09:00:00'),
        endDate: new Date('2024-12-05T16:00:00'),
        location: 'School Auditorium',
        organizer: 'Science Department',
        type: 'Academic',
        status: 'UPCOMING',
        maxParticipants: 100,
        registrationDeadline: new Date('2024-11-30'),
        isPublic: true,
      },
    }),
  ]);

  // 29. Create Event Participants
  console.log('🎯 Creating event participants...');
  await Promise.all([
    prisma.eventParticipant.create({
      data: {
        eventId: events[0].id,
        userId: studentUsers[0].id,
        role: 'ATTENDEE',
        registrationDate: new Date('2024-11-01'),
      },
    }),
    prisma.eventParticipant.create({
      data: {
        eventId: events[0].id,
        userId: studentUsers[1].id,
        role: 'ATTENDEE',
        registrationDate: new Date('2024-11-02'),
      },
    }),
    prisma.eventParticipant.create({
      data: {
        eventId: events[1].id,
        userId: studentUsers[0].id,
        role: 'ATTENDEE',
        registrationDate: new Date('2024-11-20'),
      },
    }),
  ]);

  // 30. Create Leave Applications
  console.log('📝 Creating leave applications...');
  await Promise.all([
    prisma.leaveApplication.create({
      data: {
        applicantId: studentUsers[2].id,
        applicantType: 'STUDENT',
        fromDate: new Date('2024-10-10'),
        toDate: new Date('2024-10-12'),
        reason: 'Family emergency',
        status: 'APPROVED',
        approvedById: adminUser.id,
        approvedOn: new Date('2024-10-08'),
        remarks: 'Approved',
      },
    }),
    prisma.leaveApplication.create({
      data: {
        applicantId: teacherUsers[2].id,
        applicantType: 'TEACHER',
        fromDate: new Date('2024-10-25'),
        toDate: new Date('2024-10-26'),
        reason: 'Medical appointment',
        status: 'PENDING',
      },
    }),
  ]);

  // 31. Create Classrooms
  console.log('🏫 Creating classrooms...');
  await Promise.all([
    prisma.classRoom.create({
      data: {
        name: 'Room 101',
        capacity: 35,
        building: 'Main Building',
        floor: '1st Floor',
        description: 'Standard classroom with projector',
      },
    }),
    prisma.classRoom.create({
      data: {
        name: 'Science Lab 1',
        capacity: 30,
        building: 'Science Block',
        floor: '2nd Floor',
        description: 'Physics and Chemistry laboratory',
      },
    }),
    prisma.classRoom.create({
      data: {
        name: 'Computer Lab',
        capacity: 40,
        building: 'Main Building',
        floor: '3rd Floor',
        description: 'Computer lab with 40 workstations',
      },
    }),
  ]);

  // 32. Create Student and Parent Settings
  console.log('⚙️  Creating user settings...');
  await Promise.all([
    prisma.studentSettings.create({
      data: {
        studentId: students[0].id,
        emailNotifications: true,
        assignmentReminders: true,
        examReminders: true,
        attendanceAlerts: true,
        profileVisibility: 'PRIVATE',
        theme: 'LIGHT',
        language: 'en',
      },
    }),
    prisma.studentSettings.create({
      data: {
        studentId: students[1].id,
        emailNotifications: true,
        assignmentReminders: true,
        examReminders: true,
        theme: 'DARK',
        language: 'en',
      },
    }),
    prisma.parentSettings.create({
      data: {
        parentId: parents[0].id,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        feeReminders: true,
        attendanceAlerts: true,
        examResultNotifications: true,
        preferredContactMethod: 'EMAIL',
        notificationFrequency: 'IMMEDIATE',
        theme: 'LIGHT',
        language: 'en',
      },
    }),
    prisma.parentSettings.create({
      data: {
        parentId: parents[1].id,
        emailNotifications: true,
        pushNotifications: true,
        feeReminders: true,
        attendanceAlerts: true,
        preferredContactMethod: 'BOTH',
        notificationFrequency: 'DAILY_DIGEST',
        theme: 'SYSTEM',
        language: 'en',
      },
    }),
  ]);

  // 33. Create Syllabus and Lessons
  console.log('📖 Creating syllabus and lessons...');
  const syllabus = await prisma.syllabus.create({
    data: {
      title: 'Mathematics Grade 10 Syllabus',
      description: 'Complete syllabus for Grade 10 Mathematics',
      subjectId: subjects[0].id,
    },
  });

  const syllabusUnit = await prisma.syllabusUnit.create({
    data: {
      title: 'Algebra',
      description: 'Introduction to algebraic expressions and equations',
      syllabusId: syllabus.id,
      order: 1,
    },
  });

  await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Linear Equations',
        description: 'Solving linear equations in one variable',
        subjectId: subjects[0].id,
        syllabusUnitId: syllabusUnit.id,
        content: 'Introduction to linear equations and methods to solve them',
        duration: 45,
      },
    }),
    prisma.lesson.create({
      data: {
        title: 'Quadratic Equations',
        description: 'Solving quadratic equations using various methods',
        subjectId: subjects[0].id,
        syllabusUnitId: syllabusUnit.id,
        content: 'Factorization, completing the square, and quadratic formula',
        duration: 60,
      },
    }),
  ]);

  // 34. Create Report Cards
  console.log('📊 Creating report cards...');
  await Promise.all([
    prisma.reportCard.create({
      data: {
        studentId: students[0].id,
        termId: term1.id,
        totalMarks: 450,
        averageMarks: 90,
        percentage: 90,
        grade: 'A+',
        rank: 1,
        attendance: 95,
        teacherRemarks: 'Excellent performance throughout the term',
        principalRemarks: 'Keep up the outstanding work',
        isPublished: true,
        publishDate: new Date('2024-12-25'),
      },
    }),
    prisma.reportCard.create({
      data: {
        studentId: students[1].id,
        termId: term1.id,
        totalMarks: 390,
        averageMarks: 78,
        percentage: 78,
        grade: 'B+',
        rank: 2,
        attendance: 92,
        teacherRemarks: 'Good progress, needs improvement in Physics',
        principalRemarks: 'Well done',
        isPublished: true,
        publishDate: new Date('2024-12-25'),
      },
    }),
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('- System Settings: 1');
  console.log('- Academic Years: 1');
  console.log('- Terms: 2');
  console.log('- Departments: 5');
  console.log('- Users: 16 (1 Admin, 5 Teachers, 6 Students, 4 Parents)');
  console.log('- Classes: 2');
  console.log('- Sections: 3');
  console.log('- Subjects: 5');
  console.log('- Exams: 3');
  console.log('- Assignments: 3');
  console.log('- Events: 2');
  console.log('- And much more...\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
