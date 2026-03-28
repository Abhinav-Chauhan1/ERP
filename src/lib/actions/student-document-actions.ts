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
 * Get the current student — single auth call, returns schoolId from session.
 */
async function getCurrentStudent() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, student: { select: { id: true, schoolId: true } } },
  });

  if (!dbUser || dbUser.role !== UserRole.STUDENT) return null;

  const schoolId = (session.user as any).schoolId as string | undefined;

  return { dbUser, student: dbUser.student, schoolId };
}

/**
 * Get student documents — single auth call, school-scoped, parallel queries.
 */
export async function getStudentDocuments() {
  const result = await getCurrentStudent();
  if (!result) redirect("/login");

  const { dbUser, schoolId } = result;

  // All three queries in parallel, scoped to school
  const [documentTypes, personalDocuments, rawSchoolDocuments] = await Promise.all([
    db.documentType.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { name: 'asc' },
    }),
    db.document.findMany({
      where: { userId: dbUser.id, ...(schoolId ? { schoolId } : {}) },
      include: { documentType: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.document.findMany({
      where: { isPublic: true, ...(schoolId ? { schoolId } : {}) },
      include: {
        documentType: true,
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const schoolDocuments = rawSchoolDocuments.map(doc => ({
    ...doc,
    user: { ...doc.user, firstName: doc.user.firstName || '', lastName: doc.user.lastName || '' },
  }));

  return { user: dbUser, documentTypes, personalDocuments, schoolDocuments };
}

/**
 * Upload a document
 */
export async function uploadDocument(values: DocumentUploadValues) {
  const result = await getCurrentStudent();
  if (!result) return { success: false, message: "Authentication required" };

  const { dbUser, student, schoolId } = result;

  try {
    const validatedData = documentUploadSchema.parse(values);

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
        schoolId: schoolId || student?.schoolId || '',
      },
    });

    revalidatePath("/student/documents");
    return { success: true, message: "Document uploaded successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message };
    return { success: false, message: "Failed to upload document" };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string) {
  const result = await getCurrentStudent();
  if (!result) return { success: false, message: "Authentication required" };

  const { dbUser } = result;

  try {
    const document = await db.document.findUnique({ where: { id: documentId } });
    if (!document) return { success: false, message: "Document not found" };
    if (document.userId !== dbUser.id) return { success: false, message: "You can only delete your own documents" };

    await db.document.delete({ where: { id: documentId } });
    revalidatePath("/student/documents");
    return { success: true, message: "Document deleted successfully" };
  } catch {
    return { success: false, message: "Failed to delete document" };
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
