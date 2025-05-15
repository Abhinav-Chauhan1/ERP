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
  department: z.string().optional(),
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

export const createStudentSchema = baseUserSchema
  .extend({
    role: z.literal(UserRole.STUDENT),
  })
  .and(studentSchema)
  .and(passwordSchema);

export const createParentSchema = baseUserSchema
  .extend({
    role: z.literal(UserRole.PARENT),
  })
  .and(parentSchema)
  .and(passwordSchema);

// Types for form data
export type CreateAdministratorFormData = z.infer<typeof createAdministratorSchema>;
export type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;
export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
export type CreateParentFormData = z.infer<typeof createParentSchema>;
