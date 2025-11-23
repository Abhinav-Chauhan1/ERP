-- AlterTable
ALTER TABLE "AdmissionApplication" ADD COLUMN     "aadhaarNumber" VARCHAR(12),
ADD COLUMN     "abcId" VARCHAR(50),
ADD COLUMN     "annualIncome" DECIMAL(12,2),
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "caste" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "fatherAadhaar" VARCHAR(12),
ADD COLUMN     "fatherEmail" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "fatherOccupation" TEXT,
ADD COLUMN     "fatherPhone" TEXT,
ADD COLUMN     "guardianAadhaar" VARCHAR(12),
ADD COLUMN     "guardianEmail" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "guardianPhone" TEXT,
ADD COLUMN     "guardianRelation" TEXT,
ADD COLUMN     "medicalConditions" TEXT,
ADD COLUMN     "motherAadhaar" VARCHAR(12),
ADD COLUMN     "motherEmail" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "motherOccupation" TEXT,
ADD COLUMN     "motherPhone" TEXT,
ADD COLUMN     "motherTongue" TEXT,
ADD COLUMN     "nationality" TEXT DEFAULT 'Indian',
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "specialNeeds" TEXT,
ADD COLUMN     "tcNumber" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "aadhaarNumber" VARCHAR(12),
ADD COLUMN     "abcId" VARCHAR(50),
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "caste" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "fatherAadhaar" VARCHAR(12),
ADD COLUMN     "fatherEmail" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "fatherOccupation" TEXT,
ADD COLUMN     "fatherPhone" TEXT,
ADD COLUMN     "guardianAadhaar" VARCHAR(12),
ADD COLUMN     "guardianEmail" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "guardianPhone" TEXT,
ADD COLUMN     "guardianRelation" TEXT,
ADD COLUMN     "medicalConditions" TEXT,
ADD COLUMN     "motherAadhaar" VARCHAR(12),
ADD COLUMN     "motherEmail" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "motherOccupation" TEXT,
ADD COLUMN     "motherPhone" TEXT,
ADD COLUMN     "motherTongue" TEXT,
ADD COLUMN     "nationality" TEXT DEFAULT 'Indian',
ADD COLUMN     "previousClass" TEXT,
ADD COLUMN     "previousSchool" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "specialNeeds" TEXT,
ADD COLUMN     "tcNumber" TEXT;

-- CreateIndex
CREATE INDEX "AdmissionApplication_aadhaarNumber_idx" ON "AdmissionApplication"("aadhaarNumber");

-- CreateIndex
CREATE INDEX "AdmissionApplication_abcId_idx" ON "AdmissionApplication"("abcId");

-- CreateIndex
CREATE INDEX "Student_aadhaarNumber_idx" ON "Student"("aadhaarNumber");

-- CreateIndex
CREATE INDEX "Student_abcId_idx" ON "Student"("abcId");
