"use server";

import { withSchoolAuthAction } from "@/lib/auth/security-wrapper";
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
export const getAvailableClasses = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const classes = await db.class.findMany({
      where: {
        schoolId,
        academicYear: {
          isCurrent: true
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
});

// Upload document to Cloudinary
export const uploadAdmissionDocument = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, formData: FormData) => {
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
});

// Create admission application with documents
export const createAdmissionApplication = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  data: AdmissionApplicationFormValues,
  documents?: Array<{ type: string; url: string; filename: string }>
) => {
  try {
    // Validate the input data
    const validatedData = admissionApplicationSchema.parse(data);

    // Generate unique application number
    let applicationNumber = generateApplicationNumber();

    // Ensure uniqueness
    let exists = await db.admissionApplication.findUnique({
      where: {
        schoolId,
        applicationNumber
      }
    });

    while (exists) {
      applicationNumber = generateApplicationNumber();
      exists = await db.admissionApplication.findUnique({
        where: {
          schoolId,
          applicationNumber
        }
      });
    }

    // Create the admission application with documents
    const application = await db.admissionApplication.create({
      data: {
        schoolId, // Enable multi-tenancy
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
            schoolId, // Enable multi-tenancy for nested creates
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
      console.error("Failed to send confirmation email:", emailError);
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
});

// Get admission application by application number (for verification)
export const getAdmissionApplicationByNumber = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, applicationNumber: string) => {
  try {
    const application = await db.admissionApplication.findUnique({
      where: {
        schoolId,
        applicationNumber
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

    return application;
  } catch (error) {
    console.error("Error fetching admission application:", error);
    throw new Error("Failed to fetch admission application");
  }
});

// Admin: Get all admission applications with filters and pagination
export const getAdmissionApplications = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  classId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  try {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { schoolId }; // Ensure scoped

    if (options.search) {
      where.OR = [
        { studentName: { contains: options.search, mode: 'insensitive' } },
        { parentName: { contains: options.search, mode: 'insensitive' } },
        { applicationNumber: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    if (options.classId) {
      where.appliedClassId = options.classId;
    }

    if (options.startDate || options.endDate) {
      where.submittedAt = {};
      if (options.startDate) {
        where.submittedAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.submittedAt.lte = options.endDate;
      }
    }

    const total = await db.admissionApplication.count({ where });

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
});

// Admin: Get single admission application by ID
export const getAdmissionApplicationById = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string, id: string) => {
  try {
    const application = await db.admissionApplication.findUnique({
      where: {
        schoolId,
        id
      },
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
});

// Admin: Update application status
export const updateApplicationStatus = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  applicationId: string,
  status: "ACCEPTED" | "REJECTED" | "WAITLISTED" | "UNDER_REVIEW",
  remarks?: string,
  reviewedBy?: string
) => {
  try {
    const application = await db.admissionApplication.update({
      where: {
        schoolId,
        id: applicationId
      },
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

    // Send notification email
    try {
      const { sendEmail, isEmailConfigured } = await import('@/lib/services/email-service');

      if (isEmailConfigured()) {
        const { getAdmissionStatusEmailHtml } = await import('@/lib/utils/email-templates');

        if (status === "ACCEPTED" || status === "REJECTED" || status === "WAITLISTED") {
          const emailData = getAdmissionStatusEmailHtml({
            parentName: application.parentName,
            studentName: application.studentName,
            applicationNumber: application.applicationNumber,
            appliedClass: application.appliedClass.name,
            status,
            remarks
          });

          await sendEmail({
            to: [application.parentEmail],
            subject: emailData.subject,
            html: emailData.html
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send status email:", emailError);
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
});

// Admin: Add or update remarks
export const updateApplicationRemarks = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string,
  applicationId: string,
  remarks: string
) => {
  try {
    const application = await db.admissionApplication.update({
      where: {
        schoolId,
        id: applicationId
      },
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
});

// Admin: Get application statistics
export const getAdmissionStatistics = withSchoolAuthAction(async (schoolId: string, userId: string, userRole: string) => {
  try {
    const [
      total,
      submitted,
      underReview,
      accepted,
      rejected,
      waitlisted,
    ] = await Promise.all([
      db.admissionApplication.count({ where: { schoolId } }),
      db.admissionApplication.count({ where: { schoolId, status: 'SUBMITTED' } }),
      db.admissionApplication.count({ where: { schoolId, status: 'UNDER_REVIEW' } }),
      db.admissionApplication.count({ where: { schoolId, status: 'ACCEPTED' } }),
      db.admissionApplication.count({ where: { schoolId, status: 'REJECTED' } }),
      db.admissionApplication.count({ where: { schoolId, status: 'WAITLISTED' } }),
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
});
