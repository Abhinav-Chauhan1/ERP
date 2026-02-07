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
            },
            orderBy: {
                subject: {
                    name: 'asc'
                }
            }
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

        // Get subjects assigned specifically to this section OR to the whole class (where sectionId is null)
        // First get the section to find the classId
        const section = await prisma.classSection.findUnique({
            where: { id: sectionId },
            select: { classId: true }
        });

        if (!section) {
            return { success: false, error: "Section not found" };
        }

        const subjects = await prisma.subjectClass.findMany({
            where: {
                schoolId: session.user.schoolId,
                classId: section.classId,
                OR: [
                    { sectionId: sectionId },
                    { sectionId: null }
                ]
            },
            include: {
                subject: true,
                section: true,
            },
            orderBy: {
                subject: {
                    name: 'asc'
                }
            }
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

        // Check if already assigned to class (without section)
        const existing = await prisma.subjectClass.findUnique({
            where: {
                subjectId_classId_sectionId: {
                    subjectId,
                    classId,
                    sectionId: "" // Empty string acts as null for unique constraint if prisma handles optional differently, but typically we query specific fields
                }
            }
            // Prisma unique constraint on nullable fields can be tricky.
            // Better to use findFirst
        });

        // Let's use findFirst for safer checking
        const existingAssignment = await prisma.subjectClass.findFirst({
            where: {
                subjectId,
                classId,
                sectionId: null
            }
        });

        if (existingAssignment) {
            return { success: false, error: "Subject already assigned to this class" };
        }

        await prisma.subjectClass.create({
            data: {
                subjectId,
                classId,
                sectionId: null,
                schoolId: session.user.schoolId,
            }
        });

        revalidatePath(`/admin/academic/curriculum`);
        revalidatePath(`/admin/classes/${classId}`);
        return { success: true };
    } catch (error) {
        console.error("Error assigning subject to class:", error);
        return { success: false, error: "Failed to assign subject" };
    }
}

export async function assignSubjectToSection(classId: string, sectionId: string, subjectId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session.user.schoolId) {
            return { success: false, error: "Unauthorized" };
        }

        // Check if already assigned to this section
        const existingAssignment = await prisma.subjectClass.findFirst({
            where: {
                subjectId,
                classId,
                sectionId
            }
        });

        if (existingAssignment) {
            return { success: false, error: "Subject already assigned to this section" };
        }

        await prisma.subjectClass.create({
            data: {
                subjectId,
                classId,
                sectionId,
                schoolId: session.user.schoolId,
            }
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
            where: {
                id,
                schoolId: session.user.schoolId,
            }
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
                academicYear: {
                    isCurrent: true
                }
            },
            include: {
                sections: {
                    orderBy: {
                        name: 'asc'
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
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
            where: {
                schoolId: session.user.schoolId,
            },
            orderBy: {
                name: 'asc'
            }
        });

        return { success: true, data: subjects };
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return { success: false, error: "Failed to fetch subjects" };
    }
}
