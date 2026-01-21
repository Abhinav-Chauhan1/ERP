import * as z from "zod";

export const assessmentRuleSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    classId: z.string().optional().nullable(),
    subjectId: z.string().optional().nullable(),
    ruleType: z.enum(["BEST_OF", "AVERAGE", "WEIGHTED_AVERAGE", "SUM"]),
    examTypes: z.array(z.string()).min(1, "Select at least one exam type"),
    count: z.coerce.number().optional().nullable(),
    weight: z.coerce.number().min(0).max(1).default(1.0),
});

export const assessmentRuleUpdateSchema = assessmentRuleSchema.extend({
    id: z.string().min(1, "ID is required"),
});

export type AssessmentRuleFormValues = z.infer<typeof assessmentRuleSchema>;
export type AssessmentRuleUpdateFormValues = z.infer<typeof assessmentRuleUpdateSchema>;
