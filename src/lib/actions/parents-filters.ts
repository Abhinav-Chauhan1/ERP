"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface ParentFilters {
  occupation?: string;
  hasChildren?: boolean;
  search?: string;
}

export async function getFilteredParents(filters: ParentFilters) {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const where: Prisma.ParentWhereInput = {
      schoolId // Add school isolation
    };

    // Text search across multiple fields
    if (filters.search) {
      where.OR = [
        {
          user: {
            firstName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            lastName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            phone: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          occupation: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Occupation filter
    if (filters.occupation && filters.occupation !== "all") {
      where.occupation = {
        contains: filters.occupation,
        mode: "insensitive",
      };
    }

    // Has children filter
    if (filters.hasChildren !== undefined) {
      if (filters.hasChildren) {
        where.children = {
          some: {},
        };
      } else {
        where.children = {
          none: {},
        };
      }
    }

    const parents = await db.parent.findMany({
      where,
      include: {
        user: true,
        children: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, parents: JSON.parse(JSON.stringify(parents)) };
  } catch (error) {
    console.error("Error fetching filtered parents:", error);
    return { success: false, error: "Failed to fetch parents", parents: [] };
  }
}

export async function getParentFilterOptions() {
  try {
    // Add school isolation
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const occupations = await db.parent.findMany({
      where: {
        schoolId, // Add school isolation
        occupation: {
          not: null,
        },
      },
      select: {
        occupation: true,
      },
      distinct: ["occupation"],
    });

    const uniqueOccupations = occupations
      .map((o) => o.occupation)
      .filter((o): o is string => o !== null);

    return {
      success: true,
      occupations: uniqueOccupations,
    };
  } catch (error) {
    console.error("Error fetching parent filter options:", error);
    return {
      success: false,
      occupations: [],
    };
  }
}
