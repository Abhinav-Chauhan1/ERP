import * as z from "zod";

// Enums matching Prisma schema
export const SyllabusStatusEnum = z.enum([
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
]);

export const AssessmentTypeEnum = z.enum([
  "GRADED",
  "CO_SCHOLASTIC",
]);

export const CurriculumTypeEnum = z.enum([
  "GENERAL",
  "ADVANCED",
  "REMEDIAL",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIAL_NEEDS",
]);

export const DifficultyLevelEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
]);

export const ScopeTypeEnum = z.enum([
  "SUBJECT_WIDE",
  "CLASS_WIDE",
  "SECTION_SPECIFIC",
]);

// Base syllabus schema without refinements
const baseSyllabusSchema = z.object({
  // Basic info
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  subjectId: z.string({
    required_error: "Please select a subject",
  }),
  document: z.string().optional(),

  // Scope selection
  scopeType: ScopeTypeEnum.default("SUBJECT_WIDE"),
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),

  // Curriculum details
  curriculumType: CurriculumTypeEnum.default("GENERAL"),
  boardType: z.string().optional(),
  assessmentType: AssessmentTypeEnum.default("GRADED"),

  // Metadata
  version: z.string().default("1.0"),
  difficultyLevel: DifficultyLevelEnum.default("INTERMEDIATE"),
  estimatedHours: z.coerce.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  prerequisites: z.string().optional(),

  // Scheduling
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
});

// Refinement function to apply validation rules
const applySyllabusRefinements = <T extends typeof baseSyllabusSchema>(schema: T) => {
  return schema
    .refine(
      (data) => {
        // Validate class-wide requires classId
        if (data.scopeType === "CLASS_WIDE") {
          return !!data.classId;
        }
        return true;
      },
      {
        message: "Class must be selected for class-wide syllabus",
        path: ["classId"],
      }
    )
    .refine(
      (data) => {
        // Validate section-specific requires classId and sectionId
        if (data.scopeType === "SECTION_SPECIFIC") {
          return !!data.classId && !!data.sectionId;
        }
        return true;
      },
      {
        message: "Class and section must be selected for section-specific syllabus",
        path: ["sectionId"],
      }
    )
    .refine(
      (data) => {
        // Validate effectiveTo is after effectiveFrom
        if (data.effectiveFrom && data.effectiveTo) {
          return data.effectiveTo > data.effectiveFrom;
        }
        return true;
      },
      {
        message: "End date must be after start date",
        path: ["effectiveTo"],
      }
    );
};

// Enhanced syllabus form schema with refinements
export const syllabusSchema = applySyllabusRefinements(baseSyllabusSchema);

// Base update schema (extend before applying refinements)
const baseSyllabusUpdateSchema = baseSyllabusSchema.extend({
  id: z.string().min(1, "Syllabus ID is required"),
});

// Update schema with id field and refinements
export const syllabusUpdateSchema = applySyllabusRefinements(baseSyllabusUpdateSchema);

// Scope filter schema for querying syllabi
export const syllabusScopeFilterSchema = z.object({
  subjectId: z.string().optional(),
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  curriculumType: CurriculumTypeEnum.optional(),
  boardType: z.string().optional(),
  status: z.array(SyllabusStatusEnum).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  effectiveDate: z.coerce.date().optional(), // Filter by effective date range
});

export const syllabusUnitSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  order: z.coerce.number().min(1, "Order must be at least 1"),
  syllabusId: z.string({
    required_error: "Syllabus ID is required",
  }),
});

export const syllabusUnitUpdateSchema = syllabusUnitSchema.extend({
  id: z.string().min(1, "Unit ID is required"),
});

export const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  content: z.string().optional(),
  resources: z.string().optional(),
  duration: z.coerce.number().optional(),
  subjectId: z.string({
    required_error: "Subject ID is required",
  }),
  syllabusUnitId: z.string().optional(),
});

export const lessonUpdateSchema = lessonSchema.extend({
  id: z.string().min(1, "Lesson ID is required"),
});

export type SyllabusFormValues = z.infer<typeof syllabusSchema>;
export type SyllabusUpdateFormValues = z.infer<typeof syllabusUpdateSchema>;
export type SyllabusScopeFilterValues = z.infer<typeof syllabusScopeFilterSchema>;
export type SyllabusUnitFormValues = z.infer<typeof syllabusUnitSchema>;
export type SyllabusUnitUpdateFormValues = z.infer<typeof syllabusUnitUpdateSchema>;
export type LessonFormValues = z.infer<typeof lessonSchema>;
export type LessonUpdateFormValues = z.infer<typeof lessonUpdateSchema>;

// Enhanced Syllabus Schemas

export const subModuleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  order: z.coerce.number().int().min(1),
  moduleId: z.string().optional(), // Optional for creation if nested
});

export const moduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  chapterNumber: z.coerce.number().int().positive(),
  order: z.coerce.number().int().min(1),
  term: z.string().optional(),
  weightage: z.coerce.number().min(0).optional(),
  syllabusId: z.string().optional(), // Optional for creation if nested
  subModules: z.array(subModuleSchema).optional(),
});

export const moduleUpdateSchema = moduleSchema.extend({
  id: z.string().min(1, "Module ID is required"),
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;
export type ModuleUpdateFormValues = z.infer<typeof moduleUpdateSchema>;
export type SubModuleFormValues = z.infer<typeof subModuleSchema>;
