/**
 * File Security Utility
 * Validates and sanitizes file uploads to prevent security vulnerabilities
 * Requirements: 10.1, 10.5
 */

/**
 * Allowed file types and their MIME types
 */
export const ALLOWED_FILE_TYPES = {
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  
  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  
  // Text
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  
  // Archives
  "application/zip": [".zip"],
  "application/x-rar-compressed": [".rar"],
} as const;

/**
 * Maximum file sizes by category (in bytes)
 */
export const MAX_FILE_SIZES = {
  avatar: 5 * 1024 * 1024, // 5MB
  attachment: 10 * 1024 * 1024, // 10MB
  document: 20 * 1024 * 1024, // 20MB
  general: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
  ".msi",
  ".app",
  ".deb",
  ".rpm",
  ".sh",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".py",
  ".rb",
  ".pl",
];

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "";
  
  // Remove path separators and null bytes
  let sanitized = fileName
    .replace(/[\/\\]/g, "")
    .replace(/\0/g, "")
    .replace(/\.\./g, "");
  
  // Remove leading dots
  sanitized = sanitized.replace(/^\.+/, "");
  
  // Replace spaces with underscores
  sanitized = sanitized.replace(/\s+/g, "_");
  
  // Remove special characters except dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "");
  
  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = "file";
  }
  
  // Limit filename length (excluding extension)
  const parts = sanitized.split(".");
  const extension = parts.length > 1 ? "." + parts.pop() : "";
  const name = parts.join(".");
  const maxNameLength = 100;
  
  const truncatedName = name.length > maxNameLength 
    ? name.substring(0, maxNameLength) 
    : name;
  
  return truncatedName + extension;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? "." + parts[parts.length - 1] : "";
}

/**
 * Check if file extension is dangerous
 */
export function isDangerousExtension(fileName: string): boolean {
  const extension = getFileExtension(fileName);
  return DANGEROUS_EXTENSIONS.includes(extension);
}

/**
 * Validate file type against allowed MIME types
 */
export function isAllowedFileType(mimeType: string, fileName: string): boolean {
  const extension = getFileExtension(fileName);
  
  // Check if MIME type is in allowed list
  if (!(mimeType in ALLOWED_FILE_TYPES)) {
    return false;
  }
  
  // Check if extension matches the MIME type
  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  return (allowedExtensions as readonly string[]).includes(extension);
}

/**
 * Validate file size
 */
export function isValidFileSize(
  fileSize: number,
  category: keyof typeof MAX_FILE_SIZES = "general"
): boolean {
  const maxSize = MAX_FILE_SIZES[category];
  return fileSize > 0 && fileSize <= maxSize;
}

/**
 * Validate file upload
 * Returns validation result with error message if invalid
 */
export function validateFileUpload(
  file: File,
  category: keyof typeof MAX_FILE_SIZES = "general"
): { valid: boolean; error?: string } {
  // Check if file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }
  
  // Check filename
  if (!file.name || file.name.trim() === "") {
    return { valid: false, error: "Invalid filename" };
  }
  
  // Check for dangerous extensions
  if (isDangerousExtension(file.name)) {
    return { valid: false, error: "File type not allowed for security reasons" };
  }
  
  // Check file type
  if (!isAllowedFileType(file.type, file.name)) {
    return { valid: false, error: "File type not allowed" };
  }
  
  // Check file size
  if (!isValidFileSize(file.size, category)) {
    const maxSizeMB = MAX_FILE_SIZES[category] / (1024 * 1024);
    return { 
      valid: false, 
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
}

/**
 * Generate secure random filename
 * Preserves original extension but replaces name with random string
 */
export function generateSecureFileName(originalFileName: string): string {
  const extension = getFileExtension(originalFileName);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  return `${timestamp}_${randomString}${extension}`;
}

/**
 * Validate image file specifically
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  
  if (!imageTypes.includes(file.type)) {
    return { valid: false, error: "Only image files (JPEG, PNG, GIF, WebP) are allowed" };
  }
  
  return validateFileUpload(file, "avatar");
}

/**
 * Validate document file specifically
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  
  if (!documentTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: "Only document files (PDF, DOC, DOCX, XLS, XLSX) are allowed" 
    };
  }
  
  return validateFileUpload(file, "document");
}

/**
 * File signatures (magic numbers) for common file types
 * Used to verify file content matches declared MIME type
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  // Images
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  
  // Documents
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  
  // Office documents (ZIP-based)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [[0x50, 0x4B, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [[0x50, 0x4B, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [[0x50, 0x4B, 0x03, 0x04]],
  
  // Legacy Office documents
  "application/msword": [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  "application/vnd.ms-excel": [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  "application/vnd.ms-powerpoint": [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  
  // Archives
  "application/zip": [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
  "application/x-rar-compressed": [[0x52, 0x61, 0x72, 0x21, 0x1A, 0x07]],
};

/**
 * Check if file content matches its declared MIME type
 * This is a basic check using file signatures (magic numbers)
 */
export async function verifyFileSignature(file: File): Promise<boolean> {
  try {
    // Read first 16 bytes of the file (enough for most signatures)
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const expectedSignatures = FILE_SIGNATURES[file.type];
    
    if (!expectedSignatures) {
      // If we don't have a signature for this type, allow it
      // (for text files and other types without magic numbers)
      return true;
    }
    
    // Check if file starts with any of the expected signatures
    return expectedSignatures.some(signature => {
      return signature.every((byte, index) => bytes[index] === byte);
    });
  } catch (error) {
    console.error("Error verifying file signature:", error);
    return false;
  }
}

/**
 * Comprehensive file validation with signature check
 */
export async function validateFileUploadSecure(
  file: File,
  category: keyof typeof MAX_FILE_SIZES = "general"
): Promise<{ valid: boolean; error?: string }> {
  // Basic validation
  const basicValidation = validateFileUpload(file, category);
  
  if (!basicValidation.valid) {
    return basicValidation;
  }
  
  // Verify file signature
  const signatureValid = await verifyFileSignature(file);
  
  if (!signatureValid) {
    return { 
      valid: false, 
      error: "File content does not match its declared type" 
    };
  }
  
  return { valid: true };
}
