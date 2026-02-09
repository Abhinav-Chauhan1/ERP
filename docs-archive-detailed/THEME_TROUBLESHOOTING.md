# Theme System Troubleshooting Guide

## Quick Checks

### 1. Open Browser Console
Press F12 and check for these logs:
```
[UserThemeWrapper] { userRole: 'admin', colorTheme: 'orange', themeClass: 'theme-orange', userId: 'user_xxx' }
[ColorThemeToggle] Changing theme to: orange
[ColorThemeToggle] Theme changed successfully
```

### 2. Inspect the Wrapper Element
Right-click on the page → Inspect → Find the div with `data-theme` attribute:
```html
<div class="h-full relative theme-orange" data-theme="orange" data-role="admin">
```

### 3. Check localStorage
In browser console, run:
```javascript
// Check if theme is saved
localStorage.getItem('color-theme-admin-user_2abc123xyz')
// Should return: "orange" or your selected theme

// List all theme keys
Object.keys(localStorage).filter(k => k.startsWith('color-theme-'))
```

### 4. Verify CSS Variables
In browser console, run:
```javascript
// Check if CSS variables are set
getComputedStyle(document.querySelector('[data-theme]')).getPropertyValue('--primary')
// Should return different values for different themes
```

## Common Issues

### Issue 1: Theme Not Applying

**Symptoms:**
- Click theme toggle but colors don't change
- Console shows no errors

**Solutions:**
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check if UserThemeWrapper is in the layout
4. Verify theme classes exist in globals.css

### Issue 2: Theme Affecting Other Users

**Symptoms:**
- Changing theme in one dashboard affects another
- Multiple users see the same theme

**Solutions:**
1. Check localStorage keys include userId: `color-theme-{role}-{userId}`
2. Verify no theme classes on `<html>` or `<body>` elements
3. Each dashboard should have its own UserThemeWrapper

### Issue 3: Theme Not Persisting

**Symptoms:**
- Theme resets after page refresh
- Theme resets after logout/login

**Solutions:**
1. Check localStorage is enabled in browser
2. Verify no browser extensions blocking storage
3. Check console for localStorage errors

### Issue 4: Console Errors

**Error:** `__setUserColorTheme not found on window`

**Solution:**
- UserThemeWrapper hasn't mounted yet
- Wait a moment and try again
- Check if UserThemeWrapper is in the layout

**Error:** `useColorTheme must be used within ThemeContextProvider`

**Solution:**
- This is from the old theme system
- Ignore if using new UserThemeWrapper system
- Or ensure ThemeContextProvider is in root layout

## Manual Testing Steps

### Test 1: Basic Theme Change
1. Login to admin dashboard
2. Click palette icon in header
3. Select "Orange"
4. Verify sidebar active items turn orange
5. Verify buttons turn orange
6. Check console for success logs

### Test 2: Theme Persistence
1. Select "Purple" theme
2. Refresh page (F5)
3. Verify theme is still purple
4. Check localStorage has correct value

### Test 3: User Isolation
1. Login as Admin → Select Orange
2. Logout
3. Login as Teacher → Select Purple
4. Logout
5. Login as Admin again
6. Verify theme is still Orange (not Purple)

### Test 4: Role Isolation
1. Login as user with multiple roles
2. Go to Admin dashboard → Select Orange
3. Go to Teacher dashboard → Select Purple
4. Go back to Admin dashboard
5. Verify theme is still Orange

## Debug Mode

To enable detailed logging, open browser console and run:
```javascript
// Enable debug mode
localStorage.setItem('theme-debug', 'true');

// Disable debug mode
localStorage.removeItem('theme-debug');
```

Then refresh the page to see detailed theme logs.

## Verification Checklist

- [ ] Theme toggle appears in header
- [ ] Clicking theme toggle shows 6 color options
- [ ] Selecting a theme changes colors immediately
- [ ] Theme persists after page refresh
- [ ] Theme persists after logout/login
- [ ] Different users have different themes
- [ ] Different roles have different themes
- [ ] No console errors
- [ ] localStorage keys are correct format
- [ ] CSS variables update correctly

## Still Not Working?

If themes still aren't working after trying all the above:

1. **Check the implementation:**
   - Verify UserThemeWrapper is imported correctly
   - Verify ColorThemeToggle is in headers
   - Check for TypeScript errors

2. **Check the CSS:**
   - Verify theme classes exist in `src/app/globals.css`
   - Check if Tailwind is processing the CSS correctly
   - Verify CSS variables are defined

3. **Check the browser:**
   - Try a different browser
   - Try incognito/private mode
   - Disable browser extensions
   - Clear all cache and cookies

4. **Check the code:**
   ```bash
   # Search for theme-related files
   grep -r "UserThemeWrapper" src/
   grep -r "ColorThemeToggle" src/
   grep -r "theme-orange" src/
   ```

## Getting Help

If you're still stuck, provide this information:

1. Browser and version
2. Console logs (with errors)
3. localStorage contents
4. Screenshot of inspected element
5. Which dashboard (admin/teacher/student/parent)
6. Steps to reproduce the issue

## Quick Fix

If nothing works, try this nuclear option:

```javascript
// In browser console
// Clear all theme data
Object.keys(localStorage)
  .filter(k => k.startsWith('color-theme-'))
  .forEach(k => localStorage.removeItem(k));

// Hard refresh
location.reload(true);
```

Then try setting a theme again from scratch.
