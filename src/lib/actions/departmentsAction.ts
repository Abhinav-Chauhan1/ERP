"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { DepartmentFormValues, DepartmentUpdateFormValues } from "../schemaValidation/departmentsSchemaValidation";

// Get all departments with related counts
export async function getDepartments() {
  try {
    const departments = await db.department.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            subjects: true,
            teachers: true,
          }
        }
      }
    });
    
    return { success: true, data: departments };
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch departments" 
    };
  }
}

// Get a single department by ID with related subjects and teachers
export async function getDepartmentById(id: string) {
  try {
    const department = await db.department.findUnique({
      where: { id },
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        teachers: {
          select: {
            id: true,
            employeeId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              }
            }
          }
        },
      }
    });
    
    if (!department) {
      return { success: false, error: "Department not found" };
    }
    
    return { success: true, data: department };
  } catch (error) {
    console.error("Error fetching department:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch department" 
    };
  }
}

// Create a new department
export async function createDepartment(data: DepartmentFormValues) {
  try {
    // Check if department name already exists
    const existingDepartment = await db.department.findFirst({
      where: { 
        name: { 
          equals: data.name,
          mode: 'insensitive' // Case insensitive search
        } 
      }
    });

    if (existingDepartment) {
      return { success: false, error: "A department with this name already exists" };
    }

    const department = await db.department.create({
      data: {
        name: data.name,
        description: data.description,
      }
    });
    
    revalidatePath("/admin/academic/departments");
    return { success: true, data: department };
  } catch (error) {
    console.error("Error creating department:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create department" 
    };
  }
}

// Update an existing department
export async function updateDepartment(data: DepartmentUpdateFormValues) {
  try {
    // Check if department name already exists for another department
    const existingDepartment = await db.department.findFirst({
      where: { 
        name: { 
          equals: data.name,
          mode: 'insensitive' // Case insensitive search
        },
        id: { not: data.id }
      }
    });

    if (existingDepartment) {
      return { success: false, error: "A department with this name already exists" };
    }

    const department = await db.department.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
      }
    });
    
    revalidatePath("/admin/academic/departments");
    return { success: true, data: department };
  } catch (error) {
    console.error("Error updating department:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update department" 
    };
  }
}

// Delete a department
export async function deleteDepartment(id: string) {
  try {
    // Check if department has any subjects or teachers
    const hasSubjects = await db.subject.findFirst({ where: { departmentId: id } });
    const hasTeachers = await db.teacher.findFirst({ 
      where: { 
        departments: {
          some: {
            id: id
          }
        } 
      } 
    });
    
    if (hasSubjects || hasTeachers) {
      return {
        success: false,
        error: "Cannot delete this department because it has associated subjects or teachers. Remove them first."
      };
    }
    
    // Delete the department
    await db.department.delete({
      where: { id }
    });
    
    revalidatePath("/admin/academic/departments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting department:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete department" 
    };
  }
}
