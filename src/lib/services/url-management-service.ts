/**
 * URL Management Service for R2 Storage
 * 
 * This service provides high-level URL management operations including:
 * - School-aware URL generation and validation
 * - Legacy URL mapping and redirection
 * - URL transformation and optimization
 * - Batch URL operations for multiple files
 * - URL analytics and tracking
 */

import { cdnService, type CDNUrlConfig, type ImageTransform } from './cdn-service';
import { r2StorageService } from './r2-storage-service';
import { generateSchoolKey, extractSchoolIdFromKey } from '../config/r2-config';

/**
 * URL mapping interface for legacy redirections
 */
export interface URLMapping {
  id: string;
  schoolId: string;
  legacyUrl: string;
  newUrl: string;
  category: string;
  filename: string;
  createdAt: Date;
  accessCount: number;
  lastAccessed?: Date;
}

/**
 * Batch URL operation result
 */
export interface BatchURLResult {
  success: boolean;
  results: {
    original: string;
    new?: string;
    error?: string;
  }[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

/**
 * URL analytics data
 */
export interface URLAnalytics {
  schoolId: string;
  totalUrls: number;
  categoryBreakdown: Record<string, number>;
  accessPatterns: {
    mostAccessed: string[];
    recentlyAccessed: string[];
    neverAccessed: string[];
  };
  performanceMetrics: {
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

/**
 * URL Management Service Class
 * 
 * Provides comprehensive URL management with school isolation
 */
export class URLManagementService {
  private urlMappings: Map<string, URLMapping> = new Map();

  /**
   * Generate school-aware URL with validation
   * 
   * @param schoolId - School identifier
   * @param category - File category
   * @param filename - File name
   * @param options - URL generation options
   * @returns Generated URL with validation
   */
  async generateSchoolUrl(
    schoolId: string,
    category: string,
    filename: string,
    options: {
      signed?: boolean;
      expiresIn?: number;
      transform?: ImageTransform;
      cacheTTL?: number;
      validateFile?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      // Validate inputs
      if (!schoolId || !category || !filename) {
        return {
          success: false,
          error: 'Missing required parameters: schoolId, category, or filename',
        };
      }

      // Validate file exists if requested
      if (options.validateFile) {
        const key = generateSchoolKey(schoolId, category, filename);
        const exists = await r2StorageService.fileExists(schoolId, key);
        
        if (!exists) {
          return {
            success: false,
            error: 'File does not exist in storage',
          };
        }
      }

      // Generate URL using CDN service
      const urlConfig: CDNUrlConfig = {
        schoolId,
        category,
        filename,
        signed: options.signed,
        expiresIn: options.expiresIn,
        transform: options.transform,
        cacheTTL: options.cacheTTL,
      };

      const url = cdnService.generateSchoolUrl(urlConfig);

      return {
        success: true,
        url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'URL generation failed',
      };
    }
  }

  /**
   * Generate presigned URL with school validation
   * 
   * @param schoolId - School identifier
   * @param category - File category
   * @param filename - File name
   * @param expiresIn - Expiration time in seconds
   * @param permissions - Access permissions
   * @returns Presigned URL
   */
  async generatePresignedUrl(
    schoolId: string,
    category: string,
    filename: string,
    expiresIn: number = 3600,
    permissions: string[] = ['read']
  ): Promise<{
    success: boolean;
    url?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      // Validate school access to file
      const key = generateSchoolKey(schoolId, category, filename);
      const metadata = await r2StorageService.getFileMetadata(schoolId, key);
      
      if (!metadata) {
        return {
          success: false,
          error: 'File not found or access denied',
        };
      }

      // Generate presigned URL
      const url = cdnService.generatePresignedUrl(
        schoolId,
        category,
        filename,
        expiresIn,
        permissions
      );

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      return {
        success: true,
        url,
        expiresAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Presigned URL generation failed',
      };
    }
  }

  /**
   * Validate URL access for school
   * 
   * @param url - URL to validate
   * @param schoolId - School identifier for validation
   * @param requiredPermission - Required permission
   * @returns Validation result
   */
  validateUrlAccess(
    url: string,
    schoolId: string,
    requiredPermission: string = 'read'
  ): {
    isValid: boolean;
    hasAccess: boolean;
    error?: string;
  } {
    try {
      // Validate signed URL if it contains signature
      const urlObj = new URL(url);
      const hasSignature = urlObj.searchParams.has('signature');
      
      if (hasSignature) {
        const validation = cdnService.validateSignedUrl(url, requiredPermission);
        
        return {
          isValid: validation.isValid,
          hasAccess: validation.isValid && validation.schoolId === schoolId,
          error: validation.error,
        };
      }

      // For unsigned URLs, validate school pattern
      const pathMatch = urlObj.pathname.match(/\/school-(\d+)\//);
      const urlSchoolId = pathMatch ? pathMatch[1] : null;
      
      if (!urlSchoolId) {
        return {
          isValid: false,
          hasAccess: false,
          error: 'Invalid school URL format',
        };
      }

      return {
        isValid: true,
        hasAccess: urlSchoolId === schoolId,
        error: urlSchoolId !== schoolId ? 'Access denied: URL belongs to different school' : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        hasAccess: false,
        error: error instanceof Error ? error.message : 'URL validation failed',
      };
    }
  }

  /**
   * Create legacy URL mapping for redirection
   * 
   * @param schoolId - School identifier
   * @param legacyUrl - Legacy storage URL
   * @param category - File category
   * @param filename - New filename
   * @returns URL mapping result
   */
  async createLegacyMapping(
    schoolId: string,
    legacyUrl: string,
    category: string,
    filename: string
  ): Promise<{
    success: boolean;
    mapping?: URLMapping;
    error?: string;
  }> {
    try {
      // Generate new URL
      const newUrlResult = await this.generateSchoolUrl(schoolId, category, filename);
      
      if (!newUrlResult.success || !newUrlResult.url) {
        return {
          success: false,
          error: newUrlResult.error || 'Failed to generate new URL',
        };
      }

      // Create mapping
      const mapping: URLMapping = {
        id: `${schoolId}-${Date.now()}`,
        schoolId,
        legacyUrl,
        newUrl: newUrlResult.url,
        category,
        filename,
        createdAt: new Date(),
        accessCount: 0,
      };

      // Store mapping
      this.urlMappings.set(legacyUrl, mapping);

      return {
        success: true,
        mapping,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mapping creation failed',
      };
    }
  }

  /**
   * Get redirect URL for legacy URL
   * 
   * @param legacyUrl - Legacy URL to redirect
   * @returns Redirect URL or null if not found
   */
  getLegacyRedirect(legacyUrl: string): string | null {
    const mapping = this.urlMappings.get(legacyUrl);
    
    if (mapping) {
      // Update access tracking
      mapping.accessCount++;
      mapping.lastAccessed = new Date();
      
      return mapping.newUrl;
    }

    return null;
  }

  /**
   * Generate optimized URLs for different devices
   * 
   * @param schoolId - School identifier
   * @param category - File category
   * @param filename - File name
   * @param supportedFormats - Client supported formats
   * @returns Device-optimized URLs
   */
  async generateResponsiveUrls(
    schoolId: string,
    category: string,
    filename: string,
    supportedFormats: string[] = ['webp', 'jpeg']
  ): Promise<{
    mobile: string;
    tablet: string;
    desktop: string;
  }> {
    const mobile = cdnService.getOptimizedUrl(
      schoolId,
      category,
      filename,
      'mobile',
      supportedFormats
    );

    const tablet = cdnService.getOptimizedUrl(
      schoolId,
      category,
      filename,
      'tablet',
      supportedFormats
    );

    const desktop = cdnService.getOptimizedUrl(
      schoolId,
      category,
      filename,
      'desktop',
      supportedFormats
    );

    return { mobile, tablet, desktop };
  }

  /**
   * Batch process URLs for multiple files
   * 
   * @param schoolId - School identifier
   * @param files - Array of file information
   * @param options - Processing options
   * @returns Batch processing results
   */
  async batchGenerateUrls(
    schoolId: string,
    files: Array<{
      category: string;
      filename: string;
      options?: {
        signed?: boolean;
        expiresIn?: number;
        transform?: ImageTransform;
      };
    }>,
    options: {
      validateFiles?: boolean;
      continueOnError?: boolean;
    } = {}
  ): Promise<BatchURLResult> {
    const results: BatchURLResult['results'] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const urlResult = await this.generateSchoolUrl(
          schoolId,
          file.category,
          file.filename,
          {
            ...file.options,
            validateFile: options.validateFiles,
          }
        );

        if (urlResult.success && urlResult.url) {
          results.push({
            original: `${file.category}/${file.filename}`,
            new: urlResult.url,
          });
          successCount++;
        } else {
          results.push({
            original: `${file.category}/${file.filename}`,
            error: urlResult.error || 'URL generation failed',
          });
          errorCount++;
        }
      } catch (error) {
        results.push({
          original: `${file.category}/${file.filename}`,
          error: error instanceof Error ? error.message : 'Processing failed',
        });
        errorCount++;
      }

      // Stop on first error if continueOnError is false
      if (!options.continueOnError && errorCount > 0) {
        break;
      }
    }

    return {
      success: errorCount === 0,
      results,
      totalProcessed: results.length,
      successCount,
      errorCount,
    };
  }

  /**
   * Get URL analytics for school
   * 
   * @param schoolId - School identifier
   * @returns URL analytics data
   */
  getUrlAnalytics(schoolId: string): URLAnalytics {
    const schoolMappings: URLMapping[] = [];
    
    this.urlMappings.forEach((mapping) => {
      if (mapping.schoolId === schoolId) {
        schoolMappings.push(mapping);
      }
    });

    const categoryBreakdown: Record<string, number> = {};
    const accessCounts: Array<{ url: string; count: number }> = [];

    for (const mapping of schoolMappings) {
      categoryBreakdown[mapping.category] = (categoryBreakdown[mapping.category] || 0) + 1;
      accessCounts.push({ url: mapping.newUrl, count: mapping.accessCount });
    }

    // Sort by access count
    accessCounts.sort((a, b) => b.count - a.count);

    const mostAccessed = accessCounts.slice(0, 10).map(item => item.url);
    const neverAccessed = accessCounts.filter(item => item.count === 0).map(item => item.url);
    const recentlyAccessed = schoolMappings
      .filter(mapping => mapping.lastAccessed)
      .sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0))
      .slice(0, 10)
      .map(mapping => mapping.newUrl);

    return {
      schoolId,
      totalUrls: schoolMappings.length,
      categoryBreakdown,
      accessPatterns: {
        mostAccessed,
        recentlyAccessed,
        neverAccessed,
      },
      performanceMetrics: {
        averageResponseTime: 0, // Would be populated from monitoring data
        cacheHitRate: 0, // Would be populated from CDN analytics
        errorRate: 0, // Would be populated from error tracking
      },
    };
  }

  /**
   * Clean up expired URL mappings
   * 
   * @param maxAge - Maximum age in days for mappings
   * @returns Number of cleaned up mappings
   */
  cleanupExpiredMappings(maxAge: number = 30): number {
    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    const urlsToDelete: string[] = [];
    
    this.urlMappings.forEach((mapping, url) => {
      if (mapping.createdAt < cutoffDate && mapping.accessCount === 0) {
        urlsToDelete.push(url);
        cleanedCount++;
      }
    });

    urlsToDelete.forEach(url => {
      this.urlMappings.delete(url);
    });

    return cleanedCount;
  }

  /**
   * Export URL mappings for backup
   * 
   * @param schoolId - Optional school ID filter
   * @returns Array of URL mappings
   */
  exportMappings(schoolId?: string): URLMapping[] {
    const mappings: URLMapping[] = [];
    
    this.urlMappings.forEach((mapping) => {
      if (!schoolId || mapping.schoolId === schoolId) {
        mappings.push(mapping);
      }
    });
    
    return mappings;
  }

  /**
   * Import URL mappings from backup
   * 
   * @param mappings - Array of URL mappings to import
   * @returns Import result
   */
  importMappings(mappings: URLMapping[]): {
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
  } {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const mapping of mappings) {
      try {
        if (this.urlMappings.has(mapping.legacyUrl)) {
          skipped++;
          continue;
        }

        this.urlMappings.set(mapping.legacyUrl, mapping);
        imported++;
      } catch (error) {
        errors.push(
          `Failed to import mapping for ${mapping.legacyUrl}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
    };
  }
}

// Export singleton instance
export const urlManagementService = new URLManagementService();