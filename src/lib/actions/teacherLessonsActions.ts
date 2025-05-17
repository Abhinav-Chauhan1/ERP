"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema for creating a lesson
const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  syllabusUnitId: z.string().optional(),
  content: z.string().optional(),
  resources: z.string().optional(),
  duration: z.coerce.number().min(1, "Duration is required").optional(),
});

/**
 * Get all lessons taught by the teacher
 */
export async function getTeacherLessons(subjectId?: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record for the current user
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get subjects taught by this teacher
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: {
        teacherId: teacher.id,
        ...(subjectId ? { subjectId } : {}),
      },
      select: {
        subjectId: true,
      },
    });

    const subjectIds = subjectTeachers.map(st => st.subjectId);

    if (subjectIds.length === 0) {
      return { lessons: [] };
    }

    // Get lessons for these subjects
    const lessons = await db.lesson.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
      },
      include: {
        subject: true,
        syllabusUnit: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform lessons for frontend
    const transformedLessons = lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      subject: lesson.subject.name,
      subjectId: lesson.subjectId,
      unit: lesson.syllabusUnit?.title || "Not assigned",
      unitId: lesson.syllabusUnitId,
      content: lesson.content || "",
      resources: lesson.resources || "",
      duration: lesson.duration || 0,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    }));

    return { lessons: transformedLessons };
  } catch (error) {
    console.error("Failed to fetch teacher lessons:", error);
    throw new Error("Failed to fetch lessons");
  }
}

/**
 * Get a specific lesson by ID
 */
export async function getTeacherLesson(lessonId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record for the current user
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get the lesson
    const lesson = await db.lesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        subject: true,
        syllabusUnit: {
          include: {
            syllabus: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Verify the teacher teaches this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: lesson.subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("You are not authorized to view this lesson");
    }

    // Get other lessons from the same subject for navigation
    const relatedLessons = await db.lesson.findMany({
      where: {
        subjectId: lesson.subjectId,
        id: {
          not: lesson.id,
        },
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
      },
    });

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      subject: lesson.subject.name,
      subjectId: lesson.subjectId,
      unit: lesson.syllabusUnit?.title || "Not assigned",
      unitId: lesson.syllabusUnitId,
      syllabus: lesson.syllabusUnit?.syllabus?.title || "Not assigned",
      content: lesson.content || "",
      resources: lesson.resources?.split(",") || [],
      duration: lesson.duration || 0,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
      relatedLessons,
    };
  } catch (error) {
    console.error("Failed to fetch lesson details:", error);
    throw new Error("Failed to fetch lesson details");
  }
}

/**
 * Create a new lesson
 */
export async function createLesson(formData: FormData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Parse and validate form data
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      subjectId: formData.get("subjectId") as string,
      syllabusUnitId: formData.get("syllabusUnitId") as string || undefined,
      content: formData.get("content") as string,
      resources: formData.get("resources") as string,
      duration: parseInt(formData.get("duration") as string) || 0,
    };

    const validatedData = lessonSchema.parse(data);

    // Get the teacher record for the current user
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify the teacher teaches this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: validatedData.subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("You are not authorized to create lessons for this subject");
    }

    // Create the lesson
    const lesson = await db.lesson.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        subjectId: validatedData.subjectId,
        syllabusUnitId: validatedData.syllabusUnitId || null,
        content: validatedData.content,
        resources: validatedData.resources,
        duration: validatedData.duration,
      },
    });

    revalidatePath("/teacher/teaching/lessons");
    revalidatePath(`/teacher/teaching/subjects/${validatedData.subjectId}`);

    return { success: true, lessonId: lesson.id };
  } catch (error) {
    console.error("Failed to create lesson:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create lesson" };
  }
}

/**
 * Update an existing lesson
 */
export async function updateLesson(lessonId: string, formData: FormData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Parse and validate form data
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      subjectId: formData.get("subjectId") as string,
      syllabusUnitId: formData.get("syllabusUnitId") as string || undefined,
      content: formData.get("content") as string,
      resources: formData.get("resources") as string,
      duration: parseInt(formData.get("duration") as string) || 0,
    };

    const validatedData = lessonSchema.parse(data);

    // Get the teacher record for the current user
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify the teacher teaches this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: validatedData.subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("You are not authorized to update lessons for this subject");
    }

    // Get the current lesson
    const lesson = await db.lesson.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Update the lesson
    await db.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        subjectId: validatedData.subjectId,
        syllabusUnitId: validatedData.syllabusUnitId || null,
        content: validatedData.content,
        resources: validatedData.resources,
        duration: validatedData.duration,
      },
    });

    revalidatePath("/teacher/teaching/lessons");
    revalidatePath(`/teacher/teaching/lessons/${lessonId}`);
    revalidatePath(`/teacher/teaching/subjects/${validatedData.subjectId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update lesson:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to update lesson" };
  }
}

/**
 * Delete a lesson
 */
export async function deleteLesson(lessonId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record for the current user
    const teacher = await db.teacher.findFirst({
      where: {
        user: {
          clerkId: userId,
        },
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get the lesson
    const lesson = await db.lesson.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Verify the teacher teaches this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: lesson.subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("You are not authorized to delete this lesson");
    }

    // Delete the lesson
    await db.lesson.delete({
      where: {
        id: lessonId,
      },
    });

    revalidatePath("/teacher/teaching/lessons");
    revalidatePath(`/teacher/teaching/subjects/${lesson.subjectId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    return { success: false, error: "Failed to delete lesson" };
  }
}

/**
 * Get syllabus units for a subject
 */
export async function getSubjectSyllabusUnits(subjectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the syllabus units for this subject
    const syllabus = await db.syllabus.findMany({
      where: {
        subjectId,
      },
      include: {
        units: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    const units = syllabus.flatMap(s => s.units.map(unit => ({
      id: unit.id,
      title: unit.title,
      syllabusTitle: s.title,
    })));

    return { units };
  } catch (error) {
    console.error("Failed to fetch syllabus units:", error);
    throw new Error("Failed to fetch syllabus units");
  }
}
