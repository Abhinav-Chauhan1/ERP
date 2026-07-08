"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { withSchoolAuthAction } from "../auth/security-wrapper";
import { compareClassNames } from "@/lib/utils";

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
      where: { user: { id: userId }, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new Error("Teacher not found");
    const teacherId = teacher.id;

    // -----------------------------------------------------------------
    // 1. SubjectClass rows where teacherId = this teacher
    //    (these are the precise "subject in class/section" assignments)
    // -----------------------------------------------------------------
    const subjectClassRows = await db.subjectClass.findMany({
      where: { teacherId, schoolId },
      include: {
        subject: {
          include: {
            syllabus: {
              where: { status: "PUBLISHED", isActive: true, schoolId },
              include: {
                modules: {
                  where: { schoolId },
                  orderBy: { order: "asc" },
                  include: {
                    subModules: {
                      where: { schoolId },
                      include: {
                        progress: { where: { teacherId, schoolId } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ subject: { name: "asc" } }, { class: { name: "asc" } }],
    });

    // -----------------------------------------------------------------
    // 2. Also include subjects from SubjectTeacher (global assignment)
    //    that may not have SubjectClass rows yet
    // -----------------------------------------------------------------
    const subjectTeacherRows = await db.subjectTeacher.findMany({
      where: { teacherId, schoolId },
      include: {
        subject: {
          include: {
            syllabus: {
              where: { status: "PUBLISHED", isActive: true, schoolId },
              include: {
                modules: {
                  where: { schoolId },
                  orderBy: { order: "asc" },
                  include: {
                    subModules: {
                      where: { schoolId },
                      include: {
                        progress: { where: { teacherId, schoolId } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // -----------------------------------------------------------------
    // 3. Get real student enrollment counts for all relevant sections
    // -----------------------------------------------------------------
    const sectionIds = subjectClassRows
      .map((r) => r.sectionId)
      .filter(Boolean) as string[];
    const classIds = subjectClassRows.map((r) => r.classId);

    const [sectionCounts, classCounts] = await Promise.all([
      sectionIds.length > 0
        ? db.classEnrollment.groupBy({
            by: ["sectionId"],
            where: { sectionId: { in: sectionIds }, status: "ACTIVE", schoolId },
            _count: { studentId: true },
          }).then((rows) => new Map(rows.map((r) => [r.sectionId, r._count.studentId])))
        : Promise.resolve(new Map<string, number>()),
      classIds.length > 0
        ? db.classEnrollment.groupBy({
            by: ["classId"],
            where: { classId: { in: classIds }, status: "ACTIVE", schoolId },
            _count: { studentId: true },
          }).then((rows) => new Map(rows.map((r) => [r.classId, r._count.studentId])))
        : Promise.resolve(new Map<string, number>()),
    ]);

    // -----------------------------------------------------------------
    // 4. Merge: build one entry per unique subjectId
    // -----------------------------------------------------------------
    // Subjects known from SubjectClass (precise assignments)
    const subjectIdSet = new Set(subjectClassRows.map((r) => r.subject.id));
    // Add subjects from SubjectTeacher that aren't already covered
    const extraSubjectTeachers = subjectTeacherRows.filter(
      (st) => !subjectIdSet.has(st.subject.id)
    );

    // Group subjectClassRows by subjectId
    const bySubject = new Map<string, typeof subjectClassRows>();
    for (const row of subjectClassRows) {
      const list = bySubject.get(row.subject.id) ?? [];
      list.push(row);
      bySubject.set(row.subject.id, list);
    }

    function buildSubjectEntry(
      subjectId: string,
      subjectData: (typeof subjectClassRows)[0]["subject"],
      rows: typeof subjectClassRows
    ) {
      const activeSyllabus = subjectData.syllabus[0];
      const allModules = activeSyllabus?.modules ?? [];
      const allSubModules = allModules.flatMap((m: ModuleWithProgress) => m.subModules);
      const totalTopics = allSubModules.length;
      const completedTopics = allSubModules.filter(
        (sm: SubModuleWithProgress) => sm.progress.some((p: { completed: boolean }) => p.completed)
      ).length;
      const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Class+section assignments for this subject (grade-aware sort — DB
      // orderBy on class.name is lexicographic, e.g. "Class 10" before "Class 2")
      const classAssignments = rows
        .map((r) => ({
          id: r.class.id,
          name: r.class.name,
          sectionId: r.sectionId ?? null,
          sectionName: r.section?.name ?? null,
          displayName: r.section
            ? `${r.class.name} — Section ${r.section.name}`
            : r.class.name,
          studentCount: r.sectionId
            ? (sectionCounts.get(r.sectionId) ?? 0)
            : (classCounts.get(r.classId) ?? 0),
        }))
        .sort((a, b) => compareClassNames(a.name, b.name));

      // Legacy fields for existing UI components
      const uniqueClassNames = [...new Set(classAssignments.map((c) => c.name))];
      const sections = [
        ...new Set(
          classAssignments.map((c) => c.sectionName).filter(Boolean) as string[]
        ),
      ];
      const totalStudents = classAssignments.reduce((s, c) => s + c.studentCount, 0);

      return {
        id: subjectId,
        name: subjectData.name,
        code: subjectData.code,
        // Legacy single-string grade/sections
        grade: uniqueClassNames.join(", "),
        sections: sections.length > 0 ? sections : [],
        // New structured data
        classAssignments,
        totalStudents,
        totalClasses: classAssignments.length,
        completedClasses: 0,
        totalTopics,
        completedTopics,
        progress,
        syllabus: activeSyllabus
          ? [
              {
                id: activeSyllabus.id,
                title: activeSyllabus.title,
                modules: activeSyllabus.modules.map((m: ModuleWithProgress) => {
                  const modTotal = m.subModules.length;
                  const modDone = m.subModules.filter((sm: SubModuleWithProgress) =>
                    sm.progress.some((p: { completed: boolean }) => p.completed)
                  ).length;
                  return {
                    id: m.id,
                    title: m.title,
                    order: m.order,
                    chapterNumber: m.chapterNumber,
                    term: m.term,
                    totalTopics: modTotal,
                    completedTopics: modDone,
                    subModules: m.subModules.map((sm: SubModuleWithProgress) => ({
                      id: sm.id,
                      title: sm.title,
                      isCompleted: sm.progress.some((p: { completed: boolean }) => p.completed),
                    })),
                    status:
                      modDone === modTotal && modTotal > 0
                        ? "completed"
                        : modDone > 0
                        ? "in-progress"
                        : "not-started",
                    lastUpdated: new Date().toISOString(),
                  };
                }),
              },
            ]
          : [],
        classes: classAssignments,
      };
    }

    const subjects = [
      // Subjects with explicit SubjectClass assignments
      ...Array.from(bySubject.entries()).map(([subjectId, rows]) =>
        buildSubjectEntry(subjectId, rows[0].subject, rows)
      ),
      // Subjects from SubjectTeacher with no SubjectClass rows
      ...extraSubjectTeachers.map((st) =>
        buildSubjectEntry(st.subject.id, st.subject, [])
      ),
    ].sort((a, b) => a.name.localeCompare(b.name));

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
    // Accept either: SubjectTeacher (global) OR SubjectClass.teacherId (curriculum assignment)
    const [subjectTeacher, subjectClassAssignment] = await Promise.all([
      db.subjectTeacher.findFirst({
        where: { teacherId: teacher.id, subjectId, schoolId },
        select: { id: true },
      }),
      db.subjectClass.findFirst({
        where: { teacherId: teacher.id, subjectId, schoolId },
        select: { id: true },
      }),
    ]);

    if (!subjectTeacher && !subjectClassAssignment) {
      throw new Error("Subject not found or not assigned to this teacher");
    }

    // Get subject details — only show classes where THIS teacher is assigned
    const subject = await db.subject.findFirst({
      where: { id: subjectId, schoolId },
      include: {
        department: true,
        syllabus: {
          where: { schoolId },
          include: {
            units: { where: { schoolId }, orderBy: { order: "asc" } },
          },
        },
        classes: {
          where: {
            schoolId,
            // Only rows where this teacher is the assigned teacher
            // (fall back to all if SubjectClass has no teacherId set)
            OR: [
              { teacherId: teacher.id },
              // If the teacher has a SubjectTeacher record, show all classes
              ...(subjectTeacher ? [{}] : []),
            ],
          },
          include: {
            class: true,
            section: true,
          },
        },
      },
    });

    if (!subject) throw new Error("Subject not found");

    // Build classes list from SubjectClass rows (already scoped to this teacher above)
    // Group by class, aggregate sections
    const classSectionMap = new Map<string, { className: string; sections: { id: string; name: string; studentCount: number }[] }>();

    for (const sc of subject.classes) {
      const entry = classSectionMap.get(sc.classId) ?? { className: sc.class.name, sections: [] };
      if (sc.section) {
        entry.sections.push({ id: sc.section.id, name: sc.section.name, studentCount: 0 });
      }
      classSectionMap.set(sc.classId, entry);
    }

    // Get real enrollment counts per section
    const allSectionIds = [...classSectionMap.values()]
      .flatMap((e) => e.sections.map((s) => s.id));

    const sectionEnrollments = allSectionIds.length > 0
      ? await db.classEnrollment.groupBy({
          by: ["classId", "sectionId"],
          where: { sectionId: { in: allSectionIds }, status: "ACTIVE", schoolId },
          _count: { studentId: true },
        })
      : [];

    const enrollMap = new Map(sectionEnrollments.map((r) => [`${r.classId}|${r.sectionId}`, r._count.studentId]));

    const classes = [...classSectionMap.entries()].map(([classId, entry]) => {
      const sections = entry.sections.map((s) => ({
        id: s.id,
        name: s.name,
        studentCount: enrollMap.get(`${classId}|${s.id}`) ?? 0,
      }));
      return {
        id: classId,
        name: entry.className,
        sections,
        totalStudents: sections.reduce((sum, s) => sum + s.studentCount, 0),
      };
    });

    // Transform the syllabus data — real unit data, no random values
    const syllabusData = subject.syllabus.map((s: {
      id: string;
      title: string;
      description: string | null;
      units: { id: string; title: string; description: string | null; order: number }[]
    }) => ({
      id: s.id,
      title: s.title,
      description: s.description || "",
      document: "",
      units: s.units.map((u) => ({
        id: u.id,
        title: u.title,
        description: u.description || "",
        order: u.order,
        totalTopics: 0,
        completedTopics: 0,
        status: "not-started" as const,
        lastUpdated: new Date().toISOString(),
      })),
    }));

    // Get recent lessons
    const recentLessons: any[] = [];

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

    // Verify teacher has access to this subject (SubjectTeacher OR SubjectClass.teacherId)
    const [subjectTeacher, subjectClassAssignment] = await Promise.all([
      db.subjectTeacher.findFirst({
        where: { teacherId: teacher.id, subjectId, schoolId },
        select: { id: true },
      }),
      db.subjectClass.findFirst({
        where: { teacherId: teacher.id, subjectId, schoolId },
        select: { id: true },
      }),
    ]);

    if (!subjectTeacher && !subjectClassAssignment) {
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