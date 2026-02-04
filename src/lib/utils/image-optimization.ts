/**
 * Image Optimization Utilities
 * 
 * Production-ready helper functions for working with Next.js Image component and R2 storage
 * Supports Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 * 
 * Features:
 * - Type-safe image URL generation with validation
 * - Responsive image sizing with breakpoint support
 * - Error handling and fallback mechanisms
 * - Performance optimization presets
 * - R2 CDN integration with transformation parameters
 * - Accessibility compliance (alt text validation)
 * - Image preloading utilities
 * - Comprehensive dimension and quality validation
 * 
 * @version 2.0.0
 * @author ERP System
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
 * R2 CDN transformation options
 */
export interface R2TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blur?: number;
  rotate?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  auto?: string | string[];
  dpr?: number;
}

/**
 * Get R2 CDN URL with Next.js optimization
 * @param key R2 object key
 * @param options Transformation options
 * @returns Full R2 CDN URL
 * Integrated with R2 CDN URL generation
 */
export function getR2Url(
  key: string,
  options?: R2TransformationOptions
): string {
  // Validate key parameter
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid key parameter: must be a non-empty string');
  }

  const customDomain = process.env.R2_CUSTOM_DOMAIN;
  
  if (!customDomain) {
    console.warn('R2_CUSTOM_DOMAIN not configured, returning key as fallback');
    return key;
  }
  
  // Implement R2 CDN URL generation with transformations
  const params = new URLSearchParams();
  
  if (!options) {
    // No transformations, return basic URL
    const baseUrl = `https://${customDomain}/${key.replace(/^\/+/, '')}`; // Remove leading slashes
    return baseUrl;
  }
  
  // Add transformation parameters
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.format) params.set('f', options.format);
  
  // Add fit parameter for resizing behavior
  if (options.fit) {
    params.set('fit', options.fit);
  } else if (options.width && options.height) {
    params.set('fit', 'cover'); // Default to cover when both dimensions specified
  }
  
  // Add blur effect if specified
  if (options.blur) params.set('blur', options.blur.toString());
  
  // Add rotation if specified
  if (options.rotate) params.set('r', options.rotate.toString());
  
  // Add brightness adjustment if specified
  if (options.brightness) params.set('brightness', options.brightness.toString());
  
  // Add contrast adjustment if specified
  if (options.contrast) params.set('contrast', options.contrast.toString());
  
  // Add saturation adjustment if specified
  if (options.saturation) params.set('saturation', options.saturation.toString());
  
  // Add auto optimization flags
  if (options.auto) {
    const autoFlags = Array.isArray(options.auto) ? options.auto : [options.auto];
    params.set('auto', autoFlags.join(','));
  }
  
  // Add DPR (Device Pixel Ratio) support
  if (options.dpr) params.set('dpr', options.dpr.toString());
  
  // Add crop parameter
  if (options.crop) params.set('c', options.crop);
  
  const queryString = params.toString();
  const baseUrl = `https://${customDomain}/${key.replace(/^\/+/, '')}`; // Remove leading slashes
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
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
  // Validate required parameters
  if (!src || typeof src !== 'string') {
    throw new Error('Invalid src parameter: must be a non-empty string');
  }
  if (!options.alt || typeof options.alt !== 'string') {
    throw new Error('Invalid alt parameter: must be a non-empty string for accessibility');
  }

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
      priority: options.priority || false,
      quality: options.quality && options.quality >= 1 && options.quality <= 100 
        ? options.quality 
        : QUALITY_PRESETS.medium,
    };
  }
  
  // Validate dimensions for non-fill images
  const width = options.width && options.width > 0 ? options.width : 400;
  const height = options.height && options.height > 0 ? options.height : 300;
  
  if (!validateImageDimensions(width, height)) {
    console.warn(`Invalid image dimensions: ${width}x${height}, using defaults`);
  }
  
  return {
    ...baseProps,
    width,
    height,
    priority: options.priority || false,
    quality: options.quality && options.quality >= 1 && options.quality <= 100 
      ? options.quality 
      : QUALITY_PRESETS.medium,
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

/**
 * Handle image loading errors with fallback
 * @param error Image loading error
 * @param fallbackSrc Optional fallback image URL
 * @returns Fallback image URL or placeholder
 */
export function handleImageError(error: Event, fallbackSrc?: string): string {
  console.warn('Image loading failed:', error);
  
  if (fallbackSrc) {
    return fallbackSrc;
  }
  
  // Return a placeholder data URL
  return generateBlurDataUrl(400, 300);
}

/**
 * Get image URL with error handling
 * @param primarySrc Primary image URL
 * @param fallbackSrc Fallback image URL
 * @returns Promise resolving to valid image URL
 */
export async function getValidImageUrl(
  primarySrc: string,
  fallbackSrc?: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => resolve(primarySrc);
    img.onerror = () => {
      if (fallbackSrc) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackSrc);
        fallbackImg.onerror = () => resolve(generateBlurDataUrl(400, 300));
        fallbackImg.src = fallbackSrc;
      } else {
        resolve(generateBlurDataUrl(400, 300));
      }
    };
    
    img.src = primarySrc;
  });
}

/**
 * Preload critical images
 * @param imageUrls Array of image URLs to preload
 * @returns Promise resolving when all images are loaded
 */
export function preloadImages(imageUrls: string[]): Promise<void[]> {
  const promises = imageUrls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  });
  
  return Promise.all(promises);
}

/**
 * Image optimization configuration for different contexts
 */
export const IMAGE_CONFIGS = {
  // Student profiles
  studentProfile: {
    sizes: RESPONSIVE_SIZES.cardSmall,
    quality: QUALITY_PRESETS.high,
    priority: false,
  },
  
  // Document thumbnails
  documentThumbnail: {
    sizes: RESPONSIVE_SIZES.cardSmall,
    quality: QUALITY_PRESETS.medium,
    priority: false,
  },
  
  // Hero banners
  heroBanner: {
    sizes: RESPONSIVE_SIZES.fullWidth,
    quality: QUALITY_PRESETS.high,
    priority: true,
  },
  
  // Gallery images
  galleryImage: {
    sizes: RESPONSIVE_SIZES.threeColumn,
    quality: QUALITY_PRESETS.medium,
    priority: false,
  },
  
  // Certificate images
  certificate: {
    sizes: RESPONSIVE_SIZES.mainContent,
    quality: QUALITY_PRESETS.maximum,
    priority: false,
  },
} as const;
