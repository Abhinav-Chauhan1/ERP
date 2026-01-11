"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { DayOfWeek } from "@prisma/client";

/**
 * Timetable-Topic Integration Actions
 * Handles topic assignment to timetable slots and related operations
 */

// Response type for actions
interface ActionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// Type for topic info in timetable
interface TopicInfo {
    id: string;
    title: string;
    chapterNumber: number;
    moduleTitle: string;
}

// Type for today's topic slot
interface TodayTopicSlot {
    slotId: string;
    period: string;
    className: string;
    sectionName: string | null;
    subjectName: string;
    room: string | null;
    topic: TopicInfo | null;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
}

/**
 * Assign a topic (sub-module) to a timetable slot
 */
export async function assignTopicToSlot(
    slotId: string,
    topicId: string
): Promise<ActionResponse> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        // Verify the slot exists
        const slot = await db.timetableSlot.findUnique({
            where: { id: slotId },
            include: {
                subjectTeacher: {
                    include: { subject: true }
                }
            }
        });

        if (!slot) {
            return { success: false, error: "Timetable slot not found" };
        }

        // Verify the topic exists and belongs to the same subject
        const topic = await db.subModule.findUnique({
            where: { id: topicId },
            include: {
                module: {
                    include: {
                        syllabus: true
                    }
                }
            }
        });

        if (!topic) {
            return { success: false, error: "Topic not found" };
        }

        // Check if topic's subject matches slot's subject
        if (topic.module.syllabus.subjectId !== slot.subjectTeacher.subjectId) {
            return {
                success: false,
                error: "Topic does not belong to the same subject as this timetable slot"
            };
        }

        // Update the slot with the topic
        await db.timetableSlot.update({
            where: { id: slotId },
            data: { topicId }
        });

        revalidatePath("/admin/teaching/timetable");
        revalidatePath("/teacher/teaching/timetable");

        return { success: true };
    } catch (error) {
        console.error("Error assigning topic to slot:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to assign topic"
        };
    }
}

/**
 * Remove topic assignment from a timetable slot
 */
export async function removeTopicFromSlot(
    slotId: string
): Promise<ActionResponse> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        await db.timetableSlot.update({
            where: { id: slotId },
            data: { topicId: null }
        });

        revalidatePath("/admin/teaching/timetable");
        revalidatePath("/teacher/teaching/timetable");

        return { success: true };
    } catch (error) {
        console.error("Error removing topic from slot:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to remove topic"
        };
    }
}

/**
 * Get all topics scheduled for today for a teacher
 */
export async function getTodaysTopics(
    teacherId?: string
): Promise<ActionResponse<TodayTopicSlot[]>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        // Get teacher ID - either from param or from session
        let actualTeacherId = teacherId;
        if (!actualTeacherId) {
            const teacher = await db.teacher.findUnique({
                where: { userId: session.user.id }
            });
            if (!teacher) {
                return { success: false, error: "Teacher profile not found" };
            }
            actualTeacherId = teacher.id;
        }

        // Get today's day of week
        const today = new Date();
        const dayNames: DayOfWeek[] = [
            "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
            "THURSDAY", "FRIDAY", "SATURDAY"
        ];
        const todayDay = dayNames[today.getDay()];

        // Get today's timetable slots with topics
        const slots = await db.timetableSlot.findMany({
            where: {
                subjectTeacher: {
                    teacherId: actualTeacherId
                },
                day: todayDay,
                timetable: {
                    isActive: true,
                    effectiveFrom: { lte: today },
                    OR: [
                        { effectiveTo: null },
                        { effectiveTo: { gte: today } }
                    ]
                }
            },
            include: {
                class: true,
                section: true,
                room: true,
                subjectTeacher: {
                    include: { subject: true }
                },
                topic: {
                    include: {
                        module: true,
                        progress: {
                            where: { teacherId: actualTeacherId }
                        }
                    }
                }
            },
            orderBy: { startTime: "asc" }
        });

        // Transform slots to TodayTopicSlot format
        const todayTopics: TodayTopicSlot[] = slots.map((slot, index) => ({
            slotId: slot.id,
            period: `Period ${index + 1}`,
            className: slot.class.name,
            sectionName: slot.section?.name || null,
            subjectName: slot.subjectTeacher.subject.name,
            room: slot.room?.name || null,
            topic: slot.topic ? {
                id: slot.topic.id,
                title: slot.topic.title,
                chapterNumber: slot.topic.module.chapterNumber,
                moduleTitle: slot.topic.module.title
            } : null,
            startTime: slot.startTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
            }),
            endTime: slot.endTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
            }),
            isCompleted: slot.topic?.progress?.[0]?.completed ?? false
        }));

        return { success: true, data: todayTopics };
    } catch (error) {
        console.error("Error fetching today's topics:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch today's topics"
        };
    }
}

/**
 * Mark a scheduled topic as completed via the timetable
 */
export async function markSlotTopicComplete(
    slotId: string,
    teacherId: string
): Promise<ActionResponse> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        // Get the slot with topic
        const slot = await db.timetableSlot.findUnique({
            where: { id: slotId },
            select: { topicId: true }
        });

        if (!slot) {
            return { success: false, error: "Timetable slot not found" };
        }

        if (!slot.topicId) {
            return { success: false, error: "No topic assigned to this slot" };
        }

        // Create or update progress record
        await db.subModuleProgress.upsert({
            where: {
                subModuleId_teacherId: {
                    subModuleId: slot.topicId,
                    teacherId
                }
            },
            update: {
                completed: true,
                completedAt: new Date()
            },
            create: {
                subModuleId: slot.topicId,
                teacherId,
                completed: true,
                completedAt: new Date()
            }
        });

        revalidatePath("/teacher/teaching/timetable");
        revalidatePath("/teacher/teaching/syllabus");

        return { success: true };
    } catch (error) {
        console.error("Error marking slot topic complete:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to mark topic complete"
        };
    }
}

/**
 * Get available topics for a subject (for assigning to timetable slots)
 */
export async function getTopicsForSubject(
    subjectId: string
): Promise<ActionResponse<{ id: string; title: string; chapterNumber: number; moduleTitle: string }[]>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        // Get all syllabi for this subject
        const syllabi = await db.syllabus.findMany({
            where: { subjectId },
            include: {
                modules: {
                    orderBy: { chapterNumber: "asc" },
                    include: {
                        subModules: {
                            orderBy: { order: "asc" }
                        }
                    }
                }
            }
        });

        // Flatten sub-modules with their module info
        const topics = syllabi.flatMap(syllabus =>
            syllabus.modules.flatMap(module =>
                module.subModules.map(subModule => ({
                    id: subModule.id,
                    title: subModule.title,
                    chapterNumber: module.chapterNumber,
                    moduleTitle: module.title
                }))
            )
        );

        return { success: true, data: topics };
    } catch (error) {
        console.error("Error fetching topics for subject:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch topics"
        };
    }
}
