# Student Dashboard - Complete Theme Design Specification

## Overview

This document provides comprehensive theme design specifications for all pages and components in the student dashboard, matching the admin dashboard design system exactly.

## Design System Foundation

### Color Palette

```css
/* CSS Variables - Automatically adapt to light/dark mode */

/* Primary Colors */
--primary: 222.2 47.4% 11.2%;           /* Main brand color */
--primary-foreground: 210 40% 98%;      /* Text on primary */

/* Background Colors */
--background: 0 0% 100%;                /* Page background */
--foreground: 222.2 84% 4.9%;          /* Main text color */

/* Card Colors */
--card: 0 0% 100%;                      /* Card background */
--card-foreground: 222.2 84% 4.9%;     /* Card text */

/* Accent Colors */
--accent: 210 40% 96.1%;                /* Hover states */
--accent-foreground: 222.2 47.4% 11.2%; /* Text on accent */

/* Muted Colors */
--muted: 210 40% 96.1%;                 /* Subtle backgrounds */
--muted-foreground: 215.4 16.3% 46.9%;  /* Secondary text */

/* Border & Input */
--border: 214.3 31.8% 91.4%;            /* Border color */
--input: 214.3 31.8% 91.4%;             /* Input border */
--ring: 222.2 84% 4.9%;                 /* Focus ring */

/* Semantic Colors */
--destructive: 0 84.2% 60.2%;           /* Error/delete */
--destructive-foreground: 210 40% 98%;  /* Text on destructive */

/* Status Colors */
--success: 142 76% 36%;                 /* Success state */
--warning: 38 92% 50%;                  /* Warning state */
--info: 199 89% 48%;                    /* Info state */
```

### Dark Mode Colors

```css
/* Dark Mode Overrides */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;
--accent: 217.2 32.6% 17.5%;
--accent-foreground: 210 40% 98%;
--border: 217.2 32.6% 17.5%;
```

### Typography Scale

```typescript
// Font Sizes
'text-xs': '0.75rem',      // 12px - Small labels, captions
'text-sm': '0.875rem',     // 14px - Body text, table cells
'text-base': '1rem',       // 16px - Default body text
'text-lg': '1.125rem',     // 18px - Subheadings
'text-xl': '1.25rem',      // 20px - Card titles
'text-2xl': '1.5rem',      // 24px - Page titles
'text-3xl': '1.875rem',    // 30px - Large stats
'text-4xl': '2.25rem',     // 36px - Hero text

// Font Weights
'font-normal': 400,
'font-medium': 500,
'font-semibold': 600,
'font-bold': 700,

// Line Heights
'leading-none': 1,
'leading-tight': 1.25,
'leading-snug': 1.375,
'leading-normal': 1.5,
'leading-relaxed': 1.625,
```

### Spacing System

```typescript
// Padding/Margin Scale (Tailwind)
'p-0': '0px',
'p-1': '0.25rem',    // 4px
'p-2': '0.5rem',     // 8px
'p-3': '0.75rem',    // 12px
'p-4': '1rem',       // 16px
'p-5': '1.25rem',    // 20px
'p-6': '1.5rem',     // 24px
'p-8': '2rem',       // 32px
'p-10': '2.5rem',    // 40px
'p-12': '3rem',      // 48px
```

### Border Radius

```typescript
'rounded-none': '0px',
'rounded-sm': '0.125rem',    // 2px
'rounded': '0.25rem',        // 4px
'rounded-md': '0.375rem',    // 6px
'rounded-lg': '0.5rem',      // 8px
'rounded-xl': '0.75rem',     // 12px
'rounded-2xl': '1rem',       // 16px
'rounded-full': '9999px',    // Circle
```


### Shadow System

```typescript
'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
'shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
'shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
```

---

## Layout Components Theme

### 1. Student Sidebar

**Theme Classes:**
```tsx
<div className="h-full border-r flex flex-col overflow-y-auto bg-card shadow-sm">
  {/* Logo Section */}
  <div className="p-4 md:p-6">
    <Link href="/student">
      <SchoolLogo showName={true} />
      <p className="text-xs text-muted-foreground mt-1">Student Portal</p>
    </Link>
  </div>
  
  {/* Navigation Items */}
  <div className="flex flex-col w-full pb-4">
    {/* Main Menu Item (No Submenu) */}
    <Link
      href="/student"
      className="text-sm md:text-base font-medium flex items-center py-3 md:py-3 px-4 md:px-6 transition-colors min-h-[44px] text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
    >
      <Icon className="h-5 w-5 md:h-5 md:w-5 mr-3 flex-shrink-0" />
      <span>Dashboard</span>
    </Link>
    
    {/* Active State */}
    <Link
      className="text-sm md:text-base font-medium flex items-center py-3 md:py-3 px-4 md:px-6 transition-colors min-h-[44px] text-primary bg-primary/10 border-r-4 border-primary"
    >
      {/* ... */}
    </Link>
    
    {/* Collapsible Section Header */}
    <button
      className="w-full text-sm md:text-base font-medium flex items-center justify-between py-3 md:py-3 px-4 md:px-6 transition-colors min-h-[44px] text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 md:h-5 md:w-5 flex-shrink-0" />
        <span>Section Name</span>
      </div>
      <ChevronDown className="h-4 w-4 flex-shrink-0" />
    </button>
    
    {/* Submenu Items */}
    <div className="ml-8 md:ml-9 border-l pl-3 my-1">
      <Link
        className="text-xs md:text-sm flex items-center py-2.5 md:py-2 px-2 rounded transition-colors min-h-[40px] text-muted-foreground hover:text-primary hover:bg-accent active:bg-accent"
      >
        Submenu Item
      </Link>
      
      {/* Active Submenu */}
      <Link
        className="text-xs md:text-sm flex items-center py-2.5 md:py-2 px-2 rounded transition-colors min-h-[40px] text-primary font-medium bg-primary/10"
      >
        Active Submenu
      </Link>
    </div>
  </div>
  
  {/* User Section */}
  <div className="mt-auto p-4 border-t">
    <div className="flex items-center gap-x-2">
      <UserButton afterSignOutUrl="/login" />
      <span className="text-xs md:text-sm font-medium">Student Account</span>
    </div>
  </div>
</div>
```

### 2. Student Header

**Theme Classes:**
```tsx
<div className="flex h-16 items-center justify-between border-b bg-card px-6 gap-4">
  {/* Mobile Menu */}
  <div className="flex items-center gap-2 md:hidden">
    <Button 
      variant="outline" 
      size="icon" 
      className="md:hidden"
    >
      <Menu className="h-5 w-5" />
    </Button>
  </div>
  
  {/* Page Title (Desktop) */}
  <div className="hidden md:block">
    <h1 className="text-xl font-semibold">Dashboard</h1>
  </div>
  
  {/* Global Search (Tablet+) */}
  <div className="hidden sm:block flex-1 max-w-md mx-4">
    <GlobalSearch />
  </div>
  
  {/* Actions */}
  <div className="flex items-center gap-2">
    <ColorThemeToggle />
    <ThemeToggle />
    <NotificationCenter />
    <UserButton afterSignOutUrl="/login" />
  </div>
</div>
```

---

## Page Layouts Theme

### Standard Page Layout

**Theme Pattern:**
```tsx
<div className="flex flex-col gap-4">
  {/* Page Header */}
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Page Title</h1>
      <p className="text-muted-foreground mt-1">
        Page description or subtitle
      </p>
    </div>
    <Button>
      <PlusCircle className="mr-2 h-4 w-4" /> Action Button
    </Button>
  </div>
  
  {/* Page Content */}
  <Card>
    <CardHeader className="py-4">
      <CardTitle className="text-xl">Section Title</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

---

## Dashboard Page Theme

### Main Dashboard

**File:** `src/app/student/page.tsx`

**Theme Classes:**
```tsx
<div className="flex flex-col gap-4">
  {/* Welcome Header */}
  <h1 className="text-2xl font-bold tracking-tight">
    Welcome back, {studentName}!
  </h1>
  
  {/* Stats Cards Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Stat Label
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">95%</div>
        <p className="text-xs text-muted-foreground mt-1">
          Additional info
        </p>
      </CardContent>
    </Card>
  </div>
  
  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Left Column (2/3 width) */}
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Section Title</CardTitle>
          <CardDescription>Section description</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
    
    {/* Right Column (1/3 width) */}
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Widget Title</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Widget content */}
        </CardContent>
      </Card>
    </div>
  </div>
</div>
```

---

## Component Themes

### 1. Card Component

**Standard Card:**
```tsx
<Card className="overflow-hidden hover:shadow-md transition-shadow">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter className="pt-4 border-t">
    {/* Footer actions */}
  </CardFooter>
</Card>
```

**Stat Card:**
```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-2">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-primary/10 rounded-md text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Label
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">Value</div>
    <p className="text-xs text-muted-foreground mt-1">
      Subtext
    </p>
  </CardContent>
</Card>
```

**Navigation Card:**
```tsx
<Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
  <CardHeader className="pb-2">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-primary/10 rounded-md text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <CardTitle className="text-lg">Section Name</CardTitle>
    </div>
    <CardDescription>Section description</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex justify-between items-center">
      <div className="text-3xl font-bold">Count</div>
      <Button variant="outline" size="sm">
        View
      </Button>
    </div>
  </CardContent>
</Card>
```

### 2. Button Component

**Button Variants:**
```tsx
{/* Primary Button */}
<Button className="min-h-[44px]">
  <Icon className="mr-2 h-4 w-4" />
  Primary Action
</Button>

{/* Secondary Button */}
<Button variant="outline" className="min-h-[44px]">
  Secondary Action
</Button>

{/* Ghost Button */}
<Button variant="ghost" size="sm">
  Ghost Action
</Button>

{/* Destructive Button */}
<Button 
  variant="outline" 
  className="text-red-500 border-red-200 hover:bg-red-50 min-h-[44px]"
>
  <Trash2 className="h-4 w-4 mr-2" />
  Delete
</Button>

{/* Icon Button */}
<Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
  <Icon className="h-4 w-4" />
</Button>
```

### 3. Badge Component

**Badge Variants:**
```tsx
{/* Default Badge */}
<Badge>Default</Badge>

{/* Success Badge */}
<Badge className="bg-green-100 text-green-800 hover:bg-green-100">
  Active
</Badge>

{/* Warning Badge */}
<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
  Pending
</Badge>

{/* Error Badge */}
<Badge className="bg-red-100 text-red-800 hover:bg-red-100">
  Overdue
</Badge>

{/* Info Badge */}
<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
  Info
</Badge>

{/* Muted Badge */}
<Badge className="bg-muted text-gray-800 hover:bg-muted">
  Inactive
</Badge>

{/* Outline Badge */}
<Badge variant="outline">Outline</Badge>
```

### 4. Table Component

**Standard Table:**
```tsx
<div className="rounded-md border">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-accent border-b">
          <th className="py-3 px-4 text-left font-medium text-muted-foreground">
            Column 1
          </th>
          <th className="py-3 px-4 text-left font-medium text-muted-foreground">
            Column 2
          </th>
          <th className="py-3 px-4 text-right font-medium text-muted-foreground">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b hover:bg-accent/50">
          <td className="py-3 px-4 align-middle font-medium">
            Cell 1
          </td>
          <td className="py-3 px-4 align-middle">
            Cell 2
          </td>
          <td className="py-3 px-4 align-middle text-right">
            <Button variant="ghost" size="sm">Action</Button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 5. Progress Bar Component

**Progress Variants:**
```tsx
{/* Standard Progress */}
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Progress</span>
    <span className="font-medium">75%</span>
  </div>
  <Progress value={75} className="h-2" />
</div>

{/* Large Progress with Label */}
<div className="space-y-3">
  <div className="flex justify-between">
    <span className="text-sm font-medium">Course Progress</span>
    <span className="text-sm font-bold text-primary">75%</span>
  </div>
  <Progress value={75} className="h-3" />
  <p className="text-xs text-muted-foreground">
    15 of 20 lessons completed
  </p>
</div>
```
