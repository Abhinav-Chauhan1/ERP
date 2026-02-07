"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";

export interface LessonContent {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'AUDIO' | 'INTERACTIVE';
  content: string;
  duration?: number;
  order: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  progress?: StudentContentProgress;
}

export interface StudentContentProgress {
  id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  timeSpent: number;
  completed: boolean;
  completedAt?: Date;
  lastAccessedAt?: Date;
}

/**
 * Get lesson content with student progress
 */
export async function getLessonContent(contentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get current user's student record
    const student = await db.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId
      }
    });
    if (!student) throw new Error("Student not found");

    const content = await db.lessonContent.findFirst({
      where: {
        id: contentId,
        schoolId
      },
      include: {
        studentProgress: {
          where: {
            studentId: student.id
          }
        }
      }
    });

    if (!content) {
      throw new Error("Content not found");
    }

    return {
      ...content,
      progress: content.studentProgress[0] || null
    };
  } catch (error) {
    console.error("Error getting lesson content:", error);
    throw error;
  }
}

/**
 * Get all lesson contents for a lesson or course
 */
export async function getLessonContents(lessonId?: string, courseId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get current user's student record
    const student = await db.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId
      }
    });
    if (!student) throw new Error("Student not found");

    const contents = await db.lessonContent.findMany({
      where: {
        schoolId,
        ...(lessonId && { lessonId }),
        ...(courseId && { courseId })
      },
      include: {
        studentProgress: {
          where: {
            studentId: student.id
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    return contents.map(content => ({
      ...content,
      progress: content.studentProgress[0] || null
    }));
  } catch (error) {
    console.error("Error getting lesson contents:", error);
    throw error;
  }
}

/**
 * Start or update content progress
 */
export async function updateContentProgress(
  contentId: string,
  data: {
    progress?: number;
    timeSpent?: number;
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get current user's student record
    const student = await db.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId
      }
    });
    if (!student) throw new Error("Student not found");

    // Check if content exists
    const content = await db.lessonContent.findFirst({
      where: {
        id: contentId,
        schoolId
      }
    });

    if (!content) {
      return { success: false, message: "Content not found" };
    }

    // Get or create progress record
    let progress = await db.studentContentProgress.findFirst({
      where: {
        studentId: student.id,
        contentId,
        schoolId
      }
    });

    const now = new Date();
    const isCompleted = data.status === 'COMPLETED' || (data.progress && data.progress >= 100);

    if (progress) {
      // Update existing progress
      progress = await db.studentContentProgress.update({
        where: { id: progress.id },
        data: {
          ...(data.progress !== undefined && { progress: data.progress }),
          ...(data.timeSpent !== undefined && { timeSpent: progress.timeSpent + data.timeSpent }),
          ...(data.status && { status: data.status }),
          lastAccessedAt: now,
          ...(isCompleted && !progress.completed && {
            completed: true,
            completedAt: now,
            status: 'COMPLETED'
          })
        }
      });
    } else {
      // Create new progress record
      progress = await db.studentContentProgress.create({
        data: {
          studentId: student.id,
          contentId,
          schoolId,
          progress: data.progress || 0,
          timeSpent: data.timeSpent || 0,
          status: data.status || 'IN_PROGRESS',
          lastAccessedAt: now,
          ...(isCompleted && {
            completed: true,
            completedAt: now,
            status: 'COMPLETED'
          })
        }
      });
    }

    // Award XP for completion
    if (isCompleted && !progress.completed) {
      // Import achievement actions to award XP
      const { awardXP, updateAchievementProgress } = await import('./student-achievements-actions');
      
      // Award XP based on content type and duration
      let xpPoints = 10; // Base XP
      if (content.duration) {
        xpPoints += Math.floor(content.duration / 5); // 1 XP per 5 minutes
      }
      if (content.type === 'INTERACTIVE') {
        xpPoints *= 1.5; // Bonus for interactive content
      }

      await awardXP(student.id, Math.floor(xpPoints));
      await updateAchievementProgress(student.id, 'ACADEMIC', 1);
    }

    revalidatePath('/student/learn');
    revalidatePath('/student');
    return { success: true, progress };
  } catch (error) {
    console.error("Error updating content progress:", error);
    return { success: false, message: "Failed to update progress" };
  }
}

/**
 * Mark content as completed
 */
export async function completeContent(contentId: string) {
  return updateContentProgress(contentId, {
    progress: 100,
    status: 'COMPLETED'
  });
}

/**
 * Get student's overall learning progress
 */
export async function getStudentLearningProgress(studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // If no studentId provided, get current user's student record
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId
        }
      });
      if (!student) throw new Error("Student not found");
      targetStudentId = student.id;
    }

    // Verify access - students can only view their own progress
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    // Get all content progress for the student
    const progressRecords = await db.studentContentProgress.findMany({
      where: {
        studentId: targetStudentId,
        schoolId
      },
      include: {
        content: true
      }
    });

    // Get total available content
    const totalContent = await db.lessonContent.count({
      where: { schoolId }
    });

    const completedContent = progressRecords.filter(p => p.completed).length;
    const inProgressContent = progressRecords.filter(p => p.status === 'IN_PROGRESS').length;
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
    const averageProgress = progressRecords.length > 0 
      ? progressRecords.reduce((sum, p) => sum + p.progress, 0) / progressRecords.length 
      : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = progressRecords.filter(p => 
      p.lastAccessedAt && p.lastAccessedAt >= sevenDaysAgo
    ).length;

    // Get progress by content type
    const progressByType = {
      VIDEO: progressRecords.filter(p => p.content.type === 'VIDEO').length,
      TEXT: progressRecords.filter(p => p.content.type === 'TEXT').length,
      AUDIO: progressRecords.filter(p => p.content.type === 'AUDIO').length,
      INTERACTIVE: progressRecords.filter(p => p.content.type === 'INTERACTIVE').length
    };

    return {
      totalContent,
      completedContent,
      inProgressContent,
      totalTimeSpent,
      averageProgress: Math.round(averageProgress * 100) / 100,
      recentActivity,
      progressByType,
      completionRate: totalContent > 0 ? (completedContent / totalContent) * 100 : 0
    };
  } catch (error) {
    console.error("Error getting student learning progress:", error);
    throw error;
  }
}

/**
 * Get recommended content for a student
 */
export async function getRecommendedContent(limit: number = 5) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get current user's student record
    const student = await db.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId
      }
    });
    if (!student) throw new Error("Student not found");

    // Get content that the student hasn't started or completed
    const completedContentIds = await db.studentContentProgress.findMany({
      where: {
        studentId: student.id,
        schoolId,
        completed: true
      },
      select: {
        contentId: true
      }
    });

    const completedIds = completedContentIds.map(p => p.contentId);

    const recommendedContent = await db.lessonContent.findMany({
      where: {
        schoolId,
        id: {
          notIn: completedIds
        }
      },
      include: {
        studentProgress: {
          where: {
            studentId: student.id
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return recommendedContent.map(content => ({
      ...content,
      progress: content.studentProgress[0] || null
    }));
  } catch (error) {
    console.error("Error getting recommended content:", error);
    throw error;
  }
}

/**
 * Get learning streak for a student
 */
export async function getLearningStreak(studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // If no studentId provided, get current user's student record
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId
        }
      });
      if (!student) throw new Error("Student not found");
      targetStudentId = student.id;
    }

    // Verify access - students can only view their own streak
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    // Get XP level record which contains streak information
    const xpLevel = await db.studentXPLevel.findUnique({
      where: { studentId: targetStudentId }
    });

    if (!xpLevel) {
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    }

    // Calculate longest streak by looking at completion history
    const completions = await db.studentContentProgress.findMany({
      where: {
        studentId: targetStudentId,
        schoolId,
        completed: true
      },
      orderBy: {
        completedAt: 'asc'
      },
      select: {
        completedAt: true
      }
    });

    let longestStreak = 0;
    let currentStreakCount = 0;
    let lastDate: Date | null = null;

    for (const completion of completions) {
      if (!completion.completedAt) continue;

      const completionDate = new Date(completion.completedAt);
      completionDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        currentStreakCount = 1;
      } else {
        const daysDiff = Math.floor((completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreakCount++;
        } else if (daysDiff > 1) {
          longestStreak = Math.max(longestStreak, currentStreakCount);
          currentStreakCount = 1;
        }
        // If daysDiff === 0, same day, don't change streak
      }

      lastDate = completionDate;
    }

    longestStreak = Math.max(longestStreak, currentStreakCount);

    return {
      currentStreak: xpLevel.streak,
      longestStreak,
      lastActivityDate: xpLevel.lastActivityDate
    };
  } catch (error) {
    console.error("Error getting learning streak:", error);
    throw error;
  }
}