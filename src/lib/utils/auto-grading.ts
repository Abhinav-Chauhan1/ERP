/**
 * Auto-grading utilities for online examinations
 */

export interface Question {
  id: string;
  questionType: string;
  correctAnswer: string | null;
  marks: number;
}

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  gradedMarks: number;
  hasEssayQuestions: boolean;
  questionScores: Record<string, number>;
}

/**
 * Auto-grade objective questions (MCQ and TRUE_FALSE)
 * Essay questions are marked for manual grading
 * 
 * @param questions - Array of questions from the question bank
 * @param answers - Student's answers mapped by question ID
 * @returns Grading result with scores and essay question flag
 */
export function autoGradeExam(
  questions: Question[],
  answers: Record<string, any>
): GradingResult {
  let totalScore = 0;
  let maxScore = 0;
  let gradedMarks = 0;
  let hasEssayQuestions = false;
  const questionScores: Record<string, number> = {};

  for (const question of questions) {
    const studentAnswer = answers[question.id];
    maxScore += question.marks;

    if (question.questionType === "MCQ" || question.questionType === "TRUE_FALSE") {
      // Auto-grade objective questions
      const isCorrect = studentAnswer === question.correctAnswer;
      const score = isCorrect ? question.marks : 0;
      
      totalScore += score;
      gradedMarks += question.marks;
      questionScores[question.id] = score;
    } else if (question.questionType === "ESSAY") {
      // Mark essay questions for manual grading
      hasEssayQuestions = true;
      questionScores[question.id] = 0; // Will be graded manually
    }
  }

  return {
    totalScore,
    maxScore,
    gradedMarks,
    hasEssayQuestions,
    questionScores,
  };
}

/**
 * Calculate the final score for an exam
 * Returns null if there are essay questions pending manual grading
 * 
 * @param gradingResult - Result from autoGradeExam
 * @returns Final score or null if manual grading is needed
 */
export function calculateFinalScore(gradingResult: GradingResult): number | null {
  if (gradingResult.hasEssayQuestions) {
    return null; // Needs manual grading
  }
  return gradingResult.totalScore;
}

/**
 * Check if a question is objective (can be auto-graded)
 * 
 * @param questionType - Type of the question
 * @returns True if the question can be auto-graded
 */
export function isObjectiveQuestion(questionType: string): boolean {
  return questionType === "MCQ" || questionType === "TRUE_FALSE";
}

/**
 * Validate that all objective questions have correct answers defined
 * 
 * @param questions - Array of questions
 * @returns True if all objective questions have correct answers
 */
export function validateObjectiveQuestions(questions: Question[]): boolean {
  for (const question of questions) {
    if (isObjectiveQuestion(question.questionType)) {
      if (!question.correctAnswer) {
        return false;
      }
    }
  }
  return true;
}
