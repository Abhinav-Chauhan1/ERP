"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { withSchoolAuthAction } from "../auth/security-wrapper";

// Type definitions for better type safety
interface ModuleWithProgress {
  id: string;
  title: string;
  order: number;
  chapterNumber: number;
  term: string | null;
  subModules: SubModuleWithProgress[];
}

interface SubModuleWithProgress {
  id: string;
  title: string;
  progress: { completed: boolean }[];
}

interface SubjectClassWithClass {
  id: string;
  class: {
    id: string;
    name: string;
  };
}

interface SyllabusWithModules {
  id: string;
  title: string;
  modules: ModuleWithProgress[];
}

interface SubjectWithRelations {
  id: string;
  name: string;
  code: string;
  description: string | null;
  syllabus: SyllabusWithModules[];
  classes: SubjectClassWithClass[];
}

/**
 * Get all subjects taught by the current teacher
 */
export const getTeacherSubjects = withSchoolAuthAction(async (schoolId, userId) => {
  try {
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
        schoolId
      },
      select: { id: true },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const subjectTeachers = await db.subjectTeacher.findMany({
      where: {
        teacherId: teacher.id,
        schoolId
      },
      include: {
        subject: {
          include: {
            syllabus: {
              where: {
                status: "PUBLISHED",
                isActive: true,
                schoolId
              },
              include: {
                modules: {
                  where: { schoolId },
                  orderBy: { order: 'asc' },
                  include: {
                    subModules: {
                      where: { schoolId },
                      include: {
                        progress: {
                          where: {
                            teacherId: teacher.id,
                            schoolId
                          }
                        }
                      }
                    }
                  }
                },
              },
            },
            classes: {
              where: { schoolId },
              include: {
                class: true
              },
            },
          },
        },
      },
    });

    const subjects = subjectTeachers.map((st) => {
      // Use the most recent published syllabus or the first one
      const activeSyllabus = st.subject.syllabus[0];

      const allModules = activeSyllabus?.modules || [];
      const allSubModules = allModules.flatMap((m: ModuleWithProgress) => m.subModules);

      const totalTopics = allSubModules.length;
      const completedTopics = allSubModules.filter((sm: SubModuleWithProgress) => sm.progress.some((p: { completed: boolean }) => p.completed)).length;
      const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      const classes = st.subject.classes.map((sc: SubjectClassWithClass) => ({
        id: sc.class.id,
        name: sc.class.name,
        section: "",
      }));

      const totalStudents = classes.length * 20;

      return {
        id: st.subject.id,
        name: st.subject.name,
        code: st.subject.code,
        grade: classes.map((c: { name: string }) => c.name).join(", "),
        sections: ["A", "B"],
        totalStudents,
        totalClasses: classes.length,
        completedClasses: 0,
        totalTopics,
        completedTopics,
        progress,
        syllabus: activeSyllabus ? [{
          id: activeSyllabus.id,
          title: activeSyllabus.title,
          modules: activeSyllabus.modules.map((m: ModuleWithProgress) => {
            const moduleSubModules = m.subModules;
            const moduleTotal = moduleSubModules.length;
            const moduleCompleted = moduleSubModules.filter((sm: SubModuleWithProgress) => sm.progress.some((p: { completed: boolean }) => p.completed)).length;

            return {
              id: m.id,
              title: m.title,
              order: m.order,
              chapterNumber: m.chapterNumber,
              term: m.term,
              totalTopics: moduleTotal,
              completedTopics: moduleCompleted,
              subModules: m.subModules.map((sm: SubModuleWithProgress) => ({
                id: sm.id,
                title: sm.title,
                isCompleted: sm.progress.some((p: { completed: boolean }) => p.completed)
              })),
              status: moduleCompleted === moduleTotal && moduleTotal > 0 ? "completed" : moduleCompleted > 0 ? "in-progress" : "not-started",
              lastUpdated: new Date().toISOString(), // In real app, check progress updatedAt
            };
          }),
        }] : [],
        classes: classes,
      };
    });

    return { subjects };
  } catch (error) {
    console.error("Failed to fetch teacher subjects:", error);
    throw new Error("Failed to fetch subjects");
  }
});

/**
 * Get subject details by ID
 */
export const getTeacherSubjectDetails = withSchoolAuthAction(async (schoolId, userId, _userRole, subjectId: string) => {
  try {
    // Get the teacher record for the current user
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
        schoolId
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify that this teacher teaches this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId,
        schoolId
      },
    });

    if (!subjectTeacher) {
      throw new Error("Subject not found or not assigned to this teacher");
    }

    // Get subject details
    const subject = await db.subject.findFirst({
      where: {
        id: subjectId,
        schoolId
      },
      include: {
        department: true,
        syllabus: {
          where: { schoolId },
          include: {
            units: {
              where: { schoolId },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        classes: {
          where: { schoolId },
          include: {
            class: true,
          },
        },
        lessons: {
          where: { schoolId },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!subject) {
      throw new Error("Subject not found");
    }

    // Get classes where this subject is taught (optimized to prevent N+1 query)
    const classIds = subject.classes.map((sc: { class: { id: string } }) => sc.class.id);
    const allSections = await db.classSection.findMany({
      where: {
        classId: {
          in: classIds,
        },
        schoolId
      },
      select: {
        id: true,
        name: true,
        classId: true,
        enrollments: {
          where: { schoolId },
          select: {
            id: true,
          },
        },
      },
    });

    const classes = subject.classes.map((sc: { class: { id: string; name: string } }) => {
      const sections = allSections.filter((section: { classId: string }) => section.classId === sc.class.id);

      return {
        id: sc.class.id,
        name: sc.class.name,
        sections: sections.map((section: { id: string; name: string; enrollments: { id: string }[] }) => ({
          id: section.id,
          name: section.name,
          studentCount: section.enrollments.length,
        })),
        totalStudents: sections.reduce((sum: number, section: { enrollments: { id: string }[] }) => sum + section.enrollments.length, 0),
      };
    });

    // Transform the syllabus data
    const syllabusData = subject.syllabus.map((s: { id: string; title: string; description: string | null; units: { id: string; title: string; description: string | null; order: number }[] }) => ({
      id: s.id,
      title: s.title,
      description: s.description || "",
      document: "", // Not available in current schema
      units: s.units.map((u: { id: string; title: string; description: string | null; order: number }) => ({
        id: u.id,
        title: u.title,
        description: u.description || "",
        order: u.order,
        totalTopics: 8, // Simplified - would be tracked in the database
        completedTopics: Math.floor(Math.random() * 8), // Simplified - would be tracked in the database
        status: Math.random() > 0.7 ? "completed" : Math.random() > 0.3 ? "in-progress" : "not-started",
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      })),
    }));

    // Get recent lessons
    const recentLessons = subject.lessons.slice(0, 5).map((lesson: { id: string; title: string; description: string | null; syllabusUnitId: string | null; duration: number | null; createdAt: Date }) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      unit: lesson.syllabusUnitId || "",
      duration: lesson.duration || 45,
      createdAt: lesson.createdAt.toISOString(),
    }));

    // Calculate overall syllabus progress
    const allUnits = syllabusData.flatMap((s: { units: { totalTopics: number; completedTopics: number }[] }) => s.units);
    const totalTopics = allUnits.reduce((sum: number, unit: { totalTopics: number }) => sum + unit.totalTopics, 0);
    const completedTopics = allUnits.reduce((sum: number, unit: { completedTopics: number }) => sum + unit.completedTopics, 0);
    const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      department: subject.department?.name || "General",
      syllabus: syllabusData,
      classes: classes,
      recentLessons,
      progress,
      totalTopics,
      completedTopics,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch subject details:", error);
    throw new Error("Failed to fetch subject details");
  }
});

// Update syllabus sub-module progress
export const updateSubModuleProgress = withSchoolAuthAction(async (schoolId, userId, _userRole, subModuleId: string, completed: boolean) => {
  try {
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
        schoolId
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Toggle or set progress
    if (completed) {
      await db.subModuleProgress.upsert({
        where: {
          subModuleId_teacherId: {
            subModuleId,
            teacherId: teacher.id
          }
        },
        create: {
          subModuleId,
          teacherId: teacher.id,
          completed: true,
          completedAt: new Date(),
          schoolId
        },
        update: {
          completed: true,
          completedAt: new Date(),
        }
      });
    } else {
      await db.subModuleProgress.deleteMany({
        where: {
          subModuleId,
          teacherId: teacher.id,
          schoolId
        }
      });
    }

    revalidatePath('/teacher/teaching/subjects');
    revalidatePath('/teacher/teaching/syllabus');

    return { success: true };
  } catch (error) {
    console.error("Failed to update syllabus progress:", error);
    throw new Error("Failed to update syllabus progress");
  }
});

/**
 * Get syllabus units for a specific subject
 */
export const getSubjectSyllabusUnits = withSchoolAuthAction(async (schoolId, userId, _userRole, subjectId: string) => {
  try {
    // Get the teacher record
    const teacher = await db.teacher.findFirst({
      where: {
        user: { id: userId },
        schoolId
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify teacher has access to this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId,
        schoolId
      },
    });

    if (!subjectTeacher) {
      throw new Error("Unauthorized access to this subject");
    }

    // Get the syllabus for this subject
    const syllabus = await db.syllabus.findFirst({
      where: {
        subjectId,
        schoolId
      },
      include: {
        units: {
          where: { schoolId },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Return the units or empty array if no syllabus found
    const units = syllabus?.units || [];

    return { units };
  } catch (error) {
    console.error("Failed to fetch syllabus units:", error);
    throw new Error("Failed to fetch syllabus units");
  }
});
// Legacy export alias for backward compatibility
export const updateSyllabusUnitProgress = updateSubModuleProgress;