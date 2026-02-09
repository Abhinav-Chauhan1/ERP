# Next.js Image Optimization Guide

## Overview

This guide explains the image optimization configuration implemented in the School ERP system. The configuration leverages Next.js built-in image optimization with Cloudinary integration to deliver modern, performant images.

## Configuration Details

### Image Formats

The system automatically serves images in modern formats:
- **AVIF**: ~50% smaller than JPEG with better quality
- **WebP**: ~30% smaller than JPEG with excellent browser support

Next.js automatically serves the best format based on browser support, falling back to the original format if needed.

### Device Sizes

Configured breakpoints for responsive images (in pixels):
- **640px**: Mobile phones (portrait)
- **750px**: Mobile phones (landscape)
- **828px**: Tablets (portrait)
- **1080px**: Tablets (landscape)
- **1200px**: Small laptops
- **1920px**: Desktop monitors (Full HD)
- **2048px**: Large desktop monitors
- **3840px**: 4K displays

### Image Sizes

Configured sizes for images that don't span full viewport width:
- **16px, 32px, 48px, 64px**: Icons and small thumbnails
- **96px, 128px**: Medium thumbnails
- **256px, 384px**: Large thumbnails and cards

## Usage Examples

### Basic Image Usage

```tsx
import Image from 'next/image';

export function StudentCard({ student }) {
  return (
    <div>
      <Image
        src={student.photoUrl}
        alt={`${student.name} profile photo`}
        width={200}
        height={200}
        className="rounded-full"
      />
    </div>
  );
}
```

### Responsive Image

```tsx
import Image from 'next/image';

export function HeroImage() {
  return (
    <div className="relative w-full h-96">
      <Image
        src="/hero-image.jpg"
        alt="School campus"
        fill
        sizes="100vw"
        className="object-cover"
        priority // Load above-the-fold images with priority
      />
    </div>
  );
}
```

### Lazy Loading (Below the Fold)

```tsx
import Image from 'next/image';

export function GalleryImage({ imageUrl }) {
  return (
    <Image
      src={imageUrl}
      alt="Gallery image"
      width={400}
      height={300}
      loading="lazy" // Default behavior, explicit for clarity
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Optional blur placeholder
    />
  );
}
```

### Cloudinary Images with Transformations

```tsx
import Image from 'next/image';

export function OptimizedCloudinaryImage({ publicId }) {
  const cloudinaryUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
  
  return (
    <Image
      src={cloudinaryUrl}
      alt="Optimized image"
      width={800}
      height={600}
      quality={85} // 1-100, default is 75
    />
  );
}
```

### Fixed Size Image

```tsx
import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="School ERP Logo"
      width={150}
      height={50}
      priority // Logo is above the fold
    />
  );
}
```

## Best Practices

### 1. Always Specify Dimensions

```tsx
// ✅ Good - Prevents layout shift
<Image src={url} alt="..." width={400} height={300} />

// ❌ Bad - Can cause layout shift
<Image src={url} alt="..." />
```

### 2. Use Priority for Above-the-Fold Images

```tsx
// ✅ Good - Hero images, logos
<Image src={heroUrl} alt="..." priority />

// ✅ Good - Below the fold images
<Image src={galleryUrl} alt="..." loading="lazy" />
```

### 3. Provide Descriptive Alt Text

```tsx
// ✅ Good
<Image src={url} alt="Student John Doe in graduation ceremony" />

// ❌ Bad
<Image src={url} alt="image" />
```

### 4. Use Appropriate Sizes Attribute

```tsx
// For full-width images
<Image src={url} alt="..." fill sizes="100vw" />

// For responsive grid
<Image 
  src={url} 
  alt="..." 
  width={400} 
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 5. Optimize Quality Based on Use Case

```tsx
// High quality for important images
<Image src={certificateUrl} alt="..." quality={90} />

// Standard quality for general use (default: 75)
<Image src={thumbnailUrl} alt="..." />

// Lower quality for backgrounds
<Image src={backgroundUrl} alt="..." quality={60} />
```

## Performance Benefits

### Automatic Optimization
- **Format Conversion**: Automatically serves WebP/AVIF to supported browsers
- **Responsive Images**: Generates multiple sizes for different devices
- **Lazy Loading**: Images below the fold load only when needed
- **Caching**: Optimized images are cached for fast subsequent loads

### Expected Improvements
- **50-70% reduction** in image file sizes with AVIF
- **30-50% reduction** with WebP
- **Faster page loads** due to smaller file sizes
- **Better Core Web Vitals** (LCP, CLS)

## Cloudinary Integration

### Upload Preset Configuration

The system uses Cloudinary upload preset: `school-erp`

Configure in Cloudinary dashboard:
1. Go to Settings → Upload
2. Create/edit upload preset
3. Enable automatic format conversion
4. Set quality to "auto:good"
5. Enable responsive breakpoints

### Environment Variables

Required in `.env`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=school-erp
```

## Troubleshooting

### Images Not Loading

1. Check Cloudinary domain is in `next.config.js`:
   ```js
   images: {
     domains: ["res.cloudinary.com"]
   }
   ```

2. Verify environment variables are set

3. Check browser console for errors

### Layout Shift Issues

1. Always provide width and height:
   ```tsx
   <Image src={url} alt="..." width={400} height={300} />
   ```

2. Use skeleton loaders while images load

3. Reserve space with aspect-ratio CSS

### Performance Issues

1. Use `priority` only for above-the-fold images
2. Implement lazy loading for galleries
3. Use appropriate quality settings
4. Consider using blur placeholders

## Migration Guide

### Converting from `<img>` to `<Image>`

Before:
```tsx
<img src={student.photoUrl} alt={student.name} className="w-32 h-32" />
```

After:
```tsx
<Image 
  src={student.photoUrl} 
  alt={student.name} 
  width={128} 
  height={128}
  className="w-32 h-32"
/>
```

### Converting Background Images

Before:
```tsx
<div style={{ backgroundImage: `url(${imageUrl})` }} />
```

After:
```tsx
<div className="relative">
  <Image src={imageUrl} alt="..." fill className="object-cover" />
</div>
```

## Related Requirements

- **Requirement 16.1**: Image format conversion (WebP, AVIF)
- **Requirement 16.2**: Lazy loading implementation
- **Requirement 16.3**: Blur placeholders
- **Requirement 16.4**: Responsive image sizing
- **Requirement 16.5**: Priority loading for critical images

## Additional Resources

- [Next.js Image Optimization Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Cloudinary Next.js Integration](https://cloudinary.com/documentation/nextjs_integration)
- [Web.dev Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
