-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'GROWTH', 'DOMINATE');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'CLASSMATES_ONLY');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TimeFormat" AS ENUM ('TWELVE_HOUR', 'TWENTY_FOUR_HOUR');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'EMAIL_AND_SMS', 'EMAIL_AND_WHATSAPP', 'SMS_AND_WHATSAPP', 'ALL', 'BOTH');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('CORE', 'LANGUAGE', 'ELECTIVE', 'ADDITIONAL', 'VOCATIONAL', 'SKILL_BASED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "SyllabusStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "CurriculumType" AS ENUM ('GENERAL', 'ADVANCED', 'REMEDIAL', 'INTEGRATED', 'VOCATIONAL', 'SPECIAL_NEEDS');

-- CreateEnum
CREATE TYPE "AssessmentRuleType" AS ENUM ('BEST_OF', 'AVERAGE', 'WEIGHTED_AVERAGE', 'SUM');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('GRADED', 'CO_SCHOLASTIC');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeeFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHEQUE', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'ONLINE_PAYMENT', 'SCHOLARSHIP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'PARTIAL', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('MANUAL', 'ONLINE', 'RECEIPT_UPLOAD');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('CERTIFICATE', 'ID_PROOF', 'TEACHING_MATERIAL', 'LESSON_PLAN', 'CURRICULUM', 'POLICY', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('SCHOOL_EVENT', 'TEACHER_MEETING', 'PARENT_TEACHER_CONFERENCE', 'PROFESSIONAL_DEVELOPMENT', 'HOLIDAY', 'EXAM', 'OTHER');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('AWARD', 'CERTIFICATION', 'PROFESSIONAL_DEVELOPMENT', 'PUBLICATION', 'RECOGNITION', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'PUBLISH', 'ARCHIVE', 'VERIFY', 'VIEW', 'UPLOAD', 'REUPLOAD', 'ADD_NOTE', 'DELETE_NOTE', 'BULK_VERIFY', 'BULK_REJECT');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('ISSUED', 'RETURNED', 'OVERDUE', 'LOST');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "DocumentTypeEnum" AS ENUM ('BIRTH_CERTIFICATE', 'PREVIOUS_REPORT_CARD', 'PHOTOGRAPH', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP', 'BOTH');

-- CreateEnum
CREATE TYPE "WhatsAppTemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'PARTIALLY_SENT');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageLogStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "ErrorCategory" AS ENUM ('CONFIGURATION', 'AUTHENTICATION', 'VALIDATION', 'RATE_LIMIT', 'NETWORK', 'API_ERROR', 'DATABASE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('ACHIEVEMENT', 'COMPLETION', 'PARTICIPATION', 'MERIT', 'CHARACTER', 'BONAFIDE', 'TRANSFER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransportAttendanceType" AS ENUM ('BOARDING', 'ALIGHTING');

-- CreateEnum
CREATE TYPE "TransportAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'ESSAY');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'PUBLISH', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "HostelType" AS ENUM ('BOYS', 'GIRLS', 'MIXED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'SHARED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'VACATED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('ROOM_MAINTENANCE', 'MESS_FOOD', 'CLEANLINESS', 'ELECTRICITY', 'WATER_SUPPLY', 'SECURITY', 'NOISE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('TEXT', 'VIDEO', 'AUDIO', 'DOCUMENT', 'PRESENTATION', 'INTERACTIVE', 'QUIZ');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'AUDIO', 'PDF', 'DOCUMENT', 'PRESENTATION', 'IMAGE', 'TEXT', 'LINK', 'EMBED');

-- CreateEnum
CREATE TYPE "EnrollmentCourseStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventSourceType" AS ENUM ('EXAM', 'ASSIGNMENT', 'MEETING', 'HOLIDAY', 'SCHOOL_EVENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PROMOTED', 'EXCLUDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorBackupCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "domain" TEXT,
    "subdomain" TEXT,
    "plan" "PlanType" NOT NULL DEFAULT 'STARTER',
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingCompletedAt" TIMESTAMP(3),
    "tagline" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#8b5cf6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_counters" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "whatsappUsed" INTEGER NOT NULL DEFAULT 0,
    "smsUsed" INTEGER NOT NULL DEFAULT 0,
    "whatsappLimit" INTEGER NOT NULL DEFAULT 1000,
    "smsLimit" INTEGER NOT NULL DEFAULT 1000,
    "storageUsedMB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageLimitMB" INTEGER NOT NULL DEFAULT 1024,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_schools" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Administrator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Administrator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "qualification" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "salary" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSettings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "assignmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "examReminders" BOOLEAN NOT NULL DEFAULT true,
    "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "announcementNotifications" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'LIGHT',
    "colorTheme" TEXT NOT NULL DEFAULT 'blue',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "TeacherSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "rollNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT,
    "bloodGroup" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "emergencyContact" TEXT,
    "aadhaarNumber" VARCHAR(12),
    "apaarId" VARCHAR(50),
    "pen" VARCHAR(50),
    "abcId" VARCHAR(50),
    "nationality" TEXT DEFAULT 'Indian',
    "religion" TEXT,
    "caste" TEXT,
    "category" TEXT,
    "motherTongue" TEXT,
    "birthPlace" TEXT,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "tcNumber" TEXT,
    "medicalConditions" TEXT,
    "specialNeeds" TEXT,
    "fatherName" TEXT,
    "fatherOccupation" TEXT,
    "fatherPhone" TEXT,
    "fatherEmail" TEXT,
    "fatherAadhaar" VARCHAR(12),
    "motherName" TEXT,
    "motherOccupation" TEXT,
    "motherPhone" TEXT,
    "motherEmail" TEXT,
    "motherAadhaar" VARCHAR(12),
    "guardianName" TEXT,
    "guardianRelation" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "guardianAadhaar" VARCHAR(12),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "emergencyPhone" TEXT,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSettings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "assignmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "examReminders" BOOLEAN NOT NULL DEFAULT true,
    "attendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "feeReminders" BOOLEAN NOT NULL DEFAULT true,
    "eventNotifications" BOOLEAN NOT NULL DEFAULT true,
    "announcementNotifications" BOOLEAN NOT NULL DEFAULT true,
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "theme" "Theme" NOT NULL DEFAULT 'LIGHT',
    "colorTheme" TEXT NOT NULL DEFAULT 'blue',
    "language" TEXT NOT NULL DEFAULT 'en',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "timeFormat" "TimeFormat" NOT NULL DEFAULT 'TWELVE_HOUR',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "StudentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occupation" TEXT,
    "alternatePhone" TEXT,
    "relation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentSettings" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "feeReminders" BOOLEAN NOT NULL DEFAULT true,
    "attendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "examResultNotifications" BOOLEAN NOT NULL DEFAULT true,
    "announcementNotifications" BOOLEAN NOT NULL DEFAULT true,
    "meetingReminders" BOOLEAN NOT NULL DEFAULT true,
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
    "preferredContactMethod" "ContactMethod" NOT NULL DEFAULT 'EMAIL',
    "notificationFrequency" "NotificationFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "whatsappNumber" TEXT,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "theme" "Theme" NOT NULL DEFAULT 'LIGHT',
    "colorTheme" TEXT NOT NULL DEFAULT 'blue',
    "language" TEXT NOT NULL DEFAULT 'en',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ParentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentParent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportCardTemplateId" TEXT,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "homeRoomId" TEXT,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ClassSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "building" TEXT,
    "floor" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ClassRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTeacher" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "teacherId" TEXT NOT NULL,
    "isClassHead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "rollNumber" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrollDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "type" "SubjectType" NOT NULL DEFAULT 'CORE',
    "isCompulsory" BOOLEAN NOT NULL DEFAULT false,
    "hasTheory" BOOLEAN NOT NULL DEFAULT true,
    "hasPractical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectVariant" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "variantType" TEXT NOT NULL,
    "description" TEXT,
    "prerequisite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SubjectVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "boardType" TEXT NOT NULL DEFAULT 'CBSE',
    "applicableClasses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SubjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectGroupMapping" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isCompulsory" BOOLEAN NOT NULL DEFAULT false,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SubjectGroupMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectTeacher" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SubjectTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectClass" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SubjectClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Syllabus" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "curriculumType" "CurriculumType" NOT NULL DEFAULT 'GENERAL',
    "boardType" TEXT,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'GRADED',
    "status" "SyllabusStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "version" TEXT NOT NULL DEFAULT '1.0',
    "parentSyllabusId" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "tags" TEXT[],
    "difficultyLevel" "DifficultyLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "estimatedHours" INTEGER,
    "prerequisites" TEXT,
    "document" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyllabusUnit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "syllabusId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SyllabusUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "syllabusUnitId" TEXT,
    "content" TEXT,
    "resources" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "term" TEXT,
    "weightage" DOUBLE PRECISION,
    "order" INTEGER NOT NULL,
    "syllabusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SubModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "daysOfWeek" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "TimetableConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetablePeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "configId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "TimetablePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "timetableId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectTeacherId" TEXT NOT NULL,
    "roomId" TEXT,
    "topicId" TEXT,
    "day" "DayOfWeek" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canRetest" BOOLEAN NOT NULL DEFAULT false,
    "includeInGradeCard" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "passingMarks" DOUBLE PRECISION NOT NULL,
    "creatorId" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "theoryMarks" DOUBLE PRECISION,
    "practicalMarks" DOUBLE PRECISION,
    "internalMarks" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "grade" TEXT,
    "remarks" TEXT,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeScale" (
    "id" TEXT NOT NULL,
    "boardType" TEXT NOT NULL DEFAULT 'CBSE',
    "grade" TEXT NOT NULL,
    "minMarks" DOUBLE PRECISION NOT NULL,
    "maxMarks" DOUBLE PRECISION NOT NULL,
    "gradePoint" DOUBLE PRECISION,
    "gpa" DOUBLE PRECISION,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "GradeScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "ruleType" "AssessmentRuleType" NOT NULL,
    "examTypes" TEXT[],
    "count" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "AssessmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "creatorId" TEXT,
    "instructions" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentClass" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "AssignmentClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3),
    "content" TEXT,
    "attachments" TEXT,
    "marks" DOUBLE PRECISION,
    "feedback" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "templateId" TEXT,
    "totalMarks" DOUBLE PRECISION,
    "averageMarks" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "grade" TEXT,
    "rank" INTEGER,
    "attendance" DOUBLE PRECISION,
    "coScholasticData" JSONB,
    "teacherRemarks" TEXT,
    "principalRemarks" TEXT,
    "pdfUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sectionId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "reason" TEXT,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAttendance" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "reason" TEXT,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "applicantType" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedOn" TIMESTAMP(3),
    "remarks" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" "FeeFrequency" NOT NULL DEFAULT 'ANNUAL',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "applicableClasses" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructureItem" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "feeTypeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeeStructureItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructureClass" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeeStructureClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeTypeClassAmount" (
    "id" TEXT NOT NULL,
    "feeTypeId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeeTypeClassAmount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "transactionId" TEXT,
    "receiptNumber" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "paymentSource" "PaymentSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_receipts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionRef" TEXT,
    "remarks" TEXT,
    "receiptImageUrl" TEXT NOT NULL,
    "receiptPublicId" TEXT NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "feePaymentId" TEXT,
    "referenceNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_notes" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "receipt_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "criteria" TEXT,
    "duration" TEXT,
    "fundedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipRecipient" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "awardDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ScholarshipRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "paidTo" TEXT,
    "approvedBy" TEXT,
    "receiptNumber" TEXT,
    "attachments" TEXT,
    "budgetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "academicYearId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "basic" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "da" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "travelAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "schoolId" TEXT NOT NULL,
    "otherAllowances" JSONB,
    "providentFund" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professionalTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeductions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "da" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "travelAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherAllowances" JSONB,
    "providentFund" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professionalTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeductions" JSONB,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "targetAudience" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ParentMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "userId" TEXT NOT NULL,
    "documentTypeId" TEXT,
    "category" "DocumentCategory",
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "organizer" TEXT,
    "type" TEXT,
    "category" "EventCategory",
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "maxParticipants" INTEGER,
    "registrationDeadline" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ATTENDEE',
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRSVP" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "EventRSVP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "AchievementCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,
    "documents" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,
    "location" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookIssue" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "fine" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "IssueStatus" NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "BookIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookReservation" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "BookReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "previousSchool" TEXT,
    "appliedClassId" TEXT NOT NULL,
    "aadhaarNumber" VARCHAR(12),
    "abcId" VARCHAR(50),
    "nationality" TEXT DEFAULT 'Indian',
    "religion" TEXT,
    "caste" TEXT,
    "category" TEXT,
    "motherTongue" TEXT,
    "birthPlace" TEXT,
    "bloodGroup" TEXT,
    "tcNumber" TEXT,
    "medicalConditions" TEXT,
    "specialNeeds" TEXT,
    "fatherName" TEXT,
    "fatherOccupation" TEXT,
    "fatherPhone" TEXT,
    "fatherEmail" TEXT,
    "fatherAadhaar" VARCHAR(12),
    "motherName" TEXT,
    "motherOccupation" TEXT,
    "motherPhone" TEXT,
    "motherEmail" TEXT,
    "motherAadhaar" VARCHAR(12),
    "guardianName" TEXT,
    "guardianRelation" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "guardianAadhaar" VARCHAR(12),
    "annualIncome" DECIMAL(12,2),
    "studentId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "DocumentTypeEnum" NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeritListConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedClassId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeritListConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeritList" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "appliedClassId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "totalApplications" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "MeritList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeritListEntry" (
    "id" TEXT NOT NULL,
    "meritListId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "MeritListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "location" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "schoolName" TEXT NOT NULL DEFAULT 'School Name',
    "schoolAddress" TEXT,
    "schoolPhone" TEXT,
    "schoolEmail" TEXT,
    "schoolLogo" TEXT,
    "schoolWebsite" TEXT,
    "schoolFax" TEXT,
    "affiliationNumber" TEXT,
    "schoolCode" TEXT,
    "board" TEXT DEFAULT 'CBSE',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "tagline" TEXT,
    "currentAcademicYear" TEXT,
    "currentTerm" TEXT,
    "defaultGradingScale" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "attendanceThreshold" INTEGER NOT NULL DEFAULT 75,
    "lateArrivalMinutes" INTEGER NOT NULL DEFAULT 15,
    "passingGrade" INTEGER NOT NULL DEFAULT 50,
    "autoAttendance" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyEnrollment" BOOLEAN NOT NULL DEFAULT true,
    "notifyPayment" BOOLEAN NOT NULL DEFAULT true,
    "notifyAttendance" BOOLEAN NOT NULL DEFAULT true,
    "notifyExamResults" BOOLEAN NOT NULL DEFAULT true,
    "notifyLeaveApps" BOOLEAN NOT NULL DEFAULT true,
    "enrollmentNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
    "paymentNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
    "attendanceNotificationChannels" TEXT[] DEFAULT ARRAY['SMS', 'IN_APP']::TEXT[],
    "examResultNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
    "leaveAppNotificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'IN_APP']::TEXT[],
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "passwordRequireSpecialChar" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorAuth" BOOLEAN NOT NULL DEFAULT false,
    "passwordExpiry" INTEGER NOT NULL DEFAULT 90,
    "autoBackup" BOOLEAN NOT NULL DEFAULT true,
    "backupFrequency" TEXT NOT NULL DEFAULT 'daily',
    "defaultTheme" TEXT NOT NULL DEFAULT 'LIGHT',
    "defaultColorTheme" TEXT NOT NULL DEFAULT 'blue',
    "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#8b5cf6',
    "accentColor" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "dateFormat" TEXT NOT NULL DEFAULT 'mdy',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "emailLogo" TEXT,
    "emailFooter" TEXT,
    "emailSignature" TEXT,
    "letterheadLogo" TEXT,
    "letterheadText" TEXT,
    "documentFooter" TEXT,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "enableOnlinePayment" BOOLEAN NOT NULL DEFAULT false,
    "enableOfflineVerification" BOOLEAN NOT NULL DEFAULT true,
    "onlinePaymentGateway" TEXT,
    "maxReceiptSizeMB" INTEGER NOT NULL DEFAULT 5,
    "allowedReceiptFormats" TEXT NOT NULL DEFAULT 'jpg,jpeg,png,pdf',
    "autoNotifyOnVerification" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataSource" TEXT NOT NULL,
    "selectedFields" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "sorting" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "scheduleTime" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "recipients" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL DEFAULT 'pdf',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MessageType" NOT NULL,
    "category" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "whatsappTemplateName" TEXT,
    "whatsappTemplateId" TEXT,
    "whatsappLanguage" TEXT,
    "whatsappStatus" "WhatsAppTemplateStatus",
    "dltTemplateId" TEXT,
    "variables" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_history" (
    "id" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "smsCount" INTEGER NOT NULL DEFAULT 0,
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "smsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emailCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "recipientSelection" JSONB NOT NULL,
    "results" JSONB,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "message_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "userId" TEXT,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "status" "MessageLogStatus" NOT NULL,
    "messageId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "estimatedCost" DECIMAL(10,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_error_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "ErrorCategory" NOT NULL,
    "severity" "ErrorSeverity" NOT NULL,
    "channel" "CommunicationChannel",
    "errorCode" TEXT,
    "errorDetails" TEXT,
    "recipient" TEXT,
    "userId" TEXT,
    "messageId" TEXT,
    "metadata" JSONB,
    "stackTrace" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "communication_error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
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
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "generated_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "driverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopName" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_routes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "pickupStop" TEXT NOT NULL,
    "dropStop" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "student_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_attendance" (
    "id" TEXT NOT NULL,
    "studentRouteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "stopName" TEXT NOT NULL,
    "attendanceType" "TransportAttendanceType" NOT NULL,
    "status" "TransportAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "transport_attendance_pkey" PRIMARY KEY ("id")
);

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
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "capacity" INTEGER NOT NULL,
    "wardenId" TEXT,
    "wardenName" TEXT,
    "wardenPhone" TEXT,
    "type" "HostelType" NOT NULL DEFAULT 'BOYS',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_rooms" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "roomType" "RoomType" NOT NULL DEFAULT 'SHARED',
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "amenities" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "monthlyFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "hostel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_room_allocations" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bedNumber" TEXT,
    "allocatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacatedDate" TIMESTAMP(3),
    "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "hostel_room_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_visitors" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT,
    "visitorRelation" TEXT,
    "purpose" TEXT,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "idProofType" TEXT,
    "idProofNumber" TEXT,
    "approvedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "hostel_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_fee_payments" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "roomFee" DOUBLE PRECISION NOT NULL,
    "messFee" DOUBLE PRECISION NOT NULL,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "transactionId" TEXT,
    "receiptNumber" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "hostel_fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_complaints" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "hostel_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT,
    "classId" TEXT,
    "teacherId" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "duration" INTEGER,
    "lessonType" "LessonType" NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_contents" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "content" TEXT,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "sequence" INTEGER NOT NULL,
    "isDownloadable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "course_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "EnrollmentCourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastAccessedAt" TIMESTAMP(3),
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT,
    "subModuleId" TEXT,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_discussions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "course_discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_replies" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnswer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "discussion_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_quizzes" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "timeLimit" INTEGER,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "showCorrectAnswers" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "lesson_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

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
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,

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
    "schoolId" TEXT NOT NULL,
    "signatures" JSONB,
    "disclaimer" TEXT,
    "gradingConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_card_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "calendar_event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "visibleToRoles" TEXT[],
    "visibleToClasses" TEXT[],
    "visibleToSections" TEXT[],
    "sourceType" "EventSourceType",
    "sourceId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceId" TEXT,
    "exceptionDates" TIMESTAMP(3)[],
    "attachments" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_notes" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "event_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "reminderType" "ReminderType" NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_calendar_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'month',
    "schoolId" TEXT NOT NULL,
    "filterSettings" JSONB,
    "defaultReminderTime" INTEGER NOT NULL DEFAULT 1440,
    "reminderTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_calendar_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "graduationDate" TIMESTAMP(3) NOT NULL,
    "finalClass" TEXT NOT NULL,
    "finalSection" TEXT NOT NULL,
    "finalAcademicYear" TEXT NOT NULL,
    "currentOccupation" TEXT,
    "currentEmployer" TEXT,
    "currentJobTitle" TEXT,
    "currentAddress" TEXT,
    "currentCity" TEXT,
    "currentState" TEXT,
    "currentCountry" TEXT DEFAULT 'India',
    "currentPhone" TEXT,
    "currentEmail" TEXT,
    "higherEducation" TEXT,
    "collegeName" TEXT,
    "collegeLocation" TEXT,
    "graduationYearCollege" INTEGER,
    "achievements" TEXT,
    "linkedInProfile" TEXT,
    "profilePhoto" TEXT,
    "allowCommunication" BOOLEAN NOT NULL DEFAULT true,
    "communicationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_history" (
    "id" TEXT NOT NULL,
    "sourceAcademicYear" TEXT NOT NULL,
    "sourceClass" TEXT NOT NULL,
    "sourceSection" TEXT,
    "targetAcademicYear" TEXT NOT NULL,
    "targetClass" TEXT NOT NULL,
    "targetSection" TEXT,
    "totalStudents" INTEGER NOT NULL,
    "promotedStudents" INTEGER NOT NULL,
    "excludedStudents" INTEGER NOT NULL,
    "failedStudents" INTEGER NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedBy" TEXT NOT NULL,
    "notes" TEXT,
    "excludedList" TEXT,
    "failureDetails" TEXT,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "promotion_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_records" (
    "id" TEXT NOT NULL,
    "historyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "previousEnrollmentId" TEXT NOT NULL,
    "newEnrollmentId" TEXT,
    "status" "PromotionStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "promotion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_report_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataSource" TEXT NOT NULL,
    "selectedFields" TEXT[],
    "filters" JSONB NOT NULL,
    "sorting" JSONB NOT NULL,
    "chartConfig" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "saved_report_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DepartmentTeachers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "schools_schoolCode_key" ON "schools"("schoolCode");

-- CreateIndex
CREATE INDEX "subscriptions_schoolId_idx" ON "subscriptions"("schoolId");

-- CreateIndex
CREATE INDEX "usage_counters_schoolId_idx" ON "usage_counters"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_counters_schoolId_month_key" ON "usage_counters"("schoolId", "month");

-- CreateIndex
CREATE INDEX "user_schools_userId_idx" ON "user_schools"("userId");

-- CreateIndex
CREATE INDEX "user_schools_schoolId_idx" ON "user_schools"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "user_schools_userId_schoolId_key" ON "user_schools"("userId", "schoolId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Administrator_userId_key" ON "Administrator"("userId");

-- CreateIndex
CREATE INDEX "Administrator_schoolId_idx" ON "Administrator"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "Teacher"("employeeId");

-- CreateIndex
CREATE INDEX "Teacher_schoolId_idx" ON "Teacher"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSettings_teacherId_key" ON "TeacherSettings"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSettings_teacherId_idx" ON "TeacherSettings"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSettings_schoolId_idx" ON "TeacherSettings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionId_key" ON "Student"("admissionId");

-- CreateIndex
CREATE INDEX "Student_aadhaarNumber_idx" ON "Student"("aadhaarNumber");

-- CreateIndex
CREATE INDEX "Student_abcId_idx" ON "Student"("abcId");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSettings_studentId_key" ON "StudentSettings"("studentId");

-- CreateIndex
CREATE INDEX "StudentSettings_preferredLanguage_idx" ON "StudentSettings"("preferredLanguage");

-- CreateIndex
CREATE INDEX "StudentSettings_schoolId_idx" ON "StudentSettings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

-- CreateIndex
CREATE INDEX "Parent_schoolId_idx" ON "Parent"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentSettings_parentId_key" ON "ParentSettings"("parentId");

-- CreateIndex
CREATE INDEX "ParentSettings_parentId_idx" ON "ParentSettings"("parentId");

-- CreateIndex
CREATE INDEX "ParentSettings_preferredLanguage_idx" ON "ParentSettings"("preferredLanguage");

-- CreateIndex
CREATE INDEX "ParentSettings_schoolId_idx" ON "ParentSettings"("schoolId");

-- CreateIndex
CREATE INDEX "StudentParent_parentId_idx" ON "StudentParent"("parentId");

-- CreateIndex
CREATE INDEX "StudentParent_studentId_idx" ON "StudentParent"("studentId");

-- CreateIndex
CREATE INDEX "StudentParent_schoolId_idx" ON "StudentParent"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentParent_studentId_parentId_key" ON "StudentParent"("studentId", "parentId");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_idx" ON "AcademicYear"("schoolId");

-- CreateIndex
CREATE INDEX "Term_schoolId_idx" ON "Term"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Term_schoolId_name_key" ON "Term"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Department_schoolId_idx" ON "Department"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_schoolId_name_key" ON "Department"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_name_academicYearId_key" ON "Class"("schoolId", "name", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSection_homeRoomId_key" ON "ClassSection"("homeRoomId");

-- CreateIndex
CREATE INDEX "ClassSection_schoolId_idx" ON "ClassSection"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSection_schoolId_name_classId_key" ON "ClassSection"("schoolId", "name", "classId");

-- CreateIndex
CREATE INDEX "ClassRoom_schoolId_idx" ON "ClassRoom"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRoom_schoolId_name_key" ON "ClassRoom"("schoolId", "name");

-- CreateIndex
CREATE INDEX "ClassTeacher_sectionId_idx" ON "ClassTeacher"("sectionId");

-- CreateIndex
CREATE INDEX "ClassTeacher_schoolId_idx" ON "ClassTeacher"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_classId_sectionId_teacherId_key" ON "ClassTeacher"("classId", "sectionId", "teacherId");

-- CreateIndex
CREATE INDEX "ClassEnrollment_schoolId_idx" ON "ClassEnrollment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_studentId_classId_sectionId_key" ON "ClassEnrollment"("studentId", "classId", "sectionId");

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject"("schoolId", "code");

-- CreateIndex
CREATE INDEX "SubjectVariant_schoolId_idx" ON "SubjectVariant"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVariant_subjectId_variantType_key" ON "SubjectVariant"("subjectId", "variantType");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectGroup_code_key" ON "SubjectGroup"("code");

-- CreateIndex
CREATE INDEX "SubjectGroup_schoolId_idx" ON "SubjectGroup"("schoolId");

-- CreateIndex
CREATE INDEX "SubjectGroupMapping_schoolId_idx" ON "SubjectGroupMapping"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectGroupMapping_groupId_subjectId_key" ON "SubjectGroupMapping"("groupId", "subjectId");

-- CreateIndex
CREATE INDEX "SubjectTeacher_schoolId_idx" ON "SubjectTeacher"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectTeacher_subjectId_teacherId_key" ON "SubjectTeacher"("subjectId", "teacherId");

-- CreateIndex
CREATE INDEX "SubjectClass_schoolId_idx" ON "SubjectClass"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClass_subjectId_classId_key" ON "SubjectClass"("subjectId", "classId");

-- CreateIndex
CREATE INDEX "Syllabus_subjectId_classId_idx" ON "Syllabus"("subjectId", "classId");

-- CreateIndex
CREATE INDEX "Syllabus_academicYearId_isActive_idx" ON "Syllabus"("academicYearId", "isActive");

-- CreateIndex
CREATE INDEX "Syllabus_status_isActive_idx" ON "Syllabus"("status", "isActive");

-- CreateIndex
CREATE INDEX "Syllabus_curriculumType_boardType_idx" ON "Syllabus"("curriculumType", "boardType");

-- CreateIndex
CREATE INDEX "Syllabus_schoolId_idx" ON "Syllabus"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Syllabus_subjectId_academicYearId_classId_sectionId_curricu_key" ON "Syllabus"("subjectId", "academicYearId", "classId", "sectionId", "curriculumType");

-- CreateIndex
CREATE INDEX "SyllabusUnit_schoolId_idx" ON "SyllabusUnit"("schoolId");

-- CreateIndex
CREATE INDEX "Lesson_schoolId_idx" ON "Lesson"("schoolId");

-- CreateIndex
CREATE INDEX "Module_syllabusId_order_idx" ON "Module"("syllabusId", "order");

-- CreateIndex
CREATE INDEX "Module_syllabusId_chapterNumber_idx" ON "Module"("syllabusId", "chapterNumber");

-- CreateIndex
CREATE INDEX "Module_schoolId_idx" ON "Module"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_syllabusId_chapterNumber_key" ON "Module"("syllabusId", "chapterNumber");

-- CreateIndex
CREATE INDEX "SubModule_moduleId_order_idx" ON "SubModule"("moduleId", "order");

-- CreateIndex
CREATE INDEX "SubModule_moduleId_idx" ON "SubModule"("moduleId");

-- CreateIndex
CREATE INDEX "SubModule_schoolId_idx" ON "SubModule"("schoolId");

-- CreateIndex
CREATE INDEX "SyllabusDocument_moduleId_idx" ON "SyllabusDocument"("moduleId");

-- CreateIndex
CREATE INDEX "SyllabusDocument_subModuleId_idx" ON "SyllabusDocument"("subModuleId");

-- CreateIndex
CREATE INDEX "SyllabusDocument_moduleId_order_idx" ON "SyllabusDocument"("moduleId", "order");

-- CreateIndex
CREATE INDEX "SyllabusDocument_subModuleId_order_idx" ON "SyllabusDocument"("subModuleId", "order");

-- CreateIndex
CREATE INDEX "SyllabusDocument_schoolId_idx" ON "SyllabusDocument"("schoolId");

-- CreateIndex
CREATE INDEX "SubModuleProgress_teacherId_idx" ON "SubModuleProgress"("teacherId");

-- CreateIndex
CREATE INDEX "SubModuleProgress_subModuleId_teacherId_idx" ON "SubModuleProgress"("subModuleId", "teacherId");

-- CreateIndex
CREATE INDEX "SubModuleProgress_schoolId_idx" ON "SubModuleProgress"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SubModuleProgress_subModuleId_teacherId_key" ON "SubModuleProgress"("subModuleId", "teacherId");

-- CreateIndex
CREATE INDEX "Timetable_schoolId_idx" ON "Timetable"("schoolId");

-- CreateIndex
CREATE INDEX "TimetableConfig_schoolId_idx" ON "TimetableConfig"("schoolId");

-- CreateIndex
CREATE INDEX "TimetablePeriod_schoolId_idx" ON "TimetablePeriod"("schoolId");

-- CreateIndex
CREATE INDEX "TimetableSlot_topicId_idx" ON "TimetableSlot"("topicId");

-- CreateIndex
CREATE INDEX "TimetableSlot_schoolId_idx" ON "TimetableSlot"("schoolId");

-- CreateIndex
CREATE INDEX "ExamType_schoolId_idx" ON "ExamType"("schoolId");

-- CreateIndex
CREATE INDEX "Exam_schoolId_idx" ON "Exam"("schoolId");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_examId_idx" ON "ExamResult"("studentId", "examId");

-- CreateIndex
CREATE INDEX "ExamResult_examId_marks_idx" ON "ExamResult"("examId", "marks");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_createdAt_idx" ON "ExamResult"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "ExamResult_schoolId_idx" ON "ExamResult"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examId_studentId_key" ON "ExamResult"("examId", "studentId");

-- CreateIndex
CREATE INDEX "GradeScale_schoolId_idx" ON "GradeScale"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_schoolId_boardType_grade_key" ON "GradeScale"("schoolId", "boardType", "grade");

-- CreateIndex
CREATE INDEX "AssessmentRule_schoolId_idx" ON "AssessmentRule"("schoolId");

-- CreateIndex
CREATE INDEX "Assignment_subjectId_idx" ON "Assignment"("subjectId");

-- CreateIndex
CREATE INDEX "Assignment_dueDate_idx" ON "Assignment"("dueDate");

-- CreateIndex
CREATE INDEX "Assignment_schoolId_idx" ON "Assignment"("schoolId");

-- CreateIndex
CREATE INDEX "AssignmentClass_schoolId_idx" ON "AssignmentClass"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentClass_assignmentId_classId_key" ON "AssignmentClass"("assignmentId", "classId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_studentId_idx" ON "AssignmentSubmission"("studentId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_status_idx" ON "AssignmentSubmission"("status");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_schoolId_idx" ON "AssignmentSubmission"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_studentId_key" ON "AssignmentSubmission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "ReportCard_templateId_idx" ON "ReportCard"("templateId");

-- CreateIndex
CREATE INDEX "ReportCard_isPublished_idx" ON "ReportCard"("isPublished");

-- CreateIndex
CREATE INDEX "ReportCard_schoolId_idx" ON "ReportCard"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_studentId_termId_key" ON "ReportCard"("studentId", "termId");

-- CreateIndex
CREATE INDEX "StudentAttendance_studentId_date_idx" ON "StudentAttendance"("studentId", "date");

-- CreateIndex
CREATE INDEX "StudentAttendance_sectionId_date_status_idx" ON "StudentAttendance"("sectionId", "date", "status");

-- CreateIndex
CREATE INDEX "StudentAttendance_status_idx" ON "StudentAttendance"("status");

-- CreateIndex
CREATE INDEX "StudentAttendance_schoolId_idx" ON "StudentAttendance"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_studentId_date_sectionId_key" ON "StudentAttendance"("studentId", "date", "sectionId");

-- CreateIndex
CREATE INDEX "TeacherAttendance_schoolId_idx" ON "TeacherAttendance"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAttendance_teacherId_date_key" ON "TeacherAttendance"("teacherId", "date");

-- CreateIndex
CREATE INDEX "LeaveApplication_schoolId_idx" ON "LeaveApplication"("schoolId");

-- CreateIndex
CREATE INDEX "FeeType_schoolId_idx" ON "FeeType"("schoolId");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolId_idx" ON "FeeStructure"("schoolId");

-- CreateIndex
CREATE INDEX "FeeStructureItem_schoolId_idx" ON "FeeStructureItem"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureItem_feeStructureId_feeTypeId_key" ON "FeeStructureItem"("feeStructureId", "feeTypeId");

-- CreateIndex
CREATE INDEX "FeeStructureClass_feeStructureId_idx" ON "FeeStructureClass"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureClass_classId_idx" ON "FeeStructureClass"("classId");

-- CreateIndex
CREATE INDEX "FeeStructureClass_feeStructureId_classId_idx" ON "FeeStructureClass"("feeStructureId", "classId");

-- CreateIndex
CREATE INDEX "FeeStructureClass_schoolId_idx" ON "FeeStructureClass"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureClass_feeStructureId_classId_key" ON "FeeStructureClass"("feeStructureId", "classId");

-- CreateIndex
CREATE INDEX "FeeTypeClassAmount_feeTypeId_idx" ON "FeeTypeClassAmount"("feeTypeId");

-- CreateIndex
CREATE INDEX "FeeTypeClassAmount_classId_idx" ON "FeeTypeClassAmount"("classId");

-- CreateIndex
CREATE INDEX "FeeTypeClassAmount_schoolId_idx" ON "FeeTypeClassAmount"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeTypeClassAmount_feeTypeId_classId_key" ON "FeeTypeClassAmount"("feeTypeId", "classId");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_status_paymentDate_idx" ON "FeePayment"("studentId", "status", "paymentDate");

-- CreateIndex
CREATE INDEX "FeePayment_paymentDate_idx" ON "FeePayment"("paymentDate");

-- CreateIndex
CREATE INDEX "FeePayment_status_idx" ON "FeePayment"("status");

-- CreateIndex
CREATE INDEX "FeePayment_schoolId_idx" ON "FeePayment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipts_feePaymentId_key" ON "payment_receipts"("feePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipts_referenceNumber_key" ON "payment_receipts"("referenceNumber");

-- CreateIndex
CREATE INDEX "payment_receipts_studentId_status_idx" ON "payment_receipts"("studentId", "status");

-- CreateIndex
CREATE INDEX "payment_receipts_status_createdAt_idx" ON "payment_receipts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payment_receipts_feeStructureId_idx" ON "payment_receipts"("feeStructureId");

-- CreateIndex
CREATE INDEX "payment_receipts_referenceNumber_idx" ON "payment_receipts"("referenceNumber");

-- CreateIndex
CREATE INDEX "payment_receipts_schoolId_idx" ON "payment_receipts"("schoolId");

-- CreateIndex
CREATE INDEX "receipt_notes_receiptId_createdAt_idx" ON "receipt_notes"("receiptId", "createdAt");

-- CreateIndex
CREATE INDEX "receipt_notes_receiptId_idx" ON "receipt_notes"("receiptId");

-- CreateIndex
CREATE INDEX "receipt_notes_schoolId_idx" ON "receipt_notes"("schoolId");

-- CreateIndex
CREATE INDEX "Scholarship_schoolId_idx" ON "Scholarship"("schoolId");

-- CreateIndex
CREATE INDEX "ScholarshipRecipient_schoolId_idx" ON "ScholarshipRecipient"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipRecipient_scholarshipId_studentId_key" ON "ScholarshipRecipient"("scholarshipId", "studentId");

-- CreateIndex
CREATE INDEX "Expense_schoolId_idx" ON "Expense"("schoolId");

-- CreateIndex
CREATE INDEX "Budget_schoolId_idx" ON "Budget"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_teacherId_key" ON "SalaryStructure"("teacherId");

-- CreateIndex
CREATE INDEX "SalaryStructure_teacherId_idx" ON "SalaryStructure"("teacherId");

-- CreateIndex
CREATE INDEX "Payroll_schoolId_idx" ON "Payroll"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_teacherId_month_year_key" ON "Payroll"("teacherId", "month", "year");

-- CreateIndex
CREATE INDEX "Message_recipientId_isRead_idx" ON "Message"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_schoolId_idx" ON "Message"("schoolId");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement"("isActive");

-- CreateIndex
CREATE INDEX "Announcement_startDate_idx" ON "Announcement"("startDate");

-- CreateIndex
CREATE INDEX "Announcement_schoolId_idx" ON "Announcement"("schoolId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_schoolId_idx" ON "Notification"("schoolId");

-- CreateIndex
CREATE INDEX "ParentMeeting_parentId_idx" ON "ParentMeeting"("parentId");

-- CreateIndex
CREATE INDEX "ParentMeeting_teacherId_idx" ON "ParentMeeting"("teacherId");

-- CreateIndex
CREATE INDEX "ParentMeeting_scheduledDate_idx" ON "ParentMeeting"("scheduledDate");

-- CreateIndex
CREATE INDEX "ParentMeeting_status_idx" ON "ParentMeeting"("status");

-- CreateIndex
CREATE INDEX "ParentMeeting_schoolId_idx" ON "ParentMeeting"("schoolId");

-- CreateIndex
CREATE INDEX "DocumentType_schoolId_idx" ON "DocumentType"("schoolId");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_documentTypeId_idx" ON "Document"("documentTypeId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX "Document_schoolId_idx" ON "Document"("schoolId");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_schoolId_idx" ON "Event"("schoolId");

-- CreateIndex
CREATE INDEX "EventParticipant_userId_idx" ON "EventParticipant"("userId");

-- CreateIndex
CREATE INDEX "EventParticipant_eventId_idx" ON "EventParticipant"("eventId");

-- CreateIndex
CREATE INDEX "EventParticipant_schoolId_idx" ON "EventParticipant"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_eventId_userId_key" ON "EventParticipant"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventRSVP_userId_idx" ON "EventRSVP"("userId");

-- CreateIndex
CREATE INDEX "EventRSVP_eventId_idx" ON "EventRSVP"("eventId");

-- CreateIndex
CREATE INDEX "EventRSVP_schoolId_idx" ON "EventRSVP"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRSVP_eventId_userId_key" ON "EventRSVP"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Achievement_teacherId_idx" ON "Achievement"("teacherId");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "Achievement_date_idx" ON "Achievement"("date");

-- CreateIndex
CREATE INDEX "Achievement_schoolId_idx" ON "Achievement"("schoolId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_timestamp_idx" ON "audit_logs"("resource", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_category_idx" ON "Book"("category");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_schoolId_idx" ON "Book"("schoolId");

-- CreateIndex
CREATE INDEX "BookIssue_studentId_status_idx" ON "BookIssue"("studentId", "status");

-- CreateIndex
CREATE INDEX "BookIssue_bookId_status_idx" ON "BookIssue"("bookId", "status");

-- CreateIndex
CREATE INDEX "BookIssue_dueDate_status_idx" ON "BookIssue"("dueDate", "status");

-- CreateIndex
CREATE INDEX "BookIssue_schoolId_idx" ON "BookIssue"("schoolId");

-- CreateIndex
CREATE INDEX "BookReservation_studentId_status_idx" ON "BookReservation"("studentId", "status");

-- CreateIndex
CREATE INDEX "BookReservation_bookId_status_idx" ON "BookReservation"("bookId", "status");

-- CreateIndex
CREATE INDEX "BookReservation_schoolId_idx" ON "BookReservation"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_applicationNumber_key" ON "AdmissionApplication"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_studentId_key" ON "AdmissionApplication"("studentId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_status_idx" ON "AdmissionApplication"("status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_appliedClassId_status_idx" ON "AdmissionApplication"("appliedClassId", "status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_submittedAt_idx" ON "AdmissionApplication"("submittedAt");

-- CreateIndex
CREATE INDEX "AdmissionApplication_aadhaarNumber_idx" ON "AdmissionApplication"("aadhaarNumber");

-- CreateIndex
CREATE INDEX "AdmissionApplication_abcId_idx" ON "AdmissionApplication"("abcId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_studentId_idx" ON "AdmissionApplication"("studentId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_schoolId_idx" ON "AdmissionApplication"("schoolId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_schoolId_idx" ON "ApplicationDocument"("schoolId");

-- CreateIndex
CREATE INDEX "MeritListConfig_appliedClassId_idx" ON "MeritListConfig"("appliedClassId");

-- CreateIndex
CREATE INDEX "MeritListConfig_isActive_idx" ON "MeritListConfig"("isActive");

-- CreateIndex
CREATE INDEX "MeritList_configId_idx" ON "MeritList"("configId");

-- CreateIndex
CREATE INDEX "MeritList_appliedClassId_idx" ON "MeritList"("appliedClassId");

-- CreateIndex
CREATE INDEX "MeritList_generatedAt_idx" ON "MeritList"("generatedAt");

-- CreateIndex
CREATE INDEX "MeritList_schoolId_idx" ON "MeritList"("schoolId");

-- CreateIndex
CREATE INDEX "MeritListEntry_meritListId_idx" ON "MeritListEntry"("meritListId");

-- CreateIndex
CREATE INDEX "MeritListEntry_applicationId_idx" ON "MeritListEntry"("applicationId");

-- CreateIndex
CREATE INDEX "MeritListEntry_rank_idx" ON "MeritListEntry"("rank");

-- CreateIndex
CREATE INDEX "MeritListEntry_schoolId_idx" ON "MeritListEntry"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "MeritListEntry_meritListId_applicationId_key" ON "MeritListEntry"("meritListId", "applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "MeritListEntry_meritListId_rank_key" ON "MeritListEntry"("meritListId", "rank");

-- CreateIndex
CREATE INDEX "Backup_createdAt_idx" ON "Backup"("createdAt");

-- CreateIndex
CREATE INDEX "Backup_status_idx" ON "Backup"("status");

-- CreateIndex
CREATE INDEX "Backup_schoolId_idx" ON "Backup"("schoolId");

-- CreateIndex
CREATE INDEX "scheduled_reports_active_nextRunAt_idx" ON "scheduled_reports"("active", "nextRunAt");

-- CreateIndex
CREATE INDEX "scheduled_reports_createdBy_idx" ON "scheduled_reports"("createdBy");

-- CreateIndex
CREATE INDEX "scheduled_reports_schoolId_idx" ON "scheduled_reports"("schoolId");

-- CreateIndex
CREATE INDEX "message_templates_type_isActive_idx" ON "message_templates"("type", "isActive");

-- CreateIndex
CREATE INDEX "message_templates_category_idx" ON "message_templates"("category");

-- CreateIndex
CREATE INDEX "message_templates_createdBy_idx" ON "message_templates"("createdBy");

-- CreateIndex
CREATE INDEX "message_templates_whatsappStatus_idx" ON "message_templates"("whatsappStatus");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_schoolId_name_key" ON "message_templates"("schoolId", "name");

-- CreateIndex
CREATE INDEX "message_history_sentBy_idx" ON "message_history"("sentBy");

-- CreateIndex
CREATE INDEX "message_history_sentAt_idx" ON "message_history"("sentAt");

-- CreateIndex
CREATE INDEX "message_history_status_idx" ON "message_history"("status");

-- CreateIndex
CREATE INDEX "message_history_messageType_idx" ON "message_history"("messageType");

-- CreateIndex
CREATE INDEX "message_history_templateId_idx" ON "message_history"("templateId");

-- CreateIndex
CREATE INDEX "message_history_schoolId_idx" ON "message_history"("schoolId");

-- CreateIndex
CREATE INDEX "message_logs_channel_createdAt_idx" ON "message_logs"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "message_logs_userId_createdAt_idx" ON "message_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "message_logs_status_createdAt_idx" ON "message_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "message_logs_schoolId_idx" ON "message_logs"("schoolId");

-- CreateIndex
CREATE INDEX "communication_error_logs_category_createdAt_idx" ON "communication_error_logs"("category", "createdAt");

-- CreateIndex
CREATE INDEX "communication_error_logs_severity_createdAt_idx" ON "communication_error_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "communication_error_logs_channel_createdAt_idx" ON "communication_error_logs"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "communication_error_logs_resolved_createdAt_idx" ON "communication_error_logs"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "communication_error_logs_schoolId_idx" ON "communication_error_logs"("schoolId");

-- CreateIndex
CREATE INDEX "certificate_templates_type_isActive_idx" ON "certificate_templates"("type", "isActive");

-- CreateIndex
CREATE INDEX "certificate_templates_category_idx" ON "certificate_templates"("category");

-- CreateIndex
CREATE INDEX "certificate_templates_createdBy_idx" ON "certificate_templates"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_schoolId_name_key" ON "certificate_templates"("schoolId", "name");

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

-- CreateIndex
CREATE INDEX "generated_certificates_schoolId_idx" ON "generated_certificates"("schoolId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_driverId_idx" ON "vehicles"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_schoolId_registrationNo_key" ON "vehicles"("schoolId", "registrationNo");

-- CreateIndex
CREATE INDEX "drivers_licenseNo_idx" ON "drivers"("licenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_schoolId_licenseNo_key" ON "drivers"("schoolId", "licenseNo");

-- CreateIndex
CREATE INDEX "routes_vehicleId_idx" ON "routes"("vehicleId");

-- CreateIndex
CREATE INDEX "routes_status_idx" ON "routes"("status");

-- CreateIndex
CREATE INDEX "routes_schoolId_idx" ON "routes"("schoolId");

-- CreateIndex
CREATE INDEX "route_stops_routeId_sequence_idx" ON "route_stops"("routeId", "sequence");

-- CreateIndex
CREATE INDEX "route_stops_schoolId_idx" ON "route_stops"("schoolId");

-- CreateIndex
CREATE INDEX "student_routes_routeId_idx" ON "student_routes"("routeId");

-- CreateIndex
CREATE INDEX "student_routes_studentId_idx" ON "student_routes"("studentId");

-- CreateIndex
CREATE INDEX "student_routes_schoolId_idx" ON "student_routes"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_routes_studentId_routeId_key" ON "student_routes"("studentId", "routeId");

-- CreateIndex
CREATE INDEX "transport_attendance_studentRouteId_date_idx" ON "transport_attendance"("studentRouteId", "date");

-- CreateIndex
CREATE INDEX "transport_attendance_date_status_idx" ON "transport_attendance"("date", "status");

-- CreateIndex
CREATE INDEX "transport_attendance_schoolId_idx" ON "transport_attendance"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_attendance_studentRouteId_date_stopName_attendanc_key" ON "transport_attendance"("studentRouteId", "date", "stopName", "attendanceType");

-- CreateIndex
CREATE INDEX "question_bank_subjectId_topic_idx" ON "question_bank"("subjectId", "topic");

-- CreateIndex
CREATE INDEX "question_bank_difficulty_idx" ON "question_bank"("difficulty");

-- CreateIndex
CREATE INDEX "question_bank_createdBy_idx" ON "question_bank"("createdBy");

-- CreateIndex
CREATE INDEX "question_bank_schoolId_idx" ON "question_bank"("schoolId");

-- CreateIndex
CREATE INDEX "online_exams_classId_startTime_idx" ON "online_exams"("classId", "startTime");

-- CreateIndex
CREATE INDEX "online_exams_subjectId_idx" ON "online_exams"("subjectId");

-- CreateIndex
CREATE INDEX "online_exams_createdBy_idx" ON "online_exams"("createdBy");

-- CreateIndex
CREATE INDEX "online_exams_startTime_endTime_idx" ON "online_exams"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "online_exams_schoolId_idx" ON "online_exams"("schoolId");

-- CreateIndex
CREATE INDEX "exam_attempts_studentId_status_idx" ON "exam_attempts"("studentId", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_examId_status_idx" ON "exam_attempts"("examId", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_submittedAt_idx" ON "exam_attempts"("submittedAt");

-- CreateIndex
CREATE INDEX "exam_attempts_schoolId_idx" ON "exam_attempts"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_examId_studentId_key" ON "exam_attempts"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "permissions"("category");

-- CreateIndex
CREATE INDEX "permissions_isActive_idx" ON "permissions"("isActive");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_permissions_permissionId_idx" ON "user_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "user_permissions_expiresAt_idx" ON "user_permissions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");

-- CreateIndex
CREATE INDEX "hostels_status_idx" ON "hostels"("status");

-- CreateIndex
CREATE INDEX "hostels_type_idx" ON "hostels"("type");

-- CreateIndex
CREATE INDEX "hostels_schoolId_idx" ON "hostels"("schoolId");

-- CreateIndex
CREATE INDEX "hostel_rooms_hostelId_status_idx" ON "hostel_rooms"("hostelId", "status");

-- CreateIndex
CREATE INDEX "hostel_rooms_roomType_idx" ON "hostel_rooms"("roomType");

-- CreateIndex
CREATE INDEX "hostel_rooms_schoolId_idx" ON "hostel_rooms"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_rooms_hostelId_roomNumber_key" ON "hostel_rooms"("hostelId", "roomNumber");

-- CreateIndex
CREATE INDEX "hostel_room_allocations_studentId_status_idx" ON "hostel_room_allocations"("studentId", "status");

-- CreateIndex
CREATE INDEX "hostel_room_allocations_roomId_status_idx" ON "hostel_room_allocations"("roomId", "status");

-- CreateIndex
CREATE INDEX "hostel_room_allocations_schoolId_idx" ON "hostel_room_allocations"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_room_allocations_roomId_studentId_allocatedDate_key" ON "hostel_room_allocations"("roomId", "studentId", "allocatedDate");

-- CreateIndex
CREATE INDEX "hostel_visitors_studentId_checkInTime_idx" ON "hostel_visitors"("studentId", "checkInTime");

-- CreateIndex
CREATE INDEX "hostel_visitors_checkInTime_idx" ON "hostel_visitors"("checkInTime");

-- CreateIndex
CREATE INDEX "hostel_visitors_schoolId_idx" ON "hostel_visitors"("schoolId");

-- CreateIndex
CREATE INDEX "hostel_fee_payments_allocationId_status_idx" ON "hostel_fee_payments"("allocationId", "status");

-- CreateIndex
CREATE INDEX "hostel_fee_payments_status_dueDate_idx" ON "hostel_fee_payments"("status", "dueDate");

-- CreateIndex
CREATE INDEX "hostel_fee_payments_schoolId_idx" ON "hostel_fee_payments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_fee_payments_allocationId_month_year_key" ON "hostel_fee_payments"("allocationId", "month", "year");

-- CreateIndex
CREATE INDEX "hostel_complaints_hostelId_status_idx" ON "hostel_complaints"("hostelId", "status");

-- CreateIndex
CREATE INDEX "hostel_complaints_studentId_status_idx" ON "hostel_complaints"("studentId", "status");

-- CreateIndex
CREATE INDEX "hostel_complaints_status_priority_idx" ON "hostel_complaints"("status", "priority");

-- CreateIndex
CREATE INDEX "hostel_complaints_createdAt_idx" ON "hostel_complaints"("createdAt");

-- CreateIndex
CREATE INDEX "hostel_complaints_schoolId_idx" ON "hostel_complaints"("schoolId");

-- CreateIndex
CREATE INDEX "courses_teacherId_idx" ON "courses"("teacherId");

-- CreateIndex
CREATE INDEX "courses_subjectId_idx" ON "courses"("subjectId");

-- CreateIndex
CREATE INDEX "courses_classId_idx" ON "courses"("classId");

-- CreateIndex
CREATE INDEX "courses_status_isPublished_idx" ON "courses"("status", "isPublished");

-- CreateIndex
CREATE INDEX "courses_schoolId_idx" ON "courses"("schoolId");

-- CreateIndex
CREATE INDEX "course_modules_courseId_sequence_idx" ON "course_modules"("courseId", "sequence");

-- CreateIndex
CREATE INDEX "course_modules_schoolId_idx" ON "course_modules"("schoolId");

-- CreateIndex
CREATE INDEX "course_lessons_moduleId_sequence_idx" ON "course_lessons"("moduleId", "sequence");

-- CreateIndex
CREATE INDEX "course_lessons_schoolId_idx" ON "course_lessons"("schoolId");

-- CreateIndex
CREATE INDEX "course_contents_lessonId_sequence_idx" ON "course_contents"("lessonId", "sequence");

-- CreateIndex
CREATE INDEX "course_contents_schoolId_idx" ON "course_contents"("schoolId");

-- CreateIndex
CREATE INDEX "course_enrollments_studentId_status_idx" ON "course_enrollments"("studentId", "status");

-- CreateIndex
CREATE INDEX "course_enrollments_courseId_status_idx" ON "course_enrollments"("courseId", "status");

-- CreateIndex
CREATE INDEX "course_enrollments_schoolId_idx" ON "course_enrollments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_courseId_studentId_key" ON "course_enrollments"("courseId", "studentId");

-- CreateIndex
CREATE INDEX "lesson_progress_enrollmentId_status_idx" ON "lesson_progress"("enrollmentId", "status");

-- CreateIndex
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_progress_subModuleId_idx" ON "lesson_progress"("subModuleId");

-- CreateIndex
CREATE INDEX "lesson_progress_schoolId_idx" ON "lesson_progress"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollmentId_lessonId_key" ON "lesson_progress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollmentId_subModuleId_key" ON "lesson_progress"("enrollmentId", "subModuleId");

-- CreateIndex
CREATE INDEX "course_discussions_courseId_createdAt_idx" ON "course_discussions"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "course_discussions_studentId_idx" ON "course_discussions"("studentId");

-- CreateIndex
CREATE INDEX "course_discussions_isPinned_createdAt_idx" ON "course_discussions"("isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "course_discussions_schoolId_idx" ON "course_discussions"("schoolId");

-- CreateIndex
CREATE INDEX "discussion_replies_discussionId_createdAt_idx" ON "discussion_replies"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "discussion_replies_userId_idx" ON "discussion_replies"("userId");

-- CreateIndex
CREATE INDEX "discussion_replies_schoolId_idx" ON "discussion_replies"("schoolId");

-- CreateIndex
CREATE INDEX "lesson_quizzes_lessonId_idx" ON "lesson_quizzes"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_quizzes_schoolId_idx" ON "lesson_quizzes"("schoolId");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_studentId_idx" ON "quiz_attempts"("quizId", "studentId");

-- CreateIndex
CREATE INDEX "quiz_attempts_studentId_createdAt_idx" ON "quiz_attempts"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "quiz_attempts_schoolId_idx" ON "quiz_attempts"("schoolId");

-- CreateIndex
CREATE INDEX "subject_mark_configs_examId_idx" ON "subject_mark_configs"("examId");

-- CreateIndex
CREATE INDEX "subject_mark_configs_subjectId_idx" ON "subject_mark_configs"("subjectId");

-- CreateIndex
CREATE INDEX "subject_mark_configs_schoolId_idx" ON "subject_mark_configs"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_mark_configs_examId_subjectId_key" ON "subject_mark_configs"("examId", "subjectId");

-- CreateIndex
CREATE INDEX "co_scholastic_activities_isActive_idx" ON "co_scholastic_activities"("isActive");

-- CreateIndex
CREATE INDEX "co_scholastic_activities_schoolId_idx" ON "co_scholastic_activities"("schoolId");

-- CreateIndex
CREATE INDEX "co_scholastic_grades_studentId_termId_idx" ON "co_scholastic_grades"("studentId", "termId");

-- CreateIndex
CREATE INDEX "co_scholastic_grades_activityId_idx" ON "co_scholastic_grades"("activityId");

-- CreateIndex
CREATE INDEX "co_scholastic_grades_schoolId_idx" ON "co_scholastic_grades"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "co_scholastic_grades_activityId_studentId_termId_key" ON "co_scholastic_grades"("activityId", "studentId", "termId");

-- CreateIndex
CREATE INDEX "report_card_templates_type_isActive_idx" ON "report_card_templates"("type", "isActive");

-- CreateIndex
CREATE INDEX "report_card_templates_isDefault_idx" ON "report_card_templates"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "report_card_templates_schoolId_name_key" ON "report_card_templates"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_categories_name_key" ON "calendar_event_categories"("name");

-- CreateIndex
CREATE INDEX "calendar_event_categories_isActive_order_idx" ON "calendar_event_categories"("isActive", "order");

-- CreateIndex
CREATE INDEX "calendar_event_categories_schoolId_idx" ON "calendar_event_categories"("schoolId");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_endDate_idx" ON "calendar_events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "calendar_events_categoryId_idx" ON "calendar_events"("categoryId");

-- CreateIndex
CREATE INDEX "calendar_events_sourceType_sourceId_idx" ON "calendar_events"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "calendar_events_recurrenceId_idx" ON "calendar_events"("recurrenceId");

-- CreateIndex
CREATE INDEX "calendar_events_createdBy_idx" ON "calendar_events"("createdBy");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_categoryId_idx" ON "calendar_events"("startDate", "categoryId");

-- CreateIndex
CREATE INDEX "calendar_events_isRecurring_recurrenceId_idx" ON "calendar_events"("isRecurring", "recurrenceId");

-- CreateIndex
CREATE INDEX "calendar_events_schoolId_idx" ON "calendar_events"("schoolId");

-- CreateIndex
CREATE INDEX "event_notes_eventId_userId_idx" ON "event_notes"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_notes_userId_idx" ON "event_notes"("userId");

-- CreateIndex
CREATE INDEX "event_notes_schoolId_idx" ON "event_notes"("schoolId");

-- CreateIndex
CREATE INDEX "event_reminders_eventId_userId_idx" ON "event_reminders"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_reminders_userId_isSent_idx" ON "event_reminders"("userId", "isSent");

-- CreateIndex
CREATE INDEX "event_reminders_reminderTime_isSent_idx" ON "event_reminders"("reminderTime", "isSent");

-- CreateIndex
CREATE INDEX "event_reminders_schoolId_idx" ON "event_reminders"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "user_calendar_preferences_userId_key" ON "user_calendar_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_calendar_preferences_userId_idx" ON "user_calendar_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_studentId_key" ON "alumni"("studentId");

-- CreateIndex
CREATE INDEX "alumni_graduationDate_idx" ON "alumni"("graduationDate");

-- CreateIndex
CREATE INDEX "alumni_finalClass_idx" ON "alumni"("finalClass");

-- CreateIndex
CREATE INDEX "alumni_currentCity_idx" ON "alumni"("currentCity");

-- CreateIndex
CREATE INDEX "alumni_collegeName_idx" ON "alumni"("collegeName");

-- CreateIndex
CREATE INDEX "alumni_currentOccupation_idx" ON "alumni"("currentOccupation");

-- CreateIndex
CREATE INDEX "alumni_currentEmployer_idx" ON "alumni"("currentEmployer");

-- CreateIndex
CREATE INDEX "alumni_graduationDate_finalClass_idx" ON "alumni"("graduationDate", "finalClass");

-- CreateIndex
CREATE INDEX "alumni_finalClass_graduationDate_idx" ON "alumni"("finalClass", "graduationDate");

-- CreateIndex
CREATE INDEX "alumni_currentCity_currentOccupation_idx" ON "alumni"("currentCity", "currentOccupation");

-- CreateIndex
CREATE INDEX "alumni_schoolId_idx" ON "alumni"("schoolId");

-- CreateIndex
CREATE INDEX "promotion_history_sourceAcademicYear_sourceClass_idx" ON "promotion_history"("sourceAcademicYear", "sourceClass");

-- CreateIndex
CREATE INDEX "promotion_history_targetAcademicYear_targetClass_idx" ON "promotion_history"("targetAcademicYear", "targetClass");

-- CreateIndex
CREATE INDEX "promotion_history_executedAt_idx" ON "promotion_history"("executedAt");

-- CreateIndex
CREATE INDEX "promotion_history_schoolId_idx" ON "promotion_history"("schoolId");

-- CreateIndex
CREATE INDEX "promotion_records_historyId_idx" ON "promotion_records"("historyId");

-- CreateIndex
CREATE INDEX "promotion_records_studentId_idx" ON "promotion_records"("studentId");

-- CreateIndex
CREATE INDEX "promotion_records_schoolId_idx" ON "promotion_records"("schoolId");

-- CreateIndex
CREATE INDEX "saved_report_configs_userId_idx" ON "saved_report_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentTeachers_AB_unique" ON "_DepartmentTeachers"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentTeachers_B_index" ON "_DepartmentTeachers"("B");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schools" ADD CONSTRAINT "user_schools_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schools" ADD CONSTRAINT "user_schools_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrator" ADD CONSTRAINT "Administrator_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSettings" ADD CONSTRAINT "TeacherSettings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSettings" ADD CONSTRAINT "TeacherSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSettings" ADD CONSTRAINT "StudentSettings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSettings" ADD CONSTRAINT "StudentSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentSettings" ADD CONSTRAINT "ParentSettings_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentSettings" ADD CONSTRAINT "ParentSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParent" ADD CONSTRAINT "StudentParent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_reportCardTemplateId_fkey" FOREIGN KEY ("reportCardTemplateId") REFERENCES "report_card_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_homeRoomId_fkey" FOREIGN KEY ("homeRoomId") REFERENCES "ClassRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRoom" ADD CONSTRAINT "ClassRoom_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectVariant" ADD CONSTRAINT "SubjectVariant_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectVariant" ADD CONSTRAINT "SubjectVariant_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectGroup" ADD CONSTRAINT "SubjectGroup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectGroupMapping" ADD CONSTRAINT "SubjectGroupMapping_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SubjectGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectGroupMapping" ADD CONSTRAINT "SubjectGroupMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectGroupMapping" ADD CONSTRAINT "SubjectGroupMapping_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTeacher" ADD CONSTRAINT "SubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTeacher" ADD CONSTRAINT "SubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTeacher" ADD CONSTRAINT "SubjectTeacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_parentSyllabusId_fkey" FOREIGN KEY ("parentSyllabusId") REFERENCES "Syllabus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus" ADD CONSTRAINT "Syllabus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusUnit" ADD CONSTRAINT "SyllabusUnit_syllabusId_fkey" FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusUnit" ADD CONSTRAINT "SyllabusUnit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_syllabusUnitId_fkey" FOREIGN KEY ("syllabusUnitId") REFERENCES "SyllabusUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_syllabusId_fkey" FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubModule" ADD CONSTRAINT "SubModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubModule" ADD CONSTRAINT "SubModule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusDocument" ADD CONSTRAINT "SyllabusDocument_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusDocument" ADD CONSTRAINT "SyllabusDocument_subModuleId_fkey" FOREIGN KEY ("subModuleId") REFERENCES "SubModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusDocument" ADD CONSTRAINT "SyllabusDocument_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubModuleProgress" ADD CONSTRAINT "SubModuleProgress_subModuleId_fkey" FOREIGN KEY ("subModuleId") REFERENCES "SubModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubModuleProgress" ADD CONSTRAINT "SubModuleProgress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableConfig" ADD CONSTRAINT "TimetableConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetablePeriod" ADD CONSTRAINT "TimetablePeriod_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TimetableConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetablePeriod" ADD CONSTRAINT "TimetablePeriod_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_subjectTeacherId_fkey" FOREIGN KEY ("subjectTeacherId") REFERENCES "SubjectTeacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ClassRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SubModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamType" ADD CONSTRAINT "ExamType_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeScale" ADD CONSTRAINT "GradeScale_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRule" ADD CONSTRAINT "AssessmentRule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRule" ADD CONSTRAINT "AssessmentRule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentClass" ADD CONSTRAINT "AssignmentClass_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentClass" ADD CONSTRAINT "AssignmentClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentClass" ADD CONSTRAINT "AssignmentClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_card_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeType" ADD CONSTRAINT "FeeType_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureClass" ADD CONSTRAINT "FeeStructureClass_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureClass" ADD CONSTRAINT "FeeStructureClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureClass" ADD CONSTRAINT "FeeStructureClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTypeClassAmount" ADD CONSTRAINT "FeeTypeClassAmount_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTypeClassAmount" ADD CONSTRAINT "FeeTypeClassAmount_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeTypeClassAmount" ADD CONSTRAINT "FeeTypeClassAmount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_feePaymentId_fkey" FOREIGN KEY ("feePaymentId") REFERENCES "FeePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_notes" ADD CONSTRAINT "receipt_notes_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "payment_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_notes" ADD CONSTRAINT "receipt_notes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipRecipient" ADD CONSTRAINT "ScholarshipRecipient_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipRecipient" ADD CONSTRAINT "ScholarshipRecipient_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipRecipient" ADD CONSTRAINT "ScholarshipRecipient_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Administrator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentMeeting" ADD CONSTRAINT "ParentMeeting_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentMeeting" ADD CONSTRAINT "ParentMeeting_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentMeeting" ADD CONSTRAINT "ParentMeeting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRSVP" ADD CONSTRAINT "EventRSVP_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRSVP" ADD CONSTRAINT "EventRSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRSVP" ADD CONSTRAINT "EventRSVP_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReservation" ADD CONSTRAINT "BookReservation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReservation" ADD CONSTRAINT "BookReservation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReservation" ADD CONSTRAINT "BookReservation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_appliedClassId_fkey" FOREIGN KEY ("appliedClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritListConfig" ADD CONSTRAINT "MeritListConfig_appliedClassId_fkey" FOREIGN KEY ("appliedClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritListConfig" ADD CONSTRAINT "MeritListConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritList" ADD CONSTRAINT "MeritList_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MeritListConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritList" ADD CONSTRAINT "MeritList_appliedClassId_fkey" FOREIGN KEY ("appliedClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritList" ADD CONSTRAINT "MeritList_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritListEntry" ADD CONSTRAINT "MeritListEntry_meritListId_fkey" FOREIGN KEY ("meritListId") REFERENCES "MeritList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritListEntry" ADD CONSTRAINT "MeritListEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeritListEntry" ADD CONSTRAINT "MeritListEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_error_logs" ADD CONSTRAINT "communication_error_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_certificates" ADD CONSTRAINT "generated_certificates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_certificates" ADD CONSTRAINT "generated_certificates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_routes" ADD CONSTRAINT "student_routes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_routes" ADD CONSTRAINT "student_routes_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_routes" ADD CONSTRAINT "student_routes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_studentRouteId_fkey" FOREIGN KEY ("studentRouteId") REFERENCES "student_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "online_exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_room_allocations" ADD CONSTRAINT "hostel_room_allocations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "hostel_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_room_allocations" ADD CONSTRAINT "hostel_room_allocations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_room_allocations" ADD CONSTRAINT "hostel_room_allocations_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_visitors" ADD CONSTRAINT "hostel_visitors_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_visitors" ADD CONSTRAINT "hostel_visitors_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_fee_payments" ADD CONSTRAINT "hostel_fee_payments_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "hostel_room_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_fee_payments" ADD CONSTRAINT "hostel_fee_payments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_complaints" ADD CONSTRAINT "hostel_complaints_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_complaints" ADD CONSTRAINT "hostel_complaints_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_complaints" ADD CONSTRAINT "hostel_complaints_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_subModuleId_fkey" FOREIGN KEY ("subModuleId") REFERENCES "SubModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_discussions" ADD CONSTRAINT "course_discussions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_discussions" ADD CONSTRAINT "course_discussions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_discussions" ADD CONSTRAINT "course_discussions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "course_discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_quizzes" ADD CONSTRAINT "lesson_quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_quizzes" ADD CONSTRAINT "lesson_quizzes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "lesson_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_mark_configs" ADD CONSTRAINT "subject_mark_configs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_mark_configs" ADD CONSTRAINT "subject_mark_configs_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_mark_configs" ADD CONSTRAINT "subject_mark_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_activities" ADD CONSTRAINT "co_scholastic_activities_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_grades" ADD CONSTRAINT "co_scholastic_grades_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "co_scholastic_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_grades" ADD CONSTRAINT "co_scholastic_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_grades" ADD CONSTRAINT "co_scholastic_grades_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_scholastic_grades" ADD CONSTRAINT "co_scholastic_grades_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_card_templates" ADD CONSTRAINT "report_card_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_categories" ADD CONSTRAINT "calendar_event_categories_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "calendar_event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_notes" ADD CONSTRAINT "event_notes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_calendar_preferences" ADD CONSTRAINT "user_calendar_preferences_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "promotion_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_report_configs" ADD CONSTRAINT "saved_report_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_report_configs" ADD CONSTRAINT "saved_report_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentTeachers" ADD CONSTRAINT "_DepartmentTeachers_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentTeachers" ADD CONSTRAINT "_DepartmentTeachers_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
