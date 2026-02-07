"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  category: 'ACADEMIC' | 'ATTENDANCE' | 'PARTICIPATION' | 'STREAK' | 'SPECIAL';
  points: number;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date | null;
  progress: number;
  maxProgress: number;
}

export interface StudentStats {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXP: number;
  streak: number;
  totalAchievements: number;
  unlockedAchievements: number;
}

/**
 * Get student achievements and stats
 */
export async function getStudentAchievements(studentId?: string) {
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

    // Verify access - students can only view their own achievements
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    // Get or create XP level record
    let xpLevel = await db.studentXPLevel.findUnique({
      where: { studentId: targetStudentId }
    });

    if (!xpLevel) {
      xpLevel = await db.studentXPLevel.create({
        data: {
          studentId: targetStudentId,
          schoolId,
          totalXP: 0,
          level: 1,
          currentLevelXP: 0,
          xpToNextLevel: 100,
          streak: 0
        }
      });
    }

    // Get achievements
    const achievements = await db.studentAchievement.findMany({
      where: {
        studentId: targetStudentId,
        schoolId
      },
      orderBy: [
        { unlocked: 'desc' },
        { rarity: 'desc' },
        { points: 'desc' }
      ]
    });

    // If no achievements exist, create default ones
    if (achievements.length === 0) {
      await createDefaultAchievements(targetStudentId, schoolId);
      
      // Fetch again after creating defaults
      const newAchievements = await db.studentAchievement.findMany({
        where: {
          studentId: targetStudentId,
          schoolId
        },
        orderBy: [
          { unlocked: 'desc' },
          { rarity: 'desc' },
          { points: 'desc' }
        ]
      });

      return {
        achievements: newAchievements,
        stats: {
          totalXP: xpLevel.totalXP,
          level: xpLevel.level,
          xpToNextLevel: xpLevel.xpToNextLevel,
          currentLevelXP: xpLevel.currentLevelXP,
          streak: xpLevel.streak,
          totalAchievements: newAchievements.length,
          unlockedAchievements: newAchievements.filter(a => a.unlocked).length
        }
      };
    }

    return {
      achievements,
      stats: {
        totalXP: xpLevel.totalXP,
        level: xpLevel.level,
        xpToNextLevel: xpLevel.xpToNextLevel,
        currentLevelXP: xpLevel.currentLevelXP,
        streak: xpLevel.streak,
        totalAchievements: achievements.length,
        unlockedAchievements: achievements.filter(a => a.unlocked).length
      }
    };
  } catch (error) {
    console.error("Error getting student achievements:", error);
    throw error;
  }
}

/**
 * Unlock an achievement for a student
 */
export async function unlockAchievement(achievementId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    const achievement = await db.studentAchievement.findFirst({
      where: {
        id: achievementId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!achievement) {
      throw new Error("Achievement not found");
    }

    // Verify access
    if (session.user.role === "STUDENT" && achievement.student.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    if (achievement.unlocked) {
      return { success: false, message: "Achievement already unlocked" };
    }

    // Check if progress is complete
    if (achievement.progress < achievement.maxProgress) {
      return { success: false, message: "Achievement requirements not met" };
    }

    // Unlock achievement
    await db.studentAchievement.update({
      where: { id: achievementId },
      data: {
        unlocked: true,
        unlockedAt: new Date()
      }
    });

    // Award XP
    await awardXP(achievement.studentId, achievement.points);

    revalidatePath('/student/achievements');
    revalidatePath('/student');

    return { success: true, message: "Achievement unlocked!", points: achievement.points };
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return { success: false, message: "Failed to unlock achievement" };
  }
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  studentId: string,
  category: string,
  increment: number = 1
) {
  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return;

    // Find achievements in this category that aren't unlocked
    const achievements = await db.studentAchievement.findMany({
      where: {
        studentId,
        schoolId,
        category: category as any,
        unlocked: false
      }
    });

    for (const achievement of achievements) {
      const newProgress = Math.min(achievement.progress + increment, achievement.maxProgress);
      
      await db.studentAchievement.update({
        where: { id: achievement.id },
        data: {
          progress: newProgress,
          ...(newProgress >= achievement.maxProgress && {
            unlocked: true,
            unlockedAt: new Date()
          })
        }
      });

      // Award XP if unlocked
      if (newProgress >= achievement.maxProgress && !achievement.unlocked) {
        await awardXP(studentId, achievement.points);
      }
    }
  } catch (error) {
    console.error("Error updating achievement progress:", error);
  }
}

/**
 * Award XP to a student
 */
export async function awardXP(studentId: string, points: number) {
  try {
    const xpLevel = await db.studentXPLevel.findUnique({
      where: { studentId }
    });

    if (!xpLevel) return;

    const newTotalXP = xpLevel.totalXP + points;
    let newLevel = xpLevel.level;
    let newCurrentLevelXP = xpLevel.currentLevelXP + points;
    let newXPToNextLevel = xpLevel.xpToNextLevel;

    // Calculate level ups
    while (newCurrentLevelXP >= newXPToNextLevel) {
      newCurrentLevelXP -= newXPToNextLevel;
      newLevel++;
      newXPToNextLevel = calculateXPForLevel(newLevel + 1) - calculateXPForLevel(newLevel);
    }

    await db.studentXPLevel.update({
      where: { studentId },
      data: {
        totalXP: newTotalXP,
        level: newLevel,
        currentLevelXP: newCurrentLevelXP,
        xpToNextLevel: newXPToNextLevel,
        lastActivityDate: new Date()
      }
    });

    // Update streak if activity today
    await updateStreak(studentId);
  } catch (error) {
    console.error("Error awarding XP:", error);
  }
}

/**
 * Update student streak
 */
async function updateStreak(studentId: string) {
  try {
    const xpLevel = await db.studentXPLevel.findUnique({
      where: { studentId }
    });

    if (!xpLevel) return;

    const today = new Date();
    const lastActivity = xpLevel.lastActivityDate;
    
    if (!lastActivity) {
      // First activity
      await db.studentXPLevel.update({
        where: { studentId },
        data: { streak: 1, lastActivityDate: today }
      });
      return;
    }

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      await db.studentXPLevel.update({
        where: { studentId },
        data: { streak: xpLevel.streak + 1 }
      });
    } else if (daysDiff > 1) {
      // Streak broken
      await db.studentXPLevel.update({
        where: { studentId },
        data: { streak: 1 }
      });
    }
    // Same day = no change
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}

/**
 * Calculate XP required for a level
 */
function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

/**
 * Create default achievements for a student
 */
async function createDefaultAchievements(studentId: string, schoolId: string) {
  const defaultAchievements = [
    {
      title: "First Steps",
      description: "Complete your first lesson",
      category: "ACADEMIC",
      points: 50,
      rarity: "COMMON",
      icon: "Star",
      maxProgress: 1
    },
    {
      title: "Perfect Week",
      description: "Complete all assignments for a week",
      category: "ACADEMIC",
      points: 200,
      rarity: "RARE",
      icon: "Trophy",
      maxProgress: 1
    },
    {
      title: "Never Miss",
      description: "Maintain perfect attendance for 30 days",
      category: "ATTENDANCE",
      points: 300,
      rarity: "EPIC",
      icon: "Target",
      maxProgress: 30
    },
    {
      title: "Math Master",
      description: "Score 100% on 10 math quizzes",
      category: "ACADEMIC",
      points: 500,
      rarity: "LEGENDARY",
      icon: "Award",
      maxProgress: 10
    },
    {
      title: "Helpful Student",
      description: "Help 5 classmates with their work",
      category: "PARTICIPATION",
      points: 150,
      rarity: "RARE",
      icon: "Zap",
      maxProgress: 5
    },
    {
      title: "Early Bird",
      description: "Submit assignments early 5 times",
      category: "SPECIAL",
      points: 100,
      rarity: "COMMON",
      icon: "Crown",
      maxProgress: 5
    },
    {
      title: "Study Streak",
      description: "Study for 7 consecutive days",
      category: "STREAK",
      points: 250,
      rarity: "EPIC",
      icon: "Flame",
      maxProgress: 7
    },
    {
      title: "Quiz Champion",
      description: "Win 3 class quizzes in a row",
      category: "ACADEMIC",
      points: 400,
      rarity: "LEGENDARY",
      icon: "Medal",
      maxProgress: 3
    }
  ];

  await db.studentAchievement.createMany({
    data: defaultAchievements.map(achievement => ({
      ...achievement,
      studentId,
      schoolId,
      category: achievement.category as any,
      rarity: achievement.rarity as any,
      unlocked: false,
      progress: 0
    }))
  });
}