"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { LessonFormValues, LessonUpdateFormValues } from "../schemaValidation/lessonsSchemaValidation";

// Get all lessons with expanded relationships
export async function getLessons() {
  try {
    const lessons = await db.lesson.findMany({
      include: {
        subject: true,
        syllabusUnit: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data for the UI
    const formattedLessons = await Promise.all(lessons.map(async (lesson) => {
      // Get classes associated with the subject
      const subjectClasses = await db.subjectClass.findMany({
        where: { subjectId: lesson.subjectId },
        include: { class: true },
      });
      
      const grades = subjectClasses.map(sc => sc.class.name);

      return {
        id: lesson.id,
        title: lesson.title,
        subject: {
          id: lesson.subject.id,
          name: lesson.subject.name,
          code: lesson.subject.code || "",
        },
        unit: lesson.syllabusUnit?.title || "Uncategorized",
        grades,
        duration: lesson.duration || 60,
        status: "active",
        resources: lesson.resources ? countResources(lesson.resources) : 0,
        description: lesson.description || "",
        content: lesson.content || "",
        syllabusUnitId: lesson.syllabusUnitId || "",
      };
    }));
    
    return { success: true, data: formattedLessons };
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch lessons" 
    };
  }
}

// Count resources from comma-separated string
function countResources(resourcesStr: string): number {
  if (!resourcesStr) return 0;
  return resourcesStr.split(',').filter(r => r.trim().length > 0).length;
}

// Get a single lesson by ID
export async function getLessonById(id: string) {
  try {
    const lesson = await db.lesson.findUnique({
      where: { id },
      include: {
        subject: true,
        syllabusUnit: true,
      }
    });
    
    if (!lesson) {
      return { success: false, error: "Lesson not found" };
    }
    
    // Get classes associated with the subject
    const subjectClasses = await db.subjectClass.findMany({
      where: { subjectId: lesson.subjectId },
      include: { class: true },
    });
    
    const grades = subjectClasses.map(sc => sc.class.name);
    
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      subject: {
        id: lesson.subject.id,
        name: lesson.subject.name,
        code: lesson.subject.code || "",
      },
      unit: lesson.syllabusUnit?.title || "Uncategorized",
      syllabusUnitId: lesson.syllabusUnitId || "",
      grades,
      duration: lesson.duration || 60,
      content: lesson.content || "",
      resources: lesson.resources || "",
      resourcesCount: lesson.resources ? countResources(lesson.resources) : 0,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
    
    return { success: true, data: formattedLesson };
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch lesson" 
    };
  }
}

// Get all subjects for the dropdown
export async function getSubjectsForLessons() {
  try {
    const subjects = await db.subject.findMany({
      include: {
        syllabus: {
          include: {
            units: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Transform data for UI
    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code || "",
      units: subject.syllabus.flatMap(syllabus => 
        syllabus.units.map(unit => ({
          id: unit.id,
          title: unit.title,
          order: unit.order,
        }))
      ).sort((a, b) => a.order - b.order),
    }));
    
    return { success: true, data: formattedSubjects };
  } catch (error) {
    console.error("Error fetching subjects for lessons:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch subjects" 
    };
  }
}

// Get syllabus units for a specific subject
export async function getSyllabusUnitsBySubject(subjectId: string) {
  try {
    const syllabusUnits = await db.syllabusUnit.findMany({
      where: {
        syllabus: {
          subjectId,
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
    
    return { success: true, data: syllabusUnits };
  } catch (error) {
    console.error("Error fetching syllabus units:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch syllabus units" 
    };
  }
}

// Create a new lesson
export async function createLesson(data: LessonFormValues) {
  try {
    // Check if subject exists
    const subject = await db.subject.findUnique({
      where: { id: data.subjectId }
    });

    if (!subject) {
      return { success: false, error: "Selected subject does not exist" };
    }

    // Process syllabusUnitId - set to null if "none"
    const syllabusUnitId = data.syllabusUnitId === "none" ? null : data.syllabusUnitId || null;

    // If syllabusUnitId is provided (and not "none"), validate it exists
    if (syllabusUnitId) {
      const syllabusUnit = await db.syllabusUnit.findUnique({
        where: { id: syllabusUnitId },
        include: { syllabus: true }
      });

      if (!syllabusUnit) {
        return { success: false, error: "Selected unit does not exist" };
      }

      // Ensure the unit belongs to the correct subject
      if (syllabusUnit.syllabus.subjectId !== data.subjectId) {
        return { success: false, error: "Selected unit does not belong to the selected subject" };
      }
    }

    const lesson = await db.lesson.create({
      data: {
        title: data.title,
        description: data.description || "",
        subjectId: data.subjectId,
        syllabusUnitId: syllabusUnitId,
        content: data.content || "",
        resources: data.resources || "",
        duration: data.duration || 60,
      }
    });
    
    revalidatePath("/admin/teaching/lessons");
    return { success: true, data: lesson };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create lesson" 
    };
  }
}

// Update an existing lesson
export async function updateLesson(data: LessonUpdateFormValues) {
  try {
    // Validate lesson exists
    const existingLesson = await db.lesson.findUnique({
      where: { id: data.id }
    });

    if (!existingLesson) {
      return { success: false, error: "Lesson not found" };
    }

    // Validate if subject exists
    const subject = await db.subject.findUnique({
      where: { id: data.subjectId }
    });

    if (!subject) {
      return { success: false, error: "Selected subject does not exist" };
    }

    // Process syllabusUnitId - set to null if "none"
    const syllabusUnitId = data.syllabusUnitId === "none" ? null : data.syllabusUnitId || null;

    // If syllabusUnitId is provided (and not "none"), validate it exists
    if (syllabusUnitId) {
      const syllabusUnit = await db.syllabusUnit.findUnique({
        where: { id: syllabusUnitId },
        include: { syllabus: true }
      });

      if (!syllabusUnit) {
        return { success: false, error: "Selected unit does not exist" };
      }

      // Ensure the unit belongs to the correct subject
      if (syllabusUnit.syllabus.subjectId !== data.subjectId) {
        return { success: false, error: "Selected unit does not belong to the selected subject" };
      }
    }

    const updatedLesson = await db.lesson.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || "",
        subjectId: data.subjectId,
        syllabusUnitId: syllabusUnitId,
        content: data.content || "",
        resources: data.resources || "",
        duration: data.duration || 60,
      }
    });
    
    revalidatePath("/admin/teaching/lessons");
    revalidatePath(`/admin/teaching/lessons/${data.id}`);
    return { success: true, data: updatedLesson };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update lesson" 
    };
  }
}

// Delete a lesson
export async function deleteLesson(id: string) {
  try {
    // Check if lesson exists
    const lesson = await db.lesson.findUnique({
      where: { id }
    });

    if (!lesson) {
      return { success: false, error: "Lesson not found" };
    }
    
    await db.lesson.delete({
      where: { id }
    });
    
    revalidatePath("/admin/teaching/lessons");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete lesson" 
    };
  }
}
