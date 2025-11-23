-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('SMS', 'EMAIL', 'BOTH');

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MessageType" NOT NULL,
    "category" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_name_key" ON "message_templates"("name");

-- CreateIndex
CREATE INDEX "message_templates_type_isActive_idx" ON "message_templates"("type", "isActive");

-- CreateIndex
CREATE INDEX "message_templates_category_idx" ON "message_templates"("category");

-- CreateIndex
CREATE INDEX "message_templates_createdBy_idx" ON "message_templates"("createdBy");
