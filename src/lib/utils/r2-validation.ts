/**
 * R2 Configuration Validation Utilities
 * 
 * This module provides validation functions for R2 configuration and operations:
 * - Environment variable validation
 * - Connection testing
 * - File type and size validation
 * - School isolation validation
 */

import { z } from 'zod';
import { defaultUploadConfig, type ValidationResult } from '../config/r2-config';

/**
 * Validate file type and size according to upload configuration
 * 
 * @param file - File to validate (with name, size, and type properties)
 * @param type - Expected file type category
 * @returns Validation result
 */
export function validateFile(
  file: { name: string; size: number; type: string },
  type?: 'image' | 'document'
): ValidationResult {
  const config = defaultUploadConfig;

  // Determine file type if not specified
  if (!type) {
    if (config.allowedImageTypes.includes(file.type)) {
      type = 'image';
    } else if (config.allowedDocumentTypes.includes(file.type)) {
      type = 'document';
    } else {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}`,
      };
    }
  }

  // Validate file type
  const allowedTypes = type === 'image' 
    ? config.allowedImageTypes 
    : config.allowedDocumentTypes;

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid ${type} type. Allowed types: ${allowedTypes.join(', ')}`,
      fileType: type,
    };
  }

  // Validate file size
  const maxSize = type === 'image' ? config.maxImageSize : config.maxDocumentSize;
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit for ${type}s`,
      fileType: type,
    };
  }

  return {
    isValid: true,
    fileType: type,
  };
}

/**
 * Validate school ID format
 * 
 * @param schoolId - School identifier to validate
 * @returns True if valid, false otherwise
 */
export function validateSchoolId(schoolId: string): boolean {
  // School ID should be a non-empty string with alphanumeric characters and hyphens
  const schoolIdRegex = /^[a-zA-Z0-9-]+$/;
  return schoolIdRegex.test(schoolId) && schoolId.length > 0;
}

/**
 * Validate folder name for school structure
 * 
 * @param folder - Folder name to validate
 * @returns True if valid, false otherwise
 */
export function validateFolderName(folder: string): boolean {
  // Folder names should be alphanumeric with hyphens and underscores
  const folderRegex = /^[a-zA-Z0-9-_]+$/;
  return folderRegex.test(folder) && folder.length > 0;
}

/**
 * Validate filename for safe storage
 * 
 * @param filename - Filename to validate
 * @returns True if valid, false otherwise
 */
export function validateFilename(filename: string): boolean {
  // Filenames should not contain path separators or special characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  return !invalidChars.test(filename) && filename.length > 0 && filename.length <= 255;
}

/**
 * Sanitize filename for safe storage
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .replace(/(_)(\.)/, '$2') // Remove underscore before file extension
    .substring(0, 255); // Limit length
}

/**
 * Validate R2 key format for school isolation
 * 
 * @param key - R2 object key
 * @param expectedSchoolId - Expected school ID
 * @returns True if key follows school isolation pattern
 */
export function validateSchoolKey(key: string, expectedSchoolId: string): boolean {
  const expectedPrefix = `school-${expectedSchoolId}/`;
  return key.startsWith(expectedPrefix);
}

/**
 * Extract components from R2 key
 * 
 * @param key - R2 object key
 * @returns Key components or null if invalid
 */
export function parseSchoolKey(key: string): {
  schoolId: string;
  folder: string;
  filename: string;
} | null {
  const match = key.match(/^school-([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) {
    return null;
  }

  return {
    schoolId: match[1],
    folder: match[2],
    filename: match[3],
  };
}

/**
 * Validate environment variables for R2 configuration
 * 
 * @returns Validation result with missing variables
 */
export function validateR2Environment(): {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
} {
  const requiredVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ];

  const optionalVars = [
    'R2_REGION',
    'R2_ENDPOINT',
    'R2_CUSTOM_DOMAIN',
  ];

  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Check optional variables and provide warnings
  if (!process.env.R2_CUSTOM_DOMAIN) {
    warnings.push('R2_CUSTOM_DOMAIN not set - files will use R2 endpoint URLs');
  }

  if (!process.env.R2_REGION) {
    warnings.push('R2_REGION not set - using default "auto" region');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
  };
}

/**
 * Generate validation report for R2 setup
 * 
 * @returns Detailed validation report
 */
export function generateValidationReport(): {
  environment: ReturnType<typeof validateR2Environment>;
  recommendations: string[];
} {
  const environment = validateR2Environment();
  const recommendations: string[] = [];

  if (!environment.isValid) {
    recommendations.push('Set all required R2 environment variables before proceeding');
  }

  if (!process.env.R2_CUSTOM_DOMAIN) {
    recommendations.push('Consider setting up a custom domain for better URL appearance');
  }

  if (process.env.NODE_ENV === 'production') {
    recommendations.push('Ensure R2 credentials are properly secured in production');
    recommendations.push('Configure proper CORS settings for your domain');
    recommendations.push('Set up monitoring for R2 storage usage and costs');
  }

  return {
    environment,
    recommendations,
  };
}