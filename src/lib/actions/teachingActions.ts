"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { SubjectFormValues, UpdateSubjectFormValues, LessonFormValues, UpdateLessonFormValues } from "../schemaValidation/teachingSchemaValidation";
import { withSchoolAuthAction } from "../auth/security-wrapper";

// Get teaching dashboard stats
export const getTeachingStats = withSchoolAuthAction(async (schoolId) => {
  try {
    const teacherCount = await db.teacher.count({
      where: {
        schoolId,
        user: { active: true }
      }
    });
    const classCount = await db.class.count({ where: { schoolId } });
    const subjectCount = await db.subject.count({ where: { schoolId } });
    const lessonCount = await db.lesson.count({ where: { schoolId } });

    return {
      success: true,
      data: {
        activeTeachers: teacherCount,
        totalClasses: classCount,
        subjects: subjectCount,
        lessons: lessonCount
      }
    };
  } catch (error) {
    console.error("Error fetching teaching stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teaching stats"
    };
  }
});

// Get all subjects with counts
export const getAllSubjects = withSchoolAuthAction(async (schoolId) => {
  try {
    const subjects = await db.subject.findMany({
      where: { schoolId },
      include: {
        department: true,
        _count: {
          select: {
            teachers: true,
            classes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
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
});

// Get subjects grouped by department
export const getSubjectsByDepartment = withSchoolAuthAction(async (schoolId) => {
  try {
    const departments = await db.department.findMany({
      where: { schoolId },
      include: {
        subjects: {
          include: {
            _count: {
              select: {
                teachers: true,
                classes: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: departments };
  } catch (error) {
    console.error("Error fetching subjects by department:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subjects by department"
    };
  }
});

// Get all departments
export const getDepartments = withSchoolAuthAction(async (schoolId) => {
  try {
    const departments = await db.department.findMany({
      where: { schoolId },
      orderBy: {
        name: 'asc'
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
});

// Get all classes
export const getClasses = withSchoolAuthAction(async (schoolId) => {
  try {
    const classes = await db.class.findMany({
      where: { schoolId },
      include: {
        academicYear: {
          select: {
            name: true,
            isCurrent: true
          }
        }
      },
      orderBy: [
        {
          academicYear: {
            isCurrent: 'desc'
          }
        },
        {
          name: 'asc'
        }
      ]
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes"
    };
  }
});

// Create a new subject
export const createSubject = withSchoolAuthAction(async (schoolId, userId, userRole, data: SubjectFormValues) => {
  try {
    // Check if subject code already exists
    const existingSubject = await db.subject.findFirst({
      where: {
        schoolId,
        code: {
          equals: data.code,
          mode: 'insensitive'
        }
      }
    });

    if (existingSubject) {
      return { success: false, error: "A subject with this code already exists" };
    }

    // Create the subject with class associations
    const subject = await db.subject.create({
      data: {
        schoolId,
        name: data.name,
        code: data.code,
        description: data.description,
        departmentId: data.departmentId,
        classes: {
          create: data.classIds.map(classId => ({
            class: { connect: { id: classId } }
          }))
        }
      }
    });

    revalidatePath("/admin/teaching");
    revalidatePath("/admin/teaching/subjects");
    return { success: true, data: subject };
  } catch (error) {
    console.error("Error creating subject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create subject"
    };
  }
});

// Get recent teaching activities
export const getRecentTeachingActivities = withSchoolAuthAction(async (schoolId, userId, userRole, limit = 5) => {
  try {
    // Get recent lessons
    const recentLessons = await db.lesson.findMany({
      where: { schoolId },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        subject: true
      }
    });

    // Get recent syllabi
    const recentSyllabi = await db.syllabus.findMany({
      where: {
        subject: {
          schoolId
        }
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        subject: true
      }
    });

    // Combine and sort activities
    const activities = [
      ...recentLessons.map(lesson => ({
        id: `lesson-${lesson.id}`,
        type: 'lesson',
        action: lesson.createdAt.getTime() === lesson.updatedAt.getTime() ? 'created' : 'updated',
        entityName: lesson.title,
        subjectName: lesson.subject.name,
        timestamp: lesson.updatedAt
      })),
      ...recentSyllabi.map(syllabus => ({
        id: `syllabus-${syllabus.id}`,
        type: 'syllabus',
        action: syllabus.createdAt.getTime() === syllabus.updatedAt.getTime() ? 'created' : 'updated',
        entityName: syllabus.title,
        subjectName: syllabus.subject.name,
        timestamp: syllabus.updatedAt
      }))
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return { success: true, data: activities };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch recent activities"
    };
  }
});
