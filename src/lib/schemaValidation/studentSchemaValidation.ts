import * as z from "zod";

// Schema for parent relationship in student form
const parentSchema = z.object({
  parentId: z.string(),
  isPrimary: z.boolean().default(false),
});

// Schema for student creation
export const studentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  admissionId: z.string().min(3, "Admission ID must be at least 3 characters"),
  rollNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  admissionDate: z.date({
    required_error: "Admission date is required",
  }),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  classId: z.string({
    required_error: "Class is required",
  }),
  sectionId: z.string({
    required_error: "Section is required",
  }),
  parents: z.array(parentSchema).optional(),
});

// Schema for student update
export const studentUpdateSchema = studentSchema.extend({
  id: z.string().min(1, "Student ID is required"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
export type StudentUpdateFormValues = z.infer<typeof studentUpdateSchema>;
