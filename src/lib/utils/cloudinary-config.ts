/**
 * Cloudinary Configuration Utility
 * Manages upload presets, folder structure, and signed URLs
 * Requirements: 1.2, 9.5
 */

/**
 * Cloudinary folder structure for organized file storage
 */
export const CLOUDINARY_FOLDERS = {
  // User-specific folders
  AVATARS: "avatars",
  DOCUMENTS: "documents",
  CERTIFICATES: "certificates",
  
  // Teacher-specific folders
  TEACHER_DOCUMENTS: "teacher/documents",
  TEACHER_ACHIEVEMENTS: "teacher/achievements",
  LESSON_PLANS: "teacher/lesson-plans",
  TEACHING_MATERIALS: "teacher/materials",
  
  // Student-specific folders
  STUDENT_DOCUMENTS: "student/documents",
  STUDENT_ASSIGNMENTS: "student/assignments",
  STUDENT_PHOTOS: "student/photos",
  
  // Admin-specific folders
  ADMIN_DOCUMENTS: "admin/documents",
  SCHOOL_BRANDING: "admin/branding",
  
  // General folders
  ANNOUNCEMENTS: "announcements",
  EVENTS: "events",
  LIBRARY: "library",
  UPLOADS: "uploads",
} as const;

/**
 * Cloudinary upload presets configuration
 * These should be configured in Cloudinary dashboard
 */
export const CLOUDINARY_UPLOAD_PRESETS = {
  // Image presets
  AVATAR: "avatar_preset", // Small images, auto-crop, face detection
  PHOTO: "photo_preset", // Medium images, auto-optimize
  
  // Document presets
  DOCUMENT: "document_preset", // PDFs, Office files
  CERTIFICATE: "certificate_preset", // High-quality PDFs
  
  // General preset
  GENERAL: "erp_uploads", // Default preset for all file types
} as const;

/**
 * Get Cloudinary folder path for a specific user and category
 */
export function getCloudinaryFolder(
  userId: string,
  category: keyof typeof CLOUDINARY_FOLDERS
): string {
  const baseFolder = CLOUDINARY_FOLDERS[category];
  return `${baseFolder}/${userId}`;
}

/**
 * Get Cloudinary upload preset for a file category
 */
export function getCloudinaryPreset(
  category: "avatar" | "document" | "certificate" | "photo" | "general"
): string {
  const presetMap = {
    avatar: CLOUDINARY_UPLOAD_PRESETS.AVATAR,
    document: CLOUDINARY_UPLOAD_PRESETS.DOCUMENT,
    certificate: CLOUDINARY_UPLOAD_PRESETS.CERTIFICATE,
    photo: CLOUDINARY_UPLOAD_PRESETS.PHOTO,
    general: CLOUDINARY_UPLOAD_PRESETS.GENERAL,
  };
  
  return presetMap[category] || CLOUDINARY_UPLOAD_PRESETS.GENERAL;
}

/**
 * Generate a signed URL for secure file access
 * This should be done server-side with Cloudinary API credentials
 */
export function generateSignedUrl(
  publicId: string,
  options: {
    expiresIn?: number; // Expiration time in seconds
    transformation?: string;
    resourceType?: "image" | "video" | "raw";
  } = {}
): string {
  const {
    expiresIn = 3600, // Default 1 hour
    transformation = "",
    resourceType = "image",
  } = options;
  
  // In production, this should use Cloudinary's SDK to generate signed URLs
  // For now, return the basic URL structure
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  
  // Note: Actual signature generation requires API secret (server-side only)
  const baseUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload`;
  const transformationPart = transformation ? `${transformation}/` : "";
  
  return `${baseUrl}/${transformationPart}${publicId}`;
}

/**
 * Cloudinary transformation presets for common use cases
 */
export const CLOUDINARY_TRANSFORMATIONS = {
  // Avatar transformations
  AVATAR_SMALL: "w_100,h_100,c_fill,g_face",
  AVATAR_MEDIUM: "w_200,h_200,c_fill,g_face",
  AVATAR_LARGE: "w_400,h_400,c_fill,g_face",
  
  // Thumbnail transformations
  THUMB_SMALL: "w_150,h_150,c_fit",
  THUMB_MEDIUM: "w_300,h_300,c_fit",
  THUMB_LARGE: "w_600,h_600,c_fit",
  
  // Document preview transformations
  PDF_PREVIEW: "w_800,pg_1,f_jpg",
  PDF_THUMBNAIL: "w_200,pg_1,f_jpg",
  
  // Optimization transformations
  AUTO_OPTIMIZE: "q_auto,f_auto",
  COMPRESS: "q_auto:low,f_auto",
} as const;

/**
 * Apply transformation to a Cloudinary URL
 */
export function applyTransformation(
  url: string,
  transformation: keyof typeof CLOUDINARY_TRANSFORMATIONS | string
): string {
  if (!url || !url.includes("cloudinary")) return url;
  
  const transformationString = 
    transformation in CLOUDINARY_TRANSFORMATIONS
      ? CLOUDINARY_TRANSFORMATIONS[transformation as keyof typeof CLOUDINARY_TRANSFORMATIONS]
      : transformation;
  
  return url.replace("/upload/", `/upload/${transformationString}/`);
}

/**
 * Validate Cloudinary configuration
 */
export function validateCloudinaryConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    errors.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured");
  }
  
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
    errors.push("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not configured");
  }
  
  // Server-side only checks (these should not be in NEXT_PUBLIC_*)
  if (typeof window === "undefined") {
    if (!process.env.CLOUDINARY_API_KEY) {
      errors.push("CLOUDINARY_API_KEY is not configured (server-side)");
    }
    
    if (!process.env.CLOUDINARY_API_SECRET) {
      errors.push("CLOUDINARY_API_SECRET is not configured (server-side)");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get file access URL with optional transformation
 * For public files, returns direct URL
 * For private files, should generate signed URL (server-side)
 */
export function getFileAccessUrl(
  publicId: string,
  options: {
    transformation?: keyof typeof CLOUDINARY_TRANSFORMATIONS | string;
    resourceType?: "image" | "video" | "raw";
    secure?: boolean;
  } = {}
): string {
  const {
    transformation,
    resourceType = "image",
    secure = true,
  } = options;
  
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const protocol = secure ? "https" : "http";
  const baseUrl = `${protocol}://res.cloudinary.com/${cloudName}/${resourceType}/upload`;
  
  let transformationPart = "";
  if (transformation) {
    transformationPart = transformation in CLOUDINARY_TRANSFORMATIONS
      ? CLOUDINARY_TRANSFORMATIONS[transformation as keyof typeof CLOUDINARY_TRANSFORMATIONS]
      : transformation;
    transformationPart = `${transformationPart}/`;
  }
  
  return `${baseUrl}/${transformationPart}${publicId}`;
}
