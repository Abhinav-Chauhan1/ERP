# Accessibility Implementation Guide

## Overview

This guide documents the accessibility features implemented in the School ERP system to ensure WCAG 2.1 AA compliance and provide an inclusive experience for all users.

## Requirements Coverage

This implementation addresses the following requirements from the specification:

- **Requirement 5.1**: Visible focus indicators on all interactive elements
- **Requirement 5.2**: ARIA labels for all custom components
- **Requirement 5.3**: WCAG 2.1 AA color contrast ratios (minimum 4.5:1)
- **Requirement 5.4**: Skip-to-main-content link
- **Requirement 5.5**: Descriptive alt text for all images

## Features Implemented

### 1. Enhanced Focus Indicators

**Location**: `src/app/globals.css`

All interactive elements now have visible focus indicators that meet WCAG 2.1 AA standards:

- **Standard elements**: 2px ring with offset
- **Interactive elements** (buttons, links, inputs): Primary color ring
- **High contrast mode**: 3px solid outline
- **Keyboard navigation**: Full support with visible focus states

```css
/* Example usage */
*:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2;
}
```

### 2. Skip to Main Content

**Location**: `src/components/accessibility/skip-to-main.tsx`

A skip link allows keyboard users to bypass repetitive navigation:

- Visible only when focused
- Positioned at the top of the page
- Smooth scrolls to main content
- Meets WCAG 2.4.1 (Level A)

**Usage**:
```tsx
import { SkipToMain } from '@/components/accessibility/skip-to-main';

// Added to root layout
<SkipToMain />
```

### 3. ARIA Labels and Semantic HTML

**Locations**: 
- `src/app/admin/layout.tsx`
- `src/app/student/layout.tsx`
- `src/app/teacher/layout.tsx`
- `src/app/parent/layout.tsx`

All layouts now include:

- Semantic `<nav>` elements with `aria-label`
- Main content area with `id="main-content"` and `aria-label`
- Proper heading hierarchy
- Screen reader text for icon-only buttons

**Example**:
```tsx
<nav aria-label="Admin navigation">
  <AdminSidebar />
</nav>

<main 
  id="main-content"
  tabIndex={-1}
  aria-label="Main content"
>
  {children}
</main>
```

### 4. Color Contrast Utilities

**Location**: `src/lib/utils/accessibility.ts`

Utilities for checking and ensuring WCAG 2.1 AA/AAA compliance:

```typescript
// Check if colors meet WCAG AA standards
meetsWCAGAA('#000000', '#ffffff') // true

// Calculate contrast ratio
getContrastRatio('#000000', '#ffffff') // 21

// Check AAA compliance
meetsWCAGAAA('#000000', '#ffffff') // true
```

**Minimum Requirements**:
- Normal text: 4.5:1 (AA), 7:1 (AAA)
- Large text (18pt+ or 14pt+ bold): 3:1 (AA), 4.5:1 (AAA)

### 5. Accessibility Utilities

**Location**: `src/lib/utils/accessibility.ts`

Comprehensive utilities for accessibility:

#### ARIA Label Generators
```typescript
getAriaDateLabel(new Date()) // "Monday, January 1, 2024"
getAriaTimeLabel(new Date()) // "2:30 PM"
getAriaPercentageLabel(75) // "75 percent"
getAriaStatusLabel("IN_PROGRESS") // "in progress"
```

#### Screen Reader Announcements
```typescript
announceToScreenReader("Form submitted successfully", "polite");
announceToScreenReader("Error occurred", "assertive");
```

#### Focus Management
```typescript
// Trap focus within a modal
const cleanup = trapFocus(modalElement);
// Later: cleanup();
```

#### Alt Text Generation
```typescript
generateAltText("profile", "John Doe") // "Profile photo of John Doe"
generateAltText("chart", "attendance trends") // "Chart showing attendance trends"
```

### 6. ARIA Live Regions

**Location**: `src/components/accessibility/aria-live-region.tsx`

Components for announcing dynamic content changes:

```tsx
// Invisible announcement
<AriaLiveRegion 
  message="Data loaded successfully" 
  priority="polite" 
/>

// Visible status message
<StatusMessage 
  message="Changes saved" 
  type="success"
  onClose={() => {}}
/>
```

### 7. Accessibility Checker (Development Only)

**Location**: `src/components/accessibility/accessibility-checker.tsx`

Development tool that audits pages for common accessibility issues:

- Missing alt text on images
- Buttons without accessible names
- Links without accessible names
- Form inputs without labels
- Interactive elements without keyboard access

**Usage**: Automatically appears in development mode as a floating button.

## Touch Target Sizing

All interactive elements meet the minimum touch target size of 44x44px on mobile devices:

```css
@media (max-width: 768px) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Motion Preferences

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## High Contrast Mode

Enhanced visibility in high contrast mode:

```css
@media (prefers-contrast: high) {
  * {
    border-width: 2px;
  }
  *:focus-visible {
    outline: 3px solid currentColor;
  }
}
```

## Screen Reader Only Content

Utility class for content that should only be available to screen readers:

```tsx
<span className="sr-only">
  Additional context for screen readers
</span>
```

## Best Practices

### 1. Always Provide Alt Text

```tsx
// Good
<img src="/photo.jpg" alt="Student receiving award at ceremony" />

// Bad
<img src="/photo.jpg" />
```

### 2. Use Semantic HTML

```tsx
// Good
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// Bad
<div className="nav">
  <div onClick={goHome}>Home</div>
</div>
```

### 3. Label All Form Inputs

```tsx
// Good
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// Also good
<input type="email" aria-label="Email Address" />
```

### 4. Provide Button Labels

```tsx
// Good
<button aria-label="Close dialog">
  <X className="h-4 w-4" aria-hidden="true" />
</button>

// Bad
<button>
  <X className="h-4 w-4" />
</button>
```

### 5. Announce Dynamic Changes

```tsx
// Good
<AriaLiveRegion message="5 new messages" priority="polite" />

// For critical updates
<AriaLiveRegion message="Session expiring" priority="assertive" />
```

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test with Enter and Space keys

2. **Screen Reader Testing**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS/iOS)
   - TalkBack (Android)

3. **Color Contrast**
   - Use browser DevTools
   - Check all text against backgrounds
   - Test in dark mode

### Automated Testing

1. **Browser Extensions**
   - axe DevTools
   - WAVE
   - Lighthouse

2. **Development Tool**
   - Use the built-in Accessibility Checker (dev mode only)

### Testing Checklist

- [ ] All images have alt text
- [ ] All buttons have accessible names
- [ ] All form inputs have labels
- [ ] Color contrast meets 4.5:1 minimum
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible
- [ ] Skip link works correctly
- [ ] Screen reader announces content correctly
- [ ] Touch targets are 44x44px minimum on mobile
- [ ] No keyboard traps exist

## Common Patterns

### Modal Dialogs

```tsx
<Dialog>
  <DialogContent aria-labelledby="dialog-title" aria-describedby="dialog-description">
    <DialogTitle id="dialog-title">Confirm Action</DialogTitle>
    <DialogDescription id="dialog-description">
      Are you sure you want to proceed?
    </DialogDescription>
    <DialogFooter>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Data Tables

```tsx
<table>
  <caption className="sr-only">Student attendance records</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>
        <span aria-label="Present">✓</span>
      </td>
    </tr>
  </tbody>
</table>
```

### Loading States

```tsx
<div role="status" aria-live="polite" aria-busy="true">
  <Spinner aria-hidden="true" />
  <span className="sr-only">Loading data...</span>
</div>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Maintenance

### Regular Audits

- Run accessibility checker in development
- Test with screen readers quarterly
- Verify color contrast when updating themes
- Check keyboard navigation after UI changes

### Continuous Improvement

- Monitor user feedback
- Stay updated with WCAG guidelines
- Test with real users with disabilities
- Update documentation as patterns evolve

## Support

For questions or issues related to accessibility:

1. Check this guide first
2. Review the WCAG 2.1 guidelines
3. Test with accessibility tools
4. Consult with accessibility experts if needed
