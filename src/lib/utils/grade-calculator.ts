// Utility functions for grade calculations and performance analysis

/**
 * Calculate percentage from marks
 */
export function calculatePercentage(
  obtainedMarks: number,
  totalMarks: number
): number {
  if (totalMarks === 0) return 0;
  return Math.round((obtainedMarks / totalMarks) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine grade based on percentage
 * Default grading scale (can be customized based on school settings)
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

/**
 * Calculate GPA based on percentage
 */
export function calculateGPA(percentage: number): number {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 70) return 3.3;
  if (percentage >= 60) return 3.0;
  if (percentage >= 50) return 2.7;
  if (percentage >= 40) return 2.3;
  if (percentage >= 33) return 2.0;
  return 0.0;
}

/**
 * Check if student passed based on marks and passing criteria
 */
export function isPassed(
  obtainedMarks: number,
  passingMarks: number
): boolean {
  return obtainedMarks >= passingMarks;
}

/**
 * Calculate average marks from an array of marks
 */
export function calculateAverage(marks: number[]): number {
  if (marks.length === 0) return 0;
  const sum = marks.reduce((acc, mark) => acc + mark, 0);
  return Math.round((sum / marks.length) * 100) / 100;
}

/**
 * Calculate median from an array of marks
 */
export function calculateMedian(marks: number[]): number {
  if (marks.length === 0) return 0;
  
  const sorted = [...marks].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

/**
 * Calculate percentile rank
 */
export function calculatePercentile(
  studentMarks: number,
  allMarks: number[]
): number {
  if (allMarks.length === 0) return 0;
  
  const belowCount = allMarks.filter(mark => mark < studentMarks).length;
  return Math.round((belowCount / allMarks.length) * 100);
}

/**
 * Determine performance category based on percentile
 */
export function getPerformanceCategory(
  percentile: number
): "excellent" | "above_average" | "average" | "below_average" | "needs_improvement" {
  if (percentile >= 90) return "excellent";
  if (percentile >= 70) return "above_average";
  if (percentile >= 40) return "average";
  if (percentile >= 20) return "below_average";
  return "needs_improvement";
}

/**
 * Calculate trend from a series of percentages
 */
export function calculateTrend(
  percentages: number[]
): "improving" | "declining" | "stable" {
  if (percentages.length < 2) return "stable";
  
  // Calculate linear regression slope
  const n = percentages.length;
  const xMean = (n - 1) / 2;
  const yMean = calculateAverage(percentages);
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (percentages[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  
  // Threshold for considering trend significant (2% change per exam)
  if (slope > 2) return "improving";
  if (slope < -2) return "declining";
  return "stable";
}

/**
 * Calculate improvement rate between first and last performance
 */
export function calculateImprovementRate(
  firstPercentage: number,
  lastPercentage: number
): number {
  if (firstPercentage === 0) return 0;
  return Math.round(((lastPercentage - firstPercentage) / firstPercentage) * 100 * 100) / 100;
}

/**
 * Identify strong subjects (above average performance)
 */
export function identifyStrongSubjects(
  subjectPerformances: Array<{ name: string; percentage: number }>
): string[] {
  if (subjectPerformances.length === 0) return [];
  
  const averagePercentage = calculateAverage(
    subjectPerformances.map(s => s.percentage)
  );
  
  return subjectPerformances
    .filter(s => s.percentage >= averagePercentage + 10) // 10% above average
    .map(s => s.name);
}

/**
 * Identify weak subjects (below average performance)
 */
export function identifyWeakSubjects(
  subjectPerformances: Array<{ name: string; percentage: number }>
): string[] {
  if (subjectPerformances.length === 0) return [];
  
  const averagePercentage = calculateAverage(
    subjectPerformances.map(s => s.percentage)
  );
  
  return subjectPerformances
    .filter(s => s.percentage < averagePercentage - 10) // 10% below average
    .map(s => s.name);
}

/**
 * Calculate overall grade from multiple subject grades
 */
export function calculateOverallGrade(
  subjectGrades: Array<{ marks: number; totalMarks: number }>
): { percentage: number; grade: string; totalMarks: number; obtainedMarks: number } {
  const totalMarks = subjectGrades.reduce((sum, sg) => sum + sg.totalMarks, 0);
  const obtainedMarks = subjectGrades.reduce((sum, sg) => sum + sg.marks, 0);
  
  const percentage = calculatePercentage(obtainedMarks, totalMarks);
  const grade = calculateGrade(percentage);
  
  return {
    percentage,
    grade,
    totalMarks,
    obtainedMarks,
  };
}

/**
 * Calculate rank based on total marks
 */
export function calculateRank(
  studentMarks: number,
  allStudentMarks: number[]
): number {
  const sorted = [...allStudentMarks].sort((a, b) => b - a);
  return sorted.indexOf(studentMarks) + 1;
}

/**
 * Format grade with color coding
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A+":
    case "A":
      return "text-green-600";
    case "B+":
    case "B":
      return "text-blue-600";
    case "C+":
    case "C":
      return "text-yellow-600";
    case "D":
      return "text-orange-600";
    case "F":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Get performance status message
 */
export function getPerformanceStatus(percentage: number): {
  status: string;
  message: string;
  color: string;
} {
  if (percentage >= 90) {
    return {
      status: "Excellent",
      message: "Outstanding performance! Keep up the excellent work.",
      color: "text-green-600",
    };
  }
  if (percentage >= 75) {
    return {
      status: "Very Good",
      message: "Great job! You're doing very well.",
      color: "text-blue-600",
    };
  }
  if (percentage >= 60) {
    return {
      status: "Good",
      message: "Good performance. Keep working hard.",
      color: "text-teal-600",
    };
  }
  if (percentage >= 50) {
    return {
      status: "Satisfactory",
      message: "Satisfactory performance. There's room for improvement.",
      color: "text-yellow-600",
    };
  }
  if (percentage >= 40) {
    return {
      status: "Needs Improvement",
      message: "More effort needed. Focus on weak areas.",
      color: "text-orange-600",
    };
  }
  return {
    status: "Poor",
    message: "Significant improvement required. Seek additional help.",
    color: "text-red-600",
  };
}

/**
 * Calculate attendance impact on performance
 */
export function calculateAttendanceImpact(
  attendancePercentage: number,
  performancePercentage: number
): {
  correlation: "positive" | "negative" | "neutral";
  message: string;
} {
  // Simple correlation: good attendance (>90%) with good performance (>75%)
  if (attendancePercentage >= 90 && performancePercentage >= 75) {
    return {
      correlation: "positive",
      message: "Excellent attendance is contributing to strong academic performance.",
    };
  }
  
  if (attendancePercentage < 75 && performancePercentage < 60) {
    return {
      correlation: "negative",
      message: "Low attendance may be affecting academic performance. Regular attendance is crucial.",
    };
  }
  
  return {
    correlation: "neutral",
    message: "Maintain regular attendance to support academic success.",
  };
}
