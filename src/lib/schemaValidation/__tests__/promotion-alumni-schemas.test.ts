import { describe, it, expect } from "vitest";
import {
  bulkPromotionSchema,
  promotionPreviewSchema,
  studentSelectionSchema,
  excludedStudentSchema,
  rollNumberStrategyEnum,
  promotionHistoryFilterSchema,
  graduationCeremonySchema,
} from "../promotionSchemaValidation";
import {
  createAlumniProfileSchema,
  updateAlumniProfileSchema,
  alumniSearchFilterSchema,
  alumniMessageSchema,
  alumniSelfUpdateSchema,
} from "../alumniSchemaValidation";

describe("Promotion Schema Validation", () => {
  describe("studentSelectionSchema", () => {
    it("should validate valid student selection input", () => {
      const validInput = {
        sourceClassId: "class123",
        sourceSectionId: "section456",
        sourceAcademicYearId: "year789",
      };
      const result = studentSelectionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const invalidInput = {
        sourceSectionId: "section456",
      };
      const result = studentSelectionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("bulkPromotionSchema", () => {
    it("should validate valid bulk promotion input", () => {
      const validInput = {
        sourceClassId: "class123",
        sourceAcademicYearId: "year789",
        targetAcademicYearId: "year790",
        targetClassId: "class124",
        studentIds: ["student1", "student2"],
        excludedStudents: [],
        rollNumberStrategy: "auto" as const,
        sendNotifications: true,
      };
      const result = bulkPromotionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should require roll number mapping for manual strategy", () => {
      const invalidInput = {
        sourceClassId: "class123",
        sourceAcademicYearId: "year789",
        targetAcademicYearId: "year790",
        targetClassId: "class124",
        studentIds: ["student1", "student2"],
        rollNumberStrategy: "manual" as const,
        sendNotifications: true,
      };
      const result = bulkPromotionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should validate manual strategy with complete mapping", () => {
      const validInput = {
        sourceClassId: "class123",
        sourceAcademicYearId: "year789",
        targetAcademicYearId: "year790",
        targetClassId: "class124",
        studentIds: ["student1", "student2"],
        rollNumberStrategy: "manual" as const,
        rollNumberMapping: {
          student1: "001",
          student2: "002",
        },
        sendNotifications: true,
      };
      const result = bulkPromotionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("graduationCeremonySchema", () => {
    it("should validate valid graduation ceremony input", () => {
      const validInput = {
        classId: "class123",
        academicYearId: "year789",
        studentIds: ["student1", "student2"],
        graduationDate: new Date("2024-06-15"),
        ceremonyVenue: "Main Auditorium",
        generateCertificates: true,
        sendCongratulations: true,
      };
      const result = graduationCeremonySchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject future graduation dates", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const invalidInput = {
        classId: "class123",
        academicYearId: "year789",
        studentIds: ["student1"],
        graduationDate: futureDate,
      };
      const result = graduationCeremonySchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});

describe("Alumni Schema Validation", () => {
  describe("createAlumniProfileSchema", () => {
    it("should validate valid alumni profile creation", () => {
      const validInput = {
        studentId: "student123",
        graduationDate: new Date("2024-06-15"),
        finalClass: "Grade 12",
        finalSection: "A",
        finalAcademicYear: "2023-2024",
        createdBy: "admin123",
      };
      const result = createAlumniProfileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const invalidInput = {
        studentId: "student123",
        graduationDate: new Date("2024-06-15"),
      };
      const result = createAlumniProfileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("updateAlumniProfileSchema", () => {
    it("should validate valid alumni profile update", () => {
      const validInput = {
        currentOccupation: "Software Engineer",
        currentEmployer: "Tech Corp",
        currentCity: "Mumbai",
        currentEmail: "alumni@example.com",
        higherEducation: "Bachelor of Engineering",
        collegeName: "IIT Mumbai",
        graduationYearCollege: 2024,
      };
      const result = updateAlumniProfileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept empty strings for optional email fields", () => {
      const validInput = {
        currentEmail: "",
        linkedInProfile: "",
      };
      const result = updateAlumniProfileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      const invalidInput = {
        currentEmail: "not-an-email",
      };
      const result = updateAlumniProfileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("alumniSearchFilterSchema", () => {
    it("should validate valid search filters", () => {
      const validInput = {
        searchTerm: "John Doe",
        graduationYearFrom: 2020,
        graduationYearTo: 2024,
        finalClass: "Grade 12",
        currentCity: "Mumbai",
        page: 1,
        pageSize: 20,
        sortBy: "graduationDate" as const,
        sortOrder: "desc" as const,
      };
      const result = alumniSearchFilterSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid year ranges", () => {
      const invalidInput = {
        graduationYearFrom: 2024,
        graduationYearTo: 2020,
      };
      const result = alumniSearchFilterSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should apply default values", () => {
      const input = {};
      const result = alumniSearchFilterSchema.parse(input);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.sortBy).toBe("graduationDate");
      expect(result.sortOrder).toBe("desc");
    });
  });

  describe("alumniMessageSchema", () => {
    it("should validate valid alumni message", () => {
      const validInput = {
        alumniIds: ["alumni1", "alumni2"],
        subject: "School Reunion",
        message: "Join us for the annual reunion!",
        channels: ["email" as const, "sms" as const],
      };
      const result = alumniMessageSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty alumni list", () => {
      const invalidInput = {
        alumniIds: [],
        subject: "Test",
        message: "Test message",
        channels: ["email" as const],
      };
      const result = alumniMessageSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject past scheduled dates", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const invalidInput = {
        alumniIds: ["alumni1"],
        subject: "Test",
        message: "Test message",
        channels: ["email" as const],
        scheduledAt: pastDate,
      };
      const result = alumniMessageSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
