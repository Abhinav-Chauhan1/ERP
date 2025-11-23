-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('ACHIEVEMENT', 'COMPLETION', 'PARTICIPATION', 'MERIT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CertificateType" NOT NULL,
    "category" TEXT,
    "layout" TEXT NOT NULL,
    "styling" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mergeFields" TEXT NOT NULL,
    "pageSize" TEXT NOT NULL DEFAULT 'A4',
    "orientation" TEXT NOT NULL DEFAULT 'LANDSCAPE',
    "headerImage" TEXT,
    "footerImage" TEXT,
    "background" TEXT,
    "signature1" TEXT,
    "signature2" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_certificates" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "verificationCode" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_name_key" ON "certificate_templates"("name");

-- CreateIndex
CREATE INDEX "certificate_templates_type_isActive_idx" ON "certificate_templates"("type", "isActive");

-- CreateIndex
CREATE INDEX "certificate_templates_category_idx" ON "certificate_templates"("category");

-- CreateIndex
CREATE INDEX "certificate_templates_createdBy_idx" ON "certificate_templates"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "generated_certificates_certificateNumber_key" ON "generated_certificates"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "generated_certificates_verificationCode_key" ON "generated_certificates"("verificationCode");

-- CreateIndex
CREATE INDEX "generated_certificates_certificateNumber_idx" ON "generated_certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "generated_certificates_verificationCode_idx" ON "generated_certificates"("verificationCode");

-- CreateIndex
CREATE INDEX "generated_certificates_studentId_idx" ON "generated_certificates"("studentId");

-- CreateIndex
CREATE INDEX "generated_certificates_templateId_idx" ON "generated_certificates"("templateId");

-- CreateIndex
CREATE INDEX "generated_certificates_issuedDate_idx" ON "generated_certificates"("issuedDate");

-- CreateIndex
CREATE INDEX "generated_certificates_status_idx" ON "generated_certificates"("status");

-- AddForeignKey
ALTER TABLE "generated_certificates" ADD CONSTRAINT "generated_certificates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
