"use server";

import { db } from "@/lib/db";
import {
  documentSchema,
  documentTypeSchema,
  documentFilterSchema,
  type DocumentData,
  type DocumentTypeData,
  type DocumentFilterData
} from "@/lib/schemaValidation/documentSchemaValidation";
import { revalidatePath } from "next/cache";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Document Type Actions
export async function getDocumentTypes() {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: [] };

    const documentTypes = await db.documentType.findMany({
      where: { schoolId },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    return { success: true, data: documentTypes };
  } catch (error) {
    console.error("Failed to fetch document types:", error);
    return { success: false, error: "Failed to fetch document types", data: [] };
  }
}

export async function getDocumentType(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const documentType = await db.documentType.findUnique({
      where: { id, schoolId },
      include: {
        documents: true,
      },
    });

    if (!documentType) {
      return { success: false, error: "Document type not found", data: null };
    }

    return { success: true, data: documentType };
  } catch (error) {
    console.error(`Failed to fetch document type with ID ${id}:`, error);
    return { success: false, error: "Failed to fetch document type", data: null };
  }
}

export async function createDocumentType(data: DocumentTypeData) {
  try {
    // Validate the data
    const validatedData = documentTypeSchema.parse(data);

    // Create the document type
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const documentType = await db.documentType.create({
      data: {
        schoolId,
        name: validatedData.name,
        description: validatedData.description,
      },
    });

    revalidatePath("/admin/documents");
    return { success: true, data: documentType };
  } catch (error) {
    console.error("Failed to create document type:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Failed to create document type", data: null };
  }
}

export async function updateDocumentType(id: string, data: DocumentTypeData) {
  try {
    // Validate the data
    const validatedData = documentTypeSchema.parse(data);

    // Check if the document type exists
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const existingDocumentType = await db.documentType.findUnique({
      where: { id, schoolId },
    });

    if (!existingDocumentType) {
      return { success: false, error: "Document type not found", data: null };
    }

    // Update the document type
    const updatedDocumentType = await db.documentType.update({
      where: { id, schoolId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
    });

    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/types/${id}`);
    return { success: true, data: updatedDocumentType };
  } catch (error) {
    console.error(`Failed to update document type with ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Failed to update document type", data: null };
  }
}

export async function deleteDocumentType(id: string) {
  try {
    // Check if the document type exists
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const existingDocumentType = await db.documentType.findUnique({
      where: { id, schoolId },
      include: {
        documents: true,
      },
    });

    if (!existingDocumentType) {
      return { success: false, error: "Document type not found", data: null };
    }

    // Check if there are documents associated with this type
    if (existingDocumentType.documents.length > 0) {
      return {
        success: false,
        error: "Cannot delete document type with associated documents. Remove or reassign the documents first.",
        data: null
      };
    }

    // Delete the document type
    await db.documentType.delete({
      where: { id, schoolId },
    });

    revalidatePath("/admin/documents");
    return { success: true, data: null };
  } catch (error) {
    console.error(`Failed to delete document type with ID ${id}:`, error);
    return { success: false, error: "Failed to delete document type", data: null };
  }
}

// Document Actions
export async function getDocuments(filter?: DocumentFilterData) {
  try {
    // Validate the filter if provided
    let validatedFilter = {};
    if (filter) {
      validatedFilter = documentFilterSchema.parse(filter);
    }

    // Construct the database query based on filter
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: [] };
    const where: any = { schoolId };

    if (filter?.documentTypeId) {
      where.documentTypeId = filter.documentTypeId;
    }

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.isPublic !== undefined) {
      where.isPublic = filter.isPublic;
    }

    if (filter?.searchTerm) {
      where.OR = [
        { title: { contains: filter.searchTerm, mode: 'insensitive' } },
        { description: { contains: filter.searchTerm, mode: 'insensitive' } },
        { fileName: { contains: filter.searchTerm, mode: 'insensitive' } },
        { tags: { contains: filter.searchTerm, mode: 'insensitive' } },
      ];
    }

    // Query the database
    const documents = await db.document.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documentType: true,
      },
    });

    return { success: true, data: documents };
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return { success: false, error: "Failed to fetch documents", data: [] };
  }
}

export async function getDocument(id: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const document = await db.document.findUnique({
      where: { id, schoolId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        documentType: true,
      },
    });

    if (!document) {
      return { success: false, error: "Document not found", data: null };
    }

    return { success: true, data: document };
  } catch (error) {
    console.error(`Failed to fetch document with ID ${id}:`, error);
    return { success: false, error: "Failed to fetch document", data: null };
  }
}

export async function createDocument(data: DocumentData) {
  try {
    // Validate the data
    const validatedData = documentSchema.parse(data);

    // Verify user exists before creating document
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const userExists = await db.user.findUnique({
      where: {
        id: validatedData.userId
      }
    });

    if (!userExists) {
      return {
        success: false,
        error: "User not found. Cannot create document with invalid user ID.",
        data: null
      };
    }

    // Create the document
    const document = await db.document.create({
      data: {
        schoolId,
        title: validatedData.title,
        description: validatedData.description,
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        userId: validatedData.userId,
        documentTypeId: validatedData.documentTypeId,
        isPublic: validatedData.isPublic,
        tags: validatedData.tags,
      },
    });

    revalidatePath("/admin/documents");
    return { success: true, data: document };
  } catch (error) {
    console.error("Failed to create document:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Failed to create document", data: null };
  }
}

export async function updateDocument(id: string, data: DocumentData) {
  try {
    // Validate the data
    const validatedData = documentSchema.parse(data);

    // Check if the document exists
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const existingDocument = await db.document.findUnique({
      where: { id, schoolId },
    });

    if (!existingDocument) {
      return { success: false, error: "Document not found", data: null };
    }

    // Update the document
    const updatedDocument = await db.document.update({
      where: { id, schoolId },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        documentTypeId: validatedData.documentTypeId,
        isPublic: validatedData.isPublic,
        tags: validatedData.tags,
      },
    });

    revalidatePath("/admin/documents");
    revalidatePath(`/admin/documents/${id}`);
    return { success: true, data: updatedDocument };
  } catch (error) {
    console.error(`Failed to update document with ID ${id}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Failed to update document", data: null };
  }
}

export async function deleteDocument(id: string) {
  try {
    // Check if the document exists
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: null };

    const existingDocument = await db.document.findUnique({
      where: { id, schoolId },
    });

    if (!existingDocument) {
      return { success: false, error: "Document not found", data: null };
    }

    // Delete the document
    await db.document.delete({
      where: { id, schoolId },
    });

    revalidatePath("/admin/documents");
    return { success: true, data: null };
  } catch (error) {
    console.error(`Failed to delete document with ID ${id}:`, error);
    return { success: false, error: "Failed to delete document", data: null };
  }
}

export async function getRecentDocuments(limit: number = 5) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required", data: [] };

    const documents = await db.document.findMany({
      where: { schoolId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        documentType: true,
      },
    });

    return { success: true, data: documents };
  } catch (error) {
    console.error("Failed to fetch recent documents:", error);
    return { success: false, error: "Failed to fetch recent documents", data: [] };
  }
}
