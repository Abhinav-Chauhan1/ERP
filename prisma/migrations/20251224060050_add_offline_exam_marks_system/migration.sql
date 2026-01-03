-- AlterTable
ALTER TABLE "ExamResult" ADD COLUMN     "internalMarks" DOUBLE PRECISION,
ADD COLUMN     "percentage" DOUBLE PRECISION,
ADD COLUMN     "practicalMarks" DOUBLE PRECISION,
ADD COLUMN     "theoryMarks" DOUBLE PRECISION,
ADD COLUMN     "totalMarks" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ReportCard" ADD COLUMN     "coScholasticData" JSONB,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "subject_mark_configs" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "theoryMaxMarks" DOUBLE PRECISION,
    "practicalMaxMarks" DOUBLE PRECISION,
    "internalMaxMarks" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_mark_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_scholastic_activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "maxMarks" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_scholastic_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_scholastic_grades" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "grade" TEXT,
    "marks" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_scholastic_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_card_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "pageSize" TEXT NOT NULL DEFAULT 'A4',
    "orientation" TEXT NOT NULL DEFAULT 'PORTRAIT',
    "sections" JSONB NOT NULL,
    "styling" JSONB NOT NULL,
    "headerImage" TEXT,
    "footerImage" TEXT,
    "schoolLogo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_card_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subject_mark_configs_examId_idx" ON "subject_mark_configs"("examId");

-- CreateIndex
CREATE INDEX "subject_mark_configs_subjectId_idx" ON "subject_mark_configs"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_mark_configs_examId_subjectId_key" ON "subject_mark_configs"("examId", "subjectId");

-- CreateIndex
CREATE INDEX "co_scholastic_activities_isActive_idx" ON "co_scholastic_activities"("isActive");

-- CreateIndex
CREATE INDEX "co_scholastic_grades_studentId_termId_idx" ON "co_scholastic_grades"("studentId", "termId");

-- CreateIndex
CREATE INDEX "co_scholastic_grades_activityId_idx" ON "co_scholastic_grades"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "co_scholastic_grades_activityId_studentId_termId_key" ON "co_scholastic_grades"("activityId", "studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "report_card_templates_name_key" ON "report_card_templates"("name");

-- CreateIndex
CREATE INDEX "report_card_templates_type_isActive_idx" ON "report_card_templates"("type", "isActive");

-- CreateIndex
CREATE INDEX "report_card_templates_isDefault_idx" ON "report_card_templates"("isDefault");

-- CreateIndex
CREATE INDEX "ReportCard_templateId_idx" ON "ReportCard"("templateId");

-- CreateIndex
CREATE INDEX "ReportCard_isPublished_idx" ON "ReportCard"("isPublished");

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_card_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_mark_configs" ADD CONSTRAINT "subject_mark_configs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_mark_configs" ADD CONSTRAINT "subject_mark_configs_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_grades" ADD CONSTRAINT "co_scholastic_grades_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "co_scholastic_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_grades" ADD CONSTRAINT "co_scholastic_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_grades" ADD CONSTRAINT "co_scholastic_grades_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
