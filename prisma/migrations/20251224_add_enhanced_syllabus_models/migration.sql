-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "syllabusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "moduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyllabusDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "moduleId" TEXT,
    "subModuleId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyllabusDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubModuleProgress" (
    "id" TEXT NOT NULL,
    "subModuleId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Module_syllabusId_order_idx" ON "Module"("syllabusId", "order");

-- CreateIndex
CREATE INDEX "Module_syllabusId_chapterNumber_idx" ON "Module"("syllabusId", "chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Module_syllabusId_chapterNumber_key" ON "Module"("syllabusId", "chapterNumber");

-- CreateIndex
CREATE INDEX "SubModule_moduleId_order_idx" ON "SubModule"("moduleId", "order");

-- CreateIndex
CREATE INDEX "SubModule_moduleId_idx" ON "SubModule"("moduleId");

-- CreateIndex
CREATE INDEX "SyllabusDocument_moduleId_idx" ON "SyllabusDocument"("moduleId");

-- CreateIndex
CREATE INDEX "SyllabusDocument_subModuleId_idx" ON "SyllabusDocument"("subModuleId");

-- CreateIndex
CREATE INDEX "SyllabusDocument_moduleId_order_idx" ON "SyllabusDocument"("moduleId", "order");

-- CreateIndex
CREATE INDEX "SyllabusDocument_subModuleId_order_idx" ON "SyllabusDocument"("subModuleId", "order");

-- CreateIndex
CREATE INDEX "SubModuleProgress_teacherId_idx" ON "SubModuleProgress"("teacherId");

-- CreateIndex
CREATE INDEX "SubModuleProgress_subModuleId_teacherId_idx" ON "SubModuleProgress"("subModuleId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "SubModuleProgress_subModuleId_teacherId_key" ON "SubModuleProgress"("subModuleId", "teacherId");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_syllabusId_fkey" FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubModule" ADD CONSTRAINT "SubModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusDocument" ADD CONSTRAINT "SyllabusDocument_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusDocument" ADD CONSTRAINT "SyllabusDocument_subModuleId_fkey" FOREIGN KEY ("subModuleId") REFERENCES "SubModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubModuleProgress" ADD CONSTRAINT "SubModuleProgress_subModuleId_fkey" FOREIGN KEY ("subModuleId") REFERENCES "SubModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
