/**
 * Optimized Image Component
 * 
 * A wrapper around Next.js Image component with built-in optimization
 * and best practices for the School ERP system.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import {
  generateBlurDataUrl,
  getLoadingStrategy,
  validateImageDimensions,
  QUALITY_PRESETS,
} from '@/lib/utils/image-optimization';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  /**
   * Whether the image is above the fold (visible without scrolling)
   * Above-fold images use priority loading
   */
  aboveFold?: boolean;
  
  /**
   * Quality preset: low, medium, high, or maximum
   * Defaults to 'medium' (75)
   */
  qualityPreset?: 'low' | 'medium' | 'high' | 'maximum';
  
  /**
   * Whether to show a blur placeholder while loading
   * Defaults to true
   */
  showBlurPlaceholder?: boolean;
  
  /**
   * Fallback image URL if the main image fails to load
   */
  fallbackSrc?: string;
}

/**
 * OptimizedImage Component
 * 
 * Automatically applies best practices for image optimization:
 * - Priority loading for above-fold images
 * - Lazy loading for below-fold images
 * - Blur placeholders
 * - Quality presets
 * - Error handling with fallback
 * 
 * @example
 * // Student profile photo (above fold)
 * <OptimizedImage
 *   src={student.photoUrl}
 *   alt={student.name}
 *   width={128}
 *   height={128}
 *   aboveFold
 *   qualityPreset="high"
 *   className="rounded-full"
 * />
 * 
 * @example
 * // Gallery image (below fold)
 * <OptimizedImage
 *   src={galleryImage.url}
 *   alt={galleryImage.caption}
 *   width={400}
 *   height={300}
 *   qualityPreset="medium"
 * />
 * 
 * @example
 * // Full-width hero image
 * <OptimizedImage
 *   src="/hero.jpg"
 *   alt="School campus"
 *   fill
 *   sizes="100vw"
 *   aboveFold
 *   qualityPreset="high"
 *   className="object-cover"
 * />
 */
export function OptimizedImage({
  aboveFold = false,
  qualityPreset = 'medium',
  showBlurPlaceholder = true,
  fallbackSrc = '/images/placeholder.png',
  className,
  onError,
  ...props
}: OptimizedImageProps) {
  // Validate dimensions if provided
  if ('width' in props && 'height' in props && !props.fill) {
    const isValid = validateImageDimensions(
      props.width as number,
      props.height as number
    );
    
    if (!isValid) {
      console.warn('Invalid image dimensions:', props.width, props.height);
    }
  }
  
  // Determine loading strategy
  const loading = getLoadingStrategy(aboveFold);
  const priority = aboveFold;
  
  // Get quality from preset
  const quality = QUALITY_PRESETS[qualityPreset];
  
  // Generate blur placeholder
  const blurDataURL = showBlurPlaceholder
    ? generateBlurDataUrl()
    : undefined;
  
  // Handle image load errors
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
    onError?.(e);
  };
  
  return (
    <Image
      {...props}
      className={cn(className)}
      loading={loading}
      priority={priority}
      quality={quality}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      blurDataURL={blurDataURL}
      onError={handleError}
    />
  );
}

/**
 * Student Photo Component
 * Pre-configured for student profile photos
 */
export function StudentPhoto({
  src,
  alt,
  size = 'medium',
  className,
  ...props
}: {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
} & Partial<OptimizedImageProps>) {
  const dimensions = {
    small: { width: 64, height: 64 },
    medium: { width: 128, height: 128 },
    large: { width: 256, height: 256 },
  }[size];
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      {...dimensions}
      qualityPreset="high"
      className={cn('rounded-full object-cover', className)}
      {...props}
    />
  );
}

/**
 * Document Thumbnail Component
 * Pre-configured for document previews
 */
export function DocumentThumbnail({
  src,
  alt,
  className,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
} & Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={150}
      height={200}
      qualityPreset="medium"
      className={cn('object-cover rounded', className)}
      {...props}
    />
  );
}

/**
 * Certificate Image Component
 * Pre-configured for certificates with high quality
 */
export function CertificateImage({
  src,
  alt,
  thumbnail = false,
  className,
  ...props
}: {
  src: string;
  alt: string;
  thumbnail?: boolean;
  className?: string;
} & Partial<OptimizedImageProps>) {
  const dimensions = thumbnail
    ? { width: 400, height: 300 }
    : { width: 1200, height: 900 };
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      {...dimensions}
      qualityPreset={thumbnail ? 'medium' : 'maximum'}
      className={cn('object-contain', className)}
      {...props}
    />
  );
}

/**
 * Responsive Hero Image Component
 * Pre-configured for full-width hero images
 */
export function HeroImage({
  src,
  alt,
  className,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
} & Partial<OptimizedImageProps>) {
  return (
    <div className="relative w-full h-96">
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        aboveFold
        qualityPreset="high"
        className={cn('object-cover', className)}
        {...props}
      />
    </div>
  );
}

/**
 * Card Image Component
 * Pre-configured for card layouts
 */
export function CardImage({
  src,
  alt,
  className,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
} & Partial<OptimizedImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      qualityPreset="medium"
      className={cn('object-cover rounded-t-lg', className)}
      {...props}
    />
  );
}
