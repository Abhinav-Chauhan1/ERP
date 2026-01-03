"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  uploadDocumentSchema,
  bulkUploadDocumentsSchema,
  updateDocumentMetadataSchema,
  reorderDocumentsSchema,
  fileTypeValidationSchema,
  isValidFileType,
  getFileTypeErrorMessage,
  MAX_FILE_SIZE,
  type UploadDocumentFormValues,
  type BulkUploadDocumentsFormValues,
  type UpdateDocumentMetadataFormValues,
  type ReorderDocumentsFormValues,
  type FileTypeValidationFormValues,
} from "@/lib/schemaValidation/syllabusDocumentSchemaValidations";
import { getCloudinaryPublicId, deleteFromCloudinary, getResourceType } from "@/lib/cloudinary";
import {
  requireModifyAccess,
  requireViewAccess,
  formatAuthError,
} from "@/lib/utils/syllabus-authorization";

// Types for document operations (exported for use in components)
export type UploadDocumentInput = UploadDocumentFormValues;
export type BulkUploadDocumentsInput = BulkUploadDocumentsFormValues;
export type UpdateDocumentMetadataInput = UpdateDocumentMetadataFormValues;
export type ReorderDocumentsInput = ReorderDocumentsFormValues;
export type FileTypeValidationInput = FileTypeValidationFormValues;

// Response type
interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

// Response type for bulk operations
interface BulkUploadResponse {
  success: boolean;
  data?: {
    successful: any[];
    failed: Array<{ filename: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
  error?: string;
}

/**
 * Validates file type and size
 * Requirements: 3.4
 */
export async function validateFileType(
  input: FileTypeValidationInput
): Promise<ActionResponse<{ valid: boolean; message?: string }>> {
  try {
    // Validate input with Zod schema
    const validationResult = fileTypeValidationSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
        code: "VALIDATION_ERROR",
      };
    }

    const { fileType, fileSize } = validationResult.data;

    // Check file type
    if (!isValidFileType(fileType)) {
      return {
        success: true,
        data: {
          valid: false,
          message: getFileTypeErrorMessage(fileType),
        },
      };
    }

    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        success: true,
        data: {
          valid: false,
          message: "File size exceeds maximum limit of 50MB",
        },
      };
    }

    return {
      success: true,
      data: {
        valid: true,
      },
    };
  } catch (error) {
    console.error("Error validating file type:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to validate file type",
      code: "VALIDATION_ERROR",
    };
  }
}

/**
 * Upload a single document with Cloudinary integration
 * Requirements: 3.1, 3.2, 3.4, 4.1, 4.2
 * Authorization: Admin only
 */
export async function uploadDocument(
  input: UploadDocumentInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can upload documents
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = uploadDocumentSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
        code: "VALIDATION_ERROR",
      };
    }

    const validatedData = validationResult.data;

    // Validate file type and size
    const fileValidation = await validateFileType({
      fileType: validatedData.fileType,
      fileSize: validatedData.fileSize,
    });

    if (!fileValidation.success || !fileValidation.data?.valid) {
      return {
        success: false,
        error: fileValidation.data?.message || "Invalid file type or size",
        code: "INVALID_FILE_TYPE",
      };
    }

    // Check if parent (module or sub-module) exists
    if (validatedData.moduleId) {
      const parentModule = await db.module.findUnique({
        where: { id: validatedData.moduleId },
      });

      if (!parentModule) {
        return {
          success: false,
          error: "Module not found",
          code: "PARENT_NOT_FOUND",
        };
      }
    }

    if (validatedData.subModuleId) {
      const subModule = await db.subModule.findUnique({
        where: { id: validatedData.subModuleId },
      });

      if (!subModule) {
        return {
          success: false,
          error: "Sub-module not found",
          code: "PARENT_NOT_FOUND",
        };
      }
    }

    // Determine the order if not provided
    let order = validatedData.order;
    if (order === undefined) {
      // Get the highest order value for the parent
      const existingDocuments = await db.syllabusDocument.findMany({
        where: validatedData.moduleId
          ? { moduleId: validatedData.moduleId }
          : { subModuleId: validatedData.subModuleId },
        orderBy: { order: "desc" },
        take: 1,
      });

      order = existingDocuments.length > 0 ? existingDocuments[0].order + 1 : 0;
    }

    // Use filename as title if title is not provided (Requirement 4.2)
    const title = validatedData.title || validatedData.filename;

    // Create the document
    const document = await db.syllabusDocument.create({
      data: {
        title,
        description: validatedData.description || null,
        filename: validatedData.filename,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        order,
        moduleId: validatedData.moduleId || null,
        subModuleId: validatedData.subModuleId || null,
        uploadedBy: validatedData.uploadedBy,
      },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    return {
      success: true,
      data: document,
    };
  } catch (error) {
    console.error("Error uploading document:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload document",
      code: "UPLOAD_ERROR",
    };
  }
}

/**
 * Bulk upload multiple documents
 * Requirements: 9.1, 9.3, 9.4
 * Authorization: Admin only
 */
export async function bulkUploadDocuments(
  input: BulkUploadDocumentsInput
): Promise<BulkUploadResponse> {
  try {
    // Check authorization - only admins can upload documents
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return {
        success: false,
        error: authResult.error || "Authorization failed",
      };
    }

    // Validate input with Zod schema
    const validationResult = bulkUploadDocumentsSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
      };
    }

    const { documents } = validationResult.data;

    const successful: any[] = [];
    const failed: Array<{ filename: string; error: string }> = [];

    // Process each document individually (Requirement 9.4: continue on individual failures)
    for (const docInput of documents) {
      try {
        const result = await uploadDocument(docInput);

        if (result.success && result.data) {
          successful.push(result.data);
        } else {
          failed.push({
            filename: docInput.filename,
            error: result.error || "Unknown error",
          });
        }
      } catch (error) {
        // Continue processing remaining files even if one fails
        failed.push({
          filename: docInput.filename,
          error: error instanceof Error ? error.message : "Failed to upload document",
        });
      }
    }

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    return {
      success: true,
      data: {
        successful,
        failed,
        summary: {
          total: documents.length,
          successful: successful.length,
          failed: failed.length,
        },
      },
    };
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk upload documents",
    };
  }
}

/**
 * Update document metadata (title and description)
 * Requirements: 4.4
 * Authorization: Admin only
 */
export async function updateDocumentMetadata(
  input: UpdateDocumentMetadataInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can update documents
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = updateDocumentMetadataSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
        code: "VALIDATION_ERROR",
      };
    }

    const validatedData = validationResult.data;

    // Check if document exists
    const existingDocument = await db.syllabusDocument.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };
    }

    // Update only metadata, preserve the file (Requirement 4.4)
    const updatedDocument = await db.syllabusDocument.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
      },
    });

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    return {
      success: true,
      data: updatedDocument,
    };
  } catch (error) {
    console.error("Error updating document metadata:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update document metadata",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Delete a document with storage cleanup
 * Requirements: 3.6
 * Authorization: Admin only
 */
export async function deleteDocument(id: string): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can delete documents
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    if (!id) {
      return {
        success: false,
        error: "Document ID is required",
        code: "VALIDATION_ERROR",
      };
    }

    // Check if document exists
    const document = await db.syllabusDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };
    }

    // Extract public ID from Cloudinary URL
    const publicId = getCloudinaryPublicId(document.fileUrl);

    // Delete from database first
    await db.syllabusDocument.delete({
      where: { id },
    });

    // Attempt to delete from Cloudinary storage (Requirement 3.6)
    if (publicId) {
      try {
        const resourceType = getResourceType(document.fileType);
        await deleteFromCloudinary(publicId, resourceType);
      } catch (storageError) {
        // Log the error but don't fail the operation since DB record is already deleted
        console.error("Failed to delete file from storage:", storageError);
        // Return success with a warning
        return {
          success: true,
          data: {
            deletedCount: 1,
            warning: "Document deleted from database but file removal from storage failed"
          },
        };
      }
    }

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    return {
      success: true,
      data: { deletedCount: 1 },
    };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete document",
      code: "DELETE_ERROR",
    };
  }
}

/**
 * Reorder documents within a module or sub-module
 * Requirements: 4.5
 * Authorization: Admin only
 */
export async function reorderDocuments(
  input: ReorderDocumentsInput
): Promise<ActionResponse> {
  try {
    // Check authorization - only admins can reorder documents
    const authResult = await requireModifyAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    // Validate input with Zod schema
    const validationResult = reorderDocumentsSchema.safeParse(input);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errors,
        code: "VALIDATION_ERROR",
      };
    }

    const validatedData = validationResult.data;

    // Validate that all documents belong to the parent
    const documentIds = validatedData.documentOrders.map((d) => d.id);
    const whereClause =
      validatedData.parentType === "module"
        ? { id: { in: documentIds }, moduleId: validatedData.parentId }
        : { id: { in: documentIds }, subModuleId: validatedData.parentId };

    const documents = await db.syllabusDocument.findMany({
      where: whereClause,
    });

    if (documents.length !== documentIds.length) {
      return {
        success: false,
        error: `Some documents do not belong to this ${validatedData.parentType}`,
        code: "INVALID_PARENT",
      };
    }

    // Update all documents in a transaction
    await db.$transaction(
      validatedData.documentOrders.map((documentOrder) =>
        db.syllabusDocument.update({
          where: { id: documentOrder.id },
          data: {
            order: documentOrder.order,
          },
        })
      )
    );

    revalidatePath("/admin/academic/syllabus");
    revalidatePath("/teacher");
    revalidatePath("/student");

    return {
      success: true,
      data: { updatedCount: validatedData.documentOrders.length },
    };
  } catch (error) {
    console.error("Error reordering documents:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reorder documents",
      code: "REORDER_ERROR",
    };
  }
}

/**
 * Get all documents for a module or sub-module
 * Requirements: 3.3, 5.3, 6.3
 * Authorization: All authenticated users (admin, teacher, student)
 */
export async function getDocumentsByParent(
  parentId: string,
  parentType: "module" | "subModule"
): Promise<ActionResponse> {
  try {
    // Check authorization - all authenticated users can view documents
    const authResult = await requireViewAccess();
    if (!authResult.authorized) {
      return formatAuthError(authResult);
    }

    if (!parentId) {
      return {
        success: false,
        error: `${parentType === "module" ? "Module" : "Sub-module"} ID is required`,
        code: "VALIDATION_ERROR",
      };
    }

    // Fetch documents ordered by order field
    const whereClause =
      parentType === "module"
        ? { moduleId: parentId }
        : { subModuleId: parentId };

    const documents = await db.syllabusDocument.findMany({
      where: whereClause,
      orderBy: { order: "asc" },
    });

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch documents",
      code: "FETCH_ERROR",
    };
  }
}
