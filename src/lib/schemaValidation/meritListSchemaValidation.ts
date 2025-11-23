import { z } from "zod";

// Merit List Criteria Schema
export const meritListCriteriaSchema = z.object({
  field: z.enum([
    "submittedAt", // Earlier submission gets higher rank
    "dateOfBirth", // Older/younger based on order
    "previousSchool", // Can be used for priority
    // Add more criteria as needed
  ]),
  weight: z.number().min(0).max(100), // Weight percentage (0-100)
  order: z.enum(["asc", "desc"]), // asc = lower value gets higher rank, desc = higher value gets higher rank
});

// Merit List Config Schema
export const meritListConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  appliedClassId: z.string().min(1, "Class is required"),
  criteria: z.array(meritListCriteriaSchema).min(1, "At least one criterion is required"),
});

export type MeritListCriteriaFormValues = z.infer<typeof meritListCriteriaSchema>;
export type MeritListConfigFormValues = z.infer<typeof meritListConfigSchema>;

// Generate Merit List Schema
export const generateMeritListSchema = z.object({
  configId: z.string().min(1, "Configuration is required"),
  appliedClassId: z.string().min(1, "Class is required"),
});

export type GenerateMeritListFormValues = z.infer<typeof generateMeritListSchema>;
