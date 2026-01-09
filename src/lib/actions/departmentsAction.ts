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

// Assign teacher to department
export async function assignTeacherToDepartment(teacherId: string, departmentId: string) {
  try {
    // Check if already assigned
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        departments: {
          where: { id: departmentId }
        }
      }
    });

    if (teacher?.departments.length) {
      return { success: false, error: "Teacher is already assigned to this department" };
    }

    await db.teacher.update({
      where: { id: teacherId },
      data: {
        departments: {
          connect: { id: departmentId }
        }
      }
    });

    revalidatePath("/admin/academic/departments");
    revalidatePath(`/admin/users/teachers/${teacherId}`);
    return { success: true };
  } catch (error) {
    console.error("Error assigning teacher to department:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign teacher to department"
    };
  }
}

// Remove teacher from department
export async function removeTeacherFromDepartment(teacherId: string, departmentId: string) {
  try {
    await db.teacher.update({
      where: { id: teacherId },
      data: {
        departments: {
          disconnect: { id: departmentId }
        }
      }
    });

    revalidatePath("/admin/academic/departments");
    revalidatePath(`/admin/users/teachers/${teacherId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing teacher from department:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove teacher from department"
    };
  }
}

// Get available departments for a teacher (departments not already assigned)
export async function getAvailableDepartmentsForTeacher(teacherId: string) {
  try {
    // Get departments already assigned to this teacher
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        departments: {
          select: { id: true }
        }
      }
    });

    const assignedDepartmentIds = teacher?.departments.map(d => d.id) || [];

    // Get departments not assigned to this teacher
    const availableDepartments = await db.department.findMany({
      where: {
        id: {
          notIn: assignedDepartmentIds
        }
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: availableDepartments };
  } catch (error) {
    console.error("Error fetching available departments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available departments"
    };
  }
}

// Get available teachers for a department (teachers not already assigned)
export async function getAvailableTeachersForDepartment(departmentId: string) {
  try {
    // Get teachers not assigned to this department
    const availableTeachers = await db.teacher.findMany({
      where: {
        departments: {
          none: {
            id: departmentId
          }
        },
        user: {
          active: true
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    const formattedTeachers = availableTeachers.map(t => ({
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
      email: t.user.email,
      avatar: t.user.avatar,
      employeeId: t.employeeId,
    }));

    return { success: true, data: formattedTeachers };
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available teachers"
    };
  }
}

// Get available subjects for a department (subjects not already in department)
export async function getAvailableSubjectsForDepartment(departmentId: string) {
  try {
    const availableSubjects = await db.subject.findMany({
      where: {
        OR: [
          { departmentId: null },
          { departmentId: { not: departmentId } }
        ]
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: availableSubjects };
  } catch (error) {
    console.error("Error fetching available subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available subjects"
    };
  }
}

// Assign subject to department
export async function assignSubjectToDepartment(subjectId: string, departmentId: string) {
  try {
    await db.subject.update({
      where: { id: subjectId },
      data: {
        departmentId: departmentId
      }
    });

    revalidatePath("/admin/academic/departments");
    revalidatePath("/admin/teaching/subjects");
    return { success: true };
  } catch (error) {
    console.error("Error assigning subject to department:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign subject to department"
    };
  }
}

// Remove subject from department
export async function removeSubjectFromDepartment(subjectId: string) {
  try {
    await db.subject.update({
      where: { id: subjectId },
      data: {
        departmentId: null
      }
    });

    revalidatePath("/admin/academic/departments");
    revalidatePath("/admin/teaching/subjects");
    return { success: true };
  } catch (error) {
    console.error("Error removing subject from department:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove subject from department"
    };
  }
}
