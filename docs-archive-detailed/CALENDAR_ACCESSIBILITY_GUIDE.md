# Academic Calendar System - Accessibility Guide

## Overview

The Academic Calendar System has been designed with comprehensive accessibility features to ensure all users, including those with disabilities, can effectively use the calendar. This guide documents all accessibility features and testing procedures.

## Accessibility Features Implemented

### 1. Keyboard Navigation

#### Global Keyboard Shortcuts

The calendar supports the following keyboard shortcuts for quick navigation:

| Key | Action |
|-----|--------|
| `T` | Go to today |
| `N` | Next period (month/week/day) |
| `P` | Previous period |
| `M` | Switch to month view |
| `W` | Switch to week view |
| `D` | Switch to day view |
| `A` | Switch to agenda view |
| `C` | Create new event (admin only) |
| `Arrow Keys` | Navigate dates in calendar grid |
| `Escape` | Clear focus from current element |

**Implementation:** `src/hooks/use-calendar-keyboard-navigation.ts`

#### Focus Management

- All interactive elements are keyboard accessible
- Logical tab order throughout the calendar
- Focus indicators meet WCAG 2.1 AA standards (2px ring with offset)
- Focus trapping in modals and dialogs
- Skip links available for keyboard users

### 2. Screen Reader Support

#### ARIA Labels and Roles

All calendar components include comprehensive ARIA attributes:

- **Calendar Grid:** `role="grid"` with proper row/column structure
- **Date Cells:** `role="gridcell"` with descriptive labels
- **Events:** Detailed aria-labels including title, date, time, and category
- **Navigation:** Clear labels for all navigation buttons
- **View Tabs:** Proper tablist/tab roles with labels

#### Live Regions

- Navigation changes announced via `aria-live="polite"`
- Event count updates announced when filtering
- View changes announced to screen readers
- Dynamic content updates properly announced

#### Semantic HTML

- Proper heading hierarchy (h1 → h2 → h3)
- Semantic elements (nav, main, article, section)
- Descriptive button and link text
- Form labels properly associated with inputs

**Key Components:**
- `src/components/calendar/calendar-view.tsx`
- `src/components/calendar/event-card.tsx`
- `src/components/calendar/event-list.tsx`

### 3. High Contrast Mode Support

#### Features

- Automatic detection of system high contrast mode
- Manual toggle for user preference
- Persistent preference storage in localStorage
- Enhanced color contrast in high contrast mode
- Thicker borders and focus indicators

#### Color Adjustments

In high contrast mode:
- Event category colors mapped to pure colors (e.g., #3b82f6 → #0000FF)
- Border widths doubled (minimum 2px)
- Focus rings increased to 4px with 4px offset
- Text contrast ratios meet WCAG AAA standards (7:1)

**Implementation:**
- `src/hooks/use-high-contrast-mode.ts`
- `src/components/calendar/high-contrast-toggle.tsx`

### 4. Touch Target Sizes

All interactive elements meet WCAG 2.1 Level AAA guidelines:

- **Minimum size:** 44x44 pixels
- **Applied to:**
  - All buttons
  - Calendar date cells
  - Event cards
  - Navigation controls
  - View tabs
  - Form inputs

**CSS Implementation:** `src/app/globals.css`

```css
@media (max-width: 768px) {
  button,
  a,
  [role="button"],
  input[type="checkbox"],
  input[type="radio"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 5. Color Contrast

All text and interactive elements meet WCAG 2.1 AA standards:

- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text:** Minimum 3:1 contrast ratio
- **Interactive elements:** Minimum 3:1 contrast ratio
- **Focus indicators:** Minimum 3:1 contrast ratio

Event category colors are tested for sufficient contrast against both light and dark backgrounds.

### 6. Reduced Motion Support

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 7. Form Accessibility

All forms include:
- Proper label associations
- Required field indicators
- Error messages with `role="alert"`
- Field descriptions with `aria-describedby`
- Validation feedback
- Clear focus indicators

**Example:** `src/components/calendar/event-form-modal.tsx`

## Testing Procedures

### 1. Keyboard Navigation Testing

**Test Steps:**
1. Navigate to calendar page
2. Press `Tab` to move through all interactive elements
3. Verify logical tab order
4. Test all keyboard shortcuts (T, N, P, M, W, D, A, C)
5. Test arrow key navigation in calendar grid
6. Verify focus indicators are visible
7. Test `Escape` key to clear focus

**Expected Results:**
- All elements reachable via keyboard
- Focus indicators clearly visible
- Shortcuts work as documented
- No keyboard traps

### 2. Screen Reader Testing

**Recommended Tools:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

**Test Steps:**
1. Enable screen reader
2. Navigate to calendar page
3. Listen to page structure announcement
4. Navigate through calendar grid
5. Verify event details are announced
6. Test navigation button announcements
7. Verify view change announcements
8. Test form field announcements

**Expected Results:**
- Page structure clearly announced
- All content accessible
- Meaningful labels for all elements
- Live region updates announced
- Form fields properly labeled

### 3. High Contrast Mode Testing

**Test Steps:**
1. Enable system high contrast mode (Windows: Alt+Left Shift+Print Screen)
2. Verify calendar displays correctly
3. Check event colors are distinguishable
4. Verify borders are visible
5. Test manual high contrast toggle
6. Verify preference persists on page reload

**Expected Results:**
- All content visible in high contrast
- Colors properly adjusted
- Borders and focus indicators enhanced
- Toggle works correctly
- Preference persists

### 4. Touch Target Testing

**Test Steps:**
1. Open calendar on mobile device or use browser dev tools
2. Measure interactive element sizes
3. Verify minimum 44x44px size
4. Test tapping accuracy
5. Verify no accidental activations

**Expected Results:**
- All targets meet 44x44px minimum
- Easy to tap on mobile
- No overlapping targets
- Adequate spacing between elements

### 5. Color Contrast Testing

**Tools:**
- WebAIM Contrast Checker
- Chrome DevTools Accessibility Panel
- axe DevTools browser extension

**Test Steps:**
1. Check all text against backgrounds
2. Verify event category colors
3. Test focus indicators
4. Check button states (hover, active, disabled)
5. Verify error messages

**Expected Results:**
- All text meets 4.5:1 ratio (normal) or 3:1 (large)
- Interactive elements meet 3:1 ratio
- Focus indicators meet 3:1 ratio
- No contrast failures

### 6. Automated Testing

**Tools:**
- axe DevTools
- Lighthouse Accessibility Audit
- WAVE Web Accessibility Evaluation Tool

**Test Steps:**
1. Run axe DevTools scan
2. Run Lighthouse accessibility audit
3. Run WAVE evaluation
4. Review and fix any issues
5. Re-test after fixes

**Expected Results:**
- No critical accessibility violations
- Score of 90+ on Lighthouse
- All WCAG 2.1 AA criteria met

## Accessibility Checklist

Use this checklist to verify accessibility compliance:

### Keyboard Accessibility
- [ ] All functionality available via keyboard
- [ ] Logical tab order
- [ ] Visible focus indicators
- [ ] No keyboard traps
- [ ] Keyboard shortcuts documented and working
- [ ] Skip links available

### Screen Reader Support
- [ ] Proper ARIA labels and roles
- [ ] Semantic HTML structure
- [ ] Meaningful link and button text
- [ ] Form labels properly associated
- [ ] Live regions for dynamic content
- [ ] Alternative text for images

### Visual Accessibility
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] High contrast mode support
- [ ] Text resizable to 200%
- [ ] No information conveyed by color alone
- [ ] Focus indicators visible

### Touch/Mobile Accessibility
- [ ] Touch targets minimum 44x44px
- [ ] Adequate spacing between targets
- [ ] Responsive design works on mobile
- [ ] Pinch-to-zoom enabled
- [ ] Orientation support (portrait/landscape)

### Forms and Inputs
- [ ] Labels associated with inputs
- [ ] Required fields indicated
- [ ] Error messages clear and helpful
- [ ] Validation feedback provided
- [ ] Field descriptions available

### Content Accessibility
- [ ] Heading hierarchy logical
- [ ] Content structure clear
- [ ] Language specified
- [ ] Abbreviations explained
- [ ] Complex content simplified

## Known Issues and Limitations

### Current Limitations

1. **Recurring Event Visualization:** Screen readers may not clearly convey recurring event patterns in the calendar grid. Consider adding a dedicated recurring events list view.

2. **Event Drag-and-Drop:** Drag-and-drop functionality for event rescheduling is not keyboard accessible. Alternative keyboard-based rescheduling should be implemented.

3. **Color-Only Information:** Some event categories may rely too heavily on color. Consider adding icons or patterns for better distinction.

### Future Enhancements

1. **Voice Control:** Add support for voice commands for calendar navigation
2. **Braille Display:** Test and optimize for braille display devices
3. **Cognitive Accessibility:** Add simplified view mode for users with cognitive disabilities
4. **Multi-language Support:** Ensure accessibility features work across all supported languages

## Resources

### WCAG Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.1 AA Checklist](https://www.wuhcag.com/wcag-checklist/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) (Free, Windows)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Paid, Windows)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (Built-in, macOS/iOS)

### Best Practices
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project](https://www.a11yproject.com/)

## Support

For accessibility issues or questions:
1. Check this guide for solutions
2. Review WCAG 2.1 guidelines
3. Test with assistive technologies
4. Consult with accessibility experts
5. Report issues to the development team

## Compliance Statement

The Academic Calendar System strives to meet WCAG 2.1 Level AA compliance. We are committed to ensuring digital accessibility for all users and continuously improving the user experience for everyone.

Last Updated: December 2025
