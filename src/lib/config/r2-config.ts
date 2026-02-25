/**
 * Cloudflare R2 Storage Configuration
 * 
 * This configuration manages R2 storage settings including:
 * - S3-compatible client configuration
 * - Bucket settings and CORS configuration
 * - CDN and custom domain settings
 * - File upload limits and validation rules
 */

import { z } from 'zod';

// Environment variable validation schema
const R2ConfigSchema = z.object({
  accountId: z.string().min(1, 'R2_ACCOUNT_ID is required').optional(),
  accessKeyId: z.string().min(1, 'R2_ACCESS_KEY_ID is required').optional(),
  secretAccessKey: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required').optional(),
  bucketName: z.string().min(1, 'R2_BUCKET_NAME is required').optional(),
  region: z.string().default('auto'),
  endpoint: z.string().optional(),
  customDomain: z.string().optional(),
});

// R2 configuration interface
export interface R2Config {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  region: string;
  endpoint?: string;
  customDomain?: string;
  isConfigured: boolean;
}

// Upload configuration interface
export interface UploadConfig {
  maxImageSize: number; // 5MB in bytes
  maxDocumentSize: number; // 50MB in bytes
  allowedImageTypes: string[];
  allowedDocumentTypes: string[];
  thumbnailSizes: ThumbnailSize[];
  compressionQuality: number;
  enableWebP: boolean;
  enableAVIF: boolean;
}

// Thumbnail size configuration
export interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
}

// File metadata interface
export interface FileMetadata {
  id: string;
  schoolId: string;
  originalName: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  folder: string;
  uploadedBy: string;
  uploadedAt: Date;
  variants?: FileVariant[];
  checksum: string;
}

// File variant interface for thumbnails
export interface FileVariant {
  size: ThumbnailSize;
  key: string;
  url: string;
  dimensions: { width: number; height: number };
}

// Upload result interface
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  metadata?: FileMetadata;
  error?: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'image' | 'document';
}

/**
 * Get R2 configuration from environment variables
 */
export function getR2Config(): R2Config {
  const rawConfig = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT,
    customDomain: process.env.R2_CUSTOM_DOMAIN,
  };

  // Check if R2 is configured
  const isConfigured = !!(
    rawConfig.accountId && 
    rawConfig.accessKeyId && 
    rawConfig.secretAccessKey && 
    rawConfig.bucketName
  );

  if (!isConfigured) {
    console.warn('R2 storage is not fully configured. Some features may not work.');
    return {
      region: rawConfig.region,
      isConfigured: false,
    };
  }

  try {
    // Validate configuration
    const validatedConfig = R2ConfigSchema.parse(rawConfig);

    // Generate endpoint if not provided
    const endpoint = validatedConfig.endpoint || 
      `https://${validatedConfig.accountId}.r2.cloudflarestorage.com`;

    return {
      accountId: validatedConfig.accountId,
      accessKeyId: validatedConfig.accessKeyId,
      secretAccessKey: validatedConfig.secretAccessKey,
      bucketName: validatedConfig.bucketName,
      region: validatedConfig.region,
      endpoint,
      customDomain: validatedConfig.customDomain,
      isConfigured: true,
    };
  } catch (error) {
    console.error('R2 configuration validation failed:', error);
    return {
      region: rawConfig.region,
      isConfigured: false,
    };
  }
}

/**
 * Default upload configuration
 */
export const defaultUploadConfig: UploadConfig = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxDocumentSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  thumbnailSizes: [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'medium', width: 300, height: 300 },
    { name: 'large', width: 600, height: 600 },
  ],
  compressionQuality: 85,
  enableWebP: true,
  enableAVIF: false, // Can be enabled when browser support improves
};

/**
 * CORS configuration for R2 bucket
 */
export const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: ['*'], // Should be restricted to your domain in production
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ],
};

/**
 * Generate school-based folder structure key
 */
export function generateSchoolKey(schoolId: string, folder: string, filename: string): string {
  return `school-${schoolId}/${folder}/${filename}`;
}

/**
 * Extract school ID from R2 key
 */
export function extractSchoolIdFromKey(key: string): string | null {
  const match = key.match(/^school-(\d+)\//);
  return match ? match[1] : null;
}

/**
 * Generate CDN URL for file with school-aware pattern
 */
export function generateCdnUrl(key: string, customDomain?: string): string {
  const config = getR2Config();
  
  // Use custom domain if provided, otherwise use configured domain
  let baseUrl: string;
  
  if (customDomain) {
    // Remove trailing slash if present
    baseUrl = customDomain.replace(/\/$/, '');
  } else if (config.customDomain) {
    // Remove trailing slash if present
    baseUrl = config.customDomain.replace(/\/$/, '');
  } else if (config.accountId) {
    // Use R2 public URL format: https://pub-{accountId}.r2.dev
    baseUrl = `https://pub-${config.accountId}.r2.dev`;
  } else {
    // Fallback to endpoint (requires bucket to have public access enabled)
    baseUrl = config.endpoint || `https://${config.accountId}.r2.cloudflarestorage.com`;
  }
  
  // Ensure baseUrl starts with https://
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  return `${baseUrl}/${key}`;
}

/**
 * Generate professional CDN URL with school-based pattern
 * Pattern: cdn.domain.com/school-{id}/category/file
 */
export function generateProfessionalCdnUrl(
  schoolId: string, 
  category: string, 
  filename: string, 
  customDomain?: string
): string {
  const key = generateSchoolKey(schoolId, category, filename);
  return generateCdnUrl(key, customDomain);
}

/**
 * Validate school-based URL pattern
 */
export function validateSchoolUrl(url: string, expectedSchoolId: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/school-(\d+)\//);
    const urlSchoolId = pathMatch ? pathMatch[1] : null;
    
    return urlSchoolId === expectedSchoolId;
  } catch {
    return false;
  }
}