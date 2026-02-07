-- Student Portal Phase 2 Features Migration
-- Adds support for: Student Achievements, Notes, Flashcards, Mind Maps, Enhanced LMS

-- Student Achievement System
CREATE TABLE "student_achievements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL, -- academic, attendance, participation, streak, special
    "points" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
    "icon" TEXT NOT NULL DEFAULT 'Star',
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "maxProgress" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_achievements_pkey" PRIMARY KEY ("id")
);

-- Student XP and Level System
CREATE TABLE "student_xp_levels" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentLevelXP" INTEGER NOT NULL DEFAULT 0,
    "xpToNextLevel" INTEGER NOT NULL DEFAULT 100,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_xp_levels_pkey" PRIMARY KEY ("id")
);

-- Student Notes System
CREATE TABLE "student_notes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "tags" TEXT[],
    "folder" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

-- Flashcard Decks
CREATE TABLE "flashcard_decks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- Flashcards
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium', -- easy, medium, hard
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3),
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- Mind Maps
CREATE TABLE "mind_maps" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "connections" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mind_maps_pkey" PRIMARY KEY ("id")
);

-- Enhanced Lesson Content
CREATE TABLE "lesson_contents" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT,
    "courseId" TEXT,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- video, text, audio, interactive
    "content" TEXT NOT NULL,
    "duration" INTEGER, -- in minutes
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

-- Student Lesson Content Progress
CREATE TABLE "student_content_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0, -- in seconds
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_content_progress_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance
CREATE INDEX "student_achievements_studentId_idx" ON "student_achievements"("studentId");
CREATE INDEX "student_achievements_schoolId_idx" ON "student_achievements"("schoolId");
CREATE INDEX "student_achievements_category_idx" ON "student_achievements"("category");
CREATE INDEX "student_achievements_unlocked_idx" ON "student_achievements"("unlocked");

CREATE UNIQUE INDEX "student_xp_levels_studentId_key" ON "student_xp_levels"("studentId");
CREATE INDEX "student_xp_levels_schoolId_idx" ON "student_xp_levels"("schoolId");
CREATE INDEX "student_xp_levels_level_idx" ON "student_xp_levels"("level");

CREATE INDEX "student_notes_studentId_idx" ON "student_notes"("studentId");
CREATE INDEX "student_notes_schoolId_idx" ON "student_notes"("schoolId");
CREATE INDEX "student_notes_subject_idx" ON "student_notes"("subject");
CREATE INDEX "student_notes_folder_idx" ON "student_notes"("folder");

CREATE INDEX "flashcard_decks_studentId_idx" ON "flashcard_decks"("studentId");
CREATE INDEX "flashcard_decks_schoolId_idx" ON "flashcard_decks"("schoolId");
CREATE INDEX "flashcard_decks_subject_idx" ON "flashcard_decks"("subject");

CREATE INDEX "flashcards_deckId_idx" ON "flashcards"("deckId");
CREATE INDEX "flashcards_studentId_idx" ON "flashcards"("studentId");
CREATE INDEX "flashcards_schoolId_idx" ON "flashcards"("schoolId");

CREATE INDEX "mind_maps_studentId_idx" ON "mind_maps"("studentId");
CREATE INDEX "mind_maps_schoolId_idx" ON "mind_maps"("schoolId");
CREATE INDEX "mind_maps_subject_idx" ON "mind_maps"("subject");

CREATE INDEX "lesson_contents_lessonId_idx" ON "lesson_contents"("lessonId");
CREATE INDEX "lesson_contents_courseId_idx" ON "lesson_contents"("courseId");
CREATE INDEX "lesson_contents_schoolId_idx" ON "lesson_contents"("schoolId");
CREATE INDEX "lesson_contents_order_idx" ON "lesson_contents"("order");

CREATE INDEX "student_content_progress_studentId_idx" ON "student_content_progress"("studentId");
CREATE INDEX "student_content_progress_contentId_idx" ON "student_content_progress"("contentId");
CREATE INDEX "student_content_progress_schoolId_idx" ON "student_content_progress"("schoolId");
CREATE UNIQUE INDEX "student_content_progress_studentId_contentId_key" ON "student_content_progress"("studentId", "contentId");

-- Foreign Key Constraints
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_xp_levels" ADD CONSTRAINT "student_xp_levels_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_xp_levels" ADD CONSTRAINT "student_xp_levels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_content_progress" ADD CONSTRAINT "student_content_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_content_progress" ADD CONSTRAINT "student_content_progress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "lesson_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_content_progress" ADD CONSTRAINT "student_content_progress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;