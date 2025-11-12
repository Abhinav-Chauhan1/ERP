"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

/**
 * Schema for document filters
 */
const documentFilterSchema = z.object({
  childId: z.string(),
  category: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  searchTerm: z.string().optional(),
});

type DocumentFilter = z.infer<typeof documentFilterSchema>;

/**
 * Helper function to get current parent and verify authentication
 */
async function getCurrentParent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  const dbUser = await db.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  });
  
  if (!dbUser || dbUser.role !== UserRole.PARENT) {
    return null;
  }
  
  const parent = await db.parent.findUnique({
    where: {
      userId: dbUser.id
    }
  });
  
  return parent;
}

/**
 * Helper function to verify parent-child relationship
 */
async function verifyParentChildRelationship(
  parentId: string,
  childId: string
): Promise<boolean> {
  const relationship = await db.studentParent.findFirst({
    where: { parentId, studentId: childId }
  });
  return !!relationship;
}

/**
 * Get documents for a child with optional filtering
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export async function getDocuments(filters: DocumentFilter) {
  try {
    // Validate input
    const validated = documentFilterSchema.parse(filters);
    
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: [] };
    }
    
    // Verify parent-child relationship
    const hasAccess = await verifyParentChildRelationship(parent.id, validated.childId);
    if (!hasAccess) {
      return { success: false, message: "Access denied", data: [] };
    }
    
    // Get student user ID
    const student = await db.student.findUnique({
      where: { id: validated.childId },
      select: { userId: true }
    });
    
    if (!student) {
      return { success: false, message: "Student not found", data: [] };
    }
    
    // Build query filters
    const where: any = {
      userId: student.userId
    };
    
    // Add category filter
    if (validated.category) {
      where.documentType = {
        name: validated.category
      };
    }
    
    // Add date range filter
    if (validated.startDate || validated.endDate) {
      where.createdAt = {};
      if (validated.startDate) {
        where.createdAt.gte = validated.startDate;
      }
      if (validated.endDate) {
        where.createdAt.lte = validated.endDate;
      }
    }
    
    // Add search filter
    if (validated.searchTerm) {
      where.OR = [
        { title: { contains: validated.searchTerm, mode: 'insensitive' } },
        { description: { contains: validated.searchTerm, mode: 'insensitive' } },
        { fileName: { contains: validated.searchTerm, mode: 'insensitive' } },
      ];
    }
    
    // Fetch documents
    const documents = await db.document.findMany({
      where,
      include: {
        documentType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: documents };
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.errors[0].message || "Invalid filter data",
        data: []
      };
    }
    return { success: false, message: "Failed to fetch documents", data: [] };
  }
}

/**
 * Download a document with signed URL generation
 * Requirements: 7.2, 7.3
 */
export async function downloadDocument(documentId: string) {
  try {
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", url: null };
    }
    
    // Get document
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        user: {
          include: {
            student: true
          }
        }
      }
    });
    
    if (!document) {
      return { success: false, message: "Document not found", url: null };
    }
    
    // Verify parent has access to this document
    if (document.user.student) {
      const hasAccess = await verifyParentChildRelationship(
        parent.id, 
        document.user.student.id
      );
      if (!hasAccess) {
        return { success: false, message: "Access denied", url: null };
      }
    } else {
      return { success: false, message: "Document not associated with a student", url: null };
    }
    
    // Return the file URL (in production, this would be a signed URL)
    return { 
      success: true, 
      url: document.fileUrl,
      fileName: document.fileName,
      fileType: document.fileType
    };
  } catch (error) {
    console.error("Failed to download document:", error);
    return { success: false, message: "Failed to download document", url: null };
  }
}

/**
 * Preview a document for supported file types
 * Requirements: 7.2
 */
export async function previewDocument(documentId: string) {
  try {
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: null };
    }
    
    // Get document
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        documentType: true,
        user: {
          include: {
            student: true
          }
        }
      }
    });
    
    if (!document) {
      return { success: false, message: "Document not found", data: null };
    }
    
    // Verify parent has access to this document
    if (document.user.student) {
      const hasAccess = await verifyParentChildRelationship(
        parent.id, 
        document.user.student.id
      );
      if (!hasAccess) {
        return { success: false, message: "Access denied", data: null };
      }
    } else {
      return { success: false, message: "Document not associated with a student", data: null };
    }
    
    // Check if file type is previewable (PDF, images)
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const isPreviewable = document.fileType && 
      previewableTypes.includes(document.fileType.toLowerCase());
    
    return { 
      success: true, 
      data: {
        id: document.id,
        title: document.title,
        description: document.description,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileSize: document.fileSize,
        isPreviewable,
        documentType: document.documentType,
        createdAt: document.createdAt
      }
    };
  } catch (error) {
    console.error("Failed to preview document:", error);
    return { success: false, message: "Failed to preview document", data: null };
  }
}

/**
 * Get document categories/types
 * Requirements: 7.1
 */
export async function getDocumentCategories() {
  try {
    // Get current parent
    const parent = await getCurrentParent();
    if (!parent) {
      return { success: false, message: "Unauthorized", data: [] };
    }
    
    const categories = await db.documentType.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to fetch document categories:", error);
    return { success: false, message: "Failed to fetch categories", data: [] };
  }
}
