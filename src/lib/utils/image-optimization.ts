/**
 * Image Optimization Utilities
 * 
 * Helper functions for working with Next.js Image component and Cloudinary
 * Supports Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

/**
 * Generate responsive sizes attribute for Next.js Image component
 * @param breakpoints Object mapping breakpoints to viewport widths
 * @returns Sizes string for responsive images
 * 
 * @example
 * // Full width on mobile, 50% on tablet, 33% on desktop
 * const sizes = generateSizes({
 *   mobile: '100vw',
 *   tablet: '50vw',
 *   desktop: '33vw'
 * });
 */
export function generateSizes(breakpoints: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default?: string;
}): string {
  const sizes: string[] = [];
  
  if (breakpoints.mobile) {
    sizes.push(`(max-width: 768px) ${breakpoints.mobile}`);
  }
  
  if (breakpoints.tablet) {
    sizes.push(`(max-width: 1200px) ${breakpoints.tablet}`);
  }
  
  if (breakpoints.desktop) {
    sizes.push(`(min-width: 1201px) ${breakpoints.desktop}`);
  }
  
  // Default fallback
  sizes.push(breakpoints.default || '100vw');
  
  return sizes.join(', ');
}

/**
 * Get Cloudinary URL with Next.js optimization
 * @param publicId Cloudinary public ID
 * @param options Transformation options
 * @returns Full Cloudinary URL
 */
export function getCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  }
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not configured');
    return publicId;
  }
  
  const transformations: string[] = [];
  
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);
  
  const transformString = transformations.length > 0 
    ? `${transformations.join(',')}/` 
    : '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
}

/**
 * Generate blur data URL for placeholder
 * @param width Width of blur placeholder
 * @param height Height of blur placeholder
 * @returns Base64 encoded blur data URL
 */
export function generateBlurDataUrl(width = 10, height = 10): string {
  // Simple gray blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get optimized image props for Next.js Image component
 * @param src Image source URL
 * @param options Image options
 * @returns Props object for Next.js Image component
 */
export function getOptimizedImageProps(
  src: string,
  options: {
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    quality?: number;
    fill?: boolean;
    sizes?: string;
    className?: string;
  }
) {
  const baseProps = {
    src,
    alt: options.alt,
    className: options.className,
  };
  
  if (options.fill) {
    return {
      ...baseProps,
      fill: true,
      sizes: options.sizes || '100vw',
      priority: options.priority,
      quality: options.quality,
    };
  }
  
  return {
    ...baseProps,
    width: options.width || 400,
    height: options.height || 300,
    priority: options.priority,
    quality: options.quality,
    sizes: options.sizes,
  };
}

/**
 * Check if image should be loaded with priority
 * @param position Image position on page
 * @returns Whether to use priority loading
 */
export function shouldUsePriority(position: 'above-fold' | 'below-fold'): boolean {
  return position === 'above-fold';
}

/**
 * Get responsive breakpoint sizes for common layouts
 */
export const RESPONSIVE_SIZES = {
  // Full width on all devices
  fullWidth: '100vw',
  
  // Two columns on tablet+, full width on mobile
  twoColumn: generateSizes({
    mobile: '100vw',
    tablet: '50vw',
    desktop: '50vw',
  }),
  
  // Three columns on desktop, two on tablet, full on mobile
  threeColumn: generateSizes({
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
  }),
  
  // Four columns on desktop, two on tablet, full on mobile
  fourColumn: generateSizes({
    mobile: '100vw',
    tablet: '50vw',
    desktop: '25vw',
  }),
  
  // Sidebar layout (70/30 split)
  mainContent: generateSizes({
    mobile: '100vw',
    tablet: '70vw',
    desktop: '70vw',
  }),
  
  sidebar: generateSizes({
    mobile: '100vw',
    tablet: '30vw',
    desktop: '30vw',
  }),
  
  // Card layouts
  cardSmall: generateSizes({
    mobile: '100vw',
    tablet: '300px',
    desktop: '300px',
  }),
  
  cardMedium: generateSizes({
    mobile: '100vw',
    tablet: '400px',
    desktop: '400px',
  }),
  
  cardLarge: generateSizes({
    mobile: '100vw',
    tablet: '600px',
    desktop: '600px',
  }),
};

/**
 * Common image dimensions for the ERP system
 */
export const IMAGE_DIMENSIONS = {
  // Profile photos
  profileSmall: { width: 64, height: 64 },
  profileMedium: { width: 128, height: 128 },
  profileLarge: { width: 256, height: 256 },
  
  // Thumbnails
  thumbnailSmall: { width: 96, height: 96 },
  thumbnailMedium: { width: 200, height: 200 },
  thumbnailLarge: { width: 400, height: 400 },
  
  // Cards
  cardImage: { width: 400, height: 300 },
  cardImageWide: { width: 600, height: 400 },
  
  // Banners
  bannerSmall: { width: 800, height: 200 },
  bannerMedium: { width: 1200, height: 300 },
  bannerLarge: { width: 1920, height: 400 },
  
  // Documents
  documentPreview: { width: 300, height: 400 },
  documentThumbnail: { width: 150, height: 200 },
  
  // Certificates
  certificate: { width: 1200, height: 900 },
  certificateThumbnail: { width: 400, height: 300 },
  
  // ID Cards
  idCard: { width: 600, height: 400 },
  idCardThumbnail: { width: 300, height: 200 },
};

/**
 * Quality presets for different use cases
 */
export const QUALITY_PRESETS = {
  low: 50,        // Backgrounds, decorative images
  medium: 75,     // Default, general use
  high: 85,       // Important images, featured content
  maximum: 95,    // Certificates, documents, print-ready
};

/**
 * Get image loading strategy based on position
 * @param isAboveFold Whether image is above the fold
 * @returns Loading strategy
 */
export function getLoadingStrategy(isAboveFold: boolean): 'eager' | 'lazy' {
  return isAboveFold ? 'eager' : 'lazy';
}

/**
 * Validate image dimensions
 * @param width Image width
 * @param height Image height
 * @returns Whether dimensions are valid
 */
export function validateImageDimensions(width?: number, height?: number): boolean {
  if (!width || !height) return false;
  if (width <= 0 || height <= 0) return false;
  if (width > 4096 || height > 4096) return false; // Max reasonable size
  return true;
}

/**
 * Calculate aspect ratio
 * @param width Image width
 * @param height Image height
 * @returns Aspect ratio string (e.g., "16/9")
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

/**
 * Get image props for student profile photo
 * @param photoUrl Student photo URL
 * @param size Size variant
 * @returns Image props
 */
export function getStudentPhotoProps(
  photoUrl: string,
  size: 'small' | 'medium' | 'large' = 'medium'
) {
  const dimensions = {
    small: IMAGE_DIMENSIONS.profileSmall,
    medium: IMAGE_DIMENSIONS.profileMedium,
    large: IMAGE_DIMENSIONS.profileLarge,
  }[size];
  
  return {
    src: photoUrl,
    ...dimensions,
    quality: QUALITY_PRESETS.high,
    className: 'rounded-full object-cover',
  };
}

/**
 * Get image props for document thumbnail
 * @param documentUrl Document URL
 * @returns Image props
 */
export function getDocumentThumbnailProps(documentUrl: string) {
  return {
    src: documentUrl,
    ...IMAGE_DIMENSIONS.documentThumbnail,
    quality: QUALITY_PRESETS.medium,
    className: 'object-cover',
  };
}

/**
 * Get image props for certificate
 * @param certificateUrl Certificate URL
 * @param isThumbnail Whether to use thumbnail size
 * @returns Image props
 */
export function getCertificateImageProps(
  certificateUrl: string,
  isThumbnail = false
) {
  const dimensions = isThumbnail 
    ? IMAGE_DIMENSIONS.certificateThumbnail 
    : IMAGE_DIMENSIONS.certificate;
  
  return {
    src: certificateUrl,
    ...dimensions,
    quality: isThumbnail ? QUALITY_PRESETS.medium : QUALITY_PRESETS.maximum,
    className: 'object-contain',
  };
}
