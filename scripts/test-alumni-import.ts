#!/usr/bin/env ts-node

/**
 * Test script for Historical Alumni Import
 * 
 * Creates test data and verifies the import script works correctly.
 */

import { PrismaClient, EnrollmentStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up test data...');
  
  // Delete in correct order to respect foreign key constraints
  // First, delete alumni profiles
  await prisma.alumni.deleteMany({
    where: {
      student: {
        user: {
          email: {
            startsWith: 'test-alumni-'
          }
        }
      }
    }
  });

  // Then delete enrollments
  await prisma.classEnrollment.deleteMany({
    where: {
      student: {
        user: {
          email: {
            startsWith: 'test-alumni-'
          }
        }
      }
    }
  });

  // Then delete students
  await prisma.student.deleteMany({
    where: {
      user: {
        email: {
          startsWith: 'test-alumni-'
        }
      }
    }
  });

  // Finally delete users
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'test-alumni-'
      }
    }
  });

  console.log('Cleanup complete\n');
}

async function createTestData() {
  console.log('Creating test data...\n');

  // Get or create an academic year
  let academicYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true }
  });

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2023-2024',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2024-03-31'),
        isCurrent: true
      }
    });
  }

  // Get or create a class
  let testClass = await prisma.class.findFirst({
    where: {
      name: 'Grade 12',
      academicYearId: academicYear.id
    }
  });

  if (!testClass) {
    testClass = await prisma.class.create({
      data: {
        name: 'Grade 12',
        academicYearId: academicYear.id
      }
    });
  }

  // Get or create a section
  let testSection = await prisma.classSection.findFirst({
    where: {
      name: 'A',
      classId: testClass.id
    }
  });

  if (!testSection) {
    testSection = await prisma.classSection.create({
      data: {
        name: 'A',
        classId: testClass.id,
        capacity: 40
      }
    });
  }

  // Create 3 test students with graduated status
  const students = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `test-alumni-${i}@example.com`,
        firstName: `TestAlumni${i}`,
        lastName: 'Student',
        role: UserRole.STUDENT,
        password: 'hashed_password'
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionId: `TEST-ALU-${i}`,
        admissionDate: new Date('2018-04-01'),
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male'
      }
    });

    // Create graduated enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        studentId: student.id,
        classId: testClass.id,
        sectionId: testSection.id,
        rollNumber: `${i}`,
        status: EnrollmentStatus.GRADUATED,
        enrollDate: new Date('2023-04-01')
      }
    });

    students.push({ user, student, enrollment });
    console.log(`Created test student: ${user.firstName} ${user.lastName} (${student.admissionId})`);
  }

  console.log(`\nTest data created successfully!`);
  console.log(`Academic Year: ${academicYear.name}`);
  console.log(`Class: ${testClass.name}`);
  console.log(`Section: ${testSection.name}`);
  console.log(`Students: ${students.length} graduated students\n`);

  return { academicYear, testClass, testSection, students };
}

async function verifyImport() {
  console.log('Verifying import results...\n');

  const graduatedStudents = await prisma.student.findMany({
    where: {
      user: {
        email: {
          startsWith: 'test-alumni-'
        }
      }
    },
    include: {
      user: true,
      alumni: true,
      enrollments: {
        where: {
          status: EnrollmentStatus.GRADUATED
        },
        include: {
          class: {
            include: {
              academicYear: true
            }
          },
          section: true
        }
      }
    }
  });

  console.log(`Found ${graduatedStudents.length} test students`);

  let allHaveAlumni = true;
  for (const student of graduatedStudents) {
    const hasAlumni = !!student.alumni;
    const status = hasAlumni ? '✅' : '❌';
    console.log(`${status} ${student.user.firstName} ${student.user.lastName} - Alumni profile: ${hasAlumni ? 'Yes' : 'No'}`);
    
    if (hasAlumni) {
      console.log(`   Graduation Date: ${student.alumni.graduationDate.toISOString().split('T')[0]}`);
      console.log(`   Final Class: ${student.alumni.finalClass} - ${student.alumni.finalSection}`);
      console.log(`   Academic Year: ${student.alumni.finalAcademicYear}`);
    }
    
    if (!hasAlumni) {
      allHaveAlumni = false;
    }
  }

  console.log('');
  if (allHaveAlumni) {
    console.log('✅ All test students have alumni profiles!');
    return true;
  } else {
    console.log('❌ Some test students are missing alumni profiles');
    return false;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('ALUMNI IMPORT TEST SCRIPT');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Step 1: Cleanup any existing test data
    await cleanup();

    // Step 2: Create test data
    await createTestData();

    // Step 3: Instructions for manual testing
    console.log('='.repeat(80));
    console.log('TEST INSTRUCTIONS');
    console.log('='.repeat(80));
    console.log('');
    console.log('1. Run dry-run to preview:');
    console.log('   npx tsx scripts/import-historical-alumni.ts --dry-run');
    console.log('');
    console.log('2. Run the import:');
    console.log('   npx tsx scripts/import-historical-alumni.ts');
    console.log('');
    console.log('3. Run validation:');
    console.log('   npx tsx scripts/import-historical-alumni.ts --validate');
    console.log('');
    console.log('4. Verify results:');
    console.log('   npx tsx scripts/test-alumni-import.ts verify');
    console.log('');
    console.log('5. Cleanup test data:');
    console.log('   npx tsx scripts/test-alumni-import.ts cleanup');
    console.log('');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'cleanup') {
  cleanup()
    .then(() => {
      console.log('✅ Cleanup complete');
      prisma.$disconnect();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during cleanup:', error);
      prisma.$disconnect();
      process.exit(1);
    });
} else if (command === 'verify') {
  verifyImport()
    .then((success) => {
      prisma.$disconnect();
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error during verification:', error);
      prisma.$disconnect();
      process.exit(1);
    });
} else {
  main()
    .catch((error) => {
      console.error('Unhandled error:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}
