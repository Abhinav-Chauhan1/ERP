/**
 * Report Card Data Aggregation Service
 * 
 * This service aggregates all data needed for report card generation including:
 * - Student information (with parent/guardian details)
 * - Exam results with component-wise marks breakdown
 * - Multi-term aggregation for annual CBSE report cards
 * - Overall performance calculations with CBSE grade scale
 * - Co-scholastic grades
 * - Attendance data
 * - Teacher and principal remarks
 * - Pass/fail result status
 * 
 * Requirements: 5.2, 10.1, 10.2, 10.3, 10.4
 */

import { db } from "@/lib/db";
import { calculateAttendanceForTerm, type AttendanceData } from "@/lib/utils/attendance-calculator";
import { calculateGrade, calculateGradePoint, calculateCGPA } from "@/lib/utils/grade-calculator";
import { aggregateMarksByRule, type AssessmentRule as AssessmentRuleBase } from "@/lib/utils/assessment-logic";

// ---------------------------------------------------------------------------
// Internal helper types
// ---------------------------------------------------------------------------

interface AssessmentRuleWithExamTypes extends AssessmentRuleBase {
  id: string;
  examTypes: string[];
}

interface ExamWithResults {
  examTypeId: string;
  results: Array<{ totalMarks?: number; marks?: number }>;
  subjectMarkConfig: Array<{ totalMarks?: number }>;
  totalMarks: number;
}

// ---------------------------------------------------------------------------
// Public interfaces — existing (preserved for backward compatibility)
// ---------------------------------------------------------------------------

export interface StudentInfo {
  id: string;
  name: string;
  admissionId: string;
  schoolId: string;
  rollNumber: string | null;
  dateOfBirth: Date;
  class: string;
  section: string;
  avatar: string | null;
  reportCardTemplateId?: string | null;
}

export interface TermInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  academicYear: string;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectType: string;
  theoryMarks: number | null;
  theoryMaxMarks: number | null;
  practicalMarks: number | null;
  practicalMaxMarks: number | null;
  internalMarks: number | null;
  internalMaxMarks: number | null;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string | null;
  gradePoint: number | null;
  isAbsent: boolean;
}

export interface CoScholasticResult {
  activityId: string;
  activityName: string;
  assessmentType: "GRADE" | "MARKS";
  grade: string | null;
  marks: number | null;
  maxMarks: number | null;
  remarks: string | null;
}

export interface OverallPerformance {
  totalMarks: number;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string | null;
  cgpa: number | null;
  rank: number | null;
}

export interface RemarksInfo {
  teacherRemarks: string | null;
  principalRemarks: string | null;
}

export interface ReportCardData {
  student: StudentInfo;
  term: TermInfo;
  academicYear: string;
  subjects: SubjectResult[];
  coScholastic: CoScholasticResult[];
  attendance: AttendanceData;
  overallPerformance: OverallPerformance;
  remarks: RemarksInfo;
  templateId: string | null;
  pdfUrl: string | null;
  isPublished: boolean;
  publishDate: Date | null;
}

// ---------------------------------------------------------------------------
// NEW interfaces — Phase 2 (component marks, multi-term, parent info)
// ---------------------------------------------------------------------------

/** Individual component mark (e.g. Periodic Test, Notebook, SEE) */
export interface ComponentMark {
  componentId: string;
  componentName: string;
  shortName: string;
  maxMarks: number;
  obtainedMarks: number;
  isAbsent: boolean;
}

/** Enhanced per-subject result with component-level marks for a single term */
export interface TermSubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectType: string;
  /** SCHOLASTIC | ADDITIONAL */
  subjectCategory: string;
  /** Component marks from ExamComponent + ExamComponentMark */
  components: ComponentMark[];
  theoryMarks: number | null;
  theoryMaxMarks: number | null;
  practicalMarks: number | null;
  practicalMaxMarks: number | null;
  internalMarks: number | null;
  internalMaxMarks: number | null;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string | null;
  gradePoint: number | null;
  isAbsent: boolean;
}

/** Parent / guardian details pulled from the Student model */
export interface ParentInfo {
  fatherName: string | null;
  fatherOccupation: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  motherOccupation: string | null;
  motherPhone: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
}

/** Extended student info including parent details */
export interface StudentInfoExtended extends StudentInfo {
  parent: ParentInfo;
  gender: string;
  aadhaarNumber: string | null;
}

/** Term-level slice used inside MultiTermReportCardData */
export interface TermSlice {
  term: TermInfo;
  subjects: TermSubjectResult[];
  coScholastic: CoScholasticResult[];
  attendance: AttendanceData;
}

/** Complete annual report card data (multi-term, CBSE style) */
export interface MultiTermReportCardData {
  student: StudentInfoExtended;
  academicYear: string;
  academicYearId: string;
  terms: TermSlice[];
  /** Aggregated annual subject results (scholastic) */
  annualSubjects: TermSubjectResult[];
  /** Aggregated annual subject results (additional) */
  annualAdditionalSubjects: TermSubjectResult[];
  overallPerformance: OverallPerformance;
  /** PASS | FAIL | COMPARTMENT | null */
  resultStatus: string | null;
  remarks: RemarksInfo;
  templateId: string | null;
  pdfUrl: string | null;
  isPublished: boolean;
  publishDate: Date | null;
}

// ---------------------------------------------------------------------------
// Phase 3 — CBSE Grade Scale & Pass/Fail
// ---------------------------------------------------------------------------

export interface CBSEGradeEntry {
  grade: string;
  minMarks: number;
  maxMarks: number;
  gradePoint: number;
}

/** Standard CBSE 9-point scale (Classes I–X) */
const CBSE_GRADE_SCALE: CBSEGradeEntry[] = [
  { grade: "A1", minMarks: 91, maxMarks: 100, gradePoint: 10 },
  { grade: "A2", minMarks: 81, maxMarks: 90, gradePoint: 9 },
  { grade: "B1", minMarks: 71, maxMarks: 80, gradePoint: 8 },
  { grade: "B2", minMarks: 61, maxMarks: 70, gradePoint: 7 },
  { grade: "C1", minMarks: 51, maxMarks: 60, gradePoint: 6 },
  { grade: "C2", minMarks: 41, maxMarks: 50, gradePoint: 5 },
  { grade: "D",  minMarks: 33, maxMarks: 40, gradePoint: 4 },
  { grade: "E1", minMarks: 21, maxMarks: 32, gradePoint: 0 },
  { grade: "E2", minMarks: 0,  maxMarks: 20, gradePoint: 0 },
];

/**
 * Get CBSE grade scale — first tries the school's custom GradeScale table,
 * falls back to the baked-in CBSE defaults.
 */
export async function getCBSEGradeScale(schoolId: string): Promise<CBSEGradeEntry[]> {
  const dbScales = await db.gradeScale.findMany({
    where: { schoolId, boardType: "CBSE", isActive: true },
    orderBy: { minMarks: "desc" },
  });

  if (dbScales.length > 0) {
    return dbScales.map((s) => ({
      grade: s.grade,
      minMarks: s.minMarks,
      maxMarks: s.maxMarks,
      gradePoint: s.gradePoint ?? 0,
    }));
  }

  return CBSE_GRADE_SCALE;
}

/** Look up grade for a percentage using CBSE scale */
export function getCBSEGrade(percentage: number, scale: CBSEGradeEntry[]): string | null {
  const rounded = Math.round(percentage);
  for (const entry of scale) {
    if (rounded >= entry.minMarks && rounded <= entry.maxMarks) {
      return entry.grade;
    }
  }
  return null;
}

/** Look up grade point for a percentage using CBSE scale */
export function getCBSEGradePoint(percentage: number, scale: CBSEGradeEntry[]): number {
  const rounded = Math.round(percentage);
  for (const entry of scale) {
    if (rounded >= entry.minMarks && rounded <= entry.maxMarks) {
      return entry.gradePoint;
    }
  }
  return 0;
}

/**
 * Calculate CBSE result status based on subject-wise performance.
 * 
 * Rules (CBSE):
 * - PASS:        student scores ≥ 33% in every subject
 * - COMPARTMENT: fails in 1–2 subjects
 * - FAIL:        fails in 3+ subjects
 */
export function calculateResultStatus(
  subjects: TermSubjectResult[],
  passPercentage = 33,
): string {
  const failedSubjects = subjects.filter(
    (s) => !s.isAbsent && s.percentage < passPercentage
  );

  if (failedSubjects.length === 0) return "PASS";
  if (failedSubjects.length <= 2) return "COMPARTMENT";
  return "FAIL";
}

// ---------------------------------------------------------------------------
// Existing single-term aggregation (preserved)
// ---------------------------------------------------------------------------

export async function aggregateReportCardData(
  studentId: string,
  termId: string
): Promise<ReportCardData> {
  try {
    const [
      studentData,
      termData,
      examResults,
      coScholasticGrades,
      attendanceData,
      reportCard,
    ] = await Promise.all([
      fetchStudentInformation(studentId),
      fetchTermInformation(termId),
      fetchExamResults(studentId, termId),
      fetchCoScholasticGrades(studentId, termId),
      calculateAttendanceForTerm(studentId, termId),
      fetchReportCard(studentId, termId),
    ]);

    const overallPerformance = calculateOverallPerformance(examResults, reportCard);

    const reportCardData: ReportCardData = {
      student: studentData,
      term: termData,
      academicYear: termData.academicYear,
      subjects: examResults,
      coScholastic: coScholasticGrades,
      attendance: attendanceData,
      overallPerformance,
      remarks: {
        teacherRemarks: reportCard?.teacherRemarks || null,
        principalRemarks: reportCard?.principalRemarks || null,
      },
      templateId: reportCard?.templateId || null,
      pdfUrl: reportCard?.pdfUrl || null,
      isPublished: reportCard?.isPublished || false,
      publishDate: reportCard?.publishDate || null,
    };

    return reportCardData;
  } catch (error) {
    console.error("Error aggregating report card data:", error);
    throw new Error(
      `Failed to aggregate report card data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ---------------------------------------------------------------------------
// NEW — Multi-term (annual) aggregation for CBSE report cards
// ---------------------------------------------------------------------------

/**
 * Aggregate data across all terms for an academic year (annual CBSE card).
 *
 * @param studentId  - The student ID
 * @param academicYearId - The academic year ID
 * @returns Complete multi-term report card data
 */
export async function aggregateMultiTermReportCardData(
  studentId: string,
  academicYearId: string,
): Promise<MultiTermReportCardData> {
  try {
    // 1. Fetch student + parent info
    const studentData = await fetchStudentParentInfo(studentId);

    // 2. Fetch all terms for this academic year
    const terms = await db.term.findMany({
      where: { academicYear: { id: academicYearId } },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        academicYear: { select: { name: true } },
      },
    });

    if (terms.length === 0) {
      throw new Error(`No terms found for academic year ${academicYearId}`);
    }

    const academicYearName = terms[0].academicYear.name;
    const schoolId = studentData.schoolId;
    const gradeScale = await getCBSEGradeScale(schoolId);

    // 3. Build per-term slices in parallel
    const termSlices: TermSlice[] = await Promise.all(
      terms.map(async (term) => {
        const [subjects, coScholastic, attendance] = await Promise.all([
          fetchExamResultsWithComponents(studentId, term.id, gradeScale),
          fetchCoScholasticGrades(studentId, term.id),
          calculateAttendanceForTerm(studentId, term.id),
        ]);

        return {
          term: {
            id: term.id,
            name: term.name,
            startDate: term.startDate,
            endDate: term.endDate,
            academicYear: academicYearName,
          },
          subjects,
          coScholastic,
          attendance,
        };
      }),
    );

    // 4. Aggregate annual subject results (average across terms)
    const allSubjects = aggregateAnnualSubjects(termSlices, gradeScale);
    const scholasticSubjects = allSubjects.filter((s) => s.subjectCategory === "SCHOLASTIC");
    const additionalSubjects = allSubjects.filter((s) => s.subjectCategory === "ADDITIONAL");

    // 5. Calculate overall performance
    const presentSubjects = scholasticSubjects.filter((s) => !s.isAbsent);
    const totalObtained = presentSubjects.reduce((sum, s) => sum + s.totalMarks, 0);
    const totalMax = presentSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const gradePoints = presentSubjects
      .filter((s) => s.gradePoint !== null)
      .map((s) => s.gradePoint!);
    const cgpa = calculateCGPA(gradePoints);

    // 6. Fetch annual report card record
    const reportCard = await fetchAnnualReportCard(studentId, academicYearId);
    const resultStatus = calculateResultStatus(scholasticSubjects);

    const overallPerformance: OverallPerformance = {
      totalMarks: totalObtained,
      maxMarks: totalMax,
      obtainedMarks: totalObtained,
      percentage: Math.round(overallPct * 100) / 100,
      grade: getCBSEGrade(overallPct, gradeScale),
      cgpa,
      rank: reportCard?.rank || null,
    };

    return {
      student: studentData,
      academicYear: academicYearName,
      academicYearId,
      terms: termSlices,
      annualSubjects: scholasticSubjects,
      annualAdditionalSubjects: additionalSubjects,
      overallPerformance,
      resultStatus,
      remarks: {
        teacherRemarks: reportCard?.teacherRemarks || null,
        principalRemarks: reportCard?.principalRemarks || null,
      },
      templateId: reportCard?.templateId || null,
      pdfUrl: reportCard?.pdfUrl || null,
      isPublished: reportCard?.isPublished || false,
      publishDate: reportCard?.publishDate || null,
    };
  } catch (error) {
    console.error("Error aggregating multi-term report card data:", error);
    throw new Error(
      `Failed to aggregate multi-term report card data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function fetchStudentInformation(studentId: string): Promise<StudentInfo> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      schoolId: true,
      admissionId: true,
      rollNumber: true,
      dateOfBirth: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          class: {
            select: {
              name: true,
              reportCardTemplateId: true,
            },
          },
          section: {
            select: {
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found`);
  }

  const currentEnrollment = student.enrollments[0];

  if (!currentEnrollment) {
    throw new Error(`No active enrollment found for student ${studentId}`);
  }

  return {
    id: student.id,
    name: `${student.user.firstName} ${student.user.lastName}`,
    admissionId: student.admissionId,
    schoolId: student.schoolId,
    rollNumber: student.rollNumber,
    dateOfBirth: student.dateOfBirth,
    class: currentEnrollment.class.name,
    section: currentEnrollment.section.name,
    avatar: student.user.avatar,
    reportCardTemplateId: currentEnrollment.class.reportCardTemplateId,
  };
}

/**
 * Fetch student info including parent/guardian details (CBSE cards need this).
 */
export async function fetchStudentParentInfo(studentId: string): Promise<StudentInfoExtended> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      schoolId: true,
      admissionId: true,
      rollNumber: true,
      dateOfBirth: true,
      gender: true,
      aadhaarNumber: true,
      fatherName: true,
      fatherOccupation: true,
      fatherPhone: true,
      motherName: true,
      motherOccupation: true,
      motherPhone: true,
      guardianName: true,
      guardianRelation: true,
      guardianPhone: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          class: {
            select: {
              name: true,
              reportCardTemplateId: true,
            },
          },
          section: {
            select: {
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found`);
  }

  const currentEnrollment = student.enrollments[0];
  if (!currentEnrollment) {
    throw new Error(`No active enrollment found for student ${studentId}`);
  }

  return {
    id: student.id,
    name: `${student.user.firstName} ${student.user.lastName}`,
    admissionId: student.admissionId,
    schoolId: student.schoolId,
    rollNumber: student.rollNumber,
    dateOfBirth: student.dateOfBirth,
    class: currentEnrollment.class.name,
    section: currentEnrollment.section.name,
    avatar: student.user.avatar,
    reportCardTemplateId: currentEnrollment.class.reportCardTemplateId,
    gender: student.gender,
    aadhaarNumber: student.aadhaarNumber,
    parent: {
      fatherName: student.fatherName,
      fatherOccupation: student.fatherOccupation,
      fatherPhone: student.fatherPhone,
      motherName: student.motherName,
      motherOccupation: student.motherOccupation,
      motherPhone: student.motherPhone,
      guardianName: student.guardianName,
      guardianRelation: student.guardianRelation,
      guardianPhone: student.guardianPhone,
    },
  };
}

async function fetchTermInformation(termId: string): Promise<TermInfo> {
  const term = await db.term.findUnique({
    where: { id: termId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      academicYear: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!term) {
    throw new Error(`Term with ID ${termId} not found`);
  }

  return {
    id: term.id,
    name: term.name,
    startDate: term.startDate,
    endDate: term.endDate,
    academicYear: term.academicYear.name,
  };
}

/**
 * Fetch exam results — legacy version (backward compat).
 * Returns SubjectResult[] without component marks.
 */
async function fetchExamResults(
  studentId: string,
  termId: string
): Promise<SubjectResult[]> {
  const exams = await db.exam.findMany({
    where: {
      termId,
      results: {
        some: {
          studentId,
        },
      },
    },
    select: {
      id: true,
      totalMarks: true,
      examTypeId: true,
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
        },
      },
      results: {
        where: {
          studentId,
        },
        select: {
          marks: true,
          theoryMarks: true,
          practicalMarks: true,
          internalMarks: true,
          totalMarks: true,
          percentage: true,
          grade: true,
          isAbsent: true,
        },
      },
      subjectMarkConfig: {
        select: {
          theoryMaxMarks: true,
          practicalMaxMarks: true,
          internalMaxMarks: true,
          totalMarks: true,
        },
      },
    },
  });

  // Fetch student's class to get assessment rules
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      enrollments: {
        where: { status: "ACTIVE" },
        select: { classId: true },
        take: 1,
      },
    },
  });

  const classId = student?.enrollments[0]?.classId;
  const assessmentRules = classId
    ? await db.assessmentRule.findMany({ where: { classId } })
    : [];

  // Group results by subject
  const subjectMap = new Map<string, any[]>();

  for (const exam of exams) {
    const subjectId = exam.subject.id;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, []);
    }
    subjectMap.get(subjectId)!.push(exam);
  }

  const finalizedResults: SubjectResult[] = [];

  for (const [subjectId, subjectExams] of subjectMap.entries()) {
    const firstExam = subjectExams[0];

    let aggregatedObtained = 0;
    let aggregatedTotal = 0;

    if (assessmentRules.length > 0) {
      const ruleExamsMap = new Map<string, ExamWithResults[]>();
      const unruledExams: ExamWithResults[] = [];

      for (const exam of subjectExams) {
        const rule = assessmentRules.find((r: AssessmentRuleWithExamTypes) => r.examTypes.includes(exam.examTypeId));
        if (rule) {
          if (!ruleExamsMap.has(rule.id)) ruleExamsMap.set(rule.id, []);
          ruleExamsMap.get(rule.id)!.push(exam);
        } else {
          unruledExams.push(exam);
        }
      }

      for (const [ruleId, examsForRule] of ruleExamsMap.entries()) {
        const rule = assessmentRules.find((r: AssessmentRuleWithExamTypes) => r.id === ruleId)!;
        const marks = examsForRule.map((e: ExamWithResults) => ({
          obtained: e.results[0]?.totalMarks || e.results[0]?.marks || 0,
          total: e.subjectMarkConfig[0]?.totalMarks || e.totalMarks || 100
        }));
        const aggregated = aggregateMarksByRule(marks, rule);
        aggregatedObtained += aggregated.obtained;
        aggregatedTotal += aggregated.total;
      }

      for (const exam of unruledExams) {
        aggregatedObtained += exam.results[0]?.totalMarks || exam.results[0]?.marks || 0;
        aggregatedTotal += exam.subjectMarkConfig[0]?.totalMarks || exam.totalMarks || 100;
      }
    } else {
      for (const exam of subjectExams) {
        aggregatedObtained += exam.results[0]?.totalMarks || exam.results[0]?.marks || 0;
        aggregatedTotal += exam.subjectMarkConfig[0]?.totalMarks || exam.totalMarks || 100;
      }
    }

    const percentage = aggregatedTotal > 0 ? (aggregatedObtained / aggregatedTotal) * 100 : 0;

    finalizedResults.push({
      subjectId,
      subjectName: firstExam.subject.name,
      subjectCode: firstExam.subject.code,
      subjectType: firstExam.subject.type,
      theoryMarks: null,
      theoryMaxMarks: null,
      practicalMarks: null,
      practicalMaxMarks: null,
      internalMarks: null,
      internalMaxMarks: null,
      totalMarks: aggregatedObtained,
      maxMarks: aggregatedTotal,
      percentage,
      grade: calculateGrade(percentage),
      gradePoint: calculateGradePoint(percentage),
      isAbsent: subjectExams.every((e: any) => e.results[0]?.isAbsent),
    });
  }

  return finalizedResults;
}

/**
 * Fetch exam results WITH component-level marks (Phase 2).
 * Uses ExamComponent + ExamComponentMark for granular breakdown and
 * falls back to ExamResult theory/practical/internal fields.
 */
async function fetchExamResultsWithComponents(
  studentId: string,
  termId: string,
  gradeScale: CBSEGradeEntry[],
): Promise<TermSubjectResult[]> {
  const exams = await db.exam.findMany({
    where: {
      termId,
      results: { some: { studentId } },
    },
    select: {
      id: true,
      totalMarks: true,
      examTypeId: true,
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
          category: true,
        },
      },
      results: {
        where: { studentId },
        select: {
          marks: true,
          theoryMarks: true,
          practicalMarks: true,
          internalMarks: true,
          totalMarks: true,
          percentage: true,
          grade: true,
          isAbsent: true,
        },
      },
      subjectMarkConfig: {
        select: {
          theoryMaxMarks: true,
          practicalMaxMarks: true,
          internalMaxMarks: true,
          totalMarks: true,
        },
      },
      // Fetch defined components
      components: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          shortName: true,
          maxMarks: true,
          marks: {
            where: { studentId },
            select: {
              marks: true,
              isAbsent: true,
            },
          },
        },
      },
    },
  });

  // Group by subject
  const subjectMap = new Map<string, typeof exams>();

  for (const exam of exams) {
    const subjectId = exam.subject.id;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, []);
    }
    subjectMap.get(subjectId)!.push(exam);
  }

  const results: TermSubjectResult[] = [];

  for (const [subjectId, subjectExams] of subjectMap.entries()) {
    const firstExam = subjectExams[0];

    // Build component marks from all exams for this subject
    const components: ComponentMark[] = [];
    let totalObtained = 0;
    let totalMax = 0;

    // Aggregate theory / practical / internal across exams
    let theoryObt = 0, theoryMax = 0;
    let practObt = 0, practMax = 0;
    let intObt = 0, intMax = 0;
    let hasTheory = false, hasPract = false, hasInt = false;

    for (const exam of subjectExams) {
      const result = exam.results[0];
      const config = exam.subjectMarkConfig[0];

      // Component-level marks
      if (exam.components.length > 0) {
        for (const comp of exam.components) {
          const mark = comp.marks[0];
          components.push({
            componentId: comp.id,
            componentName: comp.name,
            shortName: comp.shortName,
            maxMarks: comp.maxMarks,
            obtainedMarks: mark?.marks ?? 0,
            isAbsent: mark?.isAbsent ?? false,
          });
          totalObtained += mark?.marks ?? 0;
          totalMax += comp.maxMarks;
        }
      } else {
        // Fallback to ExamResult totals
        totalObtained += result?.totalMarks ?? result?.marks ?? 0;
        totalMax += config?.totalMarks ?? exam.totalMarks ?? 100;
      }

      // Aggregate theory/practical/internal from ExamResult
      if (result?.theoryMarks != null) {
        theoryObt += result.theoryMarks;
        hasTheory = true;
      }
      if (config?.theoryMaxMarks != null) {
        theoryMax += config.theoryMaxMarks;
      }
      if (result?.practicalMarks != null) {
        practObt += result.practicalMarks;
        hasPract = true;
      }
      if (config?.practicalMaxMarks != null) {
        practMax += config.practicalMaxMarks;
      }
      if (result?.internalMarks != null) {
        intObt += result.internalMarks;
        hasInt = true;
      }
      if (config?.internalMaxMarks != null) {
        intMax += config.internalMaxMarks;
      }
    }

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    results.push({
      subjectId,
      subjectName: firstExam.subject.name,
      subjectCode: firstExam.subject.code,
      subjectType: firstExam.subject.type,
      subjectCategory: firstExam.subject.category,
      components,
      theoryMarks: hasTheory ? theoryObt : null,
      theoryMaxMarks: hasTheory ? theoryMax : null,
      practicalMarks: hasPract ? practObt : null,
      practicalMaxMarks: hasPract ? practMax : null,
      internalMarks: hasInt ? intObt : null,
      internalMaxMarks: hasInt ? intMax : null,
      totalMarks: totalObtained,
      maxMarks: totalMax,
      percentage,
      grade: getCBSEGrade(percentage, gradeScale),
      gradePoint: getCBSEGradePoint(percentage, gradeScale),
      isAbsent: subjectExams.every((e) => e.results[0]?.isAbsent),
    });
  }

  return results;
}

/**
 * Aggregate subject results across terms into annual averages.
 * For each subject, the annual marks = sum of all term marks, and
 * the annual maxMarks = sum of all term maxMarks.
 */
function aggregateAnnualSubjects(
  termSlices: TermSlice[],
  gradeScale: CBSEGradeEntry[],
): TermSubjectResult[] {
  // Collect all subject IDs across terms
  const subjectMap = new Map<string, {
    info: Pick<TermSubjectResult, "subjectName" | "subjectCode" | "subjectType" | "subjectCategory">;
    totalObtained: number;
    totalMax: number;
    components: ComponentMark[];
    theoryObt: number; theoryMax: number; hasTheory: boolean;
    practObt: number; practMax: number; hasPract: boolean;
    intObt: number; intMax: number; hasInt: boolean;
    absentCount: number;
    termCount: number;
  }>();

  for (const slice of termSlices) {
    for (const subject of slice.subjects) {
      if (!subjectMap.has(subject.subjectId)) {
        subjectMap.set(subject.subjectId, {
          info: {
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            subjectType: subject.subjectType,
            subjectCategory: subject.subjectCategory,
          },
          totalObtained: 0,
          totalMax: 0,
          components: [],
          theoryObt: 0, theoryMax: 0, hasTheory: false,
          practObt: 0, practMax: 0, hasPract: false,
          intObt: 0, intMax: 0, hasInt: false,
          absentCount: 0,
          termCount: 0,
        });
      }

      const agg = subjectMap.get(subject.subjectId)!;
      agg.totalObtained += subject.totalMarks;
      agg.totalMax += subject.maxMarks;
      agg.components.push(...subject.components);
      if (subject.theoryMarks != null) { agg.theoryObt += subject.theoryMarks; agg.hasTheory = true; }
      if (subject.theoryMaxMarks != null) { agg.theoryMax += subject.theoryMaxMarks; }
      if (subject.practicalMarks != null) { agg.practObt += subject.practicalMarks; agg.hasPract = true; }
      if (subject.practicalMaxMarks != null) { agg.practMax += subject.practicalMaxMarks; }
      if (subject.internalMarks != null) { agg.intObt += subject.internalMarks; agg.hasInt = true; }
      if (subject.internalMaxMarks != null) { agg.intMax += subject.internalMaxMarks; }
      if (subject.isAbsent) agg.absentCount++;
      agg.termCount++;
    }
  }

  const annualResults: TermSubjectResult[] = [];

  for (const [subjectId, agg] of subjectMap.entries()) {
    const pct = agg.totalMax > 0 ? (agg.totalObtained / agg.totalMax) * 100 : 0;

    annualResults.push({
      subjectId,
      subjectName: agg.info.subjectName,
      subjectCode: agg.info.subjectCode,
      subjectType: agg.info.subjectType,
      subjectCategory: agg.info.subjectCategory,
      components: agg.components,
      theoryMarks: agg.hasTheory ? agg.theoryObt : null,
      theoryMaxMarks: agg.hasTheory ? agg.theoryMax : null,
      practicalMarks: agg.hasPract ? agg.practObt : null,
      practicalMaxMarks: agg.hasPract ? agg.practMax : null,
      internalMarks: agg.hasInt ? agg.intObt : null,
      internalMaxMarks: agg.hasInt ? agg.intMax : null,
      totalMarks: agg.totalObtained,
      maxMarks: agg.totalMax,
      percentage: Math.round(pct * 100) / 100,
      grade: getCBSEGrade(pct, gradeScale),
      gradePoint: getCBSEGradePoint(pct, gradeScale),
      isAbsent: agg.absentCount === agg.termCount,
    });
  }

  return annualResults;
}

async function fetchCoScholasticGrades(
  studentId: string,
  termId: string
): Promise<CoScholasticResult[]> {
  const coScholasticGrades = await db.coScholasticGrade.findMany({
    where: {
      studentId,
      termId,
    },
    select: {
      activity: {
        select: {
          id: true,
          name: true,
          assessmentType: true,
          maxMarks: true,
        },
      },
      grade: true,
      marks: true,
      remarks: true,
    },
  });

  return coScholasticGrades.map((cg) => ({
    activityId: cg.activity.id,
    activityName: cg.activity.name,
    assessmentType: cg.activity.assessmentType as "GRADE" | "MARKS",
    grade: cg.grade,
    marks: cg.marks,
    maxMarks: cg.activity.maxMarks,
    remarks: cg.remarks,
  }));
}

/**
 * Fetch the term-scoped report card (legacy).
 * Tries both the new compound key and falls back to a manual query
 * if the old `studentId_termId` index doesn't exist.
 */
async function fetchReportCard(studentId: string, termId: string) {
  const reportCard = await db.reportCard.findFirst({
    where: {
      studentId,
      termId,
    },
    select: {
      teacherRemarks: true,
      principalRemarks: true,
      rank: true,
      templateId: true,
      pdfUrl: true,
      isPublished: true,
      publishDate: true,
    },
  });

  return reportCard;
}

/**
 * Fetch the annual report card record (academicYear-scoped, termId = null).
 */
async function fetchAnnualReportCard(studentId: string, academicYearId: string) {
  const reportCard = await db.reportCard.findFirst({
    where: {
      studentId,
      academicYearId,
      termId: null, // annual cards have no term
    },
    select: {
      teacherRemarks: true,
      principalRemarks: true,
      rank: true,
      templateId: true,
      pdfUrl: true,
      isPublished: true,
      publishDate: true,
      resultStatus: true,
    },
  });

  return reportCard;
}

function calculateOverallPerformance(
  subjects: SubjectResult[],
  reportCard: { rank: number | null } | null
): OverallPerformance {
  const presentSubjects = subjects.filter((s) => !s.isAbsent);

  if (presentSubjects.length === 0) {
    return {
      totalMarks: 0,
      maxMarks: 0,
      obtainedMarks: 0,
      percentage: 0,
      grade: null,
      cgpa: null,
      rank: reportCard?.rank || null,
    };
  }

  const totalMarks = presentSubjects.reduce((sum, s) => sum + s.totalMarks, 0);
  const maxMarks = presentSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

  const grade = calculateGrade(percentage);

  const gradePoints = presentSubjects
    .filter(s => s.gradePoint !== null)
    .map(s => s.gradePoint!);
  const cgpa = calculateCGPA(gradePoints);

  return {
    totalMarks,
    maxMarks,
    obtainedMarks: totalMarks,
    percentage: Math.round(percentage * 100) / 100,
    grade,
    cgpa,
    rank: reportCard?.rank || null,
  };
}

// ---------------------------------------------------------------------------
// Batch helpers
// ---------------------------------------------------------------------------

export async function batchAggregateReportCardData(
  studentIds: string[],
  termId: string
): Promise<ReportCardData[]> {
  try {
    const reportCardDataPromises = studentIds.map((studentId) =>
      aggregateReportCardData(studentId, termId)
    );

    const reportCardData = await Promise.all(reportCardDataPromises);

    return reportCardData;
  } catch (error) {
    console.error("Error batch aggregating report card data:", error);
    throw new Error(
      `Failed to batch aggregate report card data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Batch aggregate multi-term (annual) report card data for multiple students.
 */
export async function batchAggregateMultiTermData(
  studentIds: string[],
  academicYearId: string,
): Promise<MultiTermReportCardData[]> {
  try {
    const results = await Promise.all(
      studentIds.map((id) => aggregateMultiTermReportCardData(id, academicYearId)),
    );
    return results;
  } catch (error) {
    console.error("Error batch aggregating multi-term report card data:", error);
    throw new Error(
      `Failed to batch aggregate multi-term data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
