import { describe, it, expect } from "vitest";
import {
  validateNumeric,
  validateMaximum,
  validateRequired,
  validateRemarksLength,
  validateComponentSum,
  validateMarkEntry,
  detectDuplicates,
  validateBulkMarks,
  formatValidationErrors,
  createErrorResponse,
  separateValidInvalidEntries,
  ValidationErrorCodes,
  type MarkConfig,
  type MarkEntry,
} from "../marks-validation";

describe("Marks Validation", () => {
  describe("validateNumeric", () => {
    it("should accept valid positive numbers", () => {
      expect(validateNumeric(50, "Theory marks")).toBeNull();
      expect(validateNumeric(0, "Theory marks")).toBeNull();
      expect(validateNumeric(100.5, "Theory marks")).toBeNull();
    });

    it("should accept null and undefined", () => {
      expect(validateNumeric(null, "Theory marks")).toBeNull();
      expect(validateNumeric(undefined, "Theory marks")).toBeNull();
    });

    it("should reject negative numbers", () => {
      const error = validateNumeric(-5, "Theory marks");
      expect(error).not.toBeNull();
      expect(error?.code).toBe(ValidationErrorCodes.NEGATIVE_VALUE);
      expect(error?.message).toContain("cannot be negative");
    });

    it("should reject non-numeric values", () => {
      const error = validateNumeric("abc", "Theory marks");
      expect(error).not.toBeNull();
      expect(error?.code).toBe(ValidationErrorCodes.INVALID_TYPE);
    });

    it("should parse valid numeric strings", () => {
      expect(validateNumeric("50", "Theory marks")).toBeNull();
      expect(validateNumeric("100.5", "Theory marks")).toBeNull();
    });

    it("should reject negative numeric strings", () => {
      const error = validateNumeric("-5", "Theory marks");
      expect(error).not.toBeNull();
      expect(error?.code).toBe(ValidationErrorCodes.NEGATIVE_VALUE);
    });
  });

  describe("validateMaximum", () => {
    it("should accept values within maximum", () => {
      expect(validateMaximum(50, 100, "Theory marks")).toBeNull();
      expect(validateMaximum(100, 100, "Theory marks")).toBeNull();
      expect(validateMaximum(0, 100, "Theory marks")).toBeNull();
    });

    it("should accept null/undefined values", () => {
      expect(validateMaximum(null, 100, "Theory marks")).toBeNull();
      expect(validateMaximum(undefined, 100, "Theory marks")).toBeNull();
    });

    it("should accept when no maximum is set", () => {
      expect(validateMaximum(150, null, "Theory marks")).toBeNull();
      expect(validateMaximum(150, undefined, "Theory marks")).toBeNull();
    });

    it("should reject values exceeding maximum", () => {
      const error = validateMaximum(101, 100, "Theory marks");
      expect(error).not.toBeNull();
      expect(error?.code).toBe(ValidationErrorCodes.EXCEEDS_MAXIMUM);
      expect(error?.message).toContain("exceeds maximum");
      expect(error?.message).toContain("101");
      expect(error?.message).toContain("100");
    });
  });

  describe("validateRequired", () => {
    it("should accept non-empty values", () => {
      expect(validateRequired("value", "Field")).toBeNull();
      expect(validateRequired(0, "Field")).toBeNull();
      expect(validateRequired(false, "Field")).toBeNull();
    });

    it("should reject null, undefined, and empty string", () => {
      const nullError = validateRequired(null, "Field");
      expect(nullError).not.toBeNull();
      expect(nullError?.code).toBe(ValidationErrorCodes.REQUIRED_FIELD);

      const undefinedError = validateRequired(undefined, "Field");
      expect(undefinedError).not.toBeNull();

      const emptyError = validateRequired("", "Field");
      expect(emptyError).not.toBeNull();
    });
  });

  describe("validateRemarksLength", () => {
    it("should accept remarks within limit", () => {
      expect(validateRemarksLength("Short remark")).toBeNull();
      expect(validateRemarksLength("A".repeat(500))).toBeNull();
      expect(validateRemarksLength(null)).toBeNull();
      expect(validateRemarksLength(undefined)).toBeNull();
    });

    it("should reject remarks exceeding 500 characters", () => {
      const longRemarks = "A".repeat(501);
      const error = validateRemarksLength(longRemarks);
      expect(error).not.toBeNull();
      expect(error?.code).toBe(ValidationErrorCodes.REMARKS_TOO_LONG);
      expect(error?.message).toContain("500");
      expect(error?.message).toContain("501");
    });
  });

  describe("validateComponentSum", () => {
    it("should accept when components sum equals total", () => {
      const config: MarkConfig = {
        theoryMaxMarks: 60,
        practicalMaxMarks: 30,
        internalMaxMarks: 10,
        totalMarks: 100,
      };
      expect(validateComponentSum(config)).toBeNull();
    });

    it("should accept with null components", () => {
      const config: MarkConfig = {
        theoryMaxMarks: 100,
        practicalMaxMarks: null,
        internalMaxMarks: null,
        totalMarks: 100,
      };
      expect(validateComponentSum(config)).toBeNull();
    });

    it("should reject when sum does not equal total", () => {
      const config: MarkConfig = {
        theoryMaxMarks: 60,
        practicalMaxMarks: 30,
        internalMaxMarks: 10,
        totalMarks: 90, // Sum is 100, not 90
      };
      const error = validateComponentSum(config);
      expect(error).not.toBeNull();
      expect(error?.code).toBe(ValidationErrorCodes.COMPONENT_SUM_MISMATCH);
    });
  });

  describe("validateMarkEntry", () => {
    const config: MarkConfig = {
      theoryMaxMarks: 70,
      practicalMaxMarks: 30,
      internalMaxMarks: null,
      totalMarks: 100,
    };

    it("should validate correct mark entry", () => {
      const entry: MarkEntry = {
        studentId: "student1",
        theoryMarks: 60,
        practicalMarks: 25,
        isAbsent: false,
      };
      const result = validateMarkEntry(entry, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept absent students without marks", () => {
      const entry: MarkEntry = {
        studentId: "student1",
        isAbsent: true,
      };
      const result = validateMarkEntry(entry, config);
      expect(result.isValid).toBe(true);
    });

    it("should reject missing student ID", () => {
      const entry: MarkEntry = {
        studentId: "",
        theoryMarks: 60,
        isAbsent: false,
      };
      const result = validateMarkEntry(entry, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === ValidationErrorCodes.REQUIRED_FIELD)).toBe(true);
    });

    it("should reject non-absent students without marks", () => {
      const entry: MarkEntry = {
        studentId: "student1",
        isAbsent: false,
      };
      const result = validateMarkEntry(entry, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === ValidationErrorCodes.NO_MARKS_PROVIDED)).toBe(
        true
      );
    });

    it("should reject marks exceeding maximum", () => {
      const entry: MarkEntry = {
        studentId: "student1",
        theoryMarks: 80, // Exceeds 70
        practicalMarks: 25,
        isAbsent: false,
      };
      const result = validateMarkEntry(entry, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === ValidationErrorCodes.EXCEEDS_MAXIMUM)).toBe(true);
    });

    it("should reject negative marks", () => {
      const entry: MarkEntry = {
        studentId: "student1",
        theoryMarks: -5,
        practicalMarks: 25,
        isAbsent: false,
      };
      const result = validateMarkEntry(entry, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === ValidationErrorCodes.NEGATIVE_VALUE)).toBe(true);
    });

    it("should reject remarks exceeding 500 characters", () => {
      const entry: MarkEntry = {
        studentId: "student1",
        theoryMarks: 60,
        isAbsent: false,
        remarks: "A".repeat(501),
      };
      const result = validateMarkEntry(entry, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === ValidationErrorCodes.REMARKS_TOO_LONG)).toBe(
        true
      );
    });
  });

  describe("detectDuplicates", () => {
    it("should detect no duplicates in unique entries", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, isAbsent: false },
        { studentId: "student2", theoryMarks: 70, isAbsent: false },
        { studentId: "student3", theoryMarks: 80, isAbsent: false },
      ];
      const duplicates = detectDuplicates(entries);
      expect(duplicates.size).toBe(0);
    });

    it("should detect duplicate student IDs", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, isAbsent: false },
        { studentId: "student2", theoryMarks: 70, isAbsent: false },
        { studentId: "student1", theoryMarks: 80, isAbsent: false },
      ];
      const duplicates = detectDuplicates(entries);
      expect(duplicates.size).toBe(1);
      expect(duplicates.has("student1")).toBe(true);
      expect(duplicates.get("student1")).toEqual([0, 2]);
    });

    it("should detect multiple duplicates", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, isAbsent: false },
        { studentId: "student2", theoryMarks: 70, isAbsent: false },
        { studentId: "student1", theoryMarks: 80, isAbsent: false },
        { studentId: "student2", theoryMarks: 90, isAbsent: false },
      ];
      const duplicates = detectDuplicates(entries);
      expect(duplicates.size).toBe(2);
      expect(duplicates.has("student1")).toBe(true);
      expect(duplicates.has("student2")).toBe(true);
    });
  });

  describe("validateBulkMarks", () => {
    const config: MarkConfig = {
      theoryMaxMarks: 70,
      practicalMaxMarks: 30,
      internalMaxMarks: null,
      totalMarks: 100,
    };

    it("should validate all correct entries", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, practicalMarks: 25, isAbsent: false },
        { studentId: "student2", theoryMarks: 65, practicalMarks: 28, isAbsent: false },
      ];
      const result = validateBulkMarks(entries, config);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.duplicates.size).toBe(0);
    });

    it("should detect validation errors", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, practicalMarks: 25, isAbsent: false },
        { studentId: "student2", theoryMarks: 80, practicalMarks: 28, isAbsent: false }, // Exceeds max
      ];
      const result = validateBulkMarks(entries, config);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(1);
      expect(result.errors["student_1"]).toBeDefined();
    });

    it("should detect duplicates", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, practicalMarks: 25, isAbsent: false },
        { studentId: "student1", theoryMarks: 65, practicalMarks: 28, isAbsent: false },
      ];
      const result = validateBulkMarks(entries, config);
      expect(result.isValid).toBe(false);
      expect(result.duplicates.size).toBe(1);
    });
  });

  describe("formatValidationErrors", () => {
    it("should format errors correctly", () => {
      const errors = {
        student_0: [
          {
            field: "theoryMarks",
            message: "Theory marks exceed maximum",
            code: ValidationErrorCodes.EXCEEDS_MAXIMUM,
          },
        ],
        student_1: [
          {
            field: "studentId",
            message: "Student ID is required",
            code: ValidationErrorCodes.REQUIRED_FIELD,
          },
        ],
      };
      const formatted = formatValidationErrors(errors);
      expect(formatted["student_0"]).toEqual(["Theory marks exceed maximum"]);
      expect(formatted["student_1"]).toEqual(["Student ID is required"]);
    });
  });

  describe("createErrorResponse", () => {
    it("should create basic error response", () => {
      const response = createErrorResponse("Validation failed", "VALIDATION_ERROR");
      expect(response.success).toBe(false);
      expect(response.error).toBe("Validation failed");
      expect(response.code).toBe("VALIDATION_ERROR");
      expect(response.timestamp).toBeDefined();
    });

    it("should include details when provided", () => {
      const details = {
        student_0: ["Error 1", "Error 2"],
      };
      const response = createErrorResponse("Validation failed", "VALIDATION_ERROR", details);
      expect(response.details).toEqual(details);
    });

    it("should include duplicates when provided", () => {
      const duplicates = new Map([["student1", [0, 2]]]);
      const response = createErrorResponse(
        "Duplicates found",
        "DUPLICATE_ENTRIES",
        undefined,
        duplicates
      );
      expect(response.duplicates).toHaveLength(1);
      expect(response.duplicates?.[0].studentId).toBe("student1");
      expect(response.duplicates?.[0].indices).toEqual([0, 2]);
    });
  });

  describe("separateValidInvalidEntries", () => {
    const config: MarkConfig = {
      theoryMaxMarks: 70,
      practicalMaxMarks: 30,
      internalMaxMarks: null,
      totalMarks: 100,
    };

    it("should separate valid and invalid entries", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, practicalMarks: 25, isAbsent: false },
        { studentId: "student2", theoryMarks: 80, practicalMarks: 28, isAbsent: false }, // Invalid
        { studentId: "student3", theoryMarks: 65, practicalMarks: 20, isAbsent: false },
      ];
      const result = separateValidInvalidEntries(entries, config);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].index).toBe(1);
      expect(result.invalid[0].errors.length).toBeGreaterThan(0);
    });

    it("should handle all valid entries", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 60, practicalMarks: 25, isAbsent: false },
        { studentId: "student2", theoryMarks: 65, practicalMarks: 28, isAbsent: false },
      ];
      const result = separateValidInvalidEntries(entries, config);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it("should handle all invalid entries", () => {
      const entries: MarkEntry[] = [
        { studentId: "student1", theoryMarks: 80, practicalMarks: 25, isAbsent: false }, // Invalid
        { studentId: "student2", theoryMarks: 85, practicalMarks: 28, isAbsent: false }, // Invalid
      ];
      const result = separateValidInvalidEntries(entries, config);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(2);
    });
  });
});
