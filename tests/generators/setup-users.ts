import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function setupUsers(schoolId: string, academicYearId: string) {
  console.log('🧑‍🎓 Setting up test users and classes...');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Never run test setup in production!');
  }

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create a Teacher
    const teacherUser = await prisma.user.create({
      data: {
        name: 'Test Teacher',
        firstName: 'Test',
        lastName: 'Teacher',
        email: 'teacher@test-intl.edu',
        passwordHash,
        role: 'TEACHER',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    await prisma.userSchool.create({
      data: { userId: teacherUser.id, schoolId, role: 'TEACHER' }
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        schoolId,
        employeeId: 'EMP001',
        joinDate: new Date('2024-01-01'),
      },
    });
    console.log(`✅ Teacher created`);

    // 2. Create a Subject
    const subject = await prisma.subject.create({
      data: {
        name: 'Mathematics',
        code: 'MATH101',
        type: 'CORE',
        schoolId,
      }
    });

    // Assign Teacher to Subject
    await prisma.subjectTeacher.create({
      data: {
        teacherId: teacher.id,
        subjectId: subject.id,
        schoolId,
      }
    });

    // 3. Create a Class
    const classRecord = await prisma.class.create({
      data: {
        name: 'Class 10',
        academicYearId,
        schoolId,
      }
    });

    // Assign class teacher
    await prisma.classTeacher.create({
      data: {
        teacherId: teacher.id,
        classId: classRecord.id,
        schoolId,
      }
    });

    // 4. Create a Parent
    const parentUser = await prisma.user.create({
      data: {
        name: 'Test Parent',
        firstName: 'Test',
        lastName: 'Parent',
        email: 'parent@test.com',
        passwordHash,
        role: 'PARENT',
        isActive: true,
        emailVerified: new Date(),
      }
    });

    await prisma.userSchool.create({
      data: { userId: parentUser.id, schoolId, role: 'PARENT' }
    });

    const parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        schoolId,
      }
    });
    console.log(`✅ Parent created`);

    // 5. Create a Student
    const studentUser = await prisma.user.create({
      data: {
        name: 'Test Student',
        firstName: 'Test',
        lastName: 'Student',
        email: 'student@test.com',
        passwordHash,
        role: 'STUDENT',
        isActive: true,
        emailVerified: new Date(),
      }
    });

    await prisma.userSchool.create({
      data: { userId: studentUser.id, schoolId, role: 'STUDENT' }
    });

    const admissionNumber = `ADM${faker.number.int({ min: 1000, max: 9999 })}`;

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        schoolId,
        admissionId: admissionNumber,
        admissionDate: new Date(),
        rollNumber: '1',
        dateOfBirth: new Date('2010-05-15'),
        gender: 'MALE',
        bloodGroup: 'O+',
      }
    });

    // Link Student to Parent
    await prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parent.id,
        schoolId,
        isPrimary: true,
      }
    });

    // Create a Section for the Class
    const section = await prisma.classSection.create({
      data: {
        name: 'A',
        classId: classRecord.id,
        schoolId,
      }
    });

    // Enroll student in class
    await prisma.classEnrollment.create({
      data: {
        studentId: student.id,
        classId: classRecord.id,
        sectionId: section.id,
        schoolId,
        status: 'ACTIVE',
        enrollDate: new Date(),
      }
    });
    console.log(`✅ Student created and linked to parent/class`);

    console.log('\n======================================');
    console.log('✅ User test data setup successfully!');
    console.log('======================================\n');
    console.log('Test Credentials (All use: password123):');
    console.log('- Teacher: teacher@test-intl.edu');
    console.log('- Student: student@test.com');
    console.log('- Parent: parent@test.com');

    return { teacher, parent, student, classRecord, subject };

  } catch (error) {
    console.error('❌ Error setting up users data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const schoolId = process.argv[2];
  const academicYearId = process.argv[3];

  if (!schoolId || !academicYearId) {
    console.error('Usage: ts-node setup-users.ts <schoolId> <academicYearId>');
    process.exit(1);
  }

  setupUsers(schoolId, academicYearId)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
