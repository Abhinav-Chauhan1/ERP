-- Add Indian-specific fields to Student model
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "aadhaarNumber" VARCHAR(12);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "abcId" VARCHAR(50);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "nationality" VARCHAR(50) DEFAULT 'Indian';
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "religion" VARCHAR(50);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "caste" VARCHAR(50);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "category" VARCHAR(20);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherTongue" VARCHAR(50);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "birthPlace" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "previousSchool" VARCHAR(200);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "previousClass" VARCHAR(50);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "tcNumber" VARCHAR(50);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "medicalConditions" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "specialNeeds" TEXT;

-- Add parent/guardian details to Student model
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "fatherName" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "fatherOccupation" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "fatherPhone" VARCHAR(20);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "fatherEmail" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "fatherAadhaar" VARCHAR(12);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherName" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherOccupation" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherPhone" VARCHAR(20);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherEmail" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "motherAadhaar" VARCHAR(12);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "guardianName" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "guardianRelation" VARCHAR(50);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "guardianPhone" VARCHAR(20);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "guardianEmail" VARCHAR(100);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "guardianAadhaar" VARCHAR(12);

-- Add Indian-specific fields to AdmissionApplication model
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "aadhaarNumber" VARCHAR(12);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "abcId" VARCHAR(50);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "nationality" VARCHAR(50) DEFAULT 'Indian';
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "religion" VARCHAR(50);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "caste" VARCHAR(50);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "category" VARCHAR(20);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "motherTongue" VARCHAR(50);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "birthPlace" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "bloodGroup" VARCHAR(10);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "tcNumber" VARCHAR(50);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "medicalConditions" TEXT;
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "specialNeeds" TEXT;

-- Add parent/guardian details to AdmissionApplication model
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "fatherName" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "fatherOccupation" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "fatherPhone" VARCHAR(20);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "fatherEmail" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "fatherAadhaar" VARCHAR(12);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "motherName" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "motherOccupation" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "motherPhone" VARCHAR(20);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "motherEmail" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "motherAadhaar" VARCHAR(12);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "guardianName" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "guardianRelation" VARCHAR(50);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "guardianPhone" VARCHAR(20);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "guardianEmail" VARCHAR(100);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "guardianAadhaar" VARCHAR(12);
ALTER TABLE "AdmissionApplication" ADD COLUMN IF NOT EXISTS "annualIncome" DECIMAL(12,2);

-- Create indexes for Aadhaar and ABC ID
CREATE INDEX IF NOT EXISTS "Student_aadhaarNumber_idx" ON "Student"("aadhaarNumber");
CREATE INDEX IF NOT EXISTS "Student_abcId_idx" ON "Student"("abcId");
CREATE INDEX IF NOT EXISTS "AdmissionApplication_aadhaarNumber_idx" ON "AdmissionApplication"("aadhaarNumber");
CREATE INDEX IF NOT EXISTS "AdmissionApplication_abcId_idx" ON "AdmissionApplication"("abcId");
