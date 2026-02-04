/**
 * CDN Service for Cloudflare R2 Storage
 * 
 * This service provides comprehensive CDN management including:
 * - School-aware URL generation with consistent patterns
 * - URL signing for secure access with expiration
 * - Cache control headers optimization
 * - Custom domain configuration for professional URLs
 * - Legacy URL redirection support
 */

import { createHmac, randomBytes } from 'crypto';
import { getR2Config, generateSchoolKey, type R2Config } from '../config/r2-config';

/**
 * CDN URL configuration interface
 */
export interface CDNUrlConfig {
  schoolId: string;
  category: string;
  filename: string;
  signed?: boolean;
  expiresIn?: number; // seconds
  cacheTTL?: number; // seconds
  transform?: ImageTransform;
}

/**
 * Image transformation options
 */
export interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * URL signing configuration
 */
export interface URLSigningConfig {
  secretKey: string;
  algorithm: 'sha256' | 'sha512';
  timestampTolerance: number; // seconds
}

/**
 * Cache control configuration
 */
export interface CacheControlConfig {
  images: {
    maxAge: number;
    staleWhileRevalidate: number;
    immutable: boolean;
  };
  documents: {
    maxAge: number;
    staleWhileRevalidate: number;
    immutable: boolean;
  };
  thumbnails: {
    maxAge: number;
    staleWhileRevalidate: number;
    immutable: boolean;
  };
}

/**
 * CDN Service Class
 * 
 * Manages all CDN operations with school-based isolation and security
 */
export class CDNService {
  private config: R2Config;
  private signingConfig: URLSigningConfig;
  private cacheConfig: CacheControlConfig;

  constructor() {
    this.config = getR2Config();
    
    // Initialize URL signing configuration
    this.signingConfig = {
      secretKey: process.env.CDN_SIGNING_SECRET || this.generateSigningSecret(),
      algorithm: 'sha256',
      timestampTolerance: 300, // 5 minutes
    };

    // Initialize cache control configuration
    this.cacheConfig = {
      images: {
        maxAge: 31536000, // 1 year
        staleWhileRevalidate: 86400, // 1 day
        immutable: true,
      },
      documents: {
        maxAge: 2592000, // 30 days
        staleWhileRevalidate: 86400, // 1 day
        immutable: false,
      },
      thumbnails: {
        maxAge: 31536000, // 1 year
        staleWhileRevalidate: 86400, // 1 day
        immutable: true,
      },
    };
  }

  /**
   * Generate school-aware CDN URL with consistent pattern
   * Pattern: cdn.domain.com/school-{id}/category/file
   * 
   * @param config - URL configuration
   * @returns Generated CDN URL
   */
  generateSchoolUrl(config: CDNUrlConfig): string {
    const { schoolId, category, filename, signed = false, expiresIn = 3600 } = config;
    
    // Generate school-based key
    const key = generateSchoolKey(schoolId, category, filename);
    
    // Get base CDN URL
    const baseUrl = this.getBaseCDNUrl();
    
    // Construct URL with school-aware pattern
    let url = `${baseUrl}/${key}`;
    
    // Add image transformations if specified
    if (config.transform) {
      url = this.addImageTransformations(url, config.transform);
    }
    
    // Add cache control parameters
    if (config.cacheTTL) {
      url = this.addCacheParameters(url, config.cacheTTL);
    }
    
    // Sign URL if required
    if (signed) {
      url = this.signUrl(url, expiresIn);
    }
    
    return url;
  }

  /**
   * Generate presigned URL for secure file access
   * 
   * @param schoolId - School identifier for validation
   * @param category - File category
   * @param filename - File name
   * @param expiresIn - Expiration time in seconds
   * @param permissions - Access permissions (read, write, delete)
   * @returns Signed URL with expiration
   */
  generatePresignedUrl(
    schoolId: string,
    category: string,
    filename: string,
    expiresIn: number = 3600,
    permissions: string[] = ['read']
  ): string {
    const key = generateSchoolKey(schoolId, category, filename);
    const baseUrl = this.getBaseCDNUrl();
    const url = `${baseUrl}/${key}`;
    
    // Create signature with permissions and expiration
    const timestamp = Math.floor(Date.now() / 1000);
    const expiry = timestamp + expiresIn;
    
    const signatureData = {
      url,
      expiry,
      permissions: permissions.sort().join(','),
      schoolId, // Include school ID in signature for additional security
    };
    
    const signature = this.createSignature(signatureData);
    
    // Construct signed URL with parameters
    const signedUrl = new URL(url);
    signedUrl.searchParams.set('expires', expiry.toString());
    signedUrl.searchParams.set('permissions', permissions.join(','));
    signedUrl.searchParams.set('signature', signature);
    
    return signedUrl.toString();
  }

  /**
   * Validate signed URL
   * 
   * @param url - Signed URL to validate
   * @param requiredPermission - Required permission for access
   * @returns Validation result with school ID if valid
   */
  validateSignedUrl(url: string, requiredPermission: string = 'read'): {
    isValid: boolean;
    schoolId?: string;
    error?: string;
  } {
    try {
      const urlObj = new URL(url);
      const expires = urlObj.searchParams.get('expires');
      const permissions = urlObj.searchParams.get('permissions');
      const signature = urlObj.searchParams.get('signature');
      
      if (!expires || !permissions || !signature) {
        return { isValid: false, error: 'Missing required parameters' };
      }
      
      // Check expiration
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = parseInt(expires);
      
      if (currentTime > expiryTime) {
        return { isValid: false, error: 'URL has expired' };
      }
      
      // Extract school ID from URL path
      const schoolId = this.extractSchoolIdFromUrl(url);
      if (!schoolId) {
        return { isValid: false, error: 'Invalid school URL format' };
      }
      
      // Check permissions
      const permissionList = permissions.split(',');
      if (!permissionList.includes(requiredPermission)) {
        return { isValid: false, error: 'Insufficient permissions' };
      }
      
      // Validate signature
      const baseUrl = url.split('?')[0]; // Remove query parameters
      const signatureData = {
        url: baseUrl,
        expiry: expiryTime,
        permissions: permissionList.sort().join(','),
        schoolId,
      };
      
      const expectedSignature = this.createSignature(signatureData);
      
      if (signature !== expectedSignature) {
        return { isValid: false, error: 'Invalid signature' };
      }
      
      return { isValid: true, schoolId };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  }

  /**
   * Generate cache control headers based on file type
   * 
   * @param category - File category
   * @param filename - File name
   * @returns Cache control headers
   */
  generateCacheHeaders(category: string, filename: string): Record<string, string> {
    const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
    
    let cacheConfig;
    
    // Determine cache configuration based on file type
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(fileExtension)) {
      if (category.includes('thumbnail') || category.includes('thumb')) {
        cacheConfig = this.cacheConfig.thumbnails;
      } else {
        cacheConfig = this.cacheConfig.images;
      }
    } else {
      cacheConfig = this.cacheConfig.documents;
    }
    
    const headers: Record<string, string> = {
      'Cache-Control': this.buildCacheControlHeader(cacheConfig),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    };
    
    // Add immutable directive for images and thumbnails
    if (cacheConfig.immutable) {
      headers['Cache-Control'] += ', immutable';
    }
    
    // Add security headers for documents
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(fileExtension)) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      headers['X-Download-Options'] = 'noopen';
    }
    
    return headers;
  }

  /**
   * Generate legacy URL redirection mapping
   * 
   * @param legacyUrl - Legacy Cloudinary URL
   * @param schoolId - School identifier
   * @param category - File category
   * @returns New R2 CDN URL
   */
  generateLegacyRedirect(legacyUrl: string, schoolId: string, category: string): string | null {
    try {
      // Extract filename from legacy URL
      const filename = this.extractFilenameFromLegacyUrl(legacyUrl);
      if (!filename) {
        return null;
      }
      
      // Generate new school-aware URL
      return this.generateSchoolUrl({
        schoolId,
        category,
        filename,
      });
    } catch (error) {
      console.error('Legacy URL redirection error:', error);
      return null;
    }
  }

  /**
   * Get optimized URL for different devices and formats
   * 
   * @param schoolId - School identifier
   * @param category - File category
   * @param filename - File name
   * @param deviceType - Device type (mobile, tablet, desktop)
   * @param supportedFormats - Supported image formats
   * @returns Optimized URL
   */
  getOptimizedUrl(
    schoolId: string,
    category: string,
    filename: string,
    deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop',
    supportedFormats: string[] = ['webp', 'jpeg']
  ): string {
    const transform: ImageTransform = {};
    
    // Set device-specific dimensions
    switch (deviceType) {
      case 'mobile':
        transform.width = 480;
        transform.quality = 75;
        break;
      case 'tablet':
        transform.width = 768;
        transform.quality = 80;
        break;
      case 'desktop':
        transform.width = 1200;
        transform.quality = 85;
        break;
    }
    
    // Choose optimal format
    if (supportedFormats.includes('avif')) {
      transform.format = 'avif';
    } else if (supportedFormats.includes('webp')) {
      transform.format = 'webp';
    } else {
      transform.format = 'jpeg';
    }
    
    return this.generateSchoolUrl({
      schoolId,
      category,
      filename,
      transform,
      cacheTTL: this.cacheConfig.images.maxAge,
    });
  }

  /**
   * Get base CDN URL with custom domain support
   */
  private getBaseCDNUrl(): string {
    // Use custom domain if configured, otherwise use R2 endpoint
    if (this.config.customDomain) {
      return `https://${this.config.customDomain}`;
    }
    
    // Use R2 public URL format
    return `https://pub-${this.config.accountId}.r2.dev`;
  }

  /**
   * Add image transformation parameters to URL
   */
  private addImageTransformations(url: string, transform: ImageTransform): string {
    const urlObj = new URL(url);
    
    if (transform.width) {
      urlObj.searchParams.set('w', transform.width.toString());
    }
    
    if (transform.height) {
      urlObj.searchParams.set('h', transform.height.toString());
    }
    
    if (transform.quality) {
      urlObj.searchParams.set('q', transform.quality.toString());
    }
    
    if (transform.format) {
      urlObj.searchParams.set('f', transform.format);
    }
    
    if (transform.fit) {
      urlObj.searchParams.set('fit', transform.fit);
    }
    
    return urlObj.toString();
  }

  /**
   * Add cache control parameters to URL
   */
  private addCacheParameters(url: string, cacheTTL: number): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set('cache', cacheTTL.toString());
    return urlObj.toString();
  }

  /**
   * Sign URL with HMAC signature
   */
  private signUrl(url: string, expiresIn: number): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiry = timestamp + expiresIn;
    
    const urlObj = new URL(url);
    urlObj.searchParams.set('expires', expiry.toString());
    
    const signature = this.createUrlSignature(urlObj.toString(), expiry);
    urlObj.searchParams.set('signature', signature);
    
    return urlObj.toString();
  }

  /**
   * Create HMAC signature for data
   */
  private createSignature(data: any): string {
    const dataString = JSON.stringify(data);
    return createHmac(this.signingConfig.algorithm, this.signingConfig.secretKey)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Create URL signature
   */
  private createUrlSignature(url: string, expiry: number): string {
    const data = `${url}:${expiry}`;
    return createHmac(this.signingConfig.algorithm, this.signingConfig.secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Extract school ID from URL path
   */
  private extractSchoolIdFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/school-(\d+)\//);
      return pathMatch ? pathMatch[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Extract filename from legacy Cloudinary URL
   */
  private extractFilenameFromLegacyUrl(legacyUrl: string): string | null {
    try {
      const urlObj = new URL(legacyUrl);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return null;
    }
  }

  /**
   * Build cache control header string
   */
  private buildCacheControlHeader(config: {
    maxAge: number;
    staleWhileRevalidate: number;
    immutable: boolean;
  }): string {
    const parts = [
      `max-age=${config.maxAge}`,
      `stale-while-revalidate=${config.staleWhileRevalidate}`,
    ];
    
    if (config.immutable) {
      parts.push('immutable');
    }
    
    return parts.join(', ');
  }

  /**
   * Generate signing secret if not provided
   */
  private generateSigningSecret(): string {
    console.warn('CDN_SIGNING_SECRET not provided, generating random secret');
    return randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const cdnService = new CDNService();