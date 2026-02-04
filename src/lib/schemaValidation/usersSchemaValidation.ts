import { z } from "zod";
import { UserRole } from "@prisma/client";

// Base user schema with common fields for all user types
export const baseUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  role: z.enum([UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT]),
  active: z.boolean().default(true),
});

// Base user schema for students and parents (email optional, phone required for mobile login)
export const mobileAuthUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number is required for login"),
  avatar: z.string().url().optional(),
  role: z.enum([UserRole.STUDENT, UserRole.PARENT]),
  active: z.boolean().default(true),
});

// Password validation schema
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Administrator-specific schema
export const administratorSchema = z.object({
  position: z.string().optional(),

});

// Teacher-specific schema
export const teacherSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  qualification: z.string().optional(),
  joinDate: z.date({
    required_error: "Join date is required",
    invalid_type_error: "Join date must be a valid date",
  }),
  salary: z.number().positive().optional(),
});

// Student-specific schema
export const studentSchema = z.object({
  admissionId: z.string().min(1, "Admission ID is required"),
  admissionDate: z.date({
    required_error: "Admission date is required",
    invalid_type_error: "Admission date must be a valid date",
  }),
  rollNumber: z.string().optional(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Date of birth must be a valid date",
  }),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),

  // Indian-specific fields
  aadhaarNumber: z.string().max(12, "Aadhaar number must be 12 digits").optional(),
  apaarId: z.string().max(50, "APAAR ID must be 50 characters or less").optional(),
  pen: z.string().max(50, "PEN must be 50 characters or less").optional(),
  abcId: z.string().max(50, "ABC ID must be 50 characters or less").optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  category: z.string().optional(),
  motherTongue: z.string().optional(),
  birthPlace: z.string().optional(),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  tcNumber: z.string().optional(),
  medicalConditions: z.string().optional(),
  specialNeeds: z.string().optional(),

  // Parent/Guardian details (email removed - mobile-only authentication)
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherAadhaar: z.string().max(12, "Aadhaar must be 12 digits").optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherPhone: z.string().optional(),
  motherAadhaar: z.string().max(12, "Aadhaar must be 12 digits").optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianAadhaar: z.string().max(12, "Aadhaar must be 12 digits").optional(),
});

// Parent-specific schema
export const parentSchema = z.object({
  occupation: z.string().optional(),
  alternatePhone: z.string().optional(),
  relation: z.string().optional(),
});

// Complete schemas for each role by combining base schema with role-specific schema
export const createAdministratorSchema = baseUserSchema
  .extend({
    role: z.literal(UserRole.ADMIN),
  })
  .and(administratorSchema)
  .and(passwordSchema);

export const createTeacherSchema = baseUserSchema
  .extend({
    role: z.literal(UserRole.TEACHER),
  })
  .and(teacherSchema)
  .and(passwordSchema);

// Students and parents use mobile-only authentication (no password)
export const createStudentSchema = mobileAuthUserSchema
  .extend({
    role: z.literal(UserRole.STUDENT),
  })
  .and(studentSchema);

export const createParentSchema = mobileAuthUserSchema
  .extend({
    role: z.literal(UserRole.PARENT),
  })
  .and(parentSchema);

// Types for form data
export type CreateAdministratorFormData = z.infer<typeof createAdministratorSchema>;
export type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;
export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
export type CreateParentFormData = z.infer<typeof createParentSchema>;
