/**
 * Input sanitization utilities to prevent XSS and other injection attacks
 * Implements security requirements for user input handling
 */

/**
 * Sanitize text input to prevent XSS attacks
 * Removes or escapes potentially dangerous characters and HTML tags
 * 
 * @param input The input string to sanitize
 * @param options Sanitization options
 * @returns The sanitized string
 */
export function sanitizeText(
  input: string | null | undefined,
  options: {
    allowNewlines?: boolean;
    maxLength?: number;
    trim?: boolean;
  } = {}
): string {
  if (!input) return '';
  
  const {
    allowNewlines = true,
    maxLength = 5000,
    trim = true,
  } = options;
  
  let sanitized = input;
  
  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Escape special HTML characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove or escape control characters (except newlines if allowed)
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n\t]/g, ' ');
  }
  
  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize HTML content while allowing safe tags
 * Removes dangerous tags and attributes but preserves basic formatting
 * 
 * @param input The HTML string to sanitize
 * @param options Sanitization options
 * @returns The sanitized HTML string
 */
export function sanitizeHtml(
  input: string | null | undefined,
  options: {
    maxLength?: number;
  } = {}
): string {
  if (!input) return '';
  
  const { maxLength = 10000 } = options;
  
  let sanitized = input.trim();
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
    sanitized = sanitized.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
  });
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize alphanumeric input with optional special characters
 * 
 * @param input The input string to sanitize
 * @param allowedSpecialChars Additional characters to allow (e.g., "-_")
 * @returns The sanitized string
 */
export function sanitizeAlphanumeric(
  input: string | null | undefined,
  allowedSpecialChars: string = ''
): string {
  if (!input) return '';
  
  const sanitized = input.trim();
  
  // Create regex pattern
  const escapedSpecialChars = allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`[^a-zA-Z0-9${escapedSpecialChars}]`, 'g');
  
  return sanitized.replace(pattern, '');
}

/**
 * Sanitize email address
 * 
 * @param email The email to sanitize
 * @returns The sanitized email
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 * 
 * @param phone The phone number to sanitize
 * @returns The sanitized phone number
 */
export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except + at the start
  let sanitized = phone.trim();
  if (sanitized.startsWith('+')) {
    sanitized = '+' + sanitized.substring(1).replace(/\D/g, '');
  } else {
    sanitized = sanitized.replace(/\D/g, '');
  }
  
  return sanitized;
}

/**
 * Sanitize URL
 * 
 * @param url The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  const sanitized = url.trim();
  
  // Basic URL validation - must start with http:// or https://
  try {
    const urlObj = new URL(sanitized);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return '';
    }
    return sanitized;
  } catch {
    // If URL is invalid, return empty string
    return '';
  }
}

/**
 * Sanitize remarks field (allows newlines, limited length)
 * 
 * @param remarks The remarks text to sanitize
 * @returns The sanitized remarks
 */
export function sanitizeRemarks(remarks: string | null | undefined): string {
  return sanitizeText(remarks, {
    allowNewlines: true,
    maxLength: 1000,
    trim: true,
  });
}

/**
 * Sanitize rejection reason (allows newlines, limited length)
 * 
 * @param reason The rejection reason to sanitize
 * @returns The sanitized rejection reason
 */
export function sanitizeRejectionReason(reason: string | null | undefined): string {
  if (!reason) return '';
  
  const sanitized = sanitizeText(reason, {
    allowNewlines: true,
    maxLength: 500,
    trim: true,
  });
  
  // Ensure non-empty after sanitization
  if (sanitized.length === 0) {
    throw new Error('Rejection reason cannot be empty');
  }
  
  return sanitized;
}

/**
 * Sanitize transaction reference (no newlines, limited length)
 * 
 * @param transactionRef The transaction reference to sanitize
 * @returns The sanitized transaction reference
 */
export function sanitizeTransactionRef(transactionRef: string | null | undefined): string | null {
  if (!transactionRef) return null;
  
  const sanitized = sanitizeText(transactionRef, {
    allowNewlines: false,
    maxLength: 100,
    trim: true,
  });
  
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate and sanitize file name
 * Removes path traversal attempts and dangerous characters
 * 
 * @param fileName The file name to sanitize
 * @returns The sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'file';
  
  // Remove path separators and parent directory references
  let sanitized = fileName.replace(/[\/\\]/g, '_');
  sanitized = sanitized.replace(/\.\./g, '_');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove or replace special characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }
  
  return sanitized || 'file';
}

/**
 * Validate file content type matches extension
 * Prevents file type spoofing attacks
 * 
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileContent(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  // Check file extension matches MIME type
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  const extensionMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf'],
  };
  
  const expectedExtensions = extensionMap[mimeType];
  if (expectedExtensions) {
    const hasValidExtension = expectedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `File extension does not match content type. Expected: ${expectedExtensions.join(' or ')}`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Check if file appears to be a valid image by reading its header
 * This provides additional validation beyond MIME type checking
 * 
 * @param file The file to check
 * @returns Promise resolving to validation result
 */
export async function validateImageHeader(file: File): Promise<{ valid: boolean; error?: string }> {
  try {
    // Read first few bytes to check file signature
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check for common image file signatures
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { valid: true };
    }
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0D &&
      bytes[5] === 0x0A &&
      bytes[6] === 0x1A &&
      bytes[7] === 0x0A
    ) {
      return { valid: true };
    }
    
    // PDF: 25 50 44 46 (%PDF)
    if (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    ) {
      return { valid: true };
    }
    
    return {
      valid: false,
      error: 'File does not appear to be a valid image or PDF',
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate file content',
    };
  }
}

/**
 * Sanitize and validate all receipt upload data
 * 
 * @param data The receipt upload data
 * @returns The sanitized data
 */
export function sanitizeReceiptUploadData(data: {
  transactionRef?: string | null;
  remarks?: string | null;
  receiptImage: File;
}): {
  transactionRef: string | null;
  remarks: string | null;
  receiptImage: File;
} {
  return {
    transactionRef: sanitizeTransactionRef(data.transactionRef),
    remarks: sanitizeRemarks(data.remarks),
    receiptImage: data.receiptImage,
  };
}
