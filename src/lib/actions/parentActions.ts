"use server";

import { db } from "@/lib/db";

// Get parent with detailed information
export async function getParentWithDetails(parentId: string) {
  if (!parentId) {
    console.error('Invalid parent ID provided:', parentId);
    return null;
  }

  try {
    console.log(`Fetching parent details for ID: ${parentId}`);
    
    const parent = await db.parent.findUnique({
      where: { id: parentId },
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
}
