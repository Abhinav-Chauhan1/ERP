# Image Optimization Quick Reference

## Quick Start

### 1. Import the Component

```tsx
import { OptimizedImage, StudentPhoto, CardImage } from '@/components/shared/optimized-image';
```

### 2. Use Pre-built Components

```tsx
// Student profile photo
<StudentPhoto 
  src={student.photoUrl} 
  alt={student.name} 
  size="medium" 
/>

// Card image
<CardImage 
  src={event.imageUrl} 
  alt={event.title} 
/>

// Document thumbnail
<DocumentThumbnail 
  src={doc.url} 
  alt={doc.name} 
/>
```

### 3. Custom Optimized Images

```tsx
// Above the fold (hero, logo)
<OptimizedImage
  src="/hero.jpg"
  alt="School campus"
  width={1200}
  height={400}
  aboveFold
  qualityPreset="high"
/>

// Below the fold (gallery)
<OptimizedImage
  src={image.url}
  alt={image.caption}
  width={400}
  height={300}
  qualityPreset="medium"
/>
```

## Common Patterns

### Profile Photos

```tsx
<StudentPhoto 
  src={student.photoUrl} 
  alt={`${student.name} profile`}
  size="medium"
  aboveFold // If in header/above fold
/>
```

### Gallery Grid

```tsx
<div className="grid grid-cols-3 gap-4">
  {images.map(img => (
    <OptimizedImage
      key={img.id}
      src={img.url}
      alt={img.caption}
      width={400}
      height={300}
      qualityPreset="medium"
    />
  ))}
</div>
```

### Full-Width Hero

```tsx
<HeroImage
  src="/campus-hero.jpg"
  alt="School campus aerial view"
/>
```

### Responsive Background

```tsx
<div className="relative h-64">
  <OptimizedImage
    src={backgroundUrl}
    alt=""
    fill
    sizes="100vw"
    qualityPreset="low"
    className="object-cover"
  />
</div>
```

## Props Reference

### OptimizedImage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | required | Image URL |
| `alt` | string | required | Alt text for accessibility |
| `width` | number | - | Image width (required unless `fill`) |
| `height` | number | - | Image height (required unless `fill`) |
| `aboveFold` | boolean | false | Load with priority if above fold |
| `qualityPreset` | string | 'medium' | 'low', 'medium', 'high', 'maximum' |
| `showBlurPlaceholder` | boolean | true | Show blur while loading |
| `fallbackSrc` | string | '/images/placeholder.png' | Fallback if load fails |
| `fill` | boolean | false | Fill parent container |
| `sizes` | string | - | Responsive sizes attribute |
| `className` | string | - | CSS classes |

## Quality Presets

- **low (50)**: Backgrounds, decorative images
- **medium (75)**: Default, general use
- **high (85)**: Important images, featured content
- **maximum (95)**: Certificates, documents, print-ready

## Size Presets

### Profile Photos
- Small: 64x64
- Medium: 128x128
- Large: 256x256

### Thumbnails
- Small: 96x96
- Medium: 200x200
- Large: 400x400

### Cards
- Standard: 400x300
- Wide: 600x400

### Certificates
- Full: 1200x900
- Thumbnail: 400x300

## Responsive Sizes

```tsx
import { RESPONSIVE_SIZES } from '@/lib/utils/image-optimization';

// Full width
<OptimizedImage sizes={RESPONSIVE_SIZES.fullWidth} />

// Two columns
<OptimizedImage sizes={RESPONSIVE_SIZES.twoColumn} />

// Three columns
<OptimizedImage sizes={RESPONSIVE_SIZES.threeColumn} />

// Four columns
<OptimizedImage sizes={RESPONSIVE_SIZES.fourColumn} />
```

## Checklist

✅ Always provide `alt` text  
✅ Specify `width` and `height` (or use `fill`)  
✅ Use `aboveFold` for images visible without scrolling  
✅ Choose appropriate `qualityPreset`  
✅ Use `sizes` for responsive images  
✅ Test on mobile devices  

## Common Mistakes

❌ Missing alt text
```tsx
<OptimizedImage src={url} alt="" /> // Bad
```

✅ Descriptive alt text
```tsx
<OptimizedImage src={url} alt="Student John Doe at graduation" /> // Good
```

❌ No dimensions
```tsx
<OptimizedImage src={url} alt="..." /> // Bad
```

✅ With dimensions
```tsx
<OptimizedImage src={url} alt="..." width={400} height={300} /> // Good
```

❌ All images with priority
```tsx
<OptimizedImage src={url} alt="..." aboveFold /> // Bad if below fold
```

✅ Priority only for above-fold
```tsx
<OptimizedImage src={url} alt="..." aboveFold={isHero} /> // Good
```

## Performance Tips

1. **Use appropriate quality**: Don't use `maximum` for thumbnails
2. **Lazy load below-fold images**: Don't set `aboveFold` for everything
3. **Provide dimensions**: Prevents layout shift
4. **Use blur placeholders**: Better perceived performance
5. **Test on slow connections**: Use Chrome DevTools throttling

## Migration from `<img>`

Before:
```tsx
<img 
  src={student.photoUrl} 
  alt={student.name}
  className="w-32 h-32 rounded-full"
/>
```

After:
```tsx
<StudentPhoto
  src={student.photoUrl}
  alt={student.name}
  size="medium"
/>
```

## Troubleshooting

### Image not loading
- Check Cloudinary domain in `next.config.js`
- Verify environment variables
- Check browser console for errors

### Layout shift
- Always provide width/height
- Use blur placeholders
- Reserve space with CSS

### Slow loading
- Use appropriate quality preset
- Implement lazy loading
- Check image file sizes

## Related Files

- Configuration: `next.config.js`
- Utilities: `src/lib/utils/image-optimization.ts`
- Components: `src/components/shared/optimized-image.tsx`
- Cloudinary: `src/lib/cloudinary.ts`
- Full Guide: `docs/IMAGE_OPTIMIZATION_GUIDE.md`
