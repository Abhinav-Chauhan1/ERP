"use server";

import { db } from "@/lib/db";

// Get teacher with detailed information
export async function getTeacherWithDetails(teacherId: string) {
  if (!teacherId) {
    console.error('Invalid teacher ID provided:', teacherId);
    return null;
  }

  try {
    console.log(`Fetching teacher details for ID: ${teacherId}`);
    
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        // Include related data for teachers
        subjects: {
          include: {
            subject: true
          }
        },
        classes: {
          include: {
            class: true
          }
        },
        parentMeetings: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'desc'
          },
          take: 3
        },
        examCreated: {
          take: 5,
          orderBy: {
            examDate: 'desc'
          },
          include: {
            subject: true
          }
        },
        assignmentCreated: {
          take: 5,
          orderBy: {
            dueDate: 'desc'
          },
          include: {
            subject: true
          }
        }
      },
    });

    if (!teacher) {
      console.log(`No teacher found with ID: ${teacherId}`);
    } else {
      console.log(`Found teacher: ${teacher.user.firstName} ${teacher.user.lastName}`);
    }

    return teacher;
  } catch (error) {
    console.error(`Error in getTeacherWithDetails for ID ${teacherId}:`, error);
    throw error;
  }
}
