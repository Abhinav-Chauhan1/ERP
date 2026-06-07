"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getClassSubjects(classId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const subjects = await prisma.subjectClass.findMany({
            where: {
                classId,
                schoolId: session.user.schoolId,
            },
            include: {
                subject: true,
                section: true,
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ sectionId: "asc" }, { order: "asc" }, { subject: { name: "asc" } }],
        });

        return { success: true, data: subjects };
    } catch (error) {
        console.error("Error fetching class subjects:", error);
        return { success: false, error: "Failed to fetch class subjects" };
    }
}

export async function getSectionSubjects(sectionId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const section = await prisma.classSection.findUnique({
            where: { id: sectionId },
            select: { classId: true },
        });

        if (!section) {
            return { success: false, error: "Section not found" };
        }

        const subjects = await prisma.subjectClass.findMany({
            where: {
                schoolId: session.user.schoolId,
                classId: section.classId,
                OR: [{ sectionId: sectionId }, { sectionId: null }],
            },
            include: {
                subject: true,
                section: true,
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ order: "asc" }, { subject: { name: "asc" } }],
        });

        return { success: true, data: subjects };
    } catch (error) {
        console.error("Error fetching section subjects:", error);
        return { success: false, error: "Failed to fetch section subjects" };
    }
}

export async function assignSubjectToClass(classId: string, subjectId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const existingAssignment = await prisma.subjectClass.findFirst({
            where: { subjectId, classId, sectionId: null },
        });

        if (existingAssignment) {
            return { success: false, error: "Subject already assigned to this class" };
        }

        // Get the current max order for the class
        const maxOrderRecord = await prisma.subjectClass.findFirst({
            where: { classId, sectionId: null, schoolId: session.user.schoolId },
            orderBy: { order: "desc" },
            select: { order: true },
        });
        const nextOrder = (maxOrderRecord?.order ?? -1) + 1;

        await prisma.subjectClass.create({
            data: {
                subjectId,
                classId,
                sectionId: null,
                schoolId: session.user.schoolId,
                order: nextOrder,
            },
        });

        revalidatePath(`/admin/academic/curriculum`);
        revalidatePath(`/admin/classes/${classId}`);
        return { success: true };
    } catch (error) {
        console.error("Error assigning subject to class:", error);
        return { success: false, error: "Failed to assign subject" };
    }
}

export async function assignSubjectToSection(
    classId: string,
    sectionId: string,
    subjectId: string
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const existingAssignment = await prisma.subjectClass.findFirst({
            where: { subjectId, classId, sectionId },
        });

        if (existingAssignment) {
            return { success: false, error: "Subject already assigned to this section" };
        }

        const maxOrderRecord = await prisma.subjectClass.findFirst({
            where: { classId, sectionId, schoolId: session.user.schoolId },
            orderBy: { order: "desc" },
            select: { order: true },
        });
        const nextOrder = (maxOrderRecord?.order ?? -1) + 1;

        await prisma.subjectClass.create({
            data: {
                subjectId,
                classId,
                sectionId,
                schoolId: session.user.schoolId,
                order: nextOrder,
            },
        });

        revalidatePath(`/admin/academic/curriculum`);
        revalidatePath(`/admin/classes/${classId}`);
        return { success: true };
    } catch (error) {
        console.error("Error assigning subject to section:", error);
        return { success: false, error: "Failed to assign subject to section" };
    }
}

export async function removeSubjectAssignment(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const assignment = await prisma.subjectClass.delete({
            where: { id, schoolId: session.user.schoolId },
        });

        revalidatePath(`/admin/academic/curriculum`);
        if (assignment.classId) {
            revalidatePath(`/admin/classes/${assignment.classId}`);
        }
        return { success: true };
    } catch (error) {
        console.error("Error removing subject assignment:", error);
        return { success: false, error: "Failed to remove subject assignment" };
    }
}

export async function getClassesWithSections() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const classes = await prisma.class.findMany({
            where: {
                schoolId: session.user.schoolId,
                academicYear: { isCurrent: true },
            },
            include: {
                sections: { orderBy: { name: "asc" } },
            },
            orderBy: { name: "asc" },
        });

        return { success: true, data: classes };
    } catch (error) {
        console.error("Error fetching classes:", error);
        return { success: false, error: "Failed to fetch classes" };
    }
}

export async function getAllSubjects() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const subjects = await prisma.subject.findMany({
            where: { schoolId: session.user.schoolId },
            orderBy: { name: "asc" },
        });

        return { success: true, data: subjects };
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return { success: false, error: "Failed to fetch subjects" };
    }
}

/** Reorder subjects within a class (or section). Takes an array of {id, order} pairs. */
export async function reorderClassSubjects(updates: { id: string; order: number }[]) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify all assignments belong to this school
        const ids = updates.map((u) => u.id);
        const existing = await prisma.subjectClass.findMany({
            where: { id: { in: ids }, schoolId: session.user.schoolId },
            select: { id: true, classId: true },
        });

        if (existing.length !== ids.length) {
            return { success: false, error: "One or more assignments not found or access denied" };
        }

        // Batch update orders
        await Promise.all(
            updates.map((u) =>
                prisma.subjectClass.update({
                    where: { id: u.id },
                    data: { order: u.order },
                })
            )
        );

        const classId = existing[0].classId;
        revalidatePath(`/admin/academic/curriculum`);
        revalidatePath(`/admin/classes/${classId}`);
        return { success: true };
    } catch (error) {
        console.error("Error reordering subjects:", error);
        return { success: false, error: "Failed to reorder subjects" };
    }
}

/** Assign (or replace) the teacher for a specific SubjectClass assignment */
export async function assignTeacherToSubjectClass(
    subjectClassId: string,
    teacherId: string | null
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify ownership
        const assignment = await prisma.subjectClass.findUnique({
            where: { id: subjectClassId, schoolId: session.user.schoolId },
        });
        if (!assignment) {
            return { success: false, error: "Assignment not found" };
        }

        // If teacher is being set, ensure the teacher belongs to this school
        if (teacherId) {
            const teacher = await prisma.teacher.findUnique({
                where: { id: teacherId, schoolId: session.user.schoolId },
                select: { id: true },
            });
            if (!teacher) {
                return { success: false, error: "Teacher not found" };
            }
        }

        const updated = await prisma.subjectClass.update({
            where: { id: subjectClassId },
            data: { teacherId: teacherId ?? null },
            include: {
                teacher: {
                    include: {
                        user: { select: { firstName: true, lastName: true, avatar: true } },
                    },
                },
            },
        });

        revalidatePath(`/admin/academic/curriculum`);
        revalidatePath(`/admin/classes/${assignment.classId}`);
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error assigning teacher to subject class:", error);
        return { success: false, error: "Failed to assign teacher" };
    }
}

/**
 * Assign a teacher to a subject within a specific section.
 * If a section-specific SubjectClass row doesn't exist yet (only class-wide does),
 * it creates one first, then sets the teacher on it.
 * Returns the SubjectClass id that was updated so the UI can refresh.
 */
export async function assignTeacherToSubjectInSection(
    subjectId: string,
    classId: string,
    sectionId: string,
    teacherId: string | null
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }
        const schoolId = session.user.schoolId;

        if (teacherId) {
            const teacher = await prisma.teacher.findUnique({
                where: { id: teacherId, schoolId },
                select: { id: true },
            });
            if (!teacher) return { success: false, error: "Teacher not found" };
        }

        // Find or create section-specific row
        let row = await prisma.subjectClass.findFirst({
            where: { subjectId, classId, sectionId, schoolId },
        });

        if (!row) {
            const maxOrder = await prisma.subjectClass.findFirst({
                where: { classId, sectionId, schoolId },
                orderBy: { order: "desc" },
                select: { order: true },
            });
            row = await prisma.subjectClass.create({
                data: {
                    subjectId,
                    classId,
                    sectionId,
                    schoolId,
                    order: (maxOrder?.order ?? -1) + 1,
                    teacherId,
                },
            });
        } else {
            row = await prisma.subjectClass.update({
                where: { id: row.id },
                data: { teacherId },
            });
        }

        revalidatePath(`/admin/academic/curriculum`);
        revalidatePath(`/admin/classes/${classId}`);
        return { success: true, data: { id: row.id } };
    } catch (error) {
        console.error("Error assigning teacher to subject in section:", error);
        return { success: false, error: "Failed to assign teacher" };
    }
}

/** Get teachers available for assignment (all active teachers in the school) */
export async function getTeachersForSchool() {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        const teachers = await prisma.teacher.findMany({
            where: { schoolId: session.user.schoolId, user: { isActive: true } },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                subjects: {
                    include: { subject: { select: { name: true, code: true } } },
                },
            },
            orderBy: { user: { firstName: "asc" } },
        });

        const formatted = teachers.map((t) => ({
            id: t.id,
            name: `${t.user.firstName} ${t.user.lastName}`,
            avatar: t.user.avatar,
            employeeId: t.employeeId,
            subjectNames: t.subjects.map((s) => s.subject.name),
        }));

        return { success: true, data: formatted };
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return { success: false, error: "Failed to fetch teachers" };
    }
}
