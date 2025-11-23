-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'ESSAY');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'CANCELLED');

-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT,
    "marks" DOUBLE PRECISION NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topic" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "createdBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "questions" JSONB NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "instructions" TEXT,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT true,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "status" "ExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_bank_subjectId_topic_idx" ON "question_bank"("subjectId", "topic");

-- CreateIndex
CREATE INDEX "question_bank_difficulty_idx" ON "question_bank"("difficulty");

-- CreateIndex
CREATE INDEX "question_bank_createdBy_idx" ON "question_bank"("createdBy");

-- CreateIndex
CREATE INDEX "online_exams_classId_startTime_idx" ON "online_exams"("classId", "startTime");

-- CreateIndex
CREATE INDEX "online_exams_subjectId_idx" ON "online_exams"("subjectId");

-- CreateIndex
CREATE INDEX "online_exams_createdBy_idx" ON "online_exams"("createdBy");

-- CreateIndex
CREATE INDEX "online_exams_startTime_endTime_idx" ON "online_exams"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "exam_attempts_studentId_status_idx" ON "exam_attempts"("studentId", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_examId_status_idx" ON "exam_attempts"("examId", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_submittedAt_idx" ON "exam_attempts"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_examId_studentId_key" ON "exam_attempts"("examId", "studentId");

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "online_exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
