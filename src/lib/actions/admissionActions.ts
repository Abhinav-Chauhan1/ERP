"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import {
  admissionApplicationSchema,
  AdmissionApplicationFormValues
} from "../schemaValidation/admissionSchemaValidation";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sendAdmissionConfirmationEmail } from "@/lib/utils/email-service";

// Generate unique application number
function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `APP${year}${random}`;
}

// Get all classes for the admission form dropdown
export async function getAvailableClasses() {
  try {
    const classes = await db.class.findMany({
      where: {
        academicYear: {
          isCurrent: true,
        }
      },
      include: {
        academicYear: {
          select: {
            name: true,
          }
        },
      },
      orderBy: {
        name: 'asc',
      }
    });

    return classes;
  } catch (error) {
    console.error("Error fetching available classes:", error);
    throw new Error("Failed to fetch available classes");
  }
}

// Upload document to Cloudinary
export async function uploadAdmissionDocument(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: "admission-documents",
      resource_type: "auto",
    });

    return {
      success: true,
      data: {
        url: result.secure_url,
        filename: result.original_filename,
        type,
      },
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error: "Failed to upload document. Please try again.",
    };
  }
}

// Create admission application with documents
export async function createAdmissionApplication(
  data: AdmissionApplicationFormValues,
  documents?: Array<{ type: string; url: string; filename: string }>
) {
  try {
    // Validate the input data
    const validatedData = admissionApplicationSchema.parse(data);

    // Generate unique application number
    let applicationNumber = generateApplicationNumber();

    // Ensure uniqueness
    let exists = await db.admissionApplication.findUnique({
      where: { applicationNumber }
    });

    while (exists) {
      applicationNumber = generateApplicationNumber();
      exists = await db.admissionApplication.findUnique({
        where: { applicationNumber }
      });
    }

    // Create the admission application with documents
    const application = await db.admissionApplication.create({
      data: {
        applicationNumber,
        studentName: validatedData.studentName,
        dateOfBirth: validatedData.dateOfBirth,
        gender: validatedData.gender,
        parentName: validatedData.parentName,
        parentEmail: validatedData.parentEmail,
        parentPhone: validatedData.parentPhone,
        address: validatedData.address,
        previousSchool: validatedData.previousSchool,
        appliedClassId: validatedData.appliedClassId,

        // Indian-specific fields
        aadhaarNumber: validatedData.aadhaarNumber,
        abcId: validatedData.abcId,
        nationality: validatedData.nationality,
        religion: validatedData.religion,
        caste: validatedData.caste,
        category: validatedData.category,
        motherTongue: validatedData.motherTongue,
        birthPlace: validatedData.birthPlace,
        bloodGroup: validatedData.bloodGroup,
        tcNumber: validatedData.tcNumber,
        medicalConditions: validatedData.medicalConditions,
        specialNeeds: validatedData.specialNeeds,

        // Parent/Guardian details
        fatherName: validatedData.fatherName,
        fatherOccupation: validatedData.fatherOccupation,
        fatherPhone: validatedData.fatherPhone,
        fatherEmail: validatedData.fatherEmail,
        fatherAadhaar: validatedData.fatherAadhaar,
        motherName: validatedData.motherName,
        motherOccupation: validatedData.motherOccupation,
        motherPhone: validatedData.motherPhone,
        motherEmail: validatedData.motherEmail,
        motherAadhaar: validatedData.motherAadhaar,
        guardianName: validatedData.guardianName,
        guardianRelation: validatedData.guardianRelation,
        guardianPhone: validatedData.guardianPhone,
        guardianEmail: validatedData.guardianEmail,
        guardianAadhaar: validatedData.guardianAadhaar,
        annualIncome: validatedData.annualIncome,

        status: "SUBMITTED",
        documents: documents && documents.length > 0 ? {
          create: documents.map(doc => ({
            type: doc.type as any,
            url: doc.url,
            filename: doc.filename,
          }))
        } : undefined,
      },
      include: {
        appliedClass: {
          select: {
            name: true,
          }
        },
        documents: true,
      }
    });

    // Send confirmation email to parent
    try {
      await sendAdmissionConfirmationEmail(
        validatedData.parentEmail,
        validatedData.parentName,
        validatedData.studentName,
        applicationNumber,
        application.appliedClass.name
      );
    } catch (emailError) {
      // Log email error but don't fail the application submission
      console.error("Failed to send confirmation email:", emailError);
      // Application was created successfully, so we still return success
    }

    return {
      success: true,
      data: application,
      message: "Application submitted successfully",
    };
  } catch (error) {
    console.error("Error creating admission application:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Failed to submit application. Please try again.",
    };
  }
}

// Get admission application by application number (for verification)
export async function getAdmissionApplicationByNumber(applicationNumber: string) {
  try {
    const application = await db.admissionApplication.findUnique({
      where: { applicationNumber },
      include: {
        appliedClass: {
          select: {
            name: true,
          }
        },
        documents: true,
      }
    });

    return application;
  } catch (error) {
    console.error("Error fetching admission application:", error);
    throw new Error("Failed to fetch admission application");
  }
}

// Admin: Get all admission applications with filters and pagination
export async function getAdmissionApplications(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  classId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by student name, parent name, or application number
    if (options.search) {
      where.OR = [
        { studentName: { contains: options.search, mode: 'insensitive' } },
        { parentName: { contains: options.search, mode: 'insensitive' } },
        { applicationNumber: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Filter by status
    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    // Filter by class
    if (options.classId) {
      where.appliedClassId = options.classId;
    }

    // Filter by date range
    if (options.startDate || options.endDate) {
      where.submittedAt = {};
      if (options.startDate) {
        where.submittedAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.submittedAt.lte = options.endDate;
      }
    }

    // Get total count
    const total = await db.admissionApplication.count({ where });

    // Get applications
    const applications = await db.admissionApplication.findMany({
      where,
      include: {
        appliedClass: {
          select: {
            name: true,
          }
        },
        documents: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching admission applications:", error);
    throw new Error("Failed to fetch admission applications");
  }
}

// Admin: Get single admission application by ID
export async function getAdmissionApplicationById(id: string) {
  try {
    const application = await db.admissionApplication.findUnique({
      where: { id },
      include: {
        appliedClass: {
          select: {
            name: true,
            academicYear: {
              select: {
                name: true,
              }
            }
          }
        },
        documents: true,
      }
    });

    return application;
  } catch (error) {
    console.error("Error fetching admission application:", error);
    throw new Error("Failed to fetch admission application");
  }
}

// Admin: Update application status (accept, reject, waitlist)
export async function updateApplicationStatus(
  applicationId: string,
  status: "ACCEPTED" | "REJECTED" | "WAITLISTED" | "UNDER_REVIEW",
  remarks?: string,
  reviewedBy?: string
) {
  try {
    const application = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status,
        remarks,
        reviewedBy,
        reviewedAt: new Date(),
      },
      include: {
        appliedClass: {
          select: {
            name: true,
          }
        },
      }
    });

    // Send notification email based on status
    try {
      const { sendEmail, isEmailConfigured } = await import('@/lib/services/email-service');

      if (isEmailConfigured()) {
        if (status === "ACCEPTED") {
          await sendEmail({
            to: application.parentEmail,
            subject: `Admission Application Accepted - ${application.studentName}`,
            html: `
              <h1>Congratulations!</h1>
              <p>Dear ${application.parentName},</p>
              <p>We are pleased to inform you that the admission application for <strong>${application.studentName}</strong> 
              for Class <strong>${application.appliedClass.name}</strong> has been <span style="color: green;"><strong>ACCEPTED</strong></span>.</p>
              
              <p>Application Number: <strong>${application.applicationNumber}</strong></p>
              
              <h2>Next Steps</h2>
              <ul>
                <li>Please visit the school administration office to complete the enrollment process</li>
                <li>Bring all original documents for verification</li>
                <li>Complete the fee payment as per the schedule provided</li>
              </ul>
              
              ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
              
              <p>We look forward to welcoming ${application.studentName} to our school!</p>
              <br>
              <p>Best regards,<br>School Administration</p>
            `
          });
        } else if (status === "REJECTED") {
          await sendEmail({
            to: application.parentEmail,
            subject: `Admission Application Update - ${application.studentName}`,
            html: `
              <h1>Admission Application Update</h1>
              <p>Dear ${application.parentName},</p>
              <p>We regret to inform you that the admission application for <strong>${application.studentName}</strong> 
              for Class <strong>${application.appliedClass.name}</strong> could not be accepted at this time.</p>
              
              <p>Application Number: <strong>${application.applicationNumber}</strong></p>
              
              ${remarks ? `<p><strong>Reason:</strong> ${remarks}</p>` : ''}
              
              <p>We appreciate your interest in our school and wish ${application.studentName} all the best for the future.</p>
              <br>
              <p>Best regards,<br>School Administration</p>
            `
          });
        } else if (status === "WAITLISTED") {
          await sendEmail({
            to: application.parentEmail,
            subject: `Admission Application Waitlisted - ${application.studentName}`,
            html: `
              <h1>Application Waitlisted</h1>
              <p>Dear ${application.parentName},</p>
              <p>The admission application for <strong>${application.studentName}</strong> 
              for Class <strong>${application.appliedClass.name}</strong> has been <strong>WAITLISTED</strong>.</p>
              
              <p>Application Number: <strong>${application.applicationNumber}</strong></p>
              
              <p>This means your application is on hold and will be considered if seats become available.</p>
              <p>We will notify you of any updates regarding your application status.</p>
              
              ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
              
              <br>
              <p>Best regards,<br>School Administration</p>
            `
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send status email:", emailError);
      // Don't fail the status update if email fails
    }

    return {
      success: true,
      data: application,
      message: `Application ${status.toLowerCase()} successfully`,
    };
  } catch (error) {
    console.error("Error updating application status:", error);
    return {
      success: false,
      error: "Failed to update application status. Please try again.",
    };
  }
}

// Admin: Add or update remarks
export async function updateApplicationRemarks(
  applicationId: string,
  remarks: string
) {
  try {
    const application = await db.admissionApplication.update({
      where: { id: applicationId },
      data: {
        remarks,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: application,
      message: "Remarks updated successfully",
    };
  } catch (error) {
    console.error("Error updating remarks:", error);
    return {
      success: false,
      error: "Failed to update remarks. Please try again.",
    };
  }
}

// Admin: Get application statistics
export async function getAdmissionStatistics() {
  try {
    const [
      total,
      submitted,
      underReview,
      accepted,
      rejected,
      waitlisted,
    ] = await Promise.all([
      db.admissionApplication.count(),
      db.admissionApplication.count({ where: { status: 'SUBMITTED' } }),
      db.admissionApplication.count({ where: { status: 'UNDER_REVIEW' } }),
      db.admissionApplication.count({ where: { status: 'ACCEPTED' } }),
      db.admissionApplication.count({ where: { status: 'REJECTED' } }),
      db.admissionApplication.count({ where: { status: 'WAITLISTED' } }),
    ]);

    return {
      total,
      submitted,
      underReview,
      accepted,
      rejected,
      waitlisted,
    };
  } catch (error) {
    console.error("Error fetching admission statistics:", error);
    throw new Error("Failed to fetch admission statistics");
  }
}
