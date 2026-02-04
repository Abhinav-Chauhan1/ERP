"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { checkRateLimit, RateLimitPresets } from "@/lib/utils/rate-limit";
import { validateImageFile } from "@/lib/utils/file-security";
import { uploadHandler } from "@/lib/services/upload-handler";
import { r2StorageService } from "@/lib/services/r2-storage-service";
import { hasPermission } from "@/lib/utils/permissions";
import { requireSchoolAccess } from "@/lib/auth/tenant";

// Get student with detailed information
export async function getStudentWithDetails(studentId: string) {
  if (!studentId) {
    console.error('Invalid student ID provided:', studentId);
    return null;
  }

  try {
    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Permission check: require STUDENT:READ
    const session = await auth();
    const userId = session?.user?.id;

    if (userId) {
      const canRead = await hasPermission(userId, 'STUDENT', 'READ');
      if (!canRead) {
        console.error('User does not have permission to read student details');
        return null;
      }
    }

    console.log(`Fetching student details for ID: ${studentId}`);

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
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

/**
 * Upload student profile photo (requires STUDENT:UPDATE permission)
 */
export async function uploadStudentAvatar(formData: FormData) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Permission check: require STUDENT:UPDATE
    const canUpdate = await hasPermission(currentUserId, 'STUDENT', 'UPDATE');
    if (!canUpdate) {
      return {
        success: false,
        message: "You do not have permission to update student photos",
      };
    }

    const studentId = formData.get("studentId") as string;
    const file = formData.get("avatar") as File;

    if (!studentId) {
      return {
        success: false,
        message: "Student ID is required",
      };
    }

    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, message: "School context required" };

    // Get student and their user
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: { user: true },
    });

    if (!student) {
      return {
        success: false,
        message: "Student not found",
      };
    }

    // Rate limiting for file uploads
    const rateLimitKey = `file-upload:${currentUserId}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimitPresets.FILE_UPLOAD);
    if (!rateLimitResult) {
      return {
        success: false,
        message: "Too many upload requests. Please try again later.",
      };
    }

    // Validate file using security utility
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || "Invalid file",
      };
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to R2 storage using upload handler
    const uploadResult = await uploadHandler.uploadImage(file, {
      folder: 'avatars',
      category: 'image',
      customMetadata: {
        userId: student.userId,
        studentId: student.id,
        uploadType: 'avatar'
      }
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload avatar');
    }

    // Update student avatar URL in database
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        user: {
          update: {
            avatar: uploadResult.url,
          },
        },
      },
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
        },
        school: true,
      },
    });

    revalidatePath(`/admin/users/students/${studentId}`);
    revalidatePath(`/admin/users/students/${studentId}/edit`);

    return {
      success: true,
      message: "Student photo updated successfully",
      data: { 
        avatar: uploadResult.url,
        metadata: uploadResult.metadata 
      },
    };
  } catch (error) {
    console.error("Error uploading student avatar:", error);
    return {
      success: false,
      message: "Failed to upload student photo",
    };
  }
}

/**
 * Remove student profile photo (requires STUDENT:UPDATE permission)
 */
export async function removeStudentAvatar(studentId: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // Permission check: require STUDENT:UPDATE
    const canUpdate = await hasPermission(currentUserId, 'STUDENT', 'UPDATE');
    if (!canUpdate) {
      return {
        success: false,
        message: "You do not have permission to update student photos",
      };
    }

    if (!studentId) {
      return {
        success: false,
        message: "Student ID is required",
      };
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) return { success: false, message: "School context required" };

    // Get student
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: { user: true },
    });

    if (!student) {
      return {
        success: false,
        message: "Student not found",
      };
    }

    // Try to delete from R2 storage if avatar exists
    if (student.user.avatar) {
      try {
        // Extract key from avatar URL to delete from R2
        const url = new URL(student.user.avatar);
        const key = url.pathname.substring(1); // Remove leading slash
        
        // Delete from R2 storage
        await r2StorageService.deleteFile(schoolId, key);
      } catch (error) {
        console.warn("Failed to delete avatar from R2 storage:", error);
        // Continue with database update even if R2 deletion fails
        
        try {
          console.warn("Avatar deletion temporarily disabled during migration to R2 storage");
          // await deleteFromR2(`student-avatars/student_${student.userId}`);
        } catch (r2Error) {
          console.error("Error deleting from R2 storage:", r2Error);
          // Continue anyway - the important thing is to clear the database
        }
      }
    }

    // Update user to remove avatar
    await db.user.update({
      where: { id: student.userId },
      data: { avatar: null },
    });

    revalidatePath(`/admin/users/students/${studentId}`);
    revalidatePath(`/admin/users/students/${studentId}/edit`);

    return {
      success: true,
      message: "Student photo removed successfully",
    };
  } catch (error) {
    console.error("Error removing student avatar:", error);
    return {
      success: false,
      message: "Failed to remove student photo",
    };
  }
}
