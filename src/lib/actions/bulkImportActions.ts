"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { parse, isValid } from "date-fns";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@prisma/client";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { sendStudentWelcomeEmail } from "@/lib/utils/email-service";

const BATCH_SIZE = 10;

/**
 * Helper to parse dates from various formats
 */
function parseImportDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  const date = new Date(dateStr);
  if (isValid(date)) return date;

  const formats = [
    "d/M/yyyy",
    "dd/MM/yyyy",
    "M/d/yyyy",
    "MM/dd/yyyy",
    "dd-MM-yyyy",
    "d-M-yyyy",
    "yyyy/MM/dd",
    "yyyy.MM.dd",
  ];

  const now = new Date();
  for (const fmt of formats) {
    const parsed = parse(dateStr, fmt, now);
    if (isValid(parsed)) return parsed;
  }

  throw new Error(`Invalid date format: ${dateStr}. Please use YYYY-MM-DD or DD/MM/YYYY`);
}

// Types for import results
export type ImportResult = {
  success: boolean;
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
};

export type DuplicateHandling = "skip" | "update" | "create";

// Helper: coerce undefined/null/empty strings to undefined for optional CSV fields
const optStr = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((v) => (v == null ? undefined : v.trim() || undefined))
  .optional();
const optStrMax = (max: number) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? undefined : v.trim() || undefined))
    .pipe(z.string().max(max).optional());

// Required string from CSV — coerces undefined/null to empty string so Zod gives a clear message
const reqStr = (msg: string) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "" : v.trim()))
    .pipe(z.string().min(1, msg));

// Expanded student import schema — all fields from studentSchema (optional except required ones)
const studentImportSchema = z.object({
  // Required
  firstName: reqStr("First name is required"),
  lastName: reqStr("Last name is required"),
  email: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "" : v.trim()))
    .pipe(z.string().email("Invalid email format")),
  admissionId: reqStr("Admission ID is required"),
  dateOfBirth: reqStr("Date of birth is required"),
  gender: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "" : v.trim().toUpperCase()))
    .pipe(
      z.enum(["MALE", "FEMALE", "OTHER"], {
        errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
      })
    ),
  // Basic optional
  phone: optStr,
  rollNumber: optStr,
  address: optStr,
  bloodGroup: optStr,
  emergencyContact: optStr,
  emergencyPhone: optStr,
  height: optStr,
  weight: optStr,
  // Indian-specific optional
  aadhaarNumber: optStrMax(12),
  apaarId: optStrMax(50),
  pen: optStrMax(50),
  abcId: optStrMax(50),
  nationality: optStr,
  religion: optStr,
  caste: optStr,
  category: optStr,
  motherTongue: optStr,
  birthPlace: optStr,
  previousSchool: optStr,
  previousClass: optStr,
  tcNumber: optStr,
  medicalConditions: optStr,
  specialNeeds: optStr,
  // Parent/Guardian optional
  fatherName: optStr,
  fatherOccupation: optStr,
  fatherPhone: optStr,
  fatherAadhaar: optStrMax(12),
  motherName: optStr,
  motherOccupation: optStr,
  motherPhone: optStr,
  motherAadhaar: optStrMax(12),
  guardianName: optStr,
  guardianRelation: optStr,
  guardianPhone: optStr,
  guardianAadhaar: optStrMax(12),
});

const teacherImportSchema = z.object({
  firstName: reqStr("First name is required"),
  lastName: reqStr("Last name is required"),
  email: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "" : v.trim()))
    .pipe(z.string().email("Invalid email format")),
  phone: optStr,
  employeeId: reqStr("Employee ID is required"),
  qualification: optStr,
  joinDate: reqStr("Join date is required"),
  salary: optStr,
  departmentId: optStr,
});

const parentImportSchema = z.object({
  firstName: reqStr("First name is required"),
  lastName: reqStr("Last name is required"),
  email: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "" : v.trim()))
    .pipe(z.string().email("Invalid email format")),
  phone: optStr,
  occupation: optStr,
  address: optStr,
  studentAdmissionId: reqStr("Student admission ID is required"),
});

type StudentImportData = z.infer<typeof studentImportSchema>;
type TeacherImportData = z.infer<typeof teacherImportSchema>;
type ParentImportData = z.infer<typeof parentImportSchema>;

/**
 * Validate CSV data before import
 */
export async function validateImportData(
  data: any[],
  type: "student" | "teacher" | "parent"
): Promise<{
  valid: boolean;
  errors: Array<{ row: number; field?: string; message: string }>;
}> {
  const errors: Array<{ row: number; field?: string; message: string }> = [];

  const schema =
    type === "student"
      ? studentImportSchema
      : type === "teacher"
        ? teacherImportSchema
        : parentImportSchema;

  data.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      schema.parse(row);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            row: rowNumber,
            field: err.path.join("."),
            message: err.message,
          });
        });
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

function initImportResult(total: number): ImportResult {
  return {
    success: true,
    summary: { total, created: 0, updated: 0, skipped: 0, failed: 0 },
    errors: [],
  };
}

function handleImportError(error: unknown, rowNumber: number, result: ImportResult) {
  result.summary.failed++;
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      result.errors.push({ row: rowNumber, field: err.path.join("."), message: err.message });
    });
  } else if (error instanceof Error) {
    result.errors.push({ row: rowNumber, message: error.message });
  } else {
    result.errors.push({ row: rowNumber, message: "Unknown error occurred" });
  }
}

/** Process a single student row — returns "created" | "updated" | "skipped" or throws */
async function processStudentRow(
  validated: StudentImportData,
  rowNumber: number,
  schoolId: string,
  schoolName: string,
  classId: string,
  sectionId: string,
  duplicateHandling: DuplicateHandling
): Promise<"created" | "updated" | "skipped"> {
  const existingStudent = await db.student.findFirst({
    where: {
      schoolId,
      OR: [{ user: { email: validated.email } }, { admissionId: validated.admissionId }],
    },
  });

  if (existingStudent) {
    if (duplicateHandling === "skip") return "skipped";
    if (duplicateHandling === "update") {
      await db.student.update({
        where: { id: existingStudent.id },
        data: {
          user: {
            update: {
              firstName: validated.firstName,
              lastName: validated.lastName,
              email: validated.email,
              phone: validated.phone || undefined,
            },
          },
          dateOfBirth: parseImportDate(validated.dateOfBirth),
          gender: validated.gender,
          address: validated.address || undefined,
          bloodGroup: validated.bloodGroup || undefined,
          emergencyContact: validated.emergencyContact || undefined,
          emergencyPhone: validated.emergencyPhone || undefined,
          rollNumber: validated.rollNumber || undefined,
          height: validated.height ? parseFloat(validated.height) : undefined,
          weight: validated.weight ? parseFloat(validated.weight) : undefined,
          aadhaarNumber: validated.aadhaarNumber || undefined,
          apaarId: validated.apaarId || undefined,
          pen: validated.pen || undefined,
          abcId: validated.abcId || undefined,
          nationality: validated.nationality || undefined,
          religion: validated.religion || undefined,
          caste: validated.caste || undefined,
          category: validated.category || undefined,
          motherTongue: validated.motherTongue || undefined,
          birthPlace: validated.birthPlace || undefined,
          previousSchool: validated.previousSchool || undefined,
          previousClass: validated.previousClass || undefined,
          tcNumber: validated.tcNumber || undefined,
          medicalConditions: validated.medicalConditions || undefined,
          specialNeeds: validated.specialNeeds || undefined,
          fatherName: validated.fatherName || undefined,
          fatherOccupation: validated.fatherOccupation || undefined,
          fatherPhone: validated.fatherPhone || undefined,
          fatherAadhaar: validated.fatherAadhaar || undefined,
          motherName: validated.motherName || undefined,
          motherOccupation: validated.motherOccupation || undefined,
          motherPhone: validated.motherPhone || undefined,
          motherAadhaar: validated.motherAadhaar || undefined,
          guardianName: validated.guardianName || undefined,
          guardianRelation: validated.guardianRelation || undefined,
          guardianPhone: validated.guardianPhone || undefined,
          guardianAadhaar: validated.guardianAadhaar || undefined,
        },
      });
      return "updated";
    }
    // "create" falls through
  }

  // Verify class/section belong to this school
  const classExists = await db.class.findUnique({ where: { id: classId, schoolId } });
  if (!classExists) throw new Error(`Class with ID ${classId} not found`);

  const sectionExists = await db.classSection.findUnique({ where: { id: sectionId, schoolId } });
  if (!sectionExists) throw new Error(`Section with ID ${sectionId} not found`);

  const tempPassword = `${validated.firstName.toLowerCase()}@123`;
  const hashedPassword = await hashPassword(tempPassword);

  const newStudent = await db.student.create({
    data: {
      user: {
        create: {
          name: `${validated.firstName} ${validated.lastName}`,
          firstName: validated.firstName,
          lastName: validated.lastName,
          email: validated.email,
          phone: validated.phone || undefined,
          role: "STUDENT" as UserRole,
          passwordHash: hashedPassword,
          emailVerified: new Date(),
          mustChangePassword: true,
        },
      },
      admissionId: validated.admissionId,
      admissionDate: new Date(),
      dateOfBirth: parseImportDate(validated.dateOfBirth),
      gender: validated.gender,
      address: validated.address || undefined,
      bloodGroup: validated.bloodGroup || undefined,
      emergencyContact: validated.emergencyContact || undefined,
      emergencyPhone: validated.emergencyPhone || undefined,
      rollNumber: validated.rollNumber || undefined,
      height: validated.height ? parseFloat(validated.height) : undefined,
      weight: validated.weight ? parseFloat(validated.weight) : undefined,
      aadhaarNumber: validated.aadhaarNumber || undefined,
      apaarId: validated.apaarId || undefined,
      pen: validated.pen || undefined,
      abcId: validated.abcId || undefined,
      nationality: validated.nationality || "Indian",
      religion: validated.religion || undefined,
      caste: validated.caste || undefined,
      category: validated.category || undefined,
      motherTongue: validated.motherTongue || undefined,
      birthPlace: validated.birthPlace || undefined,
      previousSchool: validated.previousSchool || undefined,
      previousClass: validated.previousClass || undefined,
      tcNumber: validated.tcNumber || undefined,
      medicalConditions: validated.medicalConditions || undefined,
      specialNeeds: validated.specialNeeds || undefined,
      fatherName: validated.fatherName || undefined,
      fatherOccupation: validated.fatherOccupation || undefined,
      fatherPhone: validated.fatherPhone || undefined,
      fatherAadhaar: validated.fatherAadhaar || undefined,
      motherName: validated.motherName || undefined,
      motherOccupation: validated.motherOccupation || undefined,
      motherPhone: validated.motherPhone || undefined,
      motherAadhaar: validated.motherAadhaar || undefined,
      guardianName: validated.guardianName || undefined,
      guardianRelation: validated.guardianRelation || undefined,
      guardianPhone: validated.guardianPhone || undefined,
      guardianAadhaar: validated.guardianAadhaar || undefined,
      school: { connect: { id: schoolId } },
    },
  });

  if (validated.email) {
    sendStudentWelcomeEmail({
      to: validated.email,
      studentName: `${validated.firstName} ${validated.lastName}`,
      email: validated.email,
      password: tempPassword,
      schoolName,
    }).catch((err) => console.error("Failed to send student welcome email:", err));
  }

  await db.classEnrollment.create({
    data: {
      studentId: newStudent.id,
      classId,
      sectionId,
      rollNumber: validated.rollNumber || undefined,
      enrollDate: new Date(),
      status: "ACTIVE",
      schoolId,
    },
  });

  return "created";
}

/**
 * Import students in bulk with batch processing.
 * Returns partial results per batch so the client can show progress.
 */
export async function importStudents(
  data: StudentImportData[],
  duplicateHandling: DuplicateHandling = "skip",
  defaultClassId?: string,
  defaultSectionId?: string
): Promise<ImportResult> {
  const { schoolId, user } = await requireSchoolAccess();
  const userId = user?.id;

  if (!userId || !schoolId) {
    return {
      success: false,
      summary: { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [{ row: 0, message: "Unauthorized or School Context Missing" }],
    };
  }

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } });
  const schoolName = school?.name || "Your School";

  const result = initImportResult(data.length);

  // Process in batches
  for (let batchStart = 0; batchStart < data.length; batchStart += BATCH_SIZE) {
    const batch = data.slice(batchStart, batchStart + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (row, batchIndex) => {
        const i = batchStart + batchIndex;
        const rowNumber = i + 2;

        try {
          const validated = studentImportSchema.parse(row);
          const classId = defaultClassId;
          const sectionId = defaultSectionId;

          if (!classId) {
            result.errors.push({ row: rowNumber, field: "classId", message: "Class is required — select from the dropdown" });
            result.summary.failed++;
            return;
          }
          if (!sectionId) {
            result.errors.push({ row: rowNumber, field: "sectionId", message: "Section is required — select from the dropdown" });
            result.summary.failed++;
            return;
          }

          const outcome = await processStudentRow(
            validated, rowNumber, schoolId, schoolName, classId, sectionId, duplicateHandling
          );
          result.summary[outcome === "created" ? "created" : outcome === "updated" ? "updated" : "skipped"]++;
        } catch (error) {
          handleImportError(error, rowNumber, result);
        }
      })
    );
  }

  result.success = result.summary.failed === 0;
  return result;
}

/**
 * Import students in batches, returning progress after each batch.
 * Used by the streaming progress endpoint.
 */
export async function importStudentsBatched(
  data: StudentImportData[],
  duplicateHandling: DuplicateHandling = "skip",
  defaultClassId?: string,
  defaultSectionId?: string,
  batchIndex: number = 0
): Promise<ImportResult & { nextBatch: number | null }> {
  const { schoolId, user } = await requireSchoolAccess();
  const userId = user?.id;

  if (!userId || !schoolId) {
    return {
      success: false,
      summary: { total: data.length, created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [{ row: 0, message: "Unauthorized or School Context Missing" }],
      nextBatch: null,
    };
  }

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true } });
  const schoolName = school?.name || "Your School";

  const batchStart = batchIndex * BATCH_SIZE;
  const batch = data.slice(batchStart, batchStart + BATCH_SIZE);
  const result = initImportResult(data.length);

  await Promise.allSettled(
    batch.map(async (row, idx) => {
      const rowNumber = batchStart + idx + 2;
      try {
        const validated = studentImportSchema.parse(row);
        const classId = defaultClassId;
        const sectionId = defaultSectionId;

        if (!classId) {
          result.errors.push({ row: rowNumber, field: "classId", message: "Class is required — select from the dropdown" });
          result.summary.failed++;
          return;
        }
        if (!sectionId) {
          result.errors.push({ row: rowNumber, field: "sectionId", message: "Section is required — select from the dropdown" });
          result.summary.failed++;
          return;
        }

        const outcome = await processStudentRow(
          validated, rowNumber, schoolId, schoolName, classId, sectionId, duplicateHandling
        );
        result.summary[outcome === "created" ? "created" : outcome === "updated" ? "updated" : "skipped"]++;
      } catch (error) {
        handleImportError(error, rowNumber, result);
      }
    })
  );

  const nextBatchStart = batchStart + BATCH_SIZE;
  const nextBatch = nextBatchStart < data.length ? batchIndex + 1 : null;
  result.success = result.summary.failed === 0;

  return { ...result, nextBatch };
}

/**
 * Import teachers in bulk
 */
export async function importTeachers(
  data: TeacherImportData[],
  duplicateHandling: DuplicateHandling = "skip"
): Promise<ImportResult> {
  const { schoolId, user } = await requireSchoolAccess();
  const userId = user?.id;

  if (!userId || !schoolId) {
    return {
      success: false,
      summary: { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [{ row: 0, message: "Unauthorized or School Context Missing" }],
    };
  }

  const result = initImportResult(data.length);

  for (let batchStart = 0; batchStart < data.length; batchStart += BATCH_SIZE) {
    const batch = data.slice(batchStart, batchStart + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (row, batchIndex) => {
        const rowNumber = batchStart + batchIndex + 2;
        try {
          const validated = teacherImportSchema.parse(row);

          const existingTeacher = await db.teacher.findFirst({
            where: {
              schoolId,
              OR: [{ user: { email: validated.email } }, { employeeId: validated.employeeId }],
            },
          });

          if (existingTeacher) {
            if (duplicateHandling === "skip") { result.summary.skipped++; return; }
            if (duplicateHandling === "update") {
              await db.teacher.update({
                where: { id: existingTeacher.id },
                data: {
                  user: { update: { firstName: validated.firstName, lastName: validated.lastName, email: validated.email, phone: validated.phone } },
                  qualification: validated.qualification,
                  joinDate: parseImportDate(validated.joinDate),
                  salary: validated.salary ? parseFloat(validated.salary) : undefined,
                },
              });
              result.summary.updated++;
              return;
            }
          }

          if (validated.departmentId) {
            const departmentExists = await db.department.findUnique({ where: { id: validated.departmentId } });
            if (!departmentExists) {
              result.errors.push({ row: rowNumber, field: "departmentId", message: `Department with ID ${validated.departmentId} not found` });
              result.summary.failed++;
              return;
            }
          }

          const { randomBytes } = await import("crypto");
          const tempPassword = randomBytes(12).toString("base64url");
          const hashedPassword = await hashPassword(tempPassword);

          await db.teacher.create({
            data: {
              user: {
                create: {
                  name: `${validated.firstName} ${validated.lastName}`,
                  firstName: validated.firstName,
                  lastName: validated.lastName,
                  email: validated.email,
                  phone: validated.phone,
                  role: "TEACHER" as UserRole,
                  passwordHash: hashedPassword,
                  emailVerified: new Date(),
                },
              },
              employeeId: validated.employeeId,
              qualification: validated.qualification,
              joinDate: parseImportDate(validated.joinDate),
              salary: validated.salary ? parseFloat(validated.salary) : undefined,
              school: { connect: { id: schoolId } },
            },
          });
          result.summary.created++;
        } catch (error) {
          handleImportError(error, rowNumber, result);
        }
      })
    );
  }

  result.success = result.summary.failed === 0;
  return result;
}

/**
 * Import parents in bulk
 */
export async function importParents(
  data: ParentImportData[],
  duplicateHandling: DuplicateHandling = "skip"
): Promise<ImportResult> {
  const { schoolId, user } = await requireSchoolAccess();
  const userId = user?.id;

  if (!userId || !schoolId) {
    return {
      success: false,
      summary: { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [{ row: 0, message: "Unauthorized or School Context Missing" }],
    };
  }

  const result = initImportResult(data.length);

  for (let batchStart = 0; batchStart < data.length; batchStart += BATCH_SIZE) {
    const batch = data.slice(batchStart, batchStart + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (row, batchIndex) => {
        const rowNumber = batchStart + batchIndex + 2;
        try {
          const validated = parentImportSchema.parse(row);

          const student = await db.student.findUnique({
            where: { admissionId: validated.studentAdmissionId, schoolId },
          });

          if (!student) {
            result.errors.push({ row: rowNumber, field: "studentAdmissionId", message: `Student with admission ID ${validated.studentAdmissionId} not found` });
            result.summary.failed++;
            return;
          }

          const existingParent = await db.parent.findFirst({
            where: { schoolId, user: { email: validated.email } },
          });

          if (existingParent) {
            if (duplicateHandling === "skip") { result.summary.skipped++; return; }
            if (duplicateHandling === "update") {
              await db.parent.update({
                where: { id: existingParent.id },
                data: {
                  user: { update: { firstName: validated.firstName, lastName: validated.lastName, phone: validated.phone } },
                  occupation: validated.occupation,
                },
              });
              const existingAssoc = await db.studentParent.findFirst({
                where: { schoolId, parentId: existingParent.id, studentId: student.id },
              });
              if (!existingAssoc) {
                await db.studentParent.create({
                  data: { parentId: existingParent.id, studentId: student.id, isPrimary: false, schoolId },
                });
              }
              result.summary.updated++;
              return;
            }
          }

          const { randomBytes } = await import("crypto");
          const tempPassword = randomBytes(12).toString("base64url");
          const hashedPassword = await hashPassword(tempPassword);

          const newParent = await db.parent.create({
            data: {
              user: {
                create: {
                  name: `${validated.firstName} ${validated.lastName}`,
                  firstName: validated.firstName,
                  lastName: validated.lastName,
                  email: validated.email,
                  phone: validated.phone,
                  role: "PARENT" as UserRole,
                  passwordHash: hashedPassword,
                  emailVerified: new Date(),
                },
              },
              occupation: validated.occupation,
              school: { connect: { id: schoolId } },
            },
          });

          await db.studentParent.create({
            data: { parentId: newParent.id, studentId: student.id, isPrimary: false, schoolId },
          });

          result.summary.created++;
        } catch (error) {
          handleImportError(error, rowNumber, result);
        }
      })
    );
  }

  result.success = result.summary.failed === 0;
  return result;
}
