/**
 * SikshaMitra — Demo Seed: Saraswati Convent School, Bijnor
 *
 * Run with: npx tsx prisma/seed-demo-bijnor.ts
 *
 * Creates a realistic UP private school with:
 * - 1 admin, 8 teachers, 120 students, 100 parents
 * - Classes 1–10 with sections A & B
 * - 3 months of attendance history (85% avg)
 * - Fee structures with 20% defaulters
 * - 2 exam cycles with realistic marks
 * - Announcements, expenses, payroll
 * - Healthy financials for demo
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

// ─── Constants ───────────────────────────────────────────────────────────────

const SCHOOL_CODE = "SCBIJNOR2024";
const SUBDOMAIN = "saraswati-bijnor";
const PASSWORD_HASH = bcrypt.hashSync("Demo@1234", 10);

const TODAY = new Date();
const ACADEMIC_YEAR_START = new Date("2024-04-01");
const ACADEMIC_YEAR_END = new Date("2025-03-31");

// Date helpers
const daysAgo = (n: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
};
const monthsAgo = (n: number) => {
  const d = new Date(TODAY);
  d.setMonth(d.getMonth() - n);
  return d;
};

// ─── Name pools (realistic UP Hindi names) ───────────────────────────────────

const MALE_FIRST = [
  "Aarav", "Arjun", "Rohan", "Vikram", "Rahul", "Amit", "Suresh", "Deepak",
  "Ravi", "Sanjeev", "Mohit", "Gaurav", "Nitin", "Ankit", "Saurabh", "Vivek",
  "Piyush", "Ashish", "Manish", "Rajesh", "Aditya", "Shubham", "Harsh", "Yash",
  "Kartik", "Pranav", "Varun", "Dhruv", "Akash", "Ritesh", "Sachin", "Nikhil",
  "Sumit", "Vishal", "Dinesh", "Ramesh", "Mahesh", "Naresh", "Sunil", "Anil",
];

const FEMALE_FIRST = [
  "Priya", "Pooja", "Neha", "Anjali", "Kavita", "Sunita", "Rekha", "Meena",
  "Soni", "Lata", "Radha", "Geeta", "Seema", "Anita", "Usha", "Asha",
  "Pallavi", "Shikha", "Ritu", "Nisha", "Divya", "Sneha", "Swati", "Riya",
  "Komal", "Sapna", "Preeti", "Mansi", "Nikita", "Simran", "Tanvi", "Shreya",
  "Khushi", "Muskan", "Payal", "Deepika", "Shalini", "Archana", "Bharti", "Kiran",
];

const LAST_NAMES = [
  "Sharma", "Gupta", "Verma", "Singh", "Yadav", "Tiwari", "Mishra", "Pandey",
  "Chauhan", "Rajput", "Saxena", "Agarwal", "Jain", "Srivastava", "Dubey",
  "Shukla", "Tripathi", "Chaudhary", "Rai", "Kumar", "Prasad", "Pathak",
  "Bajpai", "Dixit", "Awasthi",
];

const OCCUPATIONS = [
  "Farmer", "Shopkeeper", "Teacher", "Government Employee", "Businessman",
  "Daily Wage Worker", "Driver", "Contractor", "Tailor", "Electrician",
  "Doctor", "Engineer", "Bank Employee", "Police Officer", "Army Retired",
];

const SUBJECTS_DATA = [
  { name: "Hindi", code: "HIN" },
  { name: "English", code: "ENG" },
  { name: "Mathematics", code: "MATH" },
  { name: "Science", code: "SCI" },
  { name: "Social Science", code: "SST" },
  { name: "Sanskrit", code: "SAN" },
  { name: "Computer Science", code: "CS" },
  { name: "Physical Education", code: "PE" },
];

const ANNOUNCEMENTS = [
  {
    title: "Annual Sports Day — 15 February",
    content:
      "The Annual Sports Day will be held on 15 February 2025 at the school ground. All students must report by 8:00 AM in their house colour uniform. Parents are cordially invited.",
  },
  {
    title: "Parent-Teacher Meeting — 20 January",
    content:
      "Parent-Teacher Meeting is scheduled for 20 January 2025 (Sunday) from 10 AM to 2 PM. All parents are requested to attend and collect their ward's Term 1 report card.",
  },
  {
    title: "Winter Vacation Notice",
    content:
      "School will remain closed from 1 January to 10 January 2025 for winter vacation. School will reopen on 11 January 2025. Students are advised to complete holiday homework.",
  },
  {
    title: "Fee Submission Reminder",
    content:
      "All parents are reminded to submit the January 2025 tuition fee by 10 January 2025. Late payment will attract a fine of ₹50 per day. Contact the school office for queries.",
  },
  {
    title: "Republic Day Celebration",
    content:
      "Republic Day will be celebrated on 26 January 2025 at the school ground. Flag hoisting will be at 8:00 AM. Cultural programmes will follow. All students must attend.",
  },
];

const EXPENSE_CATEGORIES = [
  { title: "Electricity Bill — December", category: "Utilities", amount: 4200 },
  { title: "Water Bill — December", category: "Utilities", amount: 800 },
  { title: "Cleaning Staff Salary", category: "Staff", amount: 12000 },
  { title: "Stationery Purchase", category: "Supplies", amount: 3500 },
  { title: "Maintenance — Classroom Fans", category: "Maintenance", amount: 2800 },
  { title: "Chalk and Board Markers", category: "Supplies", amount: 600 },
  { title: "Printer Ink Cartridges", category: "Supplies", amount: 1800 },
  { title: "Electricity Bill — November", category: "Utilities", amount: 3900 },
  { title: "Sports Equipment", category: "Sports", amount: 5500 },
  { title: "Library Books Purchase", category: "Library", amount: 8000 },
  { title: "Generator Fuel", category: "Utilities", amount: 3200 },
  { title: "Security Guard Salary", category: "Staff", amount: 9000 },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

let _mobileCounter = 9000000000;
const uniqueMobile = () => String(++_mobileCounter);

let _emailCounter = 1;
const uniqueEmail = (name: string) =>
  `${name.toLowerCase().replace(/\s+/g, ".")}.${_emailCounter++}@demo.sikshamitra.com`;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomMarks = (total: number, passing: number): number => {
  // 80% of students pass, realistic distribution
  if (Math.random() < 0.8) {
    return randomInt(Math.ceil(passing), total);
  }
  return randomInt(Math.floor(passing * 0.4), passing - 1);
};

// Skip weekends for attendance
const isSchoolDay = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

const getSchoolDaysBetween = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    if (isSchoolDay(current)) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
};

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Saraswati Convent School, Bijnor...\n");

  // ── 1. Delete existing demo school if present ─────────────────────────────
  const existing = await db.school.findUnique({
    where: { schoolCode: SCHOOL_CODE },
  });
  if (existing) {
    console.log("  ♻️  Removing existing demo school...");
    // Delete users linked to this school before deleting the school
    const userSchools = await db.userSchool.findMany({
      where: { schoolId: existing.id },
      select: { userId: true },
    });
    const userIds = userSchools.map((us) => us.userId);
    await db.school.delete({ where: { id: existing.id } });
    if (userIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }

  // ── 2. School ─────────────────────────────────────────────────────────────
  console.log("  🏫 Creating school...");
  const school = await db.school.create({
    data: {
      name: "Saraswati Convent School",
      schoolCode: SCHOOL_CODE,
      phone: "9412345678",
      email: "principal@saraswatibijnor.edu.in",
      address: "Near Bus Stand, Civil Lines, Bijnor, Uttar Pradesh 246701",
      subdomain: SUBDOMAIN,
      subdomainStatus: "ACTIVE",
      plan: "STARTER",
      status: "ACTIVE",
      isOnboarded: true,
      onboardingStep: 5,
      onboardingCompletedAt: monthsAgo(3),
      tagline: "Nurturing Minds, Building Futures",
      primaryColor: "#1a56db",
      secondaryColor: "#7e3af2",
      metadata: { city: "Bijnor", state: "Uttar Pradesh", board: "CBSE" },
    },
  });
  console.log(`     ✓ School: ${school.name} (${school.id})`);

  // ── 3. School settings ────────────────────────────────────────────────────
  await db.schoolSettings.create({
    data: {
      schoolId: school.id,
      schoolName: "Saraswati Convent School",
      schoolAddress: "Near Bus Stand, Civil Lines, Bijnor, UP 246701",
      schoolPhone: "9412345678",
      schoolEmail: "principal@saraswatibijnor.edu.in",
      board: "CBSE",
      timezone: "Asia/Kolkata",
      tagline: "Nurturing Minds, Building Futures",
      onboardingCompleted: true,
      onboardingStep: 5,
      attendanceThreshold: 75,
      passingGrade: 33,
      language: "en",
      dateFormat: "dmy",
      enableOfflineVerification: true,
    },
  });

  // ── 4. School permissions ─────────────────────────────────────────────────
  await db.schoolPermissions.create({
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
      emailIntegration: true,
      feeManagement: true,
      paymentProcessing: true,
      financialReports: true,
      backupRestore: true,
      dataExport: true,
      auditLogs: false,
      customBranding: true,
    },
  });

  // ── 5. UsageCounter ───────────────────────────────────────────────────────
  const currentMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
  await db.usageCounter.create({
    data: {
      schoolId: school.id,
      month: currentMonth,
      whatsappUsed: 0,
      smsUsed: 47,
      storageUsedMB: 128,
      whatsappLimit: 0,
      smsLimit: 500,
      storageLimitMB: 1024,
    },
  });

  // ── 6. Academic year & terms ──────────────────────────────────────────────
  console.log("  📅 Creating academic year and terms...");
  const academicYear = await db.academicYear.create({
    data: {
      schoolId: school.id,
      name: "2024-2025",
      startDate: ACADEMIC_YEAR_START,
      endDate: ACADEMIC_YEAR_END,
      isCurrent: true,
    },
  });

  const term1 = await db.term.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "Term 1",
      startDate: new Date("2024-04-01"),
      endDate: new Date("2024-09-30"),
    },
  });

  const term2 = await db.term.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "Term 2",
      startDate: new Date("2024-10-01"),
      endDate: new Date("2025-03-31"),
    },
  });

  // ── 7. Admin user ─────────────────────────────────────────────────────────
  console.log("  👤 Creating admin...");
  const adminUser = await db.user.create({
    data: {
      name: "Aditya Sharma",
      firstName: "Aditya",
      lastName: "Sharma",
      email: "admin@saraswatibijnor.edu.in",
      mobile: "9412000001",
      passwordHash: PASSWORD_HASH,
      role: "ADMIN",
      isActive: true,
    },
  });

  await db.userSchool.create({
    data: {
      userId: adminUser.id,
      schoolId: school.id,
      role: "ADMIN",
      isActive: true,
    },
  });

  const administrator = await db.administrator.create({
    data: {
      userId: adminUser.id,
      schoolId: school.id,
      position: "Principal",
    },
  });
  console.log(`     ✓ Admin: ${adminUser.name} (admin@saraswatibijnor.edu.in / Demo@1234)`);

  // ── 8. Subjects ───────────────────────────────────────────────────────────
  console.log("  📚 Creating subjects...");
  const subjects = await Promise.all(
    SUBJECTS_DATA.map((s) =>
      db.subject.create({
        data: {
          schoolId: school.id,
          name: s.name,
          code: s.code,
          type: "CORE",
          category: "SCHOLASTIC",
          isCompulsory: true,
          hasTheory: true,
        },
      })
    )
  );

  // ── 9. Teachers ───────────────────────────────────────────────────────────
  console.log("  👩‍🏫 Creating 8 teachers...");
  const teacherData = [
    { name: "Rama Devi Mishra", firstName: "Rama Devi", lastName: "Mishra", subject: "Hindi", salary: 18000 },
    { name: "Suresh Kumar Sharma", firstName: "Suresh Kumar", lastName: "Sharma", subject: "Mathematics", salary: 20000 },
    { name: "Priya Singh", firstName: "Priya", lastName: "Singh", subject: "English", salary: 19000 },
    { name: "Rakesh Yadav", firstName: "Rakesh", lastName: "Yadav", subject: "Science", salary: 20000 },
    { name: "Sunita Gupta", firstName: "Sunita", lastName: "Gupta", subject: "Social Science", salary: 17000 },
    { name: "Mohan Tiwari", firstName: "Mohan", lastName: "Tiwari", subject: "Sanskrit", salary: 16000 },
    { name: "Kavita Verma", firstName: "Kavita", lastName: "Verma", subject: "Computer Science", salary: 18000 },
    { name: "Dinesh Chauhan", firstName: "Dinesh", lastName: "Chauhan", subject: "Physical Education", salary: 15000 },
  ];

  const teachers: Array<{ teacher: any; user: any; subject: any }> = [];

  for (let i = 0; i < teacherData.length; i++) {
    const td = teacherData[i];
    const mobile = uniqueMobile();
    const email = uniqueEmail(td.name);

    const user = await db.user.create({
      data: {
        name: td.name,
        firstName: td.firstName,
        lastName: td.lastName,
        email,
        mobile,
        passwordHash: PASSWORD_HASH,
        role: "TEACHER",
        isActive: true,
      },
    });

    await db.userSchool.create({
      data: { userId: user.id, schoolId: school.id, role: "TEACHER" },
    });

    const teacher = await db.teacher.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        employeeId: `EMP${SCHOOL_CODE}${String(i + 1).padStart(3, "0")}`,
        qualification: "B.Ed",
        joinDate: monthsAgo(randomInt(6, 36)),
        salary: td.salary,
      },
    });

    const subj = subjects.find((s) => s.name === td.subject) || subjects[0];
    teachers.push({ teacher, user, subject: subj });
  }
  console.log(`     ✓ ${teachers.length} teachers created`);

  // ── 10. Classes and sections ───────────────────────────────────────────────
  console.log("  🏫 Creating classes 1–10 with sections A & B...");
  type ClassRecord = { cls: any; sectionA: any; sectionB: any; name: string };
  const classes: ClassRecord[] = [];

  for (let grade = 1; grade <= 10; grade++) {
    const cls = await db.class.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: `Class ${grade}`,
      },
    });

    const sectionA = await db.classSection.create({
      data: { schoolId: school.id, classId: cls.id, name: "A", capacity: 40 },
    });

    const sectionB = await db.classSection.create({
      data: { schoolId: school.id, classId: cls.id, name: "B", capacity: 40 },
    });

    classes.push({ cls, sectionA, sectionB, name: `Class ${grade}` });
  }

  // ── 11. Subject-class mappings + teacher assignments ───────────────────────
  for (const { cls } of classes) {
    for (const subject of subjects) {
      await db.subjectClass.create({
        data: {
          schoolId: school.id,
          classId: cls.id,
          subjectId: subject.id,
        },
      });
    }

    // Assign each teacher to the class
    for (const { teacher } of teachers) {
      await db.subjectTeacher.upsert({
        where: {
          subjectId_teacherId: {
            subjectId: teachers[0].subject.id,
            teacherId: teacher.id,
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          subjectId: teacher.schoolId === school.id ? subjects[0].id : subjects[0].id,
          teacherId: teacher.id,
        },
      }).catch(() => {}); // ignore duplicates
    }

    // Class teacher assignment
    await db.classTeacher.create({
      data: {
        schoolId: school.id,
        classId: cls.id,
        teacherId: teachers[Math.floor(Math.random() * teachers.length)].teacher.id,
        isClassHead: true,
      },
    }).catch(() => {});
  }

  // ── 12. Fee structure ─────────────────────────────────────────────────────
  console.log("  💰 Creating fee structure...");
  const feeTypes = await Promise.all([
    db.feeType.create({
      data: {
        schoolId: school.id,
        name: "Tuition Fee",
        amount: 800,
        frequency: "MONTHLY",
      },
    }),
    db.feeType.create({
      data: {
        schoolId: school.id,
        name: "Computer Fee",
        amount: 200,
        frequency: "MONTHLY",
      },
    }),
    db.feeType.create({
      data: {
        schoolId: school.id,
        name: "Sports Fee",
        amount: 100,
        frequency: "MONTHLY",
      },
    }),
    db.feeType.create({
      data: {
        schoolId: school.id,
        name: "Annual Charges",
        amount: 2000,
        frequency: "ANNUAL",
        isOptional: false,
      },
    }),
  ]);

  const feeStructure = await db.feeStructure.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "Standard Fee Structure 2024-25",
      validFrom: ACADEMIC_YEAR_START,
      validTo: ACADEMIC_YEAR_END,
      isActive: true,
    },
  });

  await Promise.all(
    feeTypes.map((ft) =>
      db.feeStructureItem.create({
        data: {
          schoolId: school.id,
          feeStructureId: feeStructure.id,
          feeTypeId: ft.id,
          amount: ft.amount,
        },
      })
    )
  );

  // Link fee structure to all classes
  for (const { cls } of classes) {
    await db.feeStructureClass.create({
      data: {
        schoolId: school.id,
        feeStructureId: feeStructure.id,
        classId: cls.id,
      },
    });
  }

  // ── 13. Students (120 total: 12 per class, split A/B) ─────────────────────
  console.log("  👨‍🎓 Creating 120 students with parents...");
  type StudentRecord = { student: any; classRecord: ClassRecord; section: any };
  const allStudents: StudentRecord[] = [];
  let rollCounter = 1;

  for (const classRecord of classes) {
    const { cls, sectionA, sectionB } = classRecord;

    for (let i = 0; i < 12; i++) {
      const isSection = i < 6 ? sectionA : sectionB;
      const gender = Math.random() > 0.5 ? "Male" : "Female";
      const firstName =
        gender === "Male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
      const lastName = pick(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const dob = new Date(
        TODAY.getFullYear() - randomInt(5, 16),
        randomInt(0, 11),
        randomInt(1, 28)
      );

      const studentUser = await db.user.create({
        data: {
          name: fullName,
          firstName,
          lastName,
          mobile: uniqueMobile(),
          email: uniqueEmail(fullName),
          passwordHash: PASSWORD_HASH,
          role: "STUDENT",
          isActive: true,
        },
      });

      await db.userSchool.create({
        data: {
          userId: studentUser.id,
          schoolId: school.id,
          role: "STUDENT",
        },
      });

      const admissionId = `SCB${academicYear.name.slice(0, 4)}${String(rollCounter).padStart(4, "0")}`;

      const student = await db.student.create({
        data: {
          userId: studentUser.id,
          schoolId: school.id,
          admissionId,
          admissionDate: new Date("2024-04-01"),
          rollNumber: String(rollCounter % 40 || 40),
          dateOfBirth: dob,
          gender,
          address: `${randomInt(1, 200)}, ${pick(["Gandhi Nagar", "Shastri Nagar", "Civil Lines", "Mandi Road", "Station Road"])}, Bijnor`,
          nationality: "Indian",
          religion: pick(["Hindu", "Muslim", "Sikh"]),
          caste: pick(["General", "OBC", "SC"]),
          category: pick(["General", "OBC", "SC"]),
          motherTongue: "Hindi",
          fatherName: `${pick(MALE_FIRST)} ${lastName}`,
          fatherOccupation: pick(OCCUPATIONS),
          fatherPhone: uniqueMobile(),
          motherName: `${pick(FEMALE_FIRST)} ${lastName}`,
          motherOccupation: pick(["Housewife", "Teacher", "Nurse", "Anganwadi Worker"]),
          parentMobile: uniqueMobile(),
        },
      });

      rollCounter++;

      await db.classEnrollment.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          classId: cls.id,
          sectionId: isSection.id,
          rollNumber: String(i + 1),
          status: "ACTIVE",
          enrollDate: new Date("2024-04-01"),
        },
      });

      // Parent
      const parentGender = Math.random() > 0.5 ? "Male" : "Female";
      const parentFirstName = parentGender === "Male" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
      const parentLastName = lastName;
      const parentName = `${parentFirstName} ${parentLastName}`;

      const parentUser = await db.user.create({
        data: {
          name: parentName,
          firstName: parentFirstName,
          lastName: parentLastName,
          mobile: uniqueMobile(),
          email: uniqueEmail(parentName),
          passwordHash: PASSWORD_HASH,
          role: "PARENT",
          isActive: true,
        },
      });

      await db.userSchool.create({
        data: {
          userId: parentUser.id,
          schoolId: school.id,
          role: "PARENT",
        },
      });

      const parent = await db.parent.create({
        data: {
          userId: parentUser.id,
          schoolId: school.id,
          occupation: pick(OCCUPATIONS),
          relation: parentGender === "Male" ? "Father" : "Mother",
        },
      });

      await db.studentParent.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          parentId: parent.id,
          isPrimary: true,
        },
      });

      allStudents.push({ student, classRecord, section: isSection });
    }
  }
  console.log(`     ✓ ${allStudents.length} students and parents created`);

  // ── 14. Attendance — last 90 school days ──────────────────────────────────
  console.log("  📋 Generating 90 days of attendance...");
  const attendanceStart = daysAgo(90);
  const schoolDays = getSchoolDaysBetween(attendanceStart, daysAgo(1));

  // Process in batches of 10 days to avoid memory issues
  let attendanceCount = 0;
  for (const day of schoolDays) {
    const records: any[] = [];

    for (const { student, section } of allStudents) {
      // 85% present, 10% absent, 5% late
      const rand = Math.random();
      let status: "PRESENT" | "ABSENT" | "LATE" = "PRESENT";
      if (rand > 0.85 && rand <= 0.95) status = "ABSENT";
      else if (rand > 0.95) status = "LATE";

      records.push({
        schoolId: school.id,
        studentId: student.id,
        sectionId: section.id,
        date: day,
        status,
        markedBy: administrator.id,
      });
    }

    await db.studentAttendance.createMany({
      data: records,
      skipDuplicates: true,
    });
    attendanceCount += records.length;
  }
  console.log(`     ✓ ${attendanceCount} attendance records created`);

  // ── 15. Teacher attendance — last 90 days ────────────────────────────────
  for (const day of schoolDays) {
    const records = teachers.map(({ teacher }) => ({
      schoolId: school.id,
      teacherId: teacher.id,
      date: day,
      status: Math.random() > 0.05 ? ("PRESENT" as const) : ("ABSENT" as const),
    }));

    await db.teacherAttendance.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  // ── 16. Exam types ────────────────────────────────────────────────────────
  console.log("  📝 Creating exam types and exams...");
  const unitTestType = await db.examType.create({
    data: {
      schoolId: school.id,
      name: "Unit Test",
      weight: 20,
      isActive: true,
      cbseComponent: "PT",
    },
  });

  const halfYearlyType = await db.examType.create({
    data: {
      schoolId: school.id,
      name: "Half Yearly",
      weight: 40,
      isActive: true,
      cbseComponent: "HALF_YEARLY",
    },
  });

  const annualType = await db.examType.create({
    data: {
      schoolId: school.id,
      name: "Annual",
      weight: 40,
      isActive: true,
      cbseComponent: "ANNUAL",
    },
  });

  // ── 17. Exams + results for Term 1 ───────────────────────────────────────
  // Create exams for Class 9 & 10 (visible in dashboard charts)
  const examClasses = classes.filter((c) =>
    ["Class 9", "Class 10"].includes(c.name)
  );

  for (const { cls } of examClasses) {
    for (const subject of subjects.slice(0, 5)) {
      // 5 subjects
      // Half Yearly exam
      const halfYearlyExam = await db.exam.create({
        data: {
          schoolId: school.id,
          title: `Half Yearly — ${subject.name}`,
          examTypeId: halfYearlyType.id,
          subjectId: subject.id,
          classId: cls.id,
          termId: term1.id,
          examDate: new Date("2024-09-15"),
          startTime: new Date("2024-09-15T09:00:00"),
          endTime: new Date("2024-09-15T12:00:00"),
          totalMarks: 80,
          passingMarks: 27,
        },
      });

      // Results for students in this class
      const classStudents = allStudents.filter(
        (s) => s.classRecord.cls.id === cls.id
      );

      await db.examResult.createMany({
        data: classStudents.map(({ student }) => {
          const marks = randomMarks(80, 27);
          return {
            schoolId: school.id,
            examId: halfYearlyExam.id,
            studentId: student.id,
            marks,
            totalMarks: 80,
            percentage: Math.round((marks / 80) * 100 * 10) / 10,
            grade:
              marks >= 72
                ? "A1"
                : marks >= 64
                ? "A2"
                : marks >= 56
                ? "B1"
                : marks >= 48
                ? "B2"
                : marks >= 40
                ? "C1"
                : marks >= 33
                ? "C2"
                : "D",
            isAbsent: false,
          };
        }),
        skipDuplicates: true,
      });
    }
  }
  console.log(`     ✓ Exams and results created`);

  // ── 18. Fee payments (80% paid, 20% defaulters) ───────────────────────────
  console.log("  💳 Generating fee payment records...");
  let totalFeesPaid = 0;
  let totalFeesPending = 0;
  let paymentCount = 0;

  // Monthly fees for last 6 months
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const paymentMonth = monthsAgo(monthOffset);
    const paymentDate = new Date(paymentMonth);
    paymentDate.setDate(randomInt(1, 15));

    for (const { student } of allStudents) {
      const isDefaulter = Math.random() < 0.2; // 20% defaulters
      const monthlyAmount = 1100; // 800 tuition + 200 computer + 100 sports

      if (isDefaulter && monthOffset <= 1) {
        // Recent months unpaid for defaulters
        await db.feePayment.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            feeStructureId: feeStructure.id,
            amount: monthlyAmount,
            paidAmount: 0,
            balance: monthlyAmount,
            paymentDate,
            paymentMethod: "CASH",
            status: "PENDING",
          },
        });
        totalFeesPending += monthlyAmount;
      } else {
        // Paid
        const receiptNum = `RCP${Date.now()}${paymentCount}`;
        await db.feePayment.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            feeStructureId: feeStructure.id,
            amount: monthlyAmount,
            paidAmount: monthlyAmount,
            balance: 0,
            paymentDate,
            paymentMethod: Math.random() > 0.7 ? "BANK_TRANSFER" : "CASH",
            status: "COMPLETED",
            receiptNumber: receiptNum,
          },
        });
        totalFeesPaid += monthlyAmount;
      }
      paymentCount++;
    }
  }
  console.log(
    `     ✓ ${paymentCount} payment records | ₹${totalFeesPaid.toLocaleString("en-IN")} collected | ₹${totalFeesPending.toLocaleString("en-IN")} pending`
  );

  // ── 19. Announcements ─────────────────────────────────────────────────────
  console.log("  📢 Creating announcements...");
  for (let i = 0; i < ANNOUNCEMENTS.length; i++) {
    await db.announcement.create({
      data: {
        schoolId: school.id,
        publisherId: administrator.id,
        title: ANNOUNCEMENTS[i].title,
        content: ANNOUNCEMENTS[i].content,
        targetAudience: ["STUDENT", "PARENT", "TEACHER"],
        startDate: daysAgo(ANNOUNCEMENTS.length - i + randomInt(0, 5)),
        isActive: true,
      },
    });
  }

  // ── 20. Expenses ──────────────────────────────────────────────────────────
  console.log("  📊 Creating expenses...");
  for (const expense of EXPENSE_CATEGORIES) {
    await db.expense.create({
      data: {
        schoolId: school.id,
        title: expense.title,
        amount: expense.amount,
        date: daysAgo(randomInt(5, 60)),
        category: expense.category,
        paymentMethod: "CASH",
        paymentStatus: "COMPLETED",
      },
    });
  }

  // ── 21. Payroll — last 3 months ───────────────────────────────────────────
  console.log("  💼 Creating payroll records...");
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const payDate = monthsAgo(monthOffset);
    const month = payDate.getMonth() + 1;
    const year = payDate.getFullYear();

    for (const { teacher } of teachers) {
      const salary = (await db.teacher.findUnique({
        where: { id: teacher.id },
        select: { salary: true },
      }))!.salary!;

      const basic = Math.round(salary * 0.6);
      const hra = Math.round(salary * 0.2);
      const da = Math.round(salary * 0.1);
      const travel = Math.round(salary * 0.05);
      const pf = Math.round(basic * 0.12);
      const netSalary = basic + hra + da + travel - pf;

      await db.payroll.create({
        data: {
          schoolId: school.id,
          teacherId: teacher.id,
          month,
          year,
          basicSalary: basic,
          hra,
          da,
          travelAllowance: travel,
          providentFund: pf,
          deductions: pf,
          allowances: hra + da + travel,
          netSalary,
          status: "COMPLETED",
          paymentMethod: "BANK_TRANSFER",
          paymentDate: new Date(year, month - 1, 28),
        },
      }).catch(() => {}); // skip if exists
    }
  }

  // ── 22. Salary structures ────────────────────────────────────────────────
  for (const { teacher } of teachers) {
    const salary = 18000;
    await db.salaryStructure.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        basic: Math.round(salary * 0.6),
        hra: Math.round(salary * 0.2),
        da: Math.round(salary * 0.1),
        travelAllowance: Math.round(salary * 0.05),
        providentFund: Math.round(salary * 0.6 * 0.12),
        professionalTax: 200,
      },
    }).catch(() => {});
  }

  // ── 23. Notifications (a few demo ones) ───────────────────────────────────
  console.log("  🔔 Creating sample notifications...");
  const sampleStudents = allStudents.slice(0, 5);
  for (const { student } of sampleStudents) {
    await db.notification.create({
      data: {
        schoolId: school.id,
        userId: student.userId,
        title: "Fee Reminder",
        message: "Your monthly fee for January 2025 is due. Please pay by 10th January.",
        type: "FEE_REMINDER",
        isRead: false,
      },
    });
  }

  // ── 24. Grade scales (CBSE) ───────────────────────────────────────────────
  const cbseGrades = [
    { grade: "A1", minMarks: 91, maxMarks: 100, gradePoint: 10 },
    { grade: "A2", minMarks: 81, maxMarks: 90, gradePoint: 9 },
    { grade: "B1", minMarks: 71, maxMarks: 80, gradePoint: 8 },
    { grade: "B2", minMarks: 61, maxMarks: 70, gradePoint: 7 },
    { grade: "C1", minMarks: 51, maxMarks: 60, gradePoint: 6 },
    { grade: "C2", minMarks: 41, maxMarks: 50, gradePoint: 5 },
    { grade: "D", minMarks: 33, maxMarks: 40, gradePoint: 4 },
    { grade: "E", minMarks: 0, maxMarks: 32, gradePoint: 0 },
  ];

  for (const g of cbseGrades) {
    await db.gradeScale.create({
      data: {
        schoolId: school.id,
        boardType: "CBSE",
        grade: g.grade,
        minMarks: g.minMarks,
        maxMarks: g.maxMarks,
        gradePoint: g.gradePoint,
        isActive: true,
      },
    }).catch(() => {});
  }

  // ── 25. Summary ───────────────────────────────────────────────────────────
  const [studentCount, teacherCount, paymentTotal] = await Promise.all([
    db.student.count({ where: { schoolId: school.id } }),
    db.teacher.count({ where: { schoolId: school.id } }),
    db.feePayment.aggregate({
      where: { schoolId: school.id, status: "COMPLETED" },
      _sum: { paidAmount: true },
    }),
  ]);

  console.log("\n✅ Demo seed complete!\n");
  console.log("─".repeat(50));
  console.log("  School:      Saraswati Convent School, Bijnor");
  console.log(`  URL:         https://${SUBDOMAIN}.sikshamitra.com`);
  console.log("  Admin login: admin@saraswatibijnor.edu.in");
  console.log("  Password:    Demo@1234");
  console.log("─".repeat(50));
  console.log(`  Students:    ${studentCount}`);
  console.log(`  Teachers:    ${teacherCount}`);
  console.log(`  Classes:     10 (with sections A & B)`);
  console.log(`  Attendance:  ${schoolDays.length} days × ${studentCount} students`);
  console.log(`  Fee paid:    ₹${(paymentTotal._sum.paidAmount ?? 0).toLocaleString("en-IN")}`);
  console.log(`  Fee pending: ₹${totalFeesPending.toLocaleString("en-IN")}`);
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());