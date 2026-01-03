"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Schema for certificate upload
const certificateSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  issuedBy: z.string().min(2, { message: "Issuer name is required" }),
  issueDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date"
  }),
  category: z.string().min(1, { message: "Please select a category" }),
  imageFile: z.any().optional(),
  imageUrl: z.string().url().optional(),
});

// Schema for award upload
const awardSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  presenter: z.string().min(2, { message: "Presenter name is required" }),
  awardDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date"
  }),
  category: z.string().min(1, { message: "Please select a category" }),
  imageFile: z.any().optional(),
  imageUrl: z.string().url().optional(),
});

// Schema for extra-curricular activities
const extraCurricularSchema = z.object({
  activity: z.string().min(3, { message: "Activity name must be at least 3 characters" }),
  role: z.string().min(2, { message: "Role is required" }),
  duration: z.string().min(2, { message: "Duration is required" }),
  achievements: z.string().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
});

type CertificateValues = z.infer<typeof certificateSchema>;
type AwardValues = z.infer<typeof awardSchema>;
type ExtraCurricularValues = z.infer<typeof extraCurricularSchema>;

/**
 * Get the current student
 */
async function getCurrentStudent() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!dbUser || dbUser.role !== UserRole.STUDENT) {
    return null;
  }

  const student = await db.student.findUnique({
    where: {
      userId: dbUser.id
    }
  });

  return { student, dbUser };
}

/**
 * Get student achievements from document storage
 */
export async function getStudentAchievements() {
  const result = await getCurrentStudent();

  if (!result) {
    redirect("/login");
  }

  // Get achievement document types
  await ensureDocumentTypes();

  // Get certificate type
  const certificateType = await db.documentType.findFirst({
    where: {
      name: "Certificate"
    }
  });

  // Get award type
  const awardType = await db.documentType.findFirst({
    where: {
      name: "Award"
    }
  });

  // Get extra-curricular type
  const activityType = await db.documentType.findFirst({
    where: {
      name: "Extra-Curricular"
    }
  });

  // Get all certificates for this student
  const certificateDocs = await db.document.findMany({
    where: {
      userId: result.dbUser.id,
      documentTypeId: certificateType?.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get all awards for this student
  const awardDocs = await db.document.findMany({
    where: {
      userId: result.dbUser.id,
      documentTypeId: awardType?.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get all activities for this student
  const activityDocs = await db.document.findMany({
    where: {
      userId: result.dbUser.id,
      documentTypeId: activityType?.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Parse document metadata into proper objects
  const certificates = certificateDocs.map(doc => {
    const metadata = parseDocMetadata(doc.description || "{}");
    return {
      id: doc.id,
      title: doc.title,
      description: metadata.description || "",
      issueDate: metadata.issueDate ? new Date(metadata.issueDate) : new Date(),
      issuedBy: metadata.issuedBy || "Unknown",
      category: metadata.category || "Academic",
      imageUrl: doc.fileUrl
    };
  });

  const awards = awardDocs.map(doc => {
    const metadata = parseDocMetadata(doc.description || "{}");
    return {
      id: doc.id,
      title: doc.title,
      description: metadata.description || "",
      awardDate: metadata.awardDate ? new Date(metadata.awardDate) : new Date(),
      presenter: metadata.presenter || "Unknown",
      category: metadata.category || "Academic"
    };
  });

  const extraCurricular = activityDocs.map(doc => {
    const metadata = parseDocMetadata(doc.description || "{}");
    return {
      id: doc.id,
      activity: doc.title,
      role: metadata.role || "Member",
      duration: metadata.duration || "2023",
      achievements: metadata.achievements || "",
      category: metadata.category || "Academic"
    };
  });

  // Get achievement categories
  const categories = {
    certificate: ["Academic", "Competition", "Professional", "Course Completion", "Special Achievement"],
    award: ["Academic", "Sports", "Arts", "Leadership", "Community Service"],
    extraCurricular: ["Academic", "Sports", "Arts", "Leadership", "Service", "Cultural"]
  };

  return {
    user: result.dbUser,
    student: result.student,
    certificates,
    awards,
    extraCurricular,
    categories
  };
}

/**
 * Add a certificate
 */
export async function addCertificate(values: CertificateValues) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Validate data
    const validatedData = certificateSchema.parse(values);

    // Handle image upload if provided
    let imageUrl = validatedData.imageUrl;
    if (validatedData.imageFile && validatedData.imageFile instanceof File) {
      const uploadResult = await uploadToCloudinary(validatedData.imageFile, {
        folder: `students/${result.student?.id}/certificates`,
      });
      imageUrl = uploadResult.secure_url;
    }

    // Get or create certificate document type
    await ensureDocumentTypes();
    const certificateType = await db.documentType.findFirst({
      where: { name: "Certificate" }
    });

    if (!certificateType) {
      return { success: false, message: "Certificate document type not found" };
    }

    // Create metadata object
    const metadata = {
      description: validatedData.description,
      issueDate: validatedData.issueDate,
      issuedBy: validatedData.issuedBy,
      category: validatedData.category
    };

    // Store as document
    await db.document.create({
      data: {
        title: validatedData.title,
        description: JSON.stringify(metadata),
        fileName: `certificate-${Date.now()}.json`,
        fileUrl: imageUrl || "",
        fileType: "application/json",
        userId: result.dbUser.id,
        documentTypeId: certificateType.id,
        tags: validatedData.category
      }
    });

    revalidatePath("/student/achievements");
    return { success: true, message: "Certificate added successfully" };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid certificate data"
      };
    }

    console.error(error);
    return {
      success: false,
      message: "Failed to add certificate"
    };
  }
}

/**
 * Add an award
 */
export async function addAward(values: AwardValues) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Validate data
    const validatedData = awardSchema.parse(values);

    // Handle image upload if provided
    let imageUrl = validatedData.imageUrl;
    if (validatedData.imageFile && validatedData.imageFile instanceof File) {
      const uploadResult = await uploadToCloudinary(validatedData.imageFile, {
        folder: `students/${result.student?.id}/awards`,
      });
      imageUrl = uploadResult.secure_url;
    }

    // Get or create award document type
    await ensureDocumentTypes();
    const awardType = await db.documentType.findFirst({
      where: { name: "Award" }
    });

    if (!awardType) {
      return { success: false, message: "Award document type not found" };
    }

    // Create metadata object
    const metadata = {
      description: validatedData.description,
      awardDate: validatedData.awardDate,
      presenter: validatedData.presenter,
      category: validatedData.category
    };

    // Store as document
    await db.document.create({
      data: {
        title: validatedData.title,
        description: JSON.stringify(metadata),
        fileName: `award-${Date.now()}.json`,
        fileUrl: imageUrl || "",
        fileType: "application/json",
        userId: result.dbUser.id,
        documentTypeId: awardType.id,
        tags: validatedData.category
      }
    });

    revalidatePath("/student/achievements");
    return { success: true, message: "Award added successfully" };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid award data"
      };
    }

    console.error(error);
    return {
      success: false,
      message: "Failed to add award"
    };
  }
}

/**
 * Add extra-curricular activity
 */
export async function addExtraCurricular(values: ExtraCurricularValues) {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Validate data
    const validatedData = extraCurricularSchema.parse(values);

    // Get or create activity document type
    await ensureDocumentTypes();
    const activityType = await db.documentType.findFirst({
      where: { name: "Extra-Curricular" }
    });

    if (!activityType) {
      return { success: false, message: "Activity document type not found" };
    }

    // Create metadata object
    const metadata = {
      role: validatedData.role,
      duration: validatedData.duration,
      achievements: validatedData.achievements,
      category: validatedData.category
    };

    // Store as document
    await db.document.create({
      data: {
        title: validatedData.activity,
        description: JSON.stringify(metadata),
        fileName: `activity-${Date.now()}.json`,
        fileUrl: "",
        fileType: "application/json",
        userId: result.dbUser.id,
        documentTypeId: activityType.id,
        tags: validatedData.category
      }
    });

    revalidatePath("/student/achievements");
    return { success: true, message: "Activity added successfully" };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid activity data"
      };
    }

    console.error(error);
    return {
      success: false,
      message: "Failed to add activity"
    };
  }
}

/**
 * Delete an achievement
 */
export async function deleteAchievement(id: string, type: 'certificate' | 'award' | 'extraCurricular') {
  const result = await getCurrentStudent();

  if (!result) {
    return { success: false, message: "Authentication required" };
  }

  try {
    // Find the document
    const document = await db.document.findUnique({
      where: { id }
    });

    if (!document) {
      return { success: false, message: "Achievement not found" };
    }

    // Ensure it belongs to the student
    if (document.userId !== result.dbUser.id) {
      return { success: false, message: "You can only delete your own achievements" };
    }

    // Delete the document
    await db.document.delete({
      where: { id }
    });

    revalidatePath("/student/achievements");
    return { success: true, message: `${type} deleted successfully` };

  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: `Failed to delete ${type}`
    };
  }
}

/**
 * Ensure document types exist
 */
async function ensureDocumentTypes() {
  const requiredTypes = ["Certificate", "Award", "Extra-Curricular"];

  for (const typeName of requiredTypes) {
    const existingType = await db.documentType.findFirst({
      where: { name: typeName }
    });

    if (!existingType) {
      await db.documentType.create({
        data: {
          name: typeName,
          description: `${typeName} documents for student achievements`
        }
      });
    }
  }
}

/**
 * Parse document metadata
 */
function parseDocMetadata(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return {};
  }
}
