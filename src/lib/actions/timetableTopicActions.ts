"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { DayOfWeek } from "@prisma/client";
import { withSchoolAuthAction } from "../auth/security-wrapper";

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
export const assignTopicToSlot = withSchoolAuthAction(async (schoolId, userId, userRole, slotId: string, topicId: string): Promise<ActionResponse> => {
    try {
        // Verify the slot exists
        const slot = await db.timetableSlot.findFirst({
            where: { id: slotId, schoolId },
            include: {
                subjectTeacher: {
                    where: { schoolId },
                    include: {
                        subject: {
                            where: { schoolId }
                        }
                    }
                }
            }
        });

        if (!slot) {
            return { success: false, error: "Timetable slot not found" };
        }

        // Verify the topic exists and belongs to the same subject
        const topic = await db.subModule.findFirst({
            where: { id: topicId, schoolId },
            include: {
                module: {
                    where: { schoolId },
                    include: {
                        syllabus: {
                            where: { schoolId }
                        }
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
            where: { id: slotId, schoolId },
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
});

/**
 * Remove topic assignment from a timetable slot
 */
export const removeTopicFromSlot = withSchoolAuthAction(async (schoolId, userId, userRole, slotId: string): Promise<ActionResponse> => {
    try {
        await db.timetableSlot.update({
            where: { id: slotId, schoolId },
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
});

/**
 * Get all topics scheduled for today for a teacher
 */
export const getTodaysTopics = withSchoolAuthAction(async (schoolId, userId, userRole, teacherId?: string): Promise<ActionResponse<TodayTopicSlot[]>> => {
    try {
        // Get teacher ID - either from param or from session
        let actualTeacherId = teacherId;
        if (!actualTeacherId) {
            const teacher = await db.teacher.findFirst({
                where: { userId: userId, schoolId }
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
                    teacherId: actualTeacherId,
                    schoolId
                },
                day: todayDay,
                schoolId,
                timetable: {
                    isActive: true,
                    effectiveFrom: { lte: today },
                    schoolId,
                    OR: [
                        { effectiveTo: null },
                        { effectiveTo: { gte: today } }
                    ]
                }
            },
            include: {
                class: {
                    where: { schoolId }
                },
                section: {
                    where: { schoolId }
                },
                room: {
                    where: { schoolId }
                },
                subjectTeacher: {
                    where: { schoolId },
                    include: {
                        subject: {
                            where: { schoolId }
                        }
                    }
                },
                topic: {
                    include: {
                        module: {
                            where: { schoolId }
                        },
                        progress: {
                            where: {
                                teacherId: actualTeacherId,
                                schoolId
                            }
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
});

/**
 * Mark a scheduled topic as completed via the timetable
 */
export const markSlotTopicComplete = withSchoolAuthAction(async (schoolId, userId, userRole, slotId: string, teacherId: string): Promise<ActionResponse> => {
    try {
        // Get the slot with topic
        const slot = await db.timetableSlot.findFirst({
            where: { id: slotId, schoolId },
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
                completedAt: new Date(),
                schoolId
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
});

/**
 * Get available topics for a subject (for assigning to timetable slots)
 */
export const getTopicsForSubject = withSchoolAuthAction(async (schoolId, userId, userRole, subjectId: string): Promise<ActionResponse<{ id: string; title: string; chapterNumber: number; moduleTitle: string }[]>> => {
    try {
        // Get all syllabi for this subject
        const syllabi = await db.syllabus.findMany({
            where: { subjectId, schoolId },
            include: {
                modules: {
                    where: { schoolId },
                    orderBy: { chapterNumber: "asc" },
                    include: {
                        subModules: {
                            where: { schoolId },
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
});
