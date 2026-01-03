import { describe, it, expect } from "vitest";
import {
  feeStructureSchema,
  feeTypeSchema,
  feeStructureItemSchema,
} from "../feeStructureSchemaValidation";

describe("Fee Structure Schema Validation", () => {
  describe("feeStructureItemSchema", () => {
    it("should validate a valid fee structure item", () => {
      const validItem = {
        feeTypeId: "fee-type-123",
        amount: 1000,
        dueDate: new Date("2025-12-31"),
      };

      const result = feeStructureItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("should reject negative amounts", () => {
      const invalidItem = {
        feeTypeId: "fee-type-123",
        amount: -100,
      };

      const result = feeStructureItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe("feeStructureSchema", () => {
    it("should validate a valid fee structure with classIds", () => {
      const validStructure = {
        name: "Annual Fees 2025",
        academicYearId: "ay-2025",
        classIds: ["class-1", "class-2"],
        description: "Annual fee structure",
        validFrom: new Date("2025-01-01"),
        validTo: new Date("2025-12-31"),
        isActive: true,
        isTemplate: false,
        items: [
          {
            feeTypeId: "fee-type-1",
            amount: 1000,
          },
        ],
      };

      const result = feeStructureSchema.safeParse(validStructure);
      expect(result.success).toBe(true);
    });

    it("should reject fee structure with empty classIds array", () => {
      const invalidStructure = {
        name: "Annual Fees 2025",
        academicYearId: "ay-2025",
        classIds: [],
        validFrom: new Date("2025-01-01"),
        isActive: true,
        isTemplate: false,
        items: [
          {
            feeTypeId: "fee-type-1",
            amount: 1000,
          },
        ],
      };

      const result = feeStructureSchema.safeParse(invalidStructure);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          "At least one class must be selected"
        );
      }
    });

    it("should reject fee structure without classIds", () => {
      const invalidStructure = {
        name: "Annual Fees 2025",
        academicYearId: "ay-2025",
        validFrom: new Date("2025-01-01"),
        isActive: true,
        isTemplate: false,
        items: [
          {
            feeTypeId: "fee-type-1",
            amount: 1000,
          },
        ],
      };

      const result = feeStructureSchema.safeParse(invalidStructure);
      expect(result.success).toBe(false);
    });

    it("should validate isTemplate field", () => {
      const templateStructure = {
        name: "Template Fees",
        academicYearId: "ay-2025",
        classIds: ["class-1"],
        validFrom: new Date("2025-01-01"),
        isActive: false,
        isTemplate: true,
        items: [
          {
            feeTypeId: "fee-type-1",
            amount: 1000,
          },
        ],
      };

      const result = feeStructureSchema.safeParse(templateStructure);
      expect(result.success).toBe(true);
    });

    it("should reject fee structure without items", () => {
      const invalidStructure = {
        name: "Annual Fees 2025",
        academicYearId: "ay-2025",
        classIds: ["class-1"],
        validFrom: new Date("2025-01-01"),
        isActive: true,
        isTemplate: false,
        items: [],
      };

      const result = feeStructureSchema.safeParse(invalidStructure);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          "At least one fee item is required"
        );
      }
    });
  });

  describe("feeTypeSchema", () => {
    it("should validate a valid fee type without class amounts", () => {
      const validFeeType = {
        name: "Tuition Fee",
        description: "Annual tuition fee",
        amount: 5000,
        frequency: "ANNUAL" as const,
        isOptional: false,
      };

      const result = feeTypeSchema.safeParse(validFeeType);
      expect(result.success).toBe(true);
    });

    it("should validate a valid fee type with class amounts", () => {
      const validFeeType = {
        name: "Tuition Fee",
        amount: 5000,
        frequency: "ANNUAL" as const,
        isOptional: false,
        classAmounts: [
          { classId: "class-1", amount: 5000 },
          { classId: "class-2", amount: 6000 },
        ],
      };

      const result = feeTypeSchema.safeParse(validFeeType);
      expect(result.success).toBe(true);
    });

    it("should reject fee type with duplicate class amounts", () => {
      const invalidFeeType = {
        name: "Tuition Fee",
        amount: 5000,
        frequency: "ANNUAL" as const,
        isOptional: false,
        classAmounts: [
          { classId: "class-1", amount: 5000 },
          { classId: "class-1", amount: 6000 }, // Duplicate class ID
        ],
      };

      const result = feeTypeSchema.safeParse(invalidFeeType);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          "Each class can only have one custom amount"
        );
      }
    });

    it("should reject fee type with negative amount", () => {
      const invalidFeeType = {
        name: "Tuition Fee",
        amount: -5000,
        frequency: "ANNUAL" as const,
        isOptional: false,
      };

      const result = feeTypeSchema.safeParse(invalidFeeType);
      expect(result.success).toBe(false);
    });

    it("should reject fee type with negative class amount", () => {
      const invalidFeeType = {
        name: "Tuition Fee",
        amount: 5000,
        frequency: "ANNUAL" as const,
        isOptional: false,
        classAmounts: [{ classId: "class-1", amount: -1000 }],
      };

      const result = feeTypeSchema.safeParse(invalidFeeType);
      expect(result.success).toBe(false);
    });

    it("should validate all frequency types", () => {
      const frequencies = [
        "ONE_TIME",
        "MONTHLY",
        "QUARTERLY",
        "SEMI_ANNUAL",
        "ANNUAL",
      ] as const;

      frequencies.forEach((frequency) => {
        const feeType = {
          name: "Test Fee",
          amount: 1000,
          frequency,
          isOptional: false,
        };

        const result = feeTypeSchema.safeParse(feeType);
        expect(result.success).toBe(true);
      });
    });
  });
});
