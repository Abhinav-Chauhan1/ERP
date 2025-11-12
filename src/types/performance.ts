// Performance tracking types for exam results and reports

export interface ExamResultData {
  id: string;
  examId: string;
  examTitle: string;
  examType: string;
  examDate: Date;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  marks: number;
  totalMarks: number;
  percentage: number;
  grade: string | null;
  isAbsent: boolean;
  remarks: string | null;
  classAverage?: number;
  rank?: number;
  passingMarks: number;
  isPassed: boolean;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalExams: number;
  averageMarks: number;
  averagePercentage: number;
  highestMarks: number;
  lowestMarks: number;
  trend: "improving" | "declining" | "stable";
  exams: ExamResultData[];
}

export interface TermPerformance {
  termId: string;
  termName: string;
  totalExams: number;
  averagePercentage: number;
  totalMarks: number;
  obtainedMarks: number;
  grade: string | null;
  rank: number | null;
  subjects: SubjectPerformance[];
}

export interface PerformanceAnalytics {
  student: {
    id: string;
    name: string;
    admissionId: string;
    class: string;
    section: string;
  };
  currentTerm: TermPerformance | null;
  overallPerformance: {
    totalExams: number;
    averagePercentage: number;
    strongSubjects: string[];
    weakSubjects: string[];
    attendancePercentage: number;
  };
  termHistory: TermPerformance[];
  subjectTrends: Array<{
    subjectName: string;
    data: Array<{
      term: string;
      percentage: number;
      date: Date;
    }>;
  }>;
}

export interface ProgressReportData {
  id: string;
  student: {
    id: string;
    name: string;
    admissionId: string;
    rollNumber: string | null;
    class: string;
    section: string;
    dateOfBirth: Date;
    avatar: string | null;
  };
  term: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    academicYear: string;
  };
  academicPerformance: {
    totalMarks: number | null;
    averageMarks: number | null;
    percentage: number | null;
    grade: string | null;
    rank: number | null;
    subjectResults: Array<{
      subject: string;
      marks: number;
      totalMarks: number;
      percentage: number;
      grade: string | null;
    }>;
  };
  attendance: {
    percentage: number | null;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
  };
  behavioralAssessment: {
    discipline: string | null;
    participation: string | null;
    leadership: string | null;
    teamwork: string | null;
  };
  teacherRemarks: string | null;
  principalRemarks: string | null;
  strengths: string[];
  areasForImprovement: string[];
  isPublished: boolean;
  publishDate: Date | null;
}

export interface ClassComparisonData {
  examId: string;
  examTitle: string;
  subject: string;
  studentMarks: number;
  studentPercentage: number;
  studentGrade: string | null;
  classStatistics: {
    average: number;
    highest: number;
    lowest: number;
    median: number;
    totalStudents: number;
    passedStudents: number;
    failedStudents: number;
  };
  studentRank: number | null;
  percentile: number;
  performanceCategory: "excellent" | "above_average" | "average" | "below_average" | "needs_improvement";
}

export interface GradeTrendData {
  subjectId: string;
  subjectName: string;
  dataPoints: Array<{
    examId: string;
    examTitle: string;
    examDate: Date;
    marks: number;
    totalMarks: number;
    percentage: number;
    grade: string | null;
    classAverage: number;
  }>;
  overallTrend: "improving" | "declining" | "stable";
  averagePercentage: number;
  improvementRate: number; // Percentage change from first to last exam
}

export interface ReportCardFilters {
  termId?: string;
  academicYearId?: string;
  includeUnpublished?: boolean;
}

export interface ExamResultFilters {
  termId?: string;
  subjectId?: string;
  examTypeId?: string;
  startDate?: Date;
  endDate?: Date;
  includeAbsent?: boolean;
}

export interface PerformanceComparisonData {
  currentTerm: {
    percentage: number;
    grade: string | null;
    rank: number | null;
  };
  previousTerm: {
    percentage: number;
    grade: string | null;
    rank: number | null;
  } | null;
  change: {
    percentageChange: number;
    gradeChange: "improved" | "declined" | "same" | null;
    rankChange: number | null;
  };
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
