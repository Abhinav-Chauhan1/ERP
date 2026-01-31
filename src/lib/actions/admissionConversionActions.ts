"use server";

import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logCreate } from "@/lib/utils/audit-log";
import { hashPassword } from "@/lib/password";

/**
 * Generate a unique admission ID for the student
 */
function generateAdmissionId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ADM${year}${random}`;
}

/**
 * Generate a temporary password for the student
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Split full name into first and last name
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Convert an accepted admission application to an enrolled student
 */
export async function convertAdmissionToStudent(
  applicationId: string,
  options?: {
    rollNumber?: string;
    sectionId?: string;
    sendCredentials?: boolean;
  }
) {
  try {
    // 1. Get the admission application
    const application = await db.admissionApplication.findUnique({
      where: { id: applicationId },
      include: {
        appliedClass: true,
      },
    });

    if (!application) {
      return {
        success: false,
        error: "Admission application not found",
      };
    }

    // Check if already converted
    if (application.studentId) {
      return {
        success: false,
        error: "This application has already been converted to a student",
      };
    }

    // Check if application is accepted
    if (application.status !== "ACCEPTED") {
      return {
        success: false,
        error: "Only accepted applications can be converted to students",
      };
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: application.parentEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: `A user with email ${application.parentEmail} already exists. Please use a different email.`,
      };
    }

    // 2. Generate credentials
    const { firstName, lastName } = splitName(application.studentName);
    const temporaryPassword = generateTemporaryPassword();
    let admissionId = generateAdmissionId();

    // Ensure admission ID is unique
    let existingStudent = await db.student.findUnique({
      where: { admissionId },
    });
    while (existingStudent) {
      admissionId = generateAdmissionId();
      existingStudent = await db.student.findUnique({
        where: { admissionId },
      });
    }

    // 3. Create user and student in database (transaction)
    const result = await db.$transaction(async (tx) => {
      // Hash the temporary password
      const hashedPassword = await hashPassword(temporaryPassword);

      // Create base user
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: application.parentEmail,
          firstName,
          lastName,
          phone: application.parentPhone,
          role: UserRole.STUDENT,
          active: true,
          password: hashedPassword,
          emailVerified: new Date(), // Admin-converted users are pre-verified
        },
      });

      // Create student profile with all data from application
      const student = await tx.student.create({
        data: {
          userId: user.id,
          schoolId: application.schoolId,
          admissionId,
          admissionDate: new Date(),
          rollNumber: options?.rollNumber,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          address: application.address,
          bloodGroup: application.bloodGroup,
          emergencyContact: application.parentPhone,
          phone: application.parentPhone,
          emergencyPhone: application.parentPhone,

          // Indian-specific fields
          aadhaarNumber: application.aadhaarNumber,
          abcId: application.abcId,
          nationality: application.nationality,
          religion: application.religion,
          caste: application.caste,
          category: application.category,
          motherTongue: application.motherTongue,
          birthPlace: application.birthPlace,
          previousSchool: application.previousSchool,
          tcNumber: application.tcNumber,
          medicalConditions: application.medicalConditions,
          specialNeeds: application.specialNeeds,

          // Parent/Guardian details
          fatherName: application.fatherName,
          fatherOccupation: application.fatherOccupation,
          fatherPhone: application.fatherPhone,
          fatherEmail: application.fatherEmail,
          fatherAadhaar: application.fatherAadhaar,
          motherName: application.motherName,
          motherOccupation: application.motherOccupation,
          motherPhone: application.motherPhone,
          motherEmail: application.motherEmail,
          motherAadhaar: application.motherAadhaar,
          guardianName: application.guardianName,
          guardianRelation: application.guardianRelation,
          guardianPhone: application.guardianPhone,
          guardianEmail: application.guardianEmail,
          guardianAadhaar: application.guardianAadhaar,
        },
      });

      // Create class enrollment if section is provided
      if (options?.sectionId) {
        await tx.classEnrollment.create({
          data: {
            studentId: student.id,
            schoolId: application.schoolId,
            classId: application.appliedClassId,
            sectionId: options.sectionId,
            rollNumber: options.rollNumber,
            status: "ACTIVE",
            enrollDate: new Date(),
          },
        });
      }

      // Link application to student
      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          studentId: student.id,
        },
      });

      // Create default student settings
      await tx.studentSettings.create({
        data: {
          studentId: student.id,
          schoolId: application.schoolId,
        },
      });

      // Log the creation
      await logCreate(
        user.id,
        'student',
        student.id,
        {
          email: application.parentEmail,
          firstName,
          lastName,
          admissionId,
          applicationNumber: application.applicationNumber,
          convertedFrom: 'admission_application',
        }
      );

      return { user, student, temporaryPassword };
    });

    // 5. Send credentials email (optional)
    if (options?.sendCredentials) {
      try {
        const { sendEmail, isEmailConfigured } = await import('@/lib/services/email-service');

        if (isEmailConfigured()) {
          await sendEmail({
            to: application.parentEmail,
            subject: 'Student Account Created - Login Credentials',
            html: `
              <h1>Welcome to Our School</h1>
              <p>Dear Parent/Guardian,</p>
              <p>The student account for <strong>${application.studentName}</strong> has been created successfully.</p>
              
              <h2>Login Credentials</h2>
              <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${application.parentEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Temporary Password:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${result.temporaryPassword}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Admission ID:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${admissionId}</td>
                </tr>
              </table>
              
              <p><strong>Important:</strong> Please change the password after your first login.</p>
              <p>You can access the student portal to view academic information, attendance, and more.</p>
              
              <br>
              <p>Best regards,<br>School Administration</p>
            `
          });
        }
      } catch (emailError) {
        console.error('Failed to send credentials email:', emailError);
        // Don't fail the conversion if email fails
      }
    }

    revalidatePath('/admin/admissions');
    revalidatePath('/admin/students');

    return {
      success: true,
      data: {
        student: result.student,
        user: result.user,
        credentials: {
          email: application.parentEmail,
          temporaryPassword: result.temporaryPassword,
          admissionId,
        },
      },
      message: "Student enrolled successfully",
    };
  } catch (error: any) {
    console.error("Error converting admission to student:", error);
    return {
      success: false,
      error: error.message || "Failed to convert admission to student. Please try again.",
    };
  }
}

/**
 * Bulk convert multiple accepted applications to students
 */
export async function bulkConvertAdmissionsToStudents(
  applicationIds: string[],
  options?: {
    sendCredentials?: boolean;
  }
) {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (const applicationId of applicationIds) {
    const result = await convertAdmissionToStudent(applicationId, {
      sendCredentials: options?.sendCredentials,
    });

    if (result.success) {
      results.successful.push(applicationId);
    } else {
      results.failed.push({
        id: applicationId,
        error: result.error || "Unknown error",
      });
    }
  }

  return {
    success: true,
    data: results,
    message: `Converted ${results.successful.length} applications. ${results.failed.length} failed.`,
  };
}

/**
 * Get student created from an admission application
 */
export async function getStudentFromApplication(applicationId: string) {
  try {
    const application = await db.admissionApplication.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
                active: true,
              },
            },
            enrollments: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return {
        success: false,
        error: "Admission application not found",
      };
    }

    return {
      success: true,
      data: application.student,
    };
  } catch (error) {
    console.error("Error fetching student from application:", error);
    return {
      success: false,
      error: "Failed to fetch student information",
    };
  }
}
