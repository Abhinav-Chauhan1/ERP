"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

// Get administrator with detailed information
export async function getAdministratorWithDetails(administratorId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!administratorId) {
    console.error('Invalid administrator ID provided:', administratorId);
    return null;
  }

  try {
    console.log(`Fetching administrator details for ID: ${administratorId}`);

    // Get required school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    const administrator = await db.administrator.findUnique({
      where: { 
        id: administratorId,
        schoolId, // CRITICAL: Ensure administrator belongs to current school
      },
      include: {
        user: true,
        // Include related data for administrators
        announcements: {
          where: {
            schoolId, // CRITICAL: Filter announcements by school
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      },
    });

    if (!administrator) {
      console.log(`No administrator found with ID: ${administratorId}`);
    } else {
      console.log(`Found administrator: ${administrator.user.firstName} ${administrator.user.lastName}`);
    }

    return administrator;
  } catch (error) {
    console.error(`Error in getAdministratorWithDetails for ID ${administratorId}:`, error);
    throw error;
  }
}
