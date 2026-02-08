/**
 * Report Card Data Aggregation Service
 * 
 * This service aggregates all data needed for report card generation including:
 * - Student information
 * - Exam results with marks breakdown (theory, practical, internal)
 * - Overall performance calculations
 * - Co-scholastic grades
 * - Attendance data
 * - Teacher and principal remarks
 * 
 * Requirements: 5.2, 10.1, 10.2, 10.3, 10.4
 */

import { db } from "@/lib/db";
import { calculateAttendanceForTerm, type AttendanceData } from "@/lib/utils/attendance-calculator";
import { calculateGrade, calculateGradePoint, calculateCGPA } from "@/lib/utils/grade-calculator";
import { aggregateMarksByRule, type AssessmentRule as AssessmentRuleBase } from "@/lib/utils/assessment-logic";

// Extended AssessmentRule interface for database rules
interface AssessmentRuleWithExamTypes extends AssessmentRuleBase {
  id: string;
  examTypes: string[];
}

// Type for exam data with results
interface ExamWithResults {
  examTypeId: string;
  results: Array<{ totalMarks?: number; marks?: number }>;
  subjectMarkConfig: Array<{ totalMarks?: number }>;
  totalMarks: number;
}

/**
 * Interface for student information in report card
 */
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

/**
 * Interface for term information in report card
 */
export interface TermInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  academicYear: string;
}

/**
 * Interface for subject result with mark components
 */
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

/**
 * Interface for co-scholastic activity result
 */
export interface CoScholasticResult {
  activityId: string;
  activityName: string;
  assessmentType: "GRADE" | "MARKS";
  grade: string | null;
  marks: number | null;
  maxMarks: number | null;
  remarks: string | null;
}

/**
 * Interface for overall performance summary
 */
export interface OverallPerformance {
  totalMarks: number;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string | null;
  cgpa: number | null;
  rank: number | null;
}

/**
 * Interface for remarks
 */
export interface RemarksInfo {
  teacherRemarks: string | null;
  principalRemarks: string | null;
}

/**
 * Complete report card data interface
 */
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

/**
 * Aggregate all data needed for a report card
 * 
 * @param studentId - The ID of the student
 * @param termId - The ID of the term
 * @returns Complete report card data
 */
export async function aggregateReportCardData(
  studentId: string,
  termId: string
): Promise<ReportCardData> {
  try {
    // Fetch all required data in parallel for better performance
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

    // Calculate overall performance
    const overallPerformance = calculateOverallPerformance(examResults, reportCard);

    // Structure the complete report card data
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

/**
 * Fetch student information
 */
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
 * Fetch term information
 */
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
 * Fetch exam results with marks breakdown
 */
async function fetchExamResults(
  studentId: string,
  termId: string
): Promise<SubjectResult[]> {
  // Fetch all exams for the term with their results and mark configurations
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

    // marks to be aggregated
    let aggregatedObtained = 0;
    let aggregatedTotal = 0;

    // apply rules if they exist
    if (assessmentRules.length > 0) {
      // Group exams by rule
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

      // Aggregate ruled exams
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

      // Add unruled exams as a simple sum
      for (const exam of unruledExams) {
        aggregatedObtained += exam.results[0]?.totalMarks || exam.results[0]?.marks || 0;
        aggregatedTotal += exam.subjectMarkConfig[0]?.totalMarks || exam.totalMarks || 100;
      }
    } else {
      // Simple sum (Legacy logic)
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
      theoryMarks: null, // Component-wise aggregation is complex with rules, keeping simple for now
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
      isAbsent: subjectExams.every(e => e.results[0]?.isAbsent),
    });
  }

  return finalizedResults;
}

/**
 * Fetch co-scholastic grades
 */
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
 * Fetch existing report card if it exists
 */
async function fetchReportCard(studentId: string, termId: string) {
  const reportCard = await db.reportCard.findUnique({
    where: {
      studentId_termId: {
        studentId,
        termId,
      },
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
 * Calculate overall performance from subject results
 */
function calculateOverallPerformance(
  subjects: SubjectResult[],
  reportCard: { rank: number | null } | null
): OverallPerformance {
  // Filter out absent subjects
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

  // Calculate totals
  const totalMarks = presentSubjects.reduce((sum, s) => sum + s.totalMarks, 0);
  const maxMarks = presentSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

  // Calculate overall grade
  const grade = calculateGrade(percentage);

  // Calculate CGPA
  const gradePoints = presentSubjects
    .filter(s => s.gradePoint !== null)
    .map(s => s.gradePoint!);
  const cgpa = calculateCGPA(gradePoints);

  return {
    totalMarks,
    maxMarks,
    obtainedMarks: totalMarks,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    grade,
    cgpa,
    rank: reportCard?.rank || null,
  };
}


/**
 * Batch aggregate report card data for multiple students
 * Useful for batch report card generation
 * 
 * @param studentIds - Array of student IDs
 * @param termId - The ID of the term
 * @returns Array of report card data for all students
 */
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
