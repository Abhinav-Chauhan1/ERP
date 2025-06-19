"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for validating parent-student association
const associationSchema = z.object({
  parentId: z.string().min(1, "Parent ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  isPrimary: z.boolean().default(false)
});

export async function associateStudentWithParent(formData: FormData) {
  const parentId = formData.get('parentId') as string;
  const studentId = formData.get('studentId') as string;
  const isPrimary = formData.get('isPrimary') === 'true';
  
  try {
    // Validate the data
    const validatedData = associationSchema.parse({
      parentId,
      studentId,
      isPrimary
    });
    
    // Check if student exists
    const student = await db.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      return { success: false, message: "Student not found" };
    }
    
    // Check if parent exists
    const parent = await db.parent.findUnique({
      where: { id: parentId }
    });
    
    if (!parent) {
      return { success: false, message: "Parent not found" };
    }
    
    // Check if association already exists
    const existingAssociation = await db.studentParent.findFirst({
      where: {
        studentId,
        parentId
      }
    });
    
    if (existingAssociation) {
      return { success: false, message: "This student is already associated with this parent" };
    }
    
    // If making this primary, update any existing primary relations for this parent
    if (isPrimary) {
      await db.studentParent.updateMany({
        where: {
          parentId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }
    
    // Create the association
    await db.studentParent.create({
      data: {
        studentId,
        parentId,
        isPrimary
      }
    });
    
    // Revalidate the parent detail page
    revalidatePath(`/admin/users/parents/${parentId}`);
    
    return { success: true, message: "Student successfully associated with parent" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    
    console.error("Error associating student with parent:", error);
    return { success: false, message: "Failed to associate student with parent" };
  }
}

export async function removeStudentFromParent(formData: FormData) {
  const parentId = formData.get('parentId') as string;
  const studentId = formData.get('studentId') as string;
  
  try {
    // Find the association
    const association = await db.studentParent.findFirst({
      where: {
        parentId,
        studentId
      }
    });
    
    if (!association) {
      return { success: false, message: "Association not found" };
    }
    
    // Delete the association
    await db.studentParent.delete({
      where: {
        id: association.id
      }
    });
    
    // Revalidate the parent detail page
    revalidatePath(`/admin/users/parents/${parentId}`);
    
    return { success: true, message: "Student successfully removed from parent" };
  } catch (error) {
    console.error("Error removing student from parent:", error);
    return { success: false, message: "Failed to remove student from parent" };
  }
}
