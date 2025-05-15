"use server";

import { db } from "@/lib/db";

// Get administrator with detailed information
export async function getAdministratorWithDetails(administratorId: string) {
  if (!administratorId) {
    console.error('Invalid administrator ID provided:', administratorId);
    return null;
  }

  try {
    console.log(`Fetching administrator details for ID: ${administratorId}`);
    
    const administrator = await db.administrator.findUnique({
      where: { id: administratorId },
      include: {
        user: true,
        // Include related data for administrators
        announcements: {
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
