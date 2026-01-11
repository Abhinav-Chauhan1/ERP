/**
 * Tests for Notification Template Utilities
 */

import { describe, it, expect } from "vitest";
import {
  replaceTemplateVariables,
  validateTemplateVariables,
  extractTemplateVariables,
  renderMessageTemplate,
  formatDateForTemplate,
  preparePromotionVariables,
  prepareGraduationVariables,
  prepareAlumniWelcomeVariables,
} from "@/lib/utils/templateUtils";

describe("Template Utilities", () => {
  describe("replaceTemplateVariables", () => {
    it("should replace single variable", () => {
      const template = "Hello {{name}}!";
      const variables = { name: "John" };
      const result = replaceTemplateVariables(template, variables);
      expect(result).toBe("Hello John!");
    });

    it("should replace multiple variables", () => {
      const template = "Hello {{name}}, welcome to {{school}}!";
      const variables = { name: "John", school: "Springfield High" };
      const result = replaceTemplateVariables(template, variables);
      expect(result).toBe("Hello John, welcome to Springfield High!");
    });

    it("should replace repeated variables", () => {
      const template = "{{name}} is a student. {{name}} is doing well.";
      const variables = { name: "John" };
      const result = replaceTemplateVariables(template, variables);
      expect(result).toBe("John is a student. John is doing well.");
    });

    it("should handle missing variables by replacing with empty string", () => {
      const template = "Hello {{name}}, your score is {{score}}";
      const variables = { name: "John" };
      const result = replaceTemplateVariables(template, variables);
      expect(result).toBe("Hello John, your score is ");
    });

    it("should handle numeric variables", () => {
      const template = "Your score is {{score}} out of {{total}}";
      const variables = { score: 85, total: 100 };
      const result = replaceTemplateVariables(template, variables);
      expect(result).toBe("Your score is 85 out of 100");
    });
  });

  describe("validateTemplateVariables", () => {
    it("should validate all required variables are present", () => {
      const required = ["name", "school"];
      const data = { name: "John", school: "Springfield High", extra: "value" };
      const result = validateTemplateVariables(required, data);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("should detect missing variables", () => {
      const required = ["name", "school", "grade"];
      const data = { name: "John" };
      const result = validateTemplateVariables(required, data);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["school", "grade"]);
    });

    it("should detect null values as missing", () => {
      const required = ["name", "school"];
      const data = { name: "John", school: null };
      const result = validateTemplateVariables(required, data);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["school"]);
    });
  });

  describe("extractTemplateVariables", () => {
    it("should extract single variable", () => {
      const template = "Hello {{name}}!";
      const result = extractTemplateVariables(template);
      expect(result).toEqual(["name"]);
    });

    it("should extract multiple variables", () => {
      const template = "Hello {{name}}, your score is {{score}}";
      const result = extractTemplateVariables(template);
      expect(result).toEqual(["name", "score"]);
    });

    it("should extract unique variables only", () => {
      const template = "{{name}} is a student. {{name}} scored {{score}}.";
      const result = extractTemplateVariables(template);
      expect(result).toEqual(["name", "score"]);
    });

    it("should return empty array for template without variables", () => {
      const template = "This is a plain text message.";
      const result = extractTemplateVariables(template);
      expect(result).toEqual([]);
    });
  });

  describe("renderMessageTemplate", () => {
    it("should render template with subject and body", () => {
      const template = {
        subject: "Welcome {{name}}",
        body: "Hello {{name}}, welcome to {{school}}!",
      };
      const variables = { name: "John", school: "Springfield High" };
      const result = renderMessageTemplate(template, variables);
      expect(result.subject).toBe("Welcome John");
      expect(result.body).toBe("Hello John, welcome to Springfield High!");
    });

    it("should handle null subject", () => {
      const template = {
        subject: null,
        body: "Hello {{name}}!",
      };
      const variables = { name: "John" };
      const result = renderMessageTemplate(template, variables);
      expect(result.subject).toBeNull();
      expect(result.body).toBe("Hello John!");
    });
  });

  describe("formatDateForTemplate", () => {
    it("should format date in short format", () => {
      const date = new Date("2024-03-15");
      const result = formatDateForTemplate(date, "short");
      expect(result).toMatch(/03\/15\/2024/);
    });

    it("should format date in long format", () => {
      const date = new Date("2024-03-15");
      const result = formatDateForTemplate(date, "long");
      expect(result).toMatch(/March 15, 2024/);
    });

    it("should format time", () => {
      const date = new Date("2024-03-15T14:30:00");
      const result = formatDateForTemplate(date, "time");
      expect(result).toMatch(/02:30 PM/);
    });
  });

  describe("preparePromotionVariables", () => {
    it("should prepare promotion variables correctly", () => {
      const data = {
        parentName: "John Smith",
        studentName: "Alex Smith",
        sourceClass: "Grade 10",
        sourceSection: "A",
        targetClass: "Grade 11",
        targetSection: "B",
        targetAcademicYear: "2024-2025",
        rollNumber: "11B001",
        sessionStartDate: new Date("2024-09-01"),
        schoolName: "Springfield High",
        schoolPhone: "+1-555-0100",
      };

      const result = preparePromotionVariables(data);

      expect(result.parentName).toBe("John Smith");
      expect(result.studentName).toBe("Alex Smith");
      expect(result.sourceClass).toBe("Grade 10");
      expect(result.sourceSection).toBe("A");
      expect(result.targetClass).toBe("Grade 11");
      expect(result.targetSection).toBe("B");
      expect(result.targetAcademicYear).toBe("2024-2025");
      expect(result.rollNumber).toBe("11B001");
      expect(result.schoolName).toBe("Springfield High");
      expect(result.schoolPhone).toBe("+1-555-0100");
      expect(result.sessionStartDate).toBeTruthy();
    });

    it("should handle missing optional fields", () => {
      const data = {
        parentName: "John Smith",
        studentName: "Alex Smith",
        sourceClass: "Grade 10",
        targetClass: "Grade 11",
        targetAcademicYear: "2024-2025",
        sessionStartDate: new Date("2024-09-01"),
        schoolName: "Springfield High",
        schoolPhone: "+1-555-0100",
      };

      const result = preparePromotionVariables(data);

      expect(result.sourceSection).toBe("");
      expect(result.targetSection).toBe("");
      expect(result.rollNumber).toBe("TBD");
    });
  });

  describe("prepareGraduationVariables", () => {
    it("should prepare graduation variables correctly", () => {
      const data = {
        parentName: "John Smith",
        studentName: "Alex Smith",
        ceremonyDate: new Date("2024-06-15"),
        ceremonyTime: "10:00 AM",
        ceremonyVenue: "School Auditorium",
        chiefGuest: "Dr. Jane Doe",
        finalClass: "Grade 12",
        finalSection: "A",
        graduationDate: new Date("2024-06-15"),
        academicYear: "2023-2024",
        schoolName: "Springfield High",
        schoolPhone: "+1-555-0100",
        schoolEmail: "info@springfieldhigh.edu",
      };

      const result = prepareGraduationVariables(data);

      expect(result.parentName).toBe("John Smith");
      expect(result.studentName).toBe("Alex Smith");
      expect(result.ceremonyTime).toBe("10:00 AM");
      expect(result.ceremonyVenue).toBe("School Auditorium");
      expect(result.chiefGuest).toBe("Dr. Jane Doe");
      expect(result.finalClass).toBe("Grade 12");
      expect(result.finalSection).toBe("A");
      expect(result.academicYear).toBe("2023-2024");
      expect(result.schoolName).toBe("Springfield High");
      expect(result.schoolPhone).toBe("+1-555-0100");
      expect(result.schoolEmail).toBe("info@springfieldhigh.edu");
    });

    it("should handle missing optional fields", () => {
      const data = {
        studentName: "Alex Smith",
        ceremonyDate: new Date("2024-06-15"),
        ceremonyTime: "10:00 AM",
        ceremonyVenue: "School Auditorium",
        finalClass: "Grade 12",
        graduationDate: new Date("2024-06-15"),
        schoolName: "Springfield High",
        schoolPhone: "+1-555-0100",
        schoolEmail: "info@springfieldhigh.edu",
      };

      const result = prepareGraduationVariables(data);

      expect(result.parentName).toBe("");
      expect(result.chiefGuest).toBe("To be announced");
      expect(result.finalSection).toBe("");
      expect(result.academicYear).toBe("");
    });
  });

  describe("prepareAlumniWelcomeVariables", () => {
    it("should prepare alumni welcome variables correctly", () => {
      const data = {
        alumniName: "Alex Smith",
        graduationYear: 2024,
        finalClass: "Grade 12",
        admissionId: "ADM2018001",
        portalUrl: "https://springfieldhigh.edu/alumni",
        schoolName: "Springfield High",
        schoolPhone: "+1-555-0100",
        schoolEmail: "alumni@springfieldhigh.edu",
      };

      const result = prepareAlumniWelcomeVariables(data);

      expect(result.alumniName).toBe("Alex Smith");
      expect(result.graduationYear).toBe("2024");
      expect(result.finalClass).toBe("Grade 12");
      expect(result.admissionId).toBe("ADM2018001");
      expect(result.portalUrl).toBe("https://springfieldhigh.edu/alumni");
      expect(result.schoolName).toBe("Springfield High");
      expect(result.schoolPhone).toBe("+1-555-0100");
      expect(result.schoolEmail).toBe("alumni@springfieldhigh.edu");
    });
  });

  describe("Integration: Complete Template Rendering", () => {
    it("should render a complete promotion notification", () => {
      const template = {
        subject: "Promotion Notification - {{studentName}}",
        body: `Dear {{parentName}},

Congratulations! {{studentName}} has been promoted to {{targetClass}} {{targetSection}}.

Previous Class: {{sourceClass}} {{sourceSection}}
New Class: {{targetClass}} {{targetSection}}
Roll Number: {{rollNumber}}

Best regards,
{{schoolName}}`,
      };

      const data = {
        parentName: "John Smith",
        studentName: "Alex Smith",
        sourceClass: "Grade 10",
        sourceSection: "A",
        targetClass: "Grade 11",
        targetSection: "B",
        targetAcademicYear: "2024-2025",
        rollNumber: "11B001",
        sessionStartDate: new Date("2024-09-01"),
        schoolName: "Springfield High",
        schoolPhone: "+1-555-0100",
      };

      const variables = preparePromotionVariables(data);
      const result = renderMessageTemplate(template, variables);

      expect(result.subject).toBe("Promotion Notification - Alex Smith");
      expect(result.body).toContain("Dear John Smith");
      expect(result.body).toContain("Alex Smith has been promoted to Grade 11 B");
      expect(result.body).toContain("Previous Class: Grade 10 A");
      expect(result.body).toContain("Roll Number: 11B001");
      expect(result.body).toContain("Springfield High");
    });
  });
});
