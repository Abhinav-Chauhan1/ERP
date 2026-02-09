# User-Specific Theme Architecture

## Overview

This document explains how the user-specific color theme system works in the School ERP application.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Root Layout (layout.tsx)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         ThemeProvider (next-themes)                    │ │
│  │         - Handles Light/Dark mode                      │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │    ThemeContextProvider (legacy, kept for compat)│ │ │
│  │  │  ┌────────────────────────────────────────────┐  │ │ │
│  │  │  │         Application Content                │  │ │ │
│  │  │  └────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────┐
│              Dashboard Layouts (per role)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Admin Layout    Teacher Layout   Student Layout   Parent   │
│       ↓               ↓                ↓            Layout   │
│       ↓               ↓                ↓              ↓      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         UserThemeWrapper (user-specific)              │ │
│  │  - Loads theme from localStorage                      │ │
│  │  - Key: color-theme-{role}-{userId}                   │ │
│  │  - Applies theme class to wrapper div                 │ │
│  │  - Exposes window.__setUserColorTheme()               │ │
│  │  - Exposes window.__getUserColorTheme()               │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Dashboard Content                        │ │ │
│  │  │  - Sidebar                                       │ │ │
│  │  │  - Header (with ColorThemeToggle)                │ │ │
│  │  │  - Main Content                                  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Load

```
User logs in
    ↓
Dashboard layout renders
    ↓
UserThemeWrapper mounts
    ↓
Loads theme from localStorage
Key: color-theme-{role}-{userId}
    ↓
Applies theme class to wrapper div
Example: <div className="theme-orange">
    ↓
CSS variables update based on theme class
    ↓
Dashboard displays with user's preferred theme
```

### 2. Theme Change

```
User clicks ColorThemeToggle
    ↓
Selects new color (e.g., "purple")
    ↓
ColorThemeToggle calls window.__setUserColorTheme("purple")
    ↓
UserThemeWrapper receives the call
    ↓
Saves to localStorage: color-theme-{role}-{userId} = "purple"
    ↓
Updates state: setColorTheme("purple")
    ↓
Re-renders with new theme class: <div className="theme-purple">
    ↓
CSS variables update immediately
    ↓
Dashboard displays with new theme
```

## Storage Strategy

### localStorage Keys

Each user's theme is stored with a unique key:

```
Format: color-theme-{role}-{userId}

Examples:
- color-theme-admin-user_2abc123xyz
- color-theme-teacher-user_2abc123xyz
- color-theme-student-user_2def456uvw
- color-theme-parent-user_2ghi789rst
```

### Why This Format?

1. **User Isolation**: Different `userId` ensures User A's theme ≠ User B's theme
2. **Role Isolation**: Different `role` ensures same user can have different themes per role
3. **Persistence**: Survives page refreshes and logout/login cycles
4. **No Conflicts**: Unique keys prevent any cross-contamination

## Component Communication

### Window-Based API

The UserThemeWrapper exposes two global functions:

```typescript
// Set the current user's theme
window.__setUserColorTheme(theme: ColorTheme): void

// Get the current user's theme
window.__getUserColorTheme(): ColorTheme
```

### Why Window-Based?

1. **Simplicity**: No need for complex context providers
2. **Isolation**: Each dashboard has its own wrapper with its own functions
3. **Performance**: No unnecessary re-renders across components
4. **Flexibility**: Easy to call from any component

## Theme Application

### CSS Class Hierarchy

```css
/* Default (Blue) - No class needed */
:root {
  --primary: 221.2 83.2% 53.3%;
}

/* Red Theme */
.theme-red {
  --primary: 0 84.2% 60.2%;
}

/* Green Theme */
.theme-green {
  --primary: 142.1 76.2% 36.3%;
}

/* Purple Theme */
.theme-purple {
  --primary: 262.1 83.3% 57.8%;
}

/* Orange Theme */
.theme-orange {
  --primary: 24.6 95% 39.5%;
}

/* Teal Theme */
.theme-teal {
  --primary: 173 80% 40%;
}
```

### Application Scope

```html
<!-- ❌ OLD: Global application (affects everyone) -->
<html class="theme-orange">
  <body>
    <div>Admin Dashboard</div>
    <div>Teacher Dashboard</div>
  </body>
</html>

<!-- ✅ NEW: Layout-level application (isolated per user) -->
<html>
  <body>
    <div class="theme-orange">Admin Dashboard (User A)</div>
    <div class="theme-blue">Teacher Dashboard (User B)</div>
  </body>
</html>
```

## Benefits

### 1. User Isolation
- Each user has their own theme preference
- User A's orange theme doesn't affect User B's blue theme

### 2. Role Isolation
- Same user can have different themes for different roles
- Admin dashboard can be orange while Teacher dashboard is blue

### 3. No Global Pollution
- Themes are scoped to layout wrappers
- No classes added to `document.documentElement`
- No side effects on other parts of the application

### 4. Persistence
- Themes survive page refreshes
- Themes survive logout/login cycles
- Stored in localStorage for instant loading

### 5. Performance
- Themes apply instantly (no API calls)
- No unnecessary re-renders
- Minimal JavaScript overhead

## Migration Path

### Current State
✅ All dashboards use UserThemeWrapper
✅ All headers have ColorThemeToggle
✅ Themes are user-specific and role-specific
✅ No global theme contamination

### Future Enhancements (Optional)

#### 1. Database Sync
Store themes in database for cross-device sync:

```typescript
// On theme change
await updateUserTheme(userId, role, theme);

// On initial load
const dbTheme = await fetchUserTheme(userId, role);
```

#### 2. Theme Preview
Allow users to preview themes before applying:

```typescript
<ThemePreview theme="orange" />
```

#### 3. Custom Themes
Allow users to create custom color themes:

```typescript
<CustomThemeBuilder />
```

## Troubleshooting

### Theme Not Applying?

1. Check localStorage key exists: `color-theme-{role}-{userId}`
2. Check UserThemeWrapper is mounted
3. Check window functions are exposed
4. Check CSS theme classes are defined in globals.css

### Theme Affecting Other Users?

1. Verify localStorage keys include userId
2. Verify no global theme classes on `<html>` element
3. Verify each dashboard has its own UserThemeWrapper

### Theme Not Persisting?

1. Check localStorage is enabled
2. Check localStorage key format is correct
3. Check theme is saved before page unload

## Code Examples

### Using the Theme System

```tsx
// In a dashboard layout
import { UserThemeWrapper } from "@/components/layout/user-theme-wrapper";

export default function MyDashboardLayout({ children }) {
  return (
    <UserThemeWrapper userRole="admin">
      {/* Your dashboard content */}
    </UserThemeWrapper>
  );
}
```

### Accessing Current Theme

```tsx
// In any component within the dashboard
const currentTheme = window.__getUserColorTheme();
console.log(currentTheme); // "orange"
```

### Changing Theme Programmatically

```tsx
// In any component within the dashboard
window.__setUserColorTheme("purple");
```

## Summary

The user-specific theme system provides:
- ✅ Complete user isolation
- ✅ Complete role isolation
- ✅ Persistent preferences
- ✅ Instant theme changes
- ✅ No global pollution
- ✅ Simple architecture
- ✅ Easy to maintain
- ✅ Ready for production
