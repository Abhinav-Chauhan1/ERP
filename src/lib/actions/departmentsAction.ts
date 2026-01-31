"use server";

import { db } from "@/lib/db";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";

export async function removeTeacherFromDepartment(teacherId: string, departmentId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    // Verify the teacher and department belong to the school
    const teacher = await db.teacher.findFirst({
      where: {
        userId: teacherId,
        schoolId,
      },
      include: {
        user: true
      }
    });

    if (!teacher || teacher.user.role !== "TEACHER") {
      throw new Error("Teacher not found or access denied");
    }

    const department = await db.department.findFirst({
      where: {
        id: departmentId,
        schoolId
      }
    });

    if (!department) {
      throw new Error("Department not found or access denied");
    }

    // Remove teacher from department - disconnect the relation
    const teacherRecord = await db.teacher.findFirst({
      where: { userId: teacherId, schoolId }
    });
    
    if (teacherRecord) {
      await db.teacher.update({
        where: { id: teacherRecord.id },
        data: {
          departments: {
            disconnect: { id: departmentId }
          }
        }
      });
    }

    revalidatePath(`/admin/users/teachers/${teacherId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error removing teacher from department:", error);
    throw error;
  }
}

export async function assignTeacherToDepartment(teacherId: string, departmentId: string) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, error: "School context required" };

    // Verify the teacher and department belong to the school
    const teacher = await db.teacher.findFirst({
      where: {
        userId: teacherId,
        schoolId,
      },
      include: {
        user: true
      }
    });

    if (!teacher || teacher.user.role !== "TEACHER") {
      throw new Error("Teacher not found or access denied");
    }

    const department = await db.department.findFirst({
      where: {
        id: departmentId,
        schoolId
      }
    });

    if (!department) {
      throw new Error("Department not found or access denied");
    }

    // Check if already assigned
    const existing = await db.teacher.findFirst({
      where: {
        userId: teacherId,
        schoolId,
        departments: {
          some: { id: departmentId }
        }
      }
    });

    if (existing) {
      throw new Error("Teacher is already assigned to this department");
    }

    // Assign teacher to department - connect the relation
    const teacherToUpdate = await db.teacher.findFirst({
      where: { userId: teacherId, schoolId }
    });
    
    if (teacherToUpdate) {
      await db.teacher.update({
        where: { id: teacherToUpdate.id },
        data: {
          departments: {
            connect: { id: departmentId }
          }
        }
      });
    }

    revalidatePath(`/admin/users/teachers/${teacherId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error assigning teacher to department:", error);
    throw error;
  }
}