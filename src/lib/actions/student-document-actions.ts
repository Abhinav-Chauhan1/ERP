"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Schema for document upload
const documentUploadSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  documentTypeId: z.string().min(1, { message: "Please select a document type" }),
  fileName: z.string().min(1, { message: "File name is required" }),
  fileUrl: z.string().url({ message: "Valid file URL is required" }),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  isPublic: z.boolean().default(false),
  tags: z.string().optional(),
});

type DocumentUploadValues = z.infer<typeof documentUploadSchema>;

/**
 * Get the current student
 */
async function getCurrentStudent() {
  const session = await auth();
  const clerkUser = session?.user;

  if (!clerkUser) {
    return null;
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    return null;
  }

  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  return { student, dbUser };
}

/**
 * Get student documents
 */
export async function getStudentDocuments() {
  const result = await getCurrentStudent();

  if (!result) {
    redirect("/login");
  }

  const { dbUser } = result;

  // Get document types
  const documentTypes = await db.documentType.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // Get student's personal documents
  const personalDocuments = await db.document.findMany({
    where: {
      userId: dbUser.id
    },
    include: {
      documentType: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get school documents (public)
  const rawSchoolDocuments = await db.document.findMany({
    where: {
      isPublic: true
    },
    include: {
      documentType: true,
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  // Transform school documents to ensure firstName and lastName are strings
  const schoolDocuments = rawSchoolDocuments.map(doc => ({
    ...doc,
    user: {
      ...doc.user,
      firstName: doc.user.firstName || '',
      lastName: doc.user.lastName || '',
    }
  }));

  return {
    user: dbUser,
    documentTypes,
    personalDocuments,
    schoolDocuments
  };
}

/**
 * Upload a document
 */
export async function uploadDocument(values: DocumentUploadValues) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  const { dbUser, student } = result;

  try {
    // Validate data
    const validatedData = documentUploadSchema.parse(values);

    // Create document record
    await db.document.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        isPublic: validatedData.isPublic,
        tags: validatedData.tags,
        userId: dbUser.id,
        documentTypeId: validatedData.documentTypeId,
        schoolId: student?.schoolId || '', // Add required schoolId
      }
    });

    revalidatePath("/student/documents");
    return { success: true, message: "Document uploaded successfully" };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid document data"
      };
    }

    return {
      success: false,
      message: "Failed to upload document"
    };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  const { dbUser } = result;

  try {
    // Find the document
    const document = await db.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return { success: false, message: "Document not found" };
    }

    // Ensure it belongs to the student
    if (document.userId !== dbUser.id) {
      return { success: false, message: "You can only delete your own documents" };
    }

    // Delete the document
    await db.document.delete({
      where: { id: documentId }
    });

    revalidatePath("/student/documents");
    return { success: true, message: "Document deleted successfully" };

  } catch (error) {
    return {
      success: false,
      message: "Failed to delete document"
    };
  }
}

/**
 * Get document categories
 */
export async function getDocumentCategories() {
  // Verify the user is a student
  const result = await getCurrentStudent();

  if (!result) {
    redirect("/login");
  }

  const categories = await db.documentType.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return categories;
}
