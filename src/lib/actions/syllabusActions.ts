"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  SyllabusFormValues, 
  SyllabusUpdateFormValues,
  SyllabusUnitFormValues,
  SyllabusUnitUpdateFormValues,
  LessonFormValues,
  LessonUpdateFormValues
} from "../schemaValidation/syllabusSchemaValidations";
import { uploadToCloudinary, getResourceType } from "@/lib/cloudinary";

// Get all subjects for dropdown
export async function getSubjectsForDropdown() {
  try {
    const subjects = await db.subject.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        code: true,
      }
    });
    
    return { success: true, data: subjects };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch subjects" 
    };
  }
}

// Get syllabus by subject ID
export async function getSyllabusBySubject(subjectId: string) {
  try {
    const syllabus = await db.syllabus.findFirst({
      where: { 
        subjectId: subjectId 
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          }
        },
        units: {
          orderBy: {
            order: 'asc',
          },
          include: {
            lessons: true
          }
        }
      }
    });
    
    if (!syllabus) {
      return { success: true, data: null };
    }
    
    return { success: true, data: syllabus };
  } catch (error) {
    console.error("Error fetching syllabus:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch syllabus" 
    };
  }
}

// Create a new syllabus
export async function createSyllabus(data: SyllabusFormValues, file?: File | null) {
  try {
    // Check if a syllabus already exists for this subject
    const existingSyllabus = await db.syllabus.findFirst({
      where: { subjectId: data.subjectId }
    });

    if (existingSyllabus) {
      return { 
        success: false, 
        error: "A syllabus already exists for this subject" 
      };
    }

    // Upload file to Cloudinary if provided
    let documentUrl = data.document;
    if (file) {
      const resourceType = getResourceType(file.type);
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'syllabus',
        resource_type: resourceType,
        publicId: `${data.subjectId}_syllabus`
      });
      
      if (uploadResult.secure_url) {
        documentUrl = uploadResult.secure_url;
      }
    }

    const syllabus = await db.syllabus.create({
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        document: documentUrl,
      }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: syllabus };
  } catch (error) {
    console.error("Error creating syllabus:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create syllabus" 
    };
  }
}

// Update an existing syllabus
export async function updateSyllabus(data: SyllabusUpdateFormValues, file?: File | null) {
  try {
    // Upload file to Cloudinary if provided
    let documentUrl = data.document;
    if (file) {
      const resourceType = getResourceType(file.type);
      const uploadResult = await uploadToCloudinary(file, {
        folder: 'syllabus',
        resource_type: resourceType,
        publicId: `${data.subjectId}_syllabus_${Date.now()}`
      });
      
      if (uploadResult.secure_url) {
        documentUrl = uploadResult.secure_url;
      }
    }

    const syllabus = await db.syllabus.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        document: documentUrl,
      }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: syllabus };
  } catch (error) {
    console.error("Error updating syllabus:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update syllabus" 
    };
  }
}

// Delete a syllabus
export async function deleteSyllabus(id: string) {
  try {
    // This will cascade delete all related units and lessons
    await db.syllabus.delete({
      where: { id }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true };
  } catch (error) {
    console.error("Error deleting syllabus:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete syllabus" 
    };
  }
}

// Create a new syllabus unit
export async function createSyllabusUnit(data: SyllabusUnitFormValues) {
  try {
    const unit = await db.syllabusUnit.create({
      data: {
        title: data.title,
        description: data.description,
        syllabusId: data.syllabusId,
        order: data.order,
      }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: unit };
  } catch (error) {
    console.error("Error creating syllabus unit:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create syllabus unit" 
    };
  }
}

// Update an existing syllabus unit
export async function updateSyllabusUnit(data: SyllabusUnitUpdateFormValues) {
  try {
    const unit = await db.syllabusUnit.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        syllabusId: data.syllabusId,
      }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: unit };
  } catch (error) {
    console.error("Error updating syllabus unit:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update syllabus unit" 
    };
  }
}

// Delete a syllabus unit
export async function deleteSyllabusUnit(id: string) {
  try {
    // This will cascade delete all related lessons
    await db.syllabusUnit.delete({
      where: { id }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true };
  } catch (error) {
    console.error("Error deleting syllabus unit:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete syllabus unit" 
    };
  }
}

// Create a new lesson
export async function createLesson(data: LessonFormValues) {
  try {
    const lesson = await db.lesson.create({
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        syllabusUnitId: data.syllabusUnitId,
        content: data.content,
        resources: data.resources,
        duration: data.duration,
      }
    });
    
    revalidatePath("/admin/academic/syllabus");
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
    const lesson = await db.lesson.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        syllabusUnitId: data.syllabusUnitId,
        content: data.content,
        resources: data.resources,
        duration: data.duration,
      }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true, data: lesson };
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
    await db.lesson.delete({
      where: { id }
    });
    
    revalidatePath("/admin/academic/syllabus");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete lesson" 
    };
  }
}

// Get maximum order for a syllabus
export async function getMaxUnitOrder(syllabusId: string) {
  try {
    const result = await db.syllabusUnit.findMany({
      where: { syllabusId: syllabusId },
      orderBy: { order: 'desc' },
      take: 1,
      select: { order: true }
    });
    
    const maxOrder = result.length > 0 ? result[0].order : 0;
    return { success: true, data: maxOrder };
  } catch (error) {
    console.error("Error fetching max unit order:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch max unit order" 
    };
  }
}
