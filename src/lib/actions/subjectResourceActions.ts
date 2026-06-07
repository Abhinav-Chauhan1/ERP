"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getRequiredSchoolId } from "@/lib/utils/school-context-helper";

async function getTeacherId(userId: string, schoolId: string) {
  const t = await db.teacher.findFirst({
    where: { user: { id: userId }, schoolId },
    select: { id: true },
  });
  if (!t) throw new Error("Teacher not found");
  return t.id;
}

async function canAccessSubject(teacherId: string, subjectId: string, schoolId: string) {
  const [st, sc] = await Promise.all([
    db.subjectTeacher.findFirst({ where: { teacherId, subjectId, schoolId }, select: { id: true } }),
    db.subjectClass.findFirst({ where: { teacherId, subjectId, schoolId }, select: { id: true } }),
  ]);
  return !!(st || sc);
}

/** Get all resources (SyllabusDocuments) for a subject */
export async function getSubjectResources(subjectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const schoolId = await getRequiredSchoolId();

    const docs = await db.syllabusDocument.findMany({
      where: { subjectId, schoolId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        filename: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        order: true,
        createdAt: true,
        uploadedBy: true,
      },
    });

    return { success: true, data: docs };
  } catch (error) {
    console.error("Error fetching subject resources:", error);
    return { success: false, error: "Failed to fetch resources" };
  }
}

/** Save a resource that was already uploaded to R2 */
export async function saveSubjectResource(input: {
  subjectId: string;
  title: string;
  description?: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const schoolId = await getRequiredSchoolId();
    const teacherId = await getTeacherId(session.user.id, schoolId);

    if (!(await canAccessSubject(teacherId, input.subjectId, schoolId))) {
      return { success: false, error: "Access denied" };
    }

    const maxOrder = await db.syllabusDocument.findFirst({
      where: { subjectId: input.subjectId, schoolId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const doc = await db.syllabusDocument.create({
      data: {
        subjectId: input.subjectId,
        schoolId,
        title: input.title,
        description: input.description,
        filename: input.filename,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        fileSize: input.fileSize,
        order: (maxOrder?.order ?? -1) + 1,
        uploadedBy: teacherId,
      },
    });

    revalidatePath(`/teacher/teaching/subjects/${input.subjectId}`);
    return { success: true, data: doc };
  } catch (error) {
    console.error("Error saving subject resource:", error);
    return { success: false, error: "Failed to save resource" };
  }
}

/** Delete a resource */
export async function deleteSubjectResource(resourceId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const schoolId = await getRequiredSchoolId();

    const doc = await db.syllabusDocument.findUnique({
      where: { id: resourceId },
      select: { id: true, subjectId: true, schoolId: true, fileUrl: true },
    });

    if (!doc || doc.schoolId !== schoolId) {
      return { success: false, error: "Resource not found" };
    }

    await db.syllabusDocument.delete({ where: { id: resourceId } });
    revalidatePath(`/teacher/teaching/subjects/${doc.subjectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting subject resource:", error);
    return { success: false, error: "Failed to delete resource" };
  }
}
