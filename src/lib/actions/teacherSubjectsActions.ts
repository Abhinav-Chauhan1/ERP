"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Get all subjects taught by the current teacher
 */
export async function getTeacherSubjects() {
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
      select: {
        id: true,
      },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get all subjects taught by this teacher
    const subjectTeachers = await db.subjectTeacher.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        subject: {
          include: {
            syllabus: {
              include: {
                units: true,
              },
            },
            classes: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    // Transform data for the frontend
    const subjects = subjectTeachers.map((st) => {
      // Calculate progress based on syllabus units
      const allUnits = st.subject.syllabus.flatMap(s => s.units) || [];
      const totalTopics = allUnits.length;
      const completedTopics = 0; // In a real app, track this in the database
      const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Get classes where this subject is taught
      const classes = st.subject.classes.map(sc => ({
        id: sc.class.id,
        name: sc.class.name,
        section: "", // This would come from class sections in a real implementation
      }));

      // Count total students (simplified - would need a more complex query in reality)
      const totalStudents = classes.length * 20; // Assuming average 20 students per class

      return {
        id: st.subject.id,
        name: st.subject.name,
        code: st.subject.code,
        grade: classes.map(c => c.name).join(", "),
        sections: ["A", "B"], // This would come from class sections in a real implementation
        totalStudents,
        totalClasses: classes.length,
        completedClasses: Math.floor(classes.length * 0.6), // Simplified calculation
        totalTopics,
        completedTopics,
        progress,
        syllabus: st.subject.syllabus.map(s => ({
          id: s.id,
          title: s.title,
          units: s.units.map(u => ({
            id: u.id,
            title: u.title,
            order: u.order,
            totalTopics: 8, // Simplified - would be tracked in the database
            completedTopics: Math.floor(Math.random() * 8), // Simplified - would be tracked in the database
            status: Math.random() > 0.7 ? "completed" : Math.random() > 0.3 ? "in-progress" : "not-started",
            lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          })),
        })),
        classes: classes,
      };
    });

    return { subjects };
  } catch (error) {
    console.error("Failed to fetch teacher subjects:", error);
    throw new Error("Failed to fetch subjects");
  }
}

/**
 * Get subject details by ID
 */
export async function getTeacherSubjectDetails(subjectId: string) {
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
      },
    });

    if (!subjectTeacher) {
      throw new Error("Subject not found or not assigned to this teacher");
    }

    // Get subject details
    const subject = await db.subject.findUnique({
      where: {
        id: subjectId,
      },
      include: {
        department: true,
        syllabus: {
          include: {
            units: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
        lessons: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!subject) {
      throw new Error("Subject not found");
    }

    // Get classes where this subject is taught
    const classes = await Promise.all(subject.classes.map(async (sc) => {
      const sections = await db.classSection.findMany({
        where: {
          classId: sc.class.id,
        },
        select: {
          id: true,
          name: true,
          enrollments: {
            select: {
              id: true,
            },
          },
        },
      });

      return {
        id: sc.class.id,
        name: sc.class.name,
        sections: sections.map(section => ({
          id: section.id,
          name: section.name,
          studentCount: section.enrollments.length,
        })),
        totalStudents: sections.reduce((sum, section) => sum + section.enrollments.length, 0),
      };
    }));

    // Transform the syllabus data
    const syllabusData = subject.syllabus.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description || "",
      document: s.document || "",
      units: s.units.map(u => ({
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
    const recentLessons = subject.lessons.slice(0, 5).map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || "",
      unit: lesson.syllabusUnitId || "",
      duration: lesson.duration || 45,
      createdAt: lesson.createdAt.toISOString(),
    }));

    // Calculate overall syllabus progress
    const allUnits = syllabusData.flatMap(s => s.units);
    const totalTopics = allUnits.reduce((sum, unit) => sum + unit.totalTopics, 0);
    const completedTopics = allUnits.reduce((sum, unit) => sum + unit.completedTopics, 0);
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
}

/**
 * Update syllabus unit progress
 */
export async function updateSyllabusUnitProgress(unitId: string, completedTopics: number) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // In a real app, you would update a progress tracking table
    // For now, we'll just return success
    
    revalidatePath('/teacher/teaching/subjects');
    revalidatePath('/teacher/teaching/syllabus');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update syllabus progress:", error);
    throw new Error("Failed to update syllabus progress");
  }
}

/**
 * Get syllabus units for a specific subject
 */
export async function getSubjectSyllabusUnits(subjectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the teacher record
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

    // Verify teacher has access to this subject
    const subjectTeacher = await db.subjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId,
      },
    });

    if (!subjectTeacher) {
      throw new Error("Unauthorized access to this subject");
    }

    // Get the syllabus for this subject
    const syllabus = await db.syllabus.findFirst({
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

    // Return the units or empty array if no syllabus found
    const units = syllabus?.units || [];

    return { units };
  } catch (error) {
    console.error("Failed to fetch syllabus units:", error);
    throw new Error("Failed to fetch syllabus units");
  }
}
