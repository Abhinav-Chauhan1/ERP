import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  autoGradeExam,
  calculateFinalScore,
  isObjectiveQuestion,
  validateObjectiveQuestions,
  type Question,
} from './auto-grading';

describe('Auto-Grading Utilities', () => {
  describe('Unit Tests', () => {
    it('should correctly grade MCQ questions', () => {
      const questions: Question[] = [
        {
          id: '1',
          questionType: 'MCQ',
          correctAnswer: 'A',
          marks: 5,
        },
        {
          id: '2',
          questionType: 'MCQ',
          correctAnswer: 'B',
          marks: 3,
        },
      ];

      const answers = {
        '1': 'A', // Correct
        '2': 'C', // Incorrect
      };

      const result = autoGradeExam(questions, answers);

      expect(result.totalScore).toBe(5);
      expect(result.maxScore).toBe(8);
      expect(result.gradedMarks).toBe(8);
      expect(result.hasEssayQuestions).toBe(false);
      expect(result.questionScores['1']).toBe(5);
      expect(result.questionScores['2']).toBe(0);
    });

    it('should correctly grade TRUE_FALSE questions', () => {
      const questions: Question[] = [
        {
          id: '1',
          questionType: 'TRUE_FALSE',
          correctAnswer: 'true',
          marks: 2,
        },
        {
          id: '2',
          questionType: 'TRUE_FALSE',
          correctAnswer: 'false',
          marks: 2,
        },
      ];

      const answers = {
        '1': 'true', // Correct
        '2': 'false', // Correct
      };

      const result = autoGradeExam(questions, answers);

      expect(result.totalScore).toBe(4);
      expect(result.maxScore).toBe(4);
      expect(result.gradedMarks).toBe(4);
      expect(result.hasEssayQuestions).toBe(false);
    });

    it('should mark essay questions for manual grading', () => {
      const questions: Question[] = [
        {
          id: '1',
          questionType: 'MCQ',
          correctAnswer: 'A',
          marks: 5,
        },
        {
          id: '2',
          questionType: 'ESSAY',
          correctAnswer: null,
          marks: 10,
        },
      ];

      const answers = {
        '1': 'A',
        '2': 'Student essay answer...',
      };

      const result = autoGradeExam(questions, answers);

      expect(result.totalScore).toBe(5); // Only MCQ graded
      expect(result.maxScore).toBe(15);
      expect(result.gradedMarks).toBe(5); // Only MCQ marks counted
      expect(result.hasEssayQuestions).toBe(true);
      expect(result.questionScores['2']).toBe(0); // Essay not graded yet
    });

    it('should return null final score when essay questions exist', () => {
      const gradingResult = {
        totalScore: 10,
        maxScore: 20,
        gradedMarks: 10,
        hasEssayQuestions: true,
        questionScores: {},
      };

      const finalScore = calculateFinalScore(gradingResult);
      expect(finalScore).toBeNull();
    });

    it('should return total score when no essay questions exist', () => {
      const gradingResult = {
        totalScore: 15,
        maxScore: 20,
        gradedMarks: 20,
        hasEssayQuestions: false,
        questionScores: {},
      };

      const finalScore = calculateFinalScore(gradingResult);
      expect(finalScore).toBe(15);
    });

    it('should identify objective questions correctly', () => {
      expect(isObjectiveQuestion('MCQ')).toBe(true);
      expect(isObjectiveQuestion('TRUE_FALSE')).toBe(true);
      expect(isObjectiveQuestion('ESSAY')).toBe(false);
      expect(isObjectiveQuestion('SHORT_ANSWER')).toBe(false);
    });

    it('should validate objective questions have correct answers', () => {
      const validQuestions: Question[] = [
        {
          id: '1',
          questionType: 'MCQ',
          correctAnswer: 'A',
          marks: 5,
        },
        {
          id: '2',
          questionType: 'ESSAY',
          correctAnswer: null,
          marks: 10,
        },
      ];

      expect(validateObjectiveQuestions(validQuestions)).toBe(true);

      const invalidQuestions: Question[] = [
        {
          id: '1',
          questionType: 'MCQ',
          correctAnswer: null, // Missing correct answer
          marks: 5,
        },
      ];

      expect(validateObjectiveQuestions(invalidQuestions)).toBe(false);
    });

    it('should handle empty answers gracefully', () => {
      const questions: Question[] = [
        {
          id: '1',
          questionType: 'MCQ',
          correctAnswer: 'A',
          marks: 5,
        },
      ];

      const answers = {}; // No answers provided

      const result = autoGradeExam(questions, answers);

      expect(result.totalScore).toBe(0);
      expect(result.maxScore).toBe(5);
      expect(result.questionScores['1']).toBe(0);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: erp-production-completion, Property 44: Objective Question Auto-Grading
     * For any MCQ or true/false question, the system should automatically calculate
     * the score based on correct answers
     * Validates: Requirements 14.4
     */
    it('Property 44: Objective Question Auto-Grading', () => {
      fc.assert(
        fc.property(
          // Generate random objective questions
          fc.array(
            fc.record({
              id: fc.uuid(),
              questionType: fc.constantFrom('MCQ', 'TRUE_FALSE'),
              correctAnswer: fc.oneof(
                fc.constantFrom('A', 'B', 'C', 'D'),
                fc.constantFrom('true', 'false')
              ),
              marks: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (questions) => {
            // Generate random student answers
            const answers: Record<string, any> = {};
            for (const question of questions) {
              // Randomly answer correctly or incorrectly
              if (Math.random() > 0.5) {
                answers[question.id] = question.correctAnswer; // Correct answer
              } else {
                // Incorrect answer
                if (question.questionType === 'MCQ') {
                  const wrongAnswers = ['A', 'B', 'C', 'D'].filter(
                    (a) => a !== question.correctAnswer
                  );
                  answers[question.id] =
                    wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
                } else {
                  answers[question.id] =
                    question.correctAnswer === 'true' ? 'false' : 'true';
                }
              }
            }

            // Grade the exam
            const result = autoGradeExam(questions, answers);

            // Property 1: Total score should never exceed max score
            expect(result.totalScore).toBeLessThanOrEqual(result.maxScore);

            // Property 2: Total score should be non-negative
            expect(result.totalScore).toBeGreaterThanOrEqual(0);

            // Property 3: Max score should equal sum of all question marks
            const expectedMaxScore = questions.reduce((sum, q) => sum + q.marks, 0);
            expect(result.maxScore).toBe(expectedMaxScore);

            // Property 4: Graded marks should equal max score for objective-only exams
            expect(result.gradedMarks).toBe(expectedMaxScore);

            // Property 5: Should not have essay questions flag for objective-only exams
            expect(result.hasEssayQuestions).toBe(false);

            // Property 6: Each question should have a score entry
            for (const question of questions) {
              expect(result.questionScores).toHaveProperty(question.id);
              const score = result.questionScores[question.id];
              
              // Property 7: Question score should be either 0 or full marks
              expect(score === 0 || score === question.marks).toBe(true);
              
              // Property 8: If answer is correct, score should be full marks
              if (answers[question.id] === question.correctAnswer) {
                expect(score).toBe(question.marks);
              } else {
                // Property 9: If answer is incorrect, score should be 0
                expect(score).toBe(0);
              }
            }

            // Property 10: Final score should equal total score for objective-only exams
            const finalScore = calculateFinalScore(result);
            expect(finalScore).toBe(result.totalScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Essay questions prevent automatic final scoring', () => {
      fc.assert(
        fc.property(
          // Generate exams with at least one essay question
          fc.record({
            objectiveQuestions: fc.array(
              fc.record({
                id: fc.uuid(),
                questionType: fc.constantFrom('MCQ', 'TRUE_FALSE'),
                correctAnswer: fc.constantFrom('A', 'B', 'true', 'false'),
                marks: fc.integer({ min: 1, max: 10 }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
            essayQuestions: fc.array(
              fc.record({
                id: fc.uuid(),
                questionType: fc.constant('ESSAY'),
                correctAnswer: fc.constant(null),
                marks: fc.integer({ min: 5, max: 20 }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          ({ objectiveQuestions, essayQuestions }) => {
            const allQuestions = [...objectiveQuestions, ...essayQuestions];
            
            // Generate answers
            const answers: Record<string, any> = {};
            for (const question of allQuestions) {
              if (question.questionType === 'ESSAY') {
                answers[question.id] = 'Student essay answer...';
              } else {
                answers[question.id] = question.correctAnswer;
              }
            }

            // Grade the exam
            const result = autoGradeExam(allQuestions, answers);

            // Property 1: Should flag essay questions
            expect(result.hasEssayQuestions).toBe(true);

            // Property 2: Final score should be null when essay questions exist
            const finalScore = calculateFinalScore(result);
            expect(finalScore).toBeNull();

            // Property 3: Graded marks should only include objective questions
            const expectedGradedMarks = objectiveQuestions.reduce(
              (sum, q) => sum + q.marks,
              0
            );
            expect(result.gradedMarks).toBe(expectedGradedMarks);

            // Property 4: Essay question scores should be 0 (pending manual grading)
            for (const essayQ of essayQuestions) {
              expect(result.questionScores[essayQ.id]).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Grading is deterministic', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              questionType: fc.constantFrom('MCQ', 'TRUE_FALSE'),
              correctAnswer: fc.constantFrom('A', 'B', 'true', 'false'),
              marks: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.dictionary(fc.string(), fc.string()),
          (questions, answers) => {
            // Grade the same exam twice
            const result1 = autoGradeExam(questions, answers);
            const result2 = autoGradeExam(questions, answers);

            // Property: Results should be identical
            expect(result1.totalScore).toBe(result2.totalScore);
            expect(result1.maxScore).toBe(result2.maxScore);
            expect(result1.gradedMarks).toBe(result2.gradedMarks);
            expect(result1.hasEssayQuestions).toBe(result2.hasEssayQuestions);
            expect(result1.questionScores).toEqual(result2.questionScores);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: All correct answers yield maximum score', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              questionType: fc.constantFrom('MCQ', 'TRUE_FALSE'),
              correctAnswer: fc.constantFrom('A', 'B', 'true', 'false'),
              marks: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (questions) => {
            // Create answers with all correct responses
            const answers: Record<string, any> = {};
            for (const question of questions) {
              answers[question.id] = question.correctAnswer;
            }

            // Grade the exam
            const result = autoGradeExam(questions, answers);

            // Property: Total score should equal max score
            expect(result.totalScore).toBe(result.maxScore);

            // Property: All question scores should be full marks
            for (const question of questions) {
              expect(result.questionScores[question.id]).toBe(question.marks);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: All incorrect answers yield zero score', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              questionType: fc.constantFrom('MCQ', 'TRUE_FALSE'),
              correctAnswer: fc.constantFrom('A', 'B', 'true', 'false'),
              marks: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (questions) => {
            // Create answers with all incorrect responses
            const answers: Record<string, any> = {};
            for (const question of questions) {
              if (question.questionType === 'MCQ') {
                const wrongAnswers = ['A', 'B', 'C', 'D'].filter(
                  (a) => a !== question.correctAnswer
                );
                answers[question.id] = wrongAnswers[0];
              } else {
                answers[question.id] =
                  question.correctAnswer === 'true' ? 'false' : 'true';
              }
            }

            // Grade the exam
            const result = autoGradeExam(questions, answers);

            // Property: Total score should be zero
            expect(result.totalScore).toBe(0);

            // Property: All question scores should be zero
            for (const question of questions) {
              expect(result.questionScores[question.id]).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
