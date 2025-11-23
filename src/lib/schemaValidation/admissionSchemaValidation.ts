import * as z from "zod";

// Schema for admission application creation
export const admissionApplicationSchema = z.object({
  studentName: z.string().min(2, "Student name must be at least 2 characters"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Gender is required",
  }),
  parentName: z.string().min(2, "Parent name must be at least 2 characters"),
  parentEmail: z.string().email("Invalid email address"),
  parentPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  previousSchool: z.string().optional(),
  appliedClassId: z.string({
    required_error: "Applied class is required",
  }),
  
  // Indian-specific fields
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional(),
  abcId: z.string().optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  category: z.enum(["GENERAL", "OBC", "SC", "ST", "EWS"]).optional(),
  motherTongue: z.string().optional(),
  birthPlace: z.string().optional(),
  bloodGroup: z.string().optional(),
  tcNumber: z.string().optional(),
  medicalConditions: z.string().optional(),
  specialNeeds: z.string().optional(),
  
  // Parent/Guardian details
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherEmail: z.string().email("Invalid father email").optional().or(z.literal("")),
  fatherAadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherPhone: z.string().optional(),
  motherEmail: z.string().email("Invalid mother email").optional().or(z.literal("")),
  motherAadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email("Invalid guardian email").optional().or(z.literal("")),
  guardianAadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),
  annualIncome: z.number().optional(),
});

export type AdmissionApplicationFormValues = z.infer<typeof admissionApplicationSchema>;

// Schema for document upload
export const documentUploadSchema = z.object({
  type: z.enum(["BIRTH_CERTIFICATE", "PREVIOUS_REPORT_CARD", "PHOTOGRAPH", "OTHER"]),
  file: z.instanceof(File, { message: "File is required" }),
});

export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

// Extended schema for admission application with documents
export const admissionApplicationWithDocumentsSchema = admissionApplicationSchema.extend({
  documents: z.array(z.object({
    type: z.enum(["BIRTH_CERTIFICATE", "PREVIOUS_REPORT_CARD", "PHOTOGRAPH", "OTHER"]),
    url: z.string().url(),
    filename: z.string(),
  })).optional(),
});
