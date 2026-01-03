import { describe, it, expect } from "vitest";
import {
  FeeStructureErrorCode,
  FeeStructureValidationError,
  FeeStructureErrorMessages,
  handleFeeStructureError,
  createNoClassesSelectedError,
  createInvalidClassIdError,
  createDuplicateClassAssociationError,
  createInvalidAcademicYearError,
  createInvalidDateRangeError,
  createNoFeeItemsError,
  createInvalidAmountError,
  createTemplateCannotBeActiveError,
  createDuplicateClassAmountError,
  createClassNotFoundError,
  createFeeStructureNotFoundError,
  createFeeTypeNotFoundError,
  createUnauthorizedError,
  formatFeeStructureErrorMessage,
  isRetryableFeeStructureError,
} from "../fee-structure-error-handler";
import { ZodError } from "zod";

describe("Fee Structure Error Handler", () => {
  describe("FeeStructureValidationError", () => {
    it("should create error with all properties", () => {
      const error = new FeeStructureValidationError(
        FeeStructureErrorCode.NO_CLASSES_SELECTED,
        "Test message",
        "classIds",
        { detail: "test" }
      );

      expect(error.name).toBe("FeeStructureValidationError");
      expect(error.code).toBe(FeeStructureErrorCode.NO_CLASSES_SELECTED);
      expect(error.message).toBe("Test message");
      expect(error.field).toBe("classIds");
      expect(error.details).toEqual({ detail: "test" });
    });
  });

  describe("Error Messages", () => {
    it("should have messages for all error codes", () => {
      const errorCodes = Object.values(FeeStructureErrorCode);
      errorCodes.forEach((code) => {
        expect(FeeStructureErrorMessages[code]).toBeDefined();
        expect(typeof FeeStructureErrorMessages[code]).toBe("string");
      });
    });
  });

  describe("handleFeeStructureError", () => {
    it("should handle FeeStructureValidationError", () => {
      const error = new FeeStructureValidationError(
        FeeStructureErrorCode.NO_CLASSES_SELECTED,
        "Test message",
        "classIds"
      );

      const result = handleFeeStructureError(error);

      expect(result.code).toBe(FeeStructureErrorCode.NO_CLASSES_SELECTED);
      expect(result.message).toBe("Test message");
      expect(result.field).toBe("classIds");
    });

    it("should handle ZodError", () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["classIds"],
          message: "Expected string, received number",
        },
      ]);

      const result = handleFeeStructureError(zodError);

      expect(result.code).toBe(FeeStructureErrorCode.VALIDATION_ERROR);
      expect(result.message).toBe("Validation failed");
      expect(result.details).toBeDefined();
    });

    it("should handle Prisma P2002 error (unique constraint)", () => {
      const prismaError = {
        code: "P2002",
        meta: { target: ["feeStructureId", "classId"] },
      };

      const result = handleFeeStructureError(prismaError);

      expect(result.code).toBe(FeeStructureErrorCode.DUPLICATE_CLASS_ASSOCIATION);
    });

    it("should handle Prisma P2025 error (record not found)", () => {
      const prismaError = {
        code: "P2025",
        meta: { cause: "Record to update not found" },
      };

      const result = handleFeeStructureError(prismaError);

      expect(result.code).toBe(FeeStructureErrorCode.FEE_STRUCTURE_NOT_FOUND);
    });

    it("should handle Prisma P2003 error (foreign key constraint)", () => {
      const prismaError = {
        code: "P2003",
        meta: { field_name: "classId" },
      };

      const result = handleFeeStructureError(prismaError);

      expect(result.code).toBe(FeeStructureErrorCode.INVALID_CLASS_ID);
    });

    it("should handle generic Error", () => {
      const error = new Error("Generic error message");

      const result = handleFeeStructureError(error);

      expect(result.code).toBe(FeeStructureErrorCode.DATABASE_ERROR);
      expect(result.message).toBe("Generic error message");
    });

    it("should handle unknown errors", () => {
      const result = handleFeeStructureError("unknown error");

      expect(result.code).toBe(FeeStructureErrorCode.DATABASE_ERROR);
      expect(result.message).toBe("An unexpected error occurred");
    });
  });

  describe("Error Factory Functions", () => {
    it("should create no classes selected error", () => {
      const error = createNoClassesSelectedError();

      expect(error.code).toBe(FeeStructureErrorCode.NO_CLASSES_SELECTED);
      expect(error.field).toBe("classIds");
    });

    it("should create invalid class ID error", () => {
      const error = createInvalidClassIdError("class-123");

      expect(error.code).toBe(FeeStructureErrorCode.INVALID_CLASS_ID);
      expect(error.field).toBe("classIds");
      expect(error.details).toEqual({ classId: "class-123" });
    });

    it("should create duplicate class association error", () => {
      const error = createDuplicateClassAssociationError("class-123");

      expect(error.code).toBe(FeeStructureErrorCode.DUPLICATE_CLASS_ASSOCIATION);
      expect(error.field).toBe("classIds");
      expect(error.details).toEqual({ classId: "class-123" });
    });

    it("should create invalid academic year error", () => {
      const error = createInvalidAcademicYearError("ay-2025");

      expect(error.code).toBe(FeeStructureErrorCode.INVALID_ACADEMIC_YEAR);
      expect(error.field).toBe("academicYearId");
      expect(error.details).toEqual({ academicYearId: "ay-2025" });
    });

    it("should create invalid date range error", () => {
      const error = createInvalidDateRangeError();

      expect(error.code).toBe(FeeStructureErrorCode.INVALID_DATE_RANGE);
      expect(error.field).toBe("validFrom");
    });

    it("should create no fee items error", () => {
      const error = createNoFeeItemsError();

      expect(error.code).toBe(FeeStructureErrorCode.NO_FEE_ITEMS);
      expect(error.field).toBe("items");
    });

    it("should create invalid amount error", () => {
      const error = createInvalidAmountError("amount");

      expect(error.code).toBe(FeeStructureErrorCode.INVALID_AMOUNT);
      expect(error.field).toBe("amount");
    });

    it("should create template cannot be active error", () => {
      const error = createTemplateCannotBeActiveError();

      expect(error.code).toBe(FeeStructureErrorCode.TEMPLATE_CANNOT_BE_ACTIVE);
      expect(error.field).toBe("isTemplate");
    });

    it("should create duplicate class amount error", () => {
      const error = createDuplicateClassAmountError("class-123");

      expect(error.code).toBe(FeeStructureErrorCode.DUPLICATE_CLASS_AMOUNT);
      expect(error.field).toBe("classAmounts");
      expect(error.details).toEqual({ classId: "class-123" });
    });

    it("should create class not found error", () => {
      const error = createClassNotFoundError("class-123");

      expect(error.code).toBe(FeeStructureErrorCode.CLASS_NOT_FOUND);
      expect(error.field).toBe("classIds");
      expect(error.details).toEqual({ classId: "class-123" });
    });

    it("should create fee structure not found error", () => {
      const error = createFeeStructureNotFoundError("fs-123");

      expect(error.code).toBe(FeeStructureErrorCode.FEE_STRUCTURE_NOT_FOUND);
      expect(error.details).toEqual({ feeStructureId: "fs-123" });
    });

    it("should create fee type not found error", () => {
      const error = createFeeTypeNotFoundError("ft-123");

      expect(error.code).toBe(FeeStructureErrorCode.FEE_TYPE_NOT_FOUND);
      expect(error.details).toEqual({ feeTypeId: "ft-123" });
    });

    it("should create unauthorized error", () => {
      const error = createUnauthorizedError("Custom message");

      expect(error.code).toBe(FeeStructureErrorCode.UNAUTHORIZED);
      expect(error.message).toBe("Custom message");
    });

    it("should create unauthorized error with default message", () => {
      const error = createUnauthorizedError();

      expect(error.code).toBe(FeeStructureErrorCode.UNAUTHORIZED);
      expect(error.message).toBe("Unauthorized access");
    });
  });

  describe("formatFeeStructureErrorMessage", () => {
    it("should format error message from error code", () => {
      const error = {
        code: FeeStructureErrorCode.NO_CLASSES_SELECTED,
        message: "Custom message",
      };

      const formatted = formatFeeStructureErrorMessage(error);

      expect(formatted).toBe(
        FeeStructureErrorMessages[FeeStructureErrorCode.NO_CLASSES_SELECTED]
      );
    });

    it("should fallback to error message if code not found", () => {
      const error = {
        code: "UNKNOWN_CODE" as FeeStructureErrorCode,
        message: "Custom message",
      };

      const formatted = formatFeeStructureErrorMessage(error);

      expect(formatted).toBe("Custom message");
    });
  });

  describe("isRetryableFeeStructureError", () => {
    it("should identify database errors as retryable", () => {
      const error = {
        code: FeeStructureErrorCode.DATABASE_ERROR,
        message: "Database error",
      };

      expect(isRetryableFeeStructureError(error)).toBe(true);
    });

    it("should identify validation errors as not retryable", () => {
      const error = {
        code: FeeStructureErrorCode.VALIDATION_ERROR,
        message: "Validation error",
      };

      expect(isRetryableFeeStructureError(error)).toBe(false);
    });

    it("should identify unauthorized errors as not retryable", () => {
      const error = {
        code: FeeStructureErrorCode.UNAUTHORIZED,
        message: "Unauthorized",
      };

      expect(isRetryableFeeStructureError(error)).toBe(false);
    });
  });
});
