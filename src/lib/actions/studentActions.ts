"use server";

import { db } from "@/lib/db";

// Get student with detailed information
export async function getStudentWithDetails(studentId: string) {
  if (!studentId) {
    console.error('Invalid student ID provided:', studentId);
    return null;
  }

  try {
    console.log(`Fetching student details for ID: ${studentId}`);
    
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          }
        },
        enrollments: {
          include: {
            class: true,
            section: true,
          },
          where: {
            status: "ACTIVE"
          },
          take: 1
        },
        examResults: {
          include: {
            exam: {
              include: {
                subject: true
              }
            }
          },
          orderBy: {
            exam: {
              examDate: 'desc'
            }
          },
          take: 5
        },
        attendance: {
          orderBy: {
            date: 'desc'
          },
          take: 10
        }
      },
    });

    if (!student) {
      console.log(`No student found with ID: ${studentId}`);
    } else {
      console.log(`Found student: ${student.user.firstName} ${student.user.lastName}`);
    }

    return student;
  } catch (error) {
    console.error(`Error in getStudentWithDetails for ID ${studentId}:`, error);
    throw error;
  }
}
