"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
import { db } from "@/lib/db";

// Get parent with detailed information
export const getParentWithDetails = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, parentId: string) => {
  if (!parentId) {
    console.error('Invalid parent ID provided:', parentId);
    return null;
  }

  try {
    console.log(`Fetching parent details for ID: ${parentId}`);

    const parent = await db.parent.findFirst({
      where: {
        id: parentId,
        schoolId,
      },
      include: {
        user: true,
        children: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  include: {
                    class: true,
                    section: true,
                  },
                  where: {
                    schoolId,
                    status: "ACTIVE"
                  },
                  take: 1
                }
              }
            }
          }
        },
        meetings: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'desc'
          },
          take: 3
        }
      },
    });

    if (!parent) {
      console.log(`No parent found with ID: ${parentId}`);
    } else {
      console.log(`Found parent: ${parent.user.firstName} ${parent.user.lastName}`);
    }

    return parent;
  } catch (error) {
    console.error(`Error in getParentWithDetails for ID ${parentId}:`, error);
    throw error;
  }
});
