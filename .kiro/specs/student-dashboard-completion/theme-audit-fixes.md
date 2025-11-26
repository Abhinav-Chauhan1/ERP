# Theme Audit - Quick Fixes Implementation

## High Priority Fixes

### Fix 1: Add ARIA Labels to Interactive Cards

**Files to Update:**
- `src/app/student/courses/page.tsx`
- `src/app/student/academics/page.tsx`
- `src/app/student/assessments/page.tsx`

**Before:**
```tsx
<Link href={`/student/courses/${courseId}`}>
  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
    {/* Card content */}
  </Card>
</Link>
```

**After:**
```tsx
<Link 
  href={`/student/courses/${courseId}`}
  aria-label={`View course: ${course.title}`}
>
  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
    {/* Card content */}
  </Card>
</Link>
```

### Fix 2: Add ARIA Attributes to Progress Components

**Files to Update:**
- `src/app/student/courses/page.tsx`
- `src/app/student/fees/details/page.tsx`

**Before:**
```tsx
<Progress value={enrollment.progress} />
```

**After:**
```tsx
<Progress 
  value={enrollment.progress}
  aria-valuenow={enrollment.progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Course progress: ${Math.round(enrollment.progress)}%`}
/>
```

### Fix 3: Standardize Focus States

**Files to Update:**
- All pages with custom button styling

**Pattern to Apply:**
```tsx
<button className="... focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
```

---

## Medium Priority Fixes

### Fix 4: Standardize Navigation Card Pattern

**Recommended Pattern (from Academics page):**
```tsx
<Link href={feature.href}>
  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-md ${feature.color}`}>
          <feature.icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{feature.title}</CardTitle>
      </div>
      <CardDescription>{feature.description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm">
          View
        </Button>
      </div>
    </CardContent>
  </Card>
</Link>
```

**Apply to:** Assessments page navigation cards

### Fix 5: Standardize Card Hover Effects

**Pattern:**
```tsx
<Card className="hover:shadow-md transition-shadow">
```

**Update:** All cards currently using `hover:shadow-lg` to use `hover:shadow-md`

### Fix 6: Standardize Page Spacing

**Pattern:**
```tsx
<div className="flex flex-col gap-6">  {/* Main container */}
<div className="p-4 md:p-6">  {/* Page padding */}
```

**Apply to:** All pages

---

## Low Priority Fixes

### Fix 7: Replace Custom Gradients

**File:** `src/app/student/fees/details/page.tsx`

**Before:**
```tsx
<Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
```

**After:**
```tsx
<Card className="bg-primary/5 border-primary/20">
```

### Fix 8: Standardize CardHeader Padding

**Pattern:**
- Stat cards: `<CardHeader className="pb-2">`
- Content cards: `<CardHeader className="pb-4">`

**Apply to:** All card headers

### Fix 9: Standardize Icon Sizing

**Pattern:**
- Card header icons: `h-5 w-5`
- Inline icons: `h-4 w-4`
- Large icons (empty states): `h-12 w-12`

**Apply to:** All icon usage

---

## Implementation Checklist

### High Priority (Do First)
- [ ] Add ARIA labels to course cards
- [ ] Add ARIA labels to academics navigation cards
- [ ] Add ARIA labels to assessments navigation cards
- [ ] Add ARIA attributes to all Progress components
- [ ] Add focus states to custom buttons

### Medium Priority (Do Next)
- [ ] Update assessments navigation cards to match academics pattern
- [ ] Change all `hover:shadow-lg` to `hover:shadow-md`
- [ ] Standardize page container spacing to `gap-6`
- [ ] Standardize page padding to `p-4 md:p-6`

### Low Priority (Nice to Have)
- [ ] Replace fees page gradient with theme variables
- [ ] Standardize all CardHeader padding
- [ ] Standardize all icon sizing

---

## Testing After Fixes

### Accessibility Testing
- [ ] Run axe DevTools on all pages
- [ ] Test with NVDA screen reader
- [ ] Test keyboard navigation
- [ ] Verify focus indicators visible
- [ ] Check color contrast ratios

### Visual Testing
- [ ] Compare with admin dashboard
- [ ] Test light mode
- [ ] Test dark mode
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1920px)

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Estimated Time

- High Priority Fixes: 2 hours
- Medium Priority Fixes: 1 hour
- Low Priority Fixes: 30 minutes
- Testing: 30 minutes

**Total: 4 hours**

---

## Success Criteria

- [ ] All high-priority fixes implemented
- [ ] Accessibility score > 95 (Lighthouse)
- [ ] No axe DevTools violations
- [ ] Keyboard navigation works perfectly
- [ ] Screen reader announces all interactive elements
- [ ] Visual consistency maintained
- [ ] No regressions in existing functionality
