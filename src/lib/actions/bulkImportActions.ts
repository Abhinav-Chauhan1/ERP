"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

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

// Validation schemas for different import types
const studentImportSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  admissionId: z.string().min(1, "Admission ID is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
  }),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  classId: z.string().min(1, "Class ID is required"),
  sectionId: z.string().min(1, "Section ID is required"),
  rollNumber: z.string().optional(),
});

const teacherImportSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  qualification: z.string().optional(),
  joinDate: z.string().min(1, "Join date is required"),
  salary: z.string().optional(),
  departmentId: z.string().optional(),
});

const parentImportSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  studentAdmissionId: z.string().min(1, "Student admission ID is required"),
});

type StudentImportData = z.infer<typeof studentImportSchema>;
type TeacherImportData = z.infer<typeof teacherImportSchema>;
type ParentImportData = z.infer<typeof parentImportSchema>;

/**
 * Validate CSV data before import
 * Requirement 26.1: Validate data format and display errors before import
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
    const rowNumber = index + 2; // +2 because index starts at 0 and row 1 is header
    
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

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Import students in bulk
 * Requirement 26.2: Support bulk student enrollment with class assignments
 * Requirement 26.3: Provide detailed error messages with row numbers
 * Requirement 26.4: Display summary of records created, updated, and skipped
 * Requirement 26.5: Provide options to skip, update, or create new records
 */
export async function importStudents(
  data: StudentImportData[],
  duplicateHandling: DuplicateHandling = "skip"
): Promise<ImportResult> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      summary: { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [{ row: 0, message: "Unauthorized" }],
    };
  }

  const result: ImportResult = {
    success: true,
    summary: {
      total: data.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    },
    errors: [],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 because index starts at 0 and row 1 is header

    try {
      // Validate the row
      const validated = studentImportSchema.parse(row);

      // Check if student already exists
      const existingStudent = await db.student.findFirst({
        where: {
          OR: [
            { 
              user: {
                email: validated.email
              }
            },
            { admissionId: validated.admissionId },
          ],
        },
      });

      if (existingStudent) {
        // Handle duplicate based on strategy
        if (duplicateHandling === "skip") {
          result.summary.skipped++;
          continue;
        } else if (duplicateHandling === "update") {
          // Update existing student and user
          await db.student.update({
            where: { id: existingStudent.id },
            data: {
              user: {
                update: {
                  firstName: validated.firstName,
                  lastName: validated.lastName,
                  email: validated.email,
                  phone: validated.phone,
                }
              },
              dateOfBirth: new Date(validated.dateOfBirth),
              gender: validated.gender,
              address: validated.address,
              bloodGroup: validated.bloodGroup,
              emergencyContact: validated.emergencyContact,
              rollNumber: validated.rollNumber,
            },
          });
          result.summary.updated++;
          continue;
        }
        // If "create", fall through to create a new record with different ID
      }

      // Verify class exists
      const classExists = await db.class.findUnique({
        where: { id: validated.classId },
      });

      if (!classExists) {
        result.errors.push({
          row: rowNumber,
          field: "classId",
          message: `Class with ID ${validated.classId} not found`,
        });
        result.summary.failed++;
        continue;
      }

      // Verify section exists (required for enrollment)
      if (!validated.sectionId) {
        result.errors.push({
          row: rowNumber,
          field: "sectionId",
          message: "Section ID is required for enrollment",
        });
        result.summary.failed++;
        continue;
      }

      const sectionExists = await db.classSection.findUnique({
        where: { id: validated.sectionId },
      });

      if (!sectionExists) {
        result.errors.push({
          row: rowNumber,
          field: "sectionId",
          message: `Section with ID ${validated.sectionId} not found`,
        });
        result.summary.failed++;
        continue;
      }

      // Create new student with user and enrollment
      const newStudent = await db.student.create({
        data: {
          user: {
            create: {
              firstName: validated.firstName,
              lastName: validated.lastName,
              email: validated.email,
              phone: validated.phone,
              clerkId: `temp_${validated.email}_${Date.now()}`, // Temporary clerk ID until user signs up
              role: "STUDENT",
            }
          },
          admissionId: validated.admissionId,
          admissionDate: new Date(),
          dateOfBirth: new Date(validated.dateOfBirth),
          gender: validated.gender,
          address: validated.address,
          bloodGroup: validated.bloodGroup,
          emergencyContact: validated.emergencyContact,
          rollNumber: validated.rollNumber,
        },
      });

      // Create class enrollment
      await db.classEnrollment.create({
        data: {
          studentId: newStudent.id,
          classId: validated.classId,
          sectionId: validated.sectionId,
          rollNumber: validated.rollNumber,
          enrollDate: new Date(),
          status: "ACTIVE",
        },
      });

      result.summary.created++;
    } catch (error) {
      result.summary.failed++;
      
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          result.errors.push({
            row: rowNumber,
            field: err.path.join("."),
            message: err.message,
          });
        });
      } else if (error instanceof Error) {
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      } else {
        result.errors.push({
          row: rowNumber,
          message: "Unknown error occurred",
        });
      }
    }
  }

  result.success = result.summary.failed === 0;
  return result;
}

/**
 * Import teachers in bulk
 */
export async function importTeachers(
  data: TeacherImportData[],
  duplicateHandling: DuplicateHandling = "skip"
): Promise<ImportResult> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      summary: { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [{ row: 0, message: "Unauthorized" }],
    };
  }

  const result: ImportResult = {
    success: true,
    summary: {
      total: data.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    },
    errors: [],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;

    try {
      const validated = teacherImportSchema.parse(row);

      // Check if teacher already exists
      const existingTeacher = await db.teacher.findFirst({
        where: {
          OR: [
            { 
              user: {
                email: validated.email
              }
            },
            { employeeId: validated.employeeId },
          ],
        },
      });

      if (existingTeacher) {
        if (duplicateHandling === "skip") {
          result.summary.skipped++;
          continue;
        } else if (duplicateHandling === "update") {
          await db.teacher.update({
            where: { id: existingTeacher.id },
            data: {
              user: {
                update: {
                  firstName: validated.firstName,
                  lastName: validated.lastName,
                  email: validated.email,
                  phone: validated.phone,
                }
              },
              qualification: validated.qualification,
              joinDate: new Date(validated.joinDate),
              salary: validated.salary ? parseFloat(validated.salary) : undefined,
            },
          });
          result.summary.updated++;
          continue;
        }
      }

      // Verify department exists if provided
      if (validated.departmentId) {
        const departmentExists = await db.department.findUnique({
          where: { id: validated.departmentId },
        });

        if (!departmentExists) {
          result.errors.push({
            row: rowNumber,
            field: "departmentId",
            message: `Department with ID ${validated.departmentId} not found`,
          });
          result.summary.failed++;
          continue;
        }
      }

      // Create new teacher with user
      await db.teacher.create({
        data: {
          user: {
            create: {
              firstName: validated.firstName,
              lastName: validated.lastName,
              email: validated.email,
              phone: validated.phone,
              clerkId: `temp_${validated.email}_${Date.now()}`, // Temporary clerk ID until user signs up
              role: "TEACHER",
            }
          },
          employeeId: validated.employeeId,
          qualification: validated.qualification,
          joinDate: new Date(validated.joinDate),
          salary: validated.salary ? parseFloat(validated.salary) : undefined,
        },
      });

      result.summary.created++;
    } catch (error) {
      result.summary.failed++;
      
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          result.errors.push({
            row: rowNumber,
            field: err.path.join("."),
            message: err.message,
          });
        });
      } else if (error instanceof Error) {
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      } else {
        result.errors.push({
          row: rowNumber,
          message: "Unknown error occurred",
        });
      }
    }
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
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      summary: { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [{ row: 0, message: "Unauthorized" }],
    };
  }

  const result: ImportResult = {
    success: true,
    summary: {
      total: data.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    },
    errors: [],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;

    try {
      const validated = parentImportSchema.parse(row);

      // Find the student by admission ID
      const student = await db.student.findUnique({
        where: { admissionId: validated.studentAdmissionId },
      });

      if (!student) {
        result.errors.push({
          row: rowNumber,
          field: "studentAdmissionId",
          message: `Student with admission ID ${validated.studentAdmissionId} not found`,
        });
        result.summary.failed++;
        continue;
      }

      // Check if parent already exists
      const existingParent = await db.parent.findFirst({
        where: { 
          user: {
            email: validated.email
          }
        },
      });

      if (existingParent) {
        if (duplicateHandling === "skip") {
          result.summary.skipped++;
          continue;
        } else if (duplicateHandling === "update") {
          await db.parent.update({
            where: { id: existingParent.id },
            data: {
              user: {
                update: {
                  firstName: validated.firstName,
                  lastName: validated.lastName,
                  phone: validated.phone,
                }
              },
              occupation: validated.occupation,
            },
          });
          
          // Create parent-student association if it doesn't exist
          const existingAssociation = await db.studentParent.findFirst({
            where: {
              parentId: existingParent.id,
              studentId: student.id,
            },
          });

          if (!existingAssociation) {
            await db.studentParent.create({
              data: {
                parentId: existingParent.id,
                studentId: student.id,
                isPrimary: false,
              },
            });
          }

          result.summary.updated++;
          continue;
        }
      }

      // Create new parent with user
      const newParent = await db.parent.create({
        data: {
          user: {
            create: {
              firstName: validated.firstName,
              lastName: validated.lastName,
              email: validated.email,
              phone: validated.phone,
              clerkId: `temp_${validated.email}_${Date.now()}`, // Temporary clerk ID until user signs up
              role: "PARENT",
            }
          },
          occupation: validated.occupation,
        },
      });

      // Create parent-student association
      await db.studentParent.create({
        data: {
          parentId: newParent.id,
          studentId: student.id,
          isPrimary: false,
        },
      });

      result.summary.created++;
    } catch (error) {
      result.summary.failed++;
      
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          result.errors.push({
            row: rowNumber,
            field: err.path.join("."),
            message: err.message,
          });
        });
      } else if (error instanceof Error) {
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      } else {
        result.errors.push({
          row: rowNumber,
           
        message: "Unknown error occurred",
        });
      }
    }
  }

  result.success = result.summary.failed === 0;
  return result;
}
