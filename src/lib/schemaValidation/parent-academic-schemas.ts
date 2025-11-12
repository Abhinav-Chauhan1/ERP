import { z } from "zod";

// ============================================================================
// ACADEMIC SCHEMAS
// ============================================================================

/**
 * Get class schedule schema
 */
export const getClassScheduleSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  date: z.date().optional(),
});

export type GetClassScheduleInput = z.infer<typeof getClassScheduleSchema>;

/**
 * Get homework filter schema
 */
export const getHomeworkSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  status: z.enum(["PENDING", "SUBMITTED", "GRADED", "OVERDUE"]).optional(),
  subjectId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(50),
});

export type GetHomeworkInput = z.infer<typeof getHomeworkSchema>;

/**
 * Get full timetable schema
 */
export const getFullTimetableSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  weekStartDate: z.date().optional(),
});

export type GetFullTimetableInput = z.infer<typeof getFullTimetableSchema>;

/**
 * Get academic progress schema
 */
export const getAcademicProgressSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  academicYearId: z.string().optional(),
});

export type GetAcademicProgressInput = z.infer<typeof getAcademicProgressSchema>;

/**
 * Homework detail schema (for responses)
 */
export const homeworkDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  dueDate: z.date(),
  status: z.enum(["PENDING", "SUBMITTED", "GRADED", "OVERDUE"]),
  submissionDate: z.date().nullable(),
  marks: z.number().nullable(),
  maxMarks: z.number().nullable(),
  feedback: z.string().nullable(),
  attachments: z.string().nullable(),
  createdAt: z.date(),
});

export type HomeworkDetail = z.infer<typeof homeworkDetailSchema>;

/**
 * Timetable slot schema (for responses)
 */
export const timetableSlotSchema = z.object({
  id: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  roomId: z.string().nullable(),
  roomName: z.string().nullable(),
});

export type TimetableSlot = z.infer<typeof timetableSlotSchema>;

/**
 * Academic progress schema (for responses)
 */
export const academicProgressSchema = z.object({
  childId: z.string(),
  childName: z.string(),
  academicYear: z.string(),
  overallProgress: z.number().min(0).max(100),
  subjects: z.array(
    z.object({
      subjectId: z.string(),
      subjectName: z.string(),
      progress: z.number().min(0).max(100),
      completedTopics: z.number(),
      totalTopics: z.number(),
      currentGrade: z.string().nullable(),
    })
  ),
  milestones: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      dueDate: z.date(),
      isCompleted: z.boolean(),
      completedDate: z.date().nullable(),
    })
  ),
});

export type AcademicProgress = z.infer<typeof academicProgressSchema>;

