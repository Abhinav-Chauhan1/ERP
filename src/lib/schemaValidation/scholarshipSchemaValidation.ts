import { z } from "zod";

// Scholarship Schema
export const scholarshipSchema = z.object({
  name: z.string().min(1, "Scholarship name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().optional().nullable(),
  type: z.enum(["MERIT", "NEED_BASED", "SPORTS", "ARTS", "OTHER"], {
    required_error: "Scholarship type is required",
  }),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  percentage: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, {
    message: "Percentage must be between 0 and 100",
  }),
  eligibilityCriteria: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  maxRecipients: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const num = parseInt(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Max recipients must be a positive number",
  }),
  status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).default("ACTIVE"),
});

export type ScholarshipFormValues = z.infer<typeof scholarshipSchema>;

// Update Scholarship Schema
export const updateScholarshipSchema = scholarshipSchema.extend({
  id: z.string(),
});

export type UpdateScholarshipFormValues = z.infer<typeof updateScholarshipSchema>;

// Award Scholarship Schema
export const awardScholarshipSchema = z.object({
  scholarshipId: z.string().min(1, "Scholarship is required"),
  studentId: z.string().min(1, "Student is required"),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type AwardScholarshipFormValues = z.infer<typeof awardScholarshipSchema>;
