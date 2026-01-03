"use server";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS, CACHE_DURATION } from "@/lib/utils/cache";
import { requireViewAccess, formatAuthError } from "@/lib/utils/syllabus-authorization";

/**
 * Cached version of getModulesBySyllabus with server-side caching
 * Requirements: 1.4, 5.1, 6.1
 * Cache duration: 5 minutes (MEDIUM)
 */
export async function getCachedModulesBySyllabus(syllabusId: string) {
  // Check authorization first (not cached)
  const authResult = await requireViewAccess();
  if (!authResult.authorized) {
    return formatAuthError(authResult);
  }

  if (!syllabusId) {
    return {
      success: false,
      error: "Syllabus ID is required",
    };
  }

  try {
    // Create cached function for this specific syllabus
    const getCachedModules = unstable_cache(
      async (id: string) => {
        return await db.module.findMany({
          where: { syllabusId: id },
          include: {
            subModules: {
              orderBy: { order: "asc" },
              include: {
                documents: {
                  orderBy: { order: "asc" },
                },
                progress: true,
              },
            },
            documents: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { chapterNumber: "asc" },
        });
      },
      [`modules-by-syllabus-${syllabusId}`],
      {
        tags: [CACHE_TAGS.MODULES, CACHE_TAGS.SYLLABUS, `syllabus-${syllabusId}`],
        revalidate: CACHE_DURATION.MEDIUM,
      }
    );

    const modules = await getCachedModules(syllabusId);

    return {
      success: true,
      data: modules,
    };
  } catch (error) {
    console.error("Error fetching cached modules:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch modules",
    };
  }
}

/**
 * Cached version of getSubModulesByModule with server-side caching
 * Requirements: 2.2, 2.5, 5.2, 6.2
 * Cache duration: 5 minutes (MEDIUM)
 */
export async function getCachedSubModulesByModule(moduleId: string) {
  // Check authorization first (not cached)
  const authResult = await requireViewAccess();
  if (!authResult.authorized) {
    return formatAuthError(authResult);
  }

  if (!moduleId) {
    return {
      success: false,
      error: "Module ID is required",
    };
  }

  try {
    // Create cached function for this specific module
    const getCachedSubModules = unstable_cache(
      async (id: string) => {
        return await db.subModule.findMany({
          where: { moduleId: id },
          include: {
            documents: {
              orderBy: { order: "asc" },
            },
            progress: true,
          },
          orderBy: { order: "asc" },
        });
      },
      [`submodules-by-module-${moduleId}`],
      {
        tags: [CACHE_TAGS.SUB_MODULES, CACHE_TAGS.MODULES, `module-${moduleId}`],
        revalidate: CACHE_DURATION.MEDIUM,
      }
    );

    const subModules = await getCachedSubModules(moduleId);

    return {
      success: true,
      data: subModules,
    };
  } catch (error) {
    console.error("Error fetching cached sub-modules:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sub-modules",
    };
  }
}

/**
 * Get paginated modules for a syllabus with caching
 * Requirements: Performance optimization with pagination
 */
export async function getPaginatedModules(
  syllabusId: string,
  options: {
    page?: number;
    pageSize?: number;
    cursor?: string;
  } = {}
) {
  // Check authorization first (not cached)
  const authResult = await requireViewAccess();
  if (!authResult.authorized) {
    return formatAuthError(authResult);
  }

  if (!syllabusId) {
    return {
      success: false,
      error: "Syllabus ID is required",
    };
  }

  const { page = 1, pageSize = 20, cursor } = options;

  try {
    // Use cursor-based pagination for better performance
    const getCachedPaginatedModules = unstable_cache(
      async (id: string, pg: number, size: number, csr?: string) => {
        const skip = csr ? 1 : (pg - 1) * size;

        const [modules, totalCount] = await Promise.all([
          db.module.findMany({
            where: { syllabusId: id },
            include: {
              subModules: {
                orderBy: { order: "asc" },
                include: {
                  documents: {
                    orderBy: { order: "asc" },
                  },
                  progress: true,
                },
              },
              documents: {
                orderBy: { order: "asc" },
              },
            },
            orderBy: { chapterNumber: "asc" },
            take: size,
            skip,
            ...(csr && { cursor: { id: csr } }),
          }),
          db.module.count({
            where: { syllabusId: id },
          }),
        ]);

        return {
          modules,
          totalCount,
          hasMore: skip + modules.length < totalCount,
          nextCursor: modules.length > 0 ? modules[modules.length - 1].id : null,
        };
      },
      [`paginated-modules-${syllabusId}-${page}-${pageSize}-${cursor || 'none'}`],
      {
        tags: [CACHE_TAGS.MODULES, CACHE_TAGS.SYLLABUS, `syllabus-${syllabusId}`],
        revalidate: CACHE_DURATION.MEDIUM,
      }
    );

    const result = await getCachedPaginatedModules(syllabusId, page, pageSize, cursor);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching paginated modules:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch paginated modules",
    };
  }
}

/**
 * Get module with all nested data (cached)
 * Useful for detailed module view
 */
export async function getCachedModuleById(moduleId: string) {
  // Check authorization first (not cached)
  const authResult = await requireViewAccess();
  if (!authResult.authorized) {
    return formatAuthError(authResult);
  }

  if (!moduleId) {
    return {
      success: false,
      error: "Module ID is required",
    };
  }

  try {
    const getCachedModule = unstable_cache(
      async (id: string) => {
        return await db.module.findUnique({
          where: { id },
          include: {
            syllabus: {
              select: {
                id: true,
                title: true,
                subjectId: true,
              },
            },
            subModules: {
              orderBy: { order: "asc" },
              include: {
                documents: {
                  orderBy: { order: "asc" },
                },
                progress: true,
              },
            },
            documents: {
              orderBy: { order: "asc" },
            },
          },
        });
      },
      [`module-${moduleId}`],
      {
        tags: [CACHE_TAGS.MODULES, `module-${moduleId}`],
        revalidate: CACHE_DURATION.MEDIUM,
      }
    );

    const cachedModule = await getCachedModule(moduleId);

    if (!cachedModule) {
      return {
        success: false,
        error: "Module not found",
      };
    }

    return {
      success: true,
      data: cachedModule,
    };
  } catch (error) {
    console.error("Error fetching cached module:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch module",
    };
  }
}

/**
 * Get syllabus progress with caching
 * Requirements: 10.3, 10.4
 */
export async function getCachedSyllabusProgress(syllabusId: string, teacherId: string) {
  // Check authorization first (not cached)
  const authResult = await requireViewAccess();
  if (!authResult.authorized) {
    return formatAuthError(authResult);
  }

  if (!syllabusId || !teacherId) {
    return {
      success: false,
      error: "Syllabus ID and Teacher ID are required",
    };
  }

  try {
    const getCachedProgress = unstable_cache(
      async (sId: string, tId: string) => {
        const modules = await db.module.findMany({
          where: { syllabusId: sId },
          include: {
            subModules: {
              include: {
                progress: {
                  where: { teacherId: tId },
                },
              },
            },
          },
          orderBy: { chapterNumber: "asc" },
        });

        // Calculate progress for each module
        const moduleProgress = modules.map((module) => {
          const totalSubModules = module.subModules.length;
          const completedSubModules = module.subModules.filter(
            (sm) => sm.progress.some((p) => p.completed)
          ).length;
          const completionPercentage =
            totalSubModules > 0 ? (completedSubModules / totalSubModules) * 100 : 0;

          return {
            moduleId: module.id,
            moduleTitle: module.title,
            totalSubModules,
            completedSubModules,
            completionPercentage: Math.round(completionPercentage),
          };
        });

        // Calculate overall syllabus progress
        const totalModules = modules.length;
        const totalCompletionSum = moduleProgress.reduce(
          (sum, mp) => sum + mp.completionPercentage,
          0
        );
        const overallCompletionPercentage =
          totalModules > 0 ? totalCompletionSum / totalModules : 0;

        return {
          syllabusId: sId,
          totalModules,
          completionPercentage: Math.round(overallCompletionPercentage),
          modules: moduleProgress,
        };
      },
      [`syllabus-progress-${syllabusId}-${teacherId}`],
      {
        tags: [
          CACHE_TAGS.SYLLABUS_PROGRESS,
          `syllabus-${syllabusId}`,
          `teacher-${teacherId}`,
        ],
        revalidate: CACHE_DURATION.SHORT,
      }
    );

    const progress = await getCachedProgress(syllabusId, teacherId);

    return {
      success: true,
      data: progress,
    };
  } catch (error) {
    console.error("Error fetching cached syllabus progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch syllabus progress",
    };
  }
}
