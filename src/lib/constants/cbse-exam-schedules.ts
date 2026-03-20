/**
 * CBSE exam schedule templates and types
 * Used by auto-generate exams functionality
 */

export interface CBSEExamScheduleEntry {
  examTypeName: string;
  cbseComponent: string;
  totalMarks: number;
  passingMarks: number;
  /** Offset in days from term start date for the exam date */
  dayOffset: number;
  /** Duration in minutes */
  durationMinutes: number;
}

export interface AutoGenerateExamsInput {
  termId: string;
  classIds: string[];
  /** If omitted, all subjects assigned to the class are used */
  subjectIds?: string[];
  cbseLevel: "CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR";
  /** Term 1 uses PT/MA/Portfolio/HY; Term 2 uses PT/MA/Portfolio/Annual */
  termNumber?: 1 | 2;
}

export const CBSE_PRIMARY_SCHEDULE: CBSEExamScheduleEntry[] = [
  { examTypeName: "Periodic Test",       cbseComponent: "PT",          totalMarks: 10,  passingMarks: 3,  dayOffset: 30,  durationMinutes: 60  },
  { examTypeName: "Multiple Assessment", cbseComponent: "MA",          totalMarks: 5,   passingMarks: 2,  dayOffset: 45,  durationMinutes: 30  },
  { examTypeName: "Portfolio",           cbseComponent: "PORTFOLIO",   totalMarks: 5,   passingMarks: 2,  dayOffset: 60,  durationMinutes: 30  },
  { examTypeName: "Half Yearly Exam",    cbseComponent: "HALF_YEARLY", totalMarks: 80,  passingMarks: 26, dayOffset: 90,  durationMinutes: 180 },
];

export const CBSE_SECONDARY_SCHEDULE: CBSEExamScheduleEntry[] = [
  { examTypeName: "Periodic Test",       cbseComponent: "PT",          totalMarks: 10,  passingMarks: 3,  dayOffset: 30,  durationMinutes: 60  },
  { examTypeName: "Multiple Assessment", cbseComponent: "MA",          totalMarks: 5,   passingMarks: 2,  dayOffset: 45,  durationMinutes: 30  },
  { examTypeName: "Portfolio",           cbseComponent: "PORTFOLIO",   totalMarks: 5,   passingMarks: 2,  dayOffset: 60,  durationMinutes: 30  },
  { examTypeName: "Half Yearly Exam",    cbseComponent: "HALF_YEARLY", totalMarks: 80,  passingMarks: 26, dayOffset: 90,  durationMinutes: 180 },
];

export const CBSE_SENIOR_SCHEDULE: CBSEExamScheduleEntry[] = [
  { examTypeName: "Annual Exam",         cbseComponent: "ANNUAL",      totalMarks: 100, passingMarks: 33, dayOffset: 90,  durationMinutes: 180 },
];

// ---------------------------------------------------------------------------
// Exam Type Templates (used by examTypesActions.ts)
// ---------------------------------------------------------------------------

export interface CBSEExamTypeTemplate {
  name: string;
  cbseComponent: string;
  weight: number;
  description: string;
}

export const CBSE_EXAM_TYPE_TEMPLATES: CBSEExamTypeTemplate[] = [
  { name: "Periodic Test",       cbseComponent: "PT",          weight: 10, description: "Periodic Test (10 marks) — Term 1 & 2" },
  { name: "Multiple Assessment", cbseComponent: "MA",          weight: 5,  description: "Multiple Assessment (5 marks) — Term 1 & 2" },
  { name: "Portfolio",           cbseComponent: "PORTFOLIO",   weight: 5,  description: "Portfolio (5 marks) — Term 1 & 2" },
  { name: "Half Yearly Exam",    cbseComponent: "HALF_YEARLY", weight: 80, description: "Half Yearly Exam (80 marks) — Term 1" },
  { name: "Annual Exam",         cbseComponent: "ANNUAL",      weight: 80, description: "Annual Exam (80 marks) — Term 2" },
];
