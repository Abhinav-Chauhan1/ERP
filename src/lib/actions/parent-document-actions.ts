"use server";

import { db } from "@/lib/db";
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
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

type DocumentFilter = z.infer<typeof documentFilterSchema>;

/**
 * Helper function to get current parent, verify authentication, and return schoolId.
 * Single auth round-trip using requireSchoolAccess.
 */
async function getCurrentParentWithSchool() {
  const { requireSchoolAccess } = await import('@/lib/auth/tenant');
  const { schoolId, userId } = await requireSchoolAccess();
  if (!schoolId || !userId) return null;

  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!dbUser || dbUser.role !== UserRole.PARENT) return null;

  const parent = await db.parent.findUnique({ where: { userId: dbUser.id } });
  if (!parent) return null;

  return { parent, schoolId };
}

/**
 * Get documents for a child with optional filtering
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export async function getDocuments(filters: DocumentFilter) {
  try {
    const validated = documentFilterSchema.parse(filters);

    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: [] };

    // Verify relationship and get student userId in one query
    const studentParent = await db.studentParent.findFirst({
      where: { parentId: ctx.parent.id, studentId: validated.childId, student: { schoolId: ctx.schoolId } },
      select: { student: { select: { userId: true } } },
    });
    if (!studentParent) return { success: false, message: "Access denied", data: [] };

    const where: any = { userId: studentParent.student.userId };
    if (validated.category) where.documentType = { name: validated.category };
    if (validated.startDate || validated.endDate) {
      where.createdAt = {};
      if (validated.startDate) where.createdAt.gte = validated.startDate;
      if (validated.endDate) where.createdAt.lte = validated.endDate;
    }
    if (validated.searchTerm) {
      where.OR = [
        { title: { contains: validated.searchTerm, mode: 'insensitive' } },
        { description: { contains: validated.searchTerm, mode: 'insensitive' } },
        { fileName: { contains: validated.searchTerm, mode: 'insensitive' } },
      ];
    }

    const skip = (validated.page - 1) * validated.limit;

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        include: { documentType: { select: { id: true, name: true, description: true } } },
        orderBy: { createdAt: 'desc' },
        take: validated.limit,
        skip,
      }),
      db.document.count({ where }),
    ]);

    return {
      success: true,
      data: documents,
      pagination: { total, page: validated.page, limit: validated.limit, totalPages: Math.ceil(total / validated.limit) },
    };
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message, data: [] };
    return { success: false, message: "Failed to fetch documents", data: [] };
  }
}

/**
 * Download a document with signed URL generation
 * Requirements: 7.2, 7.3
 */
export async function downloadDocument(documentId: string) {
  try {
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", url: null };

    const document = await db.document.findFirst({
      where: { id: documentId, schoolId: ctx.schoolId },
      include: { user: { include: { student: { select: { id: true } } } } },
    });
    if (!document) return { success: false, message: "Document not found", url: null };

    if (document.user.student) {
      const rel = await db.studentParent.findFirst({
        where: { parentId: ctx.parent.id, studentId: document.user.student.id },
      });
      if (!rel) return { success: false, message: "Access denied", url: null };
    } else {
      return { success: false, message: "Document not associated with a student", url: null };
    }

    return { success: true, url: document.fileUrl, fileName: document.fileName, fileType: document.fileType };
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
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: null };

    const document = await db.document.findFirst({
      where: { id: documentId, schoolId: ctx.schoolId },
      include: { documentType: true, user: { include: { student: { select: { id: true } } } } },
    });
    if (!document) return { success: false, message: "Document not found", data: null };

    if (document.user.student) {
      const rel = await db.studentParent.findFirst({
        where: { parentId: ctx.parent.id, studentId: document.user.student.id },
      });
      if (!rel) return { success: false, message: "Access denied", data: null };
    } else {
      return { success: false, message: "Document not associated with a student", data: null };
    }

    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const isPreviewable = !!document.fileType && previewableTypes.includes(document.fileType.toLowerCase());

    return {
      success: true,
      data: { id: document.id, title: document.title, description: document.description, fileName: document.fileName, fileUrl: document.fileUrl, fileType: document.fileType, fileSize: document.fileSize, isPreviewable, documentType: document.documentType, createdAt: document.createdAt },
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
    const ctx = await getCurrentParentWithSchool();
    if (!ctx) return { success: false, message: "Unauthorized", data: [] };

    const categories = await db.documentType.findMany({
      where: { schoolId: ctx.schoolId },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to fetch document categories:", error);
    return { success: false, message: "Failed to fetch categories", data: [] };
  }
}
