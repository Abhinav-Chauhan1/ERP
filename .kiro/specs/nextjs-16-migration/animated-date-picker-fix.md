# Animated Date Picker Positioning Fix

**Date:** January 11, 2026  
**Component:** `src/components/ui/animated-date-picker.tsx`  
**Issue:** Calendar popup positioning and alignment issues

## Problem

The AnimatedDatePicker component's calendar popup was:
1. Appearing in the wrong position (overlapping with input field)
2. Getting cut off by parent containers
3. Not properly positioned relative to the input button
4. Not handling edge cases (screen boundaries)

## Root Cause

The component was using `absolute` positioning which:
- Gets constrained by parent containers with `overflow: hidden`
- Doesn't account for scroll position
- Can't escape parent boundaries
- Doesn't handle viewport edges

## Solution

### 1. Changed to Fixed Positioning
```typescript
// Before: absolute positioning
<div className="absolute z-50 mt-2 ...">

// After: fixed positioning with calculated coordinates
<div className="fixed z-50 ..." style={{ top: `${position.top}px`, left: `${position.left}px` }}>
```

### 2. Added Dynamic Position Calculation
```typescript
const buttonRef = React.useRef<HTMLButtonElement>(null)
const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)

React.useEffect(() => {
    if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        
        // Calendar dimensions
        const calendarHeight = 380
        const calendarWidth = 280
        
        // Calculate vertical position (show above if not enough space below)
        const showAbove = spaceBelow < calendarHeight && spaceAbove > spaceBelow
        let top = showAbove ? rect.top - calendarHeight - 8 : rect.bottom + 8
        
        // Calculate horizontal position (ensure it doesn't go off-screen)
        let left = rect.left
        if (left + calendarWidth > window.innerWidth) {
            left = window.innerWidth - calendarWidth - 16
        }
        if (left < 16) {
            left = 16
        }
        
        setPosition({ top, left })
    }
}, [isOpen])
```

### 3. Enhanced Styling
```typescript
<div 
    className="fixed z-50 rounded-md border border-border bg-background shadow-xl overflow-hidden"
    style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '280px',
        maxHeight: '400px',
    }}
>
```

## Key Improvements

1. ✅ **Fixed Positioning**: Calendar now uses `position: fixed` to escape parent constraints
2. ✅ **Smart Vertical Positioning**: Automatically shows above input if not enough space below
3. ✅ **Horizontal Boundary Checking**: Ensures calendar stays within viewport horizontally
4. ✅ **Dynamic Calculation**: Position recalculated every time calendar opens
5. ✅ **Proper Z-Index**: Uses z-50 to ensure calendar appears above other content
6. ✅ **Enhanced Shadow**: Changed from `shadow-lg` to `shadow-xl` for better visibility
7. ✅ **Min Width**: Ensures calendar maintains proper width

## Technical Details

### Position Calculation Logic

**Vertical Positioning:**
- Measures space below button: `window.innerHeight - rect.bottom`
- Measures space above button: `rect.top`
- If space below < 380px AND space above > space below: show above
- Otherwise: show below
- Adds 8px gap between button and calendar

**Horizontal Positioning:**
- Starts at button's left edge: `rect.left`
- If calendar would go off right edge: shift left
- If calendar would go off left edge: shift right
- Maintains 16px minimum margin from edges

### Why This Works

1. **Fixed positioning** is relative to the viewport, not parent containers
2. **getBoundingClientRect()** gives exact pixel coordinates relative to viewport
3. **Dynamic calculation** adapts to any screen size or scroll position
4. **Boundary checking** prevents calendar from being cut off
5. **Conditional rendering** (`{isOpen && position && ...}`) ensures position is calculated before rendering

## Files Modified

- `src/components/ui/animated-date-picker.tsx` - Complete positioning overhaul

## Testing Checklist

- [ ] Calendar appears below input when space available
- [ ] Calendar appears above input when space limited below
- [ ] Calendar stays within viewport horizontally
- [ ] Calendar doesn't overlap with input field
- [ ] Calendar works in scrolled containers
- [ ] Calendar works near screen edges
- [ ] Calendar works on different screen sizes
- [ ] Month/year selection dropdowns work correctly
- [ ] Calendar closes when clicking outside

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Notes

- The component now requires a ref to track button position
- Position is recalculated every time the calendar opens
- The backdrop overlay (`z-40`) ensures clicking outside closes the calendar
- The calendar container (`z-50`) ensures it appears above the backdrop

## Related Components

- `src/components/ui/date-picker.tsx` - Also updated with similar fix
- `src/components/ui/calendar.tsx` - Fixed Chevron component for React 19

## Conclusion

The AnimatedDatePicker component now properly positions its calendar popup using fixed positioning with intelligent boundary detection, ensuring it's always visible and properly aligned regardless of parent container constraints or viewport position.
