# Font Optimization Guide

## Overview

This guide explains the font optimization strategies implemented in the School ERP system to prevent FOIT (Flash of Invisible Text) and improve page load performance.

## Implementation

### 1. Font Display Strategy

We use `font-display: swap` for all web fonts, which provides the best user experience:

```typescript
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Show fallback font immediately
  preload: true,
  fallback: ['system-ui', 'arial'],
});
```

### 2. Font Display Strategies Explained

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `auto` | Browser default | Not recommended |
| `block` | Hide text briefly (up to 3s) | Can cause FOIT ❌ |
| `swap` | Show fallback immediately | **Recommended** ✅ |
| `fallback` | Brief block (100ms), then fallback | Acceptable |
| `optional` | Brief block, no swap if slow | Very slow connections |

### 3. Benefits of font-display: swap

- **Prevents FOIT**: Text is visible immediately using fallback fonts
- **Improves perceived performance**: Users can start reading content faster
- **Better Core Web Vitals**: Reduces FCP (First Contentful Paint) and LCP (Largest Contentful Paint)
- **Accessibility**: Screen readers can access content immediately

### 4. Fallback Font Stack

We provide a comprehensive fallback font stack:

```css
font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

This ensures good typography even if the custom font fails to load.

## Next.js Font Optimization

Next.js automatically optimizes fonts from `next/font/google`:

1. **Self-hosting**: Fonts are downloaded and served from your domain (no external requests)
2. **Zero layout shift**: Font metrics are calculated to prevent CLS
3. **Automatic subsetting**: Only required characters are included
4. **Preloading**: Critical fonts are preloaded automatically

## Font Loading Utilities

### Check if Font is Loaded

```typescript
import { waitForFontLoad } from '@/lib/utils/font-optimization';

const isLoaded = await waitForFontLoad('Inter');
console.log('Font loaded:', isLoaded);
```

### Measure Font Loading Performance

```typescript
import { measureFontLoading } from '@/lib/utils/font-optimization';

const metrics = await measureFontLoading('Inter');
console.log('Load time:', metrics.loadTime, 'ms');
```

### Get Optimal Font Display Strategy

```typescript
import { getOptimalFontDisplay } from '@/lib/utils/font-optimization';

const strategy = getOptimalFontDisplay();
// Returns 'swap', 'fallback', or 'optional' based on connection speed
```

## Performance Impact

### Before Optimization
- FOIT duration: 0-3 seconds
- Users see blank text during font loading
- Poor FCP and LCP scores

### After Optimization
- FOIT duration: 0 seconds ✅
- Users see fallback font immediately
- Improved FCP and LCP scores
- Better user experience

## Testing

### Visual Testing

1. Open DevTools Network tab
2. Throttle to "Slow 3G"
3. Reload the page
4. Verify text is visible immediately (using fallback font)
5. Verify font swaps to Inter when loaded

### Performance Testing

```bash
# Run Lighthouse audit
npm run build
npm start
# Open Chrome DevTools > Lighthouse > Run audit
```

Check for:
- FCP < 1.8s
- LCP < 2.5s
- No layout shift when font loads

## Browser Support

`font-display: swap` is supported in:
- Chrome 60+
- Firefox 58+
- Safari 11.1+
- Edge 79+

For older browsers, Next.js provides automatic fallbacks.

## Best Practices

1. ✅ **Always use `display: 'swap'`** for web fonts
2. ✅ **Provide fallback fonts** that match the custom font's metrics
3. ✅ **Preload critical fonts** (Next.js does this automatically)
4. ✅ **Use font subsetting** to reduce file size
5. ✅ **Test on slow connections** to verify FOIT prevention
6. ❌ **Avoid `display: 'block'`** as it causes FOIT
7. ❌ **Don't load too many font weights** (stick to 2-3 weights)

## Troubleshooting

### Font Not Loading

1. Check browser console for errors
2. Verify font file is accessible
3. Check CORS headers if loading from external domain
4. Verify font-family name matches CSS

### Layout Shift When Font Loads

1. Ensure `adjustFontFallback: true` in font config
2. Use similar fallback fonts (e.g., Arial for Inter)
3. Consider using `font-display: optional` for non-critical text

### Slow Font Loading

1. Reduce number of font weights
2. Use font subsetting to include only needed characters
3. Consider using system fonts for body text
4. Implement font preloading for critical fonts

## Related Requirements

- **Requirement 17.5**: Use font-display: swap for web fonts and prevent invisible text (FOIT)

## References

- [MDN: font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Web.dev: Font Best Practices](https://web.dev/font-best-practices/)
- [CSS Tricks: font-display](https://css-tricks.com/almanac/properties/f/font-display/)
