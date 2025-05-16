import * as z from "zod";

// Define the base schema for leave applications
export const leaveApplicationSchema = z.object({
  applicantId: z.string({
    required_error: "Applicant ID is required",
  }),
  applicantType: z.enum(["STUDENT", "TEACHER"], {
    required_error: "Applicant type is required",
  }),
  fromDate: z.date({
    required_error: "From date is required",
  }),
  toDate: z.date({
    required_error: "To date is required",
  }),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).default("PENDING"),
  remarks: z.string().optional(),
}).refine(data => {
  if (!data.fromDate || !data.toDate || !(data.fromDate instanceof Date) || !(data.toDate instanceof Date)) {
    return true; // Skip validation if dates are not valid
  }
  return data.toDate >= data.fromDate;
}, {
  message: "End date must be after start date",
  path: ["toDate"],
});

// Extend the base schema for updates
export const leaveApplicationUpdateSchema = z.object({
  id: z.string().min(1, "Leave application ID is required"),
  applicantId: z.string({
    required_error: "Applicant ID is required",
  }),
  applicantType: z.enum(["STUDENT", "TEACHER"], {
    required_error: "Applicant type is required",
  }),
  fromDate: z.date({
    required_error: "From date is required",
  }),
  toDate: z.date({
    required_error: "To date is required",
  }),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).default("PENDING"),
  remarks: z.string().optional(),
}).refine(data => {
  if (!data.fromDate || !data.toDate || !(data.fromDate instanceof Date) || !(data.toDate instanceof Date)) {
    return true; // Skip validation if dates are not valid
  }
  return data.toDate >= data.fromDate;
}, {
  message: "End date must be after start date",
  path: ["toDate"],
});

// Schema for approving or rejecting leave applications
export const leaveApprovalSchema = z.object({
  id: z.string().min(1, "Leave application ID is required"),
  status: z.enum(["APPROVED", "REJECTED"], {
    required_error: "Approval status is required",
  }),
  approvedById: z.string({
    required_error: "Approver ID is required",
  }),
  remarks: z.string().optional(),
});

// Define the TypeScript types based on the schemas
export type LeaveApplicationFormValues = z.infer<typeof leaveApplicationSchema>;
export type LeaveApplicationUpdateFormValues = z.infer<typeof leaveApplicationUpdateSchema>;
export type LeaveApprovalFormValues = z.infer<typeof leaveApprovalSchema>;
