import * as z from "zod";

export const assessmentRuleSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    classId: z.string().optional().nullable(),
    subjectId: z.string().optional().nullable(),
    termId: z.string().optional().nullable(),
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

// ---------------------------------------------------------------------------
// PT Pattern schemas — one PT pattern per term; ptStartNumber is auto-computed
// by the wizard (chronological order across selected terms).
// ---------------------------------------------------------------------------

export const ptGroupDefinitionSchema = z.object({
    ptNumbers: z.array(z.number().int().min(1).max(4)).min(1, "Pick at least one PT"),
    op: z.enum(["BEST_OF", "AVERAGE", "SUM"]),
    count: z.coerce.number().int().min(1).max(4).optional(),
    weight: z.coerce.number().min(0.01).max(1),
});

export const ptPatternConfigSchema = z.object({
    ptCount: z.coerce.number().int().min(1).max(4),
    ptStartNumber: z.coerce.number().int().min(1).max(16),
    perMarks: z.coerce.number().min(0.01),
    passingMarks: z.coerce.number().min(0),
    aggregation: z.enum(["SUM", "AVERAGE", "BEST_OF", "USE_LAST", "CUSTOM_GROUPS"]),
    bestOfCount: z.coerce.number().int().min(1).max(4).optional(),
    groups: z.array(ptGroupDefinitionSchema).optional(),
}).refine(
    (v) => v.passingMarks <= v.perMarks,
    { message: "Passing marks cannot exceed marks per PT", path: ["passingMarks"] },
);

export const ptPatternApplySchema = z.object({
    name: z.string().min(1, "Name is required"),
    classId: z.string().optional().nullable(),
    termId: z.string().min(1, "termId is required (one PT pattern per term)"),
    cbseLevel: z.string().optional().nullable(),
    config: ptPatternConfigSchema,
    scopeClassIds: z.array(z.string().min(1)).min(1, "Select at least one class"),
});

export type PTGroupDefinitionSchema = z.infer<typeof ptGroupDefinitionSchema>;
export type PTPatternConfigSchema = z.infer<typeof ptPatternConfigSchema>;
export type PTPatternApplySchema = z.infer<typeof ptPatternApplySchema>;
