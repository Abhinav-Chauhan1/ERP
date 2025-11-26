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


### 6. Empty State Component

**Empty State Pattern:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-6 mb-4">
    <Icon className="h-12 w-12 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No items yet</h3>
  <p className="text-muted-foreground mb-6 max-w-sm">
    Description of empty state and what user can do
  </p>
  <Button>
    <PlusCircle className="mr-2 h-4 w-4" />
    Create First Item
  </Button>
</div>
```

### 7. Loading Skeleton Component

**Skeleton Patterns:**
```tsx
{/* Card Skeleton */}
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-64 mt-2" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-32 w-full" />
  </CardContent>
</Card>

{/* Table Skeleton */}
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</div>

{/* Stats Grid Skeleton */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <Skeleton key={i} className="h-32" />
  ))}
</div>
```

### 8. Alert/Toast Component

**Alert Variants:**
```tsx
{/* Success Alert */}
<Alert className="border-green-200 bg-green-50">
  <CheckCircle className="h-4 w-4 text-green-600" />
  <AlertTitle className="text-green-800">Success</AlertTitle>
  <AlertDescription className="text-green-700">
    Operation completed successfully
  </AlertDescription>
</Alert>

{/* Error Alert */}
<Alert className="border-red-200 bg-red-50">
  <AlertCircle className="h-4 w-4 text-red-600" />
  <AlertTitle className="text-red-800">Error</AlertTitle>
  <AlertDescription className="text-red-700">
    Something went wrong
  </AlertDescription>
</Alert>

{/* Warning Alert */}
<Alert className="border-amber-200 bg-amber-50">
  <AlertTriangle className="h-4 w-4 text-amber-600" />
  <AlertTitle className="text-amber-800">Warning</AlertTitle>
  <AlertDescription className="text-amber-700">
    Please review this information
  </AlertDescription>
</Alert>

{/* Info Alert */}
<Alert className="border-blue-200 bg-blue-50">
  <Info className="h-4 w-4 text-blue-600" />
  <AlertTitle className="text-blue-800">Information</AlertTitle>
  <AlertDescription className="text-blue-700">
    Here's some helpful information
  </AlertDescription>
</Alert>
```

---

## Page-Specific Themes

### Courses Page Theme

**File:** `src/app/student/courses/page.tsx`

```tsx
<div className="p-6 space-y-8">
  {/* My Courses Section */}
  <div>
    <h1 className="text-3xl font-bold mb-2">My Courses</h1>
    <p className="text-muted-foreground mb-6">
      Continue your learning journey
    </p>
    
    {/* Course Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Course Card */}
      <Link href={`/student/courses/${courseId}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          {/* Thumbnail */}
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline">{level}</Badge>
              <Badge className="bg-green-500">
                <Award className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
            <CardTitle className="line-clamp-2">{title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">75%</span>
                </div>
                <Progress value={75} />
              </div>
              
              {/* Metadata */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Subject Name</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>10 hours</span>
                </div>
                <div className="text-xs">
                  5 modules • 25 lessons
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  </div>
  
  {/* Available Courses Section */}
  <div>
    <h2 className="text-2xl font-bold mb-2">Available Courses</h2>
    <p className="text-muted-foreground mb-6">
      Explore new courses to expand your knowledge
    </p>
    
    {/* Similar grid as above */}
  </div>
</div>
```

### Course Detail Page Theme

**File:** `src/app/student/courses/[courseId]/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Course Header */}
  <div className="relative">
    {/* Hero Image */}
    <div className="aspect-video w-full overflow-hidden rounded-lg mb-6">
      <img
        src={thumbnail}
        alt={title}
        className="w-full h-full object-cover"
      />
    </div>
    
    {/* Course Info */}
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{level}</Badge>
            <Badge className="bg-primary/10 text-primary">
              {subject}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      
      {/* Metadata Row */}
      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Teacher Name</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>10 hours</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>5 modules • 25 lessons</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>150 students enrolled</span>
        </div>
      </div>
    </div>
  </div>
  
  {/* Progress Section (if enrolled) */}
  <Card className="bg-primary/5 border-primary/20">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Your Progress</h3>
          <p className="text-sm text-muted-foreground">
            15 of 25 lessons completed
          </p>
        </div>
        <div className="text-3xl font-bold text-primary">60%</div>
      </div>
      <Progress value={60} className="h-3" />
    </CardContent>
  </Card>
  
  {/* Action Button */}
  <div className="flex gap-4">
    <Button size="lg" className="flex-1 min-h-[48px]">
      Continue Learning
    </Button>
    <Button variant="outline" size="lg" className="min-h-[48px]">
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  </div>
  
  {/* Course Content */}
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Course Content</CardTitle>
      <CardDescription>
        {modulesCount} modules • {lessonsCount} lessons
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Module */}
        <div className="border rounded-lg">
          <button className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold">Module 1: Introduction</h4>
                <p className="text-sm text-muted-foreground">
                  5 lessons • 2 hours
                </p>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </button>
          
          {/* Lessons List (when expanded) */}
          <div className="border-t">
            {/* Lesson Item */}
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}`}
              className="flex items-center gap-3 p-4 hover:bg-accent transition-colors border-b last:border-b-0"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h5 className="font-medium">Lesson 1: Getting Started</h5>
                <p className="text-sm text-muted-foreground">
                  Video • 15 min
                </p>
              </div>
              <PlayCircle className="h-5 w-5 text-muted-foreground" />
            </Link>
            
            {/* Incomplete Lesson */}
            <Link 
              href={`/student/courses/${courseId}/lessons/${lessonId}`}
              className="flex items-center gap-3 p-4 hover:bg-accent transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">2</span>
                </div>
              </div>
              <div className="flex-1">
                <h5 className="font-medium">Lesson 2: Core Concepts</h5>
                <p className="text-sm text-muted-foreground">
                  Text • 20 min
                </p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

### Lesson Viewer Page Theme

**File:** `src/app/student/courses/[courseId]/lessons/[lessonId]/page.tsx`

```tsx
<div className="h-full flex flex-col lg:flex-row">
  {/* Main Content Area */}
  <div className="flex-1 overflow-y-auto">
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student/courses" className="hover:text-primary">
          Courses
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/student/courses/${courseId}`} className="hover:text-primary">
          Course Title
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Lesson Title</span>
      </div>
      
      {/* Lesson Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Lesson Title</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>15 minutes</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Video Lesson</span>
          </div>
        </div>
      </div>
      
      {/* Video Player (for VIDEO type) */}
      <Card className="overflow-hidden">
        <div className="aspect-video bg-black">
          {/* Video player component */}
        </div>
      </Card>
      
      {/* Text Content (for TEXT type) */}
      <Card>
        <CardContent className="pt-6 prose prose-sm max-w-none">
          {/* Rendered HTML content */}
        </CardContent>
      </Card>
      
      {/* Progress & Actions */}
      <Card className="bg-accent/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Lesson Progress</h3>
              <p className="text-sm text-muted-foreground">
                Mark as complete when you're done
              </p>
            </div>
            <div className="text-2xl font-bold text-primary">100%</div>
          </div>
          <Progress value={100} className="mb-4" />
          <div className="flex gap-3">
            <Button className="flex-1 min-h-[44px]">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
            <Button variant="outline" className="min-h-[44px]">
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 min-h-[44px]">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Lesson
        </Button>
        <Button className="flex-1 min-h-[44px]">
          Next Lesson
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  </div>
  
  {/* Sidebar - Module Navigation */}
  <div className="w-full lg:w-80 border-l bg-card overflow-y-auto">
    <div className="p-4 border-b">
      <h3 className="font-semibold">Course Content</h3>
      <p className="text-sm text-muted-foreground">
        15 of 25 lessons completed
      </p>
    </div>
    <div className="p-2">
      {/* Module List */}
      <div className="space-y-2">
        {/* Module */}
        <div>
          <button className="w-full p-2 flex items-center justify-between hover:bg-accent rounded-md transition-colors">
            <span className="font-medium text-sm">Module 1</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {/* Lessons */}
          <div className="ml-4 mt-1 space-y-1">
            {/* Current Lesson */}
            <Link
              href="#"
              className="flex items-center gap-2 p-2 rounded-md bg-primary/10 text-primary"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <PlayCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium truncate">
                Current Lesson
              </span>
            </Link>
            
            {/* Completed Lesson */}
            <Link
              href="#"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
            >
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm truncate">Completed Lesson</span>
            </Link>
            
            {/* Incomplete Lesson */}
            <Link
              href="#"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
            >
              <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs">3</span>
              </div>
              <span className="text-sm text-muted-foreground truncate">
                Upcoming Lesson
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```


### Academics Page Theme

**File:** `src/app/student/academics/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Academics</h1>
    <p className="text-muted-foreground mt-1">
      Your academic information and resources
    </p>
  </div>
  
  {/* Academic Info Card */}
  <Card className="bg-primary/5 border-primary/20">
    <CardContent className="pt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Class</p>
          <p className="text-lg font-semibold">10th Grade</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Section</p>
          <p className="text-lg font-semibold">A</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Roll Number</p>
          <p className="text-lg font-semibold">25</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Academic Year</p>
          <p className="text-lg font-semibold">2024-2025</p>
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Navigation Cards Grid */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Link href="/student/academics/schedule">
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Class Schedule</CardTitle>
          </div>
          <CardDescription>View your timetable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">Today</div>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
    
    {/* Similar cards for Subjects, Curriculum, Materials */}
  </div>
</div>
```

### Assessments Page Theme

**File:** `src/app/student/assessments/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
    <p className="text-muted-foreground mt-1">
      Exams, assignments, and results
    </p>
  </div>
  
  {/* Stats Grid */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-md text-blue-600">
            <FileQuestion className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Upcoming Exams
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">3</div>
        <p className="text-xs text-muted-foreground mt-1">
          Next exam in 2 days
        </p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-md text-amber-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Assignments
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">5</div>
        <p className="text-xs text-muted-foreground mt-1">
          2 due this week
        </p>
      </CardContent>
    </Card>
    
    {/* Similar cards for Results, Report Cards */}
  </div>
  
  {/* Navigation Cards */}
  <div className="grid gap-4 md:grid-cols-2">
    <Link href="/student/assessments/exams">
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Exams</CardTitle>
              <CardDescription>View upcoming exams</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            View All Exams
          </Button>
        </CardContent>
      </Card>
    </Link>
    
    {/* Similar cards for Assignments, Results, Report Cards */}
  </div>
</div>
```

### Assignments Page Theme

**File:** `src/app/student/assessments/assignments/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
    <p className="text-muted-foreground mt-1">
      Manage your assignments and submissions
    </p>
  </div>
  
  {/* Tabs */}
  <Tabs defaultValue="pending" className="w-full">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="pending" className="relative">
        Pending
        <Badge className="ml-2 bg-amber-500">5</Badge>
      </TabsTrigger>
      <TabsTrigger value="submitted">
        Submitted
        <Badge className="ml-2 bg-blue-500">3</Badge>
      </TabsTrigger>
      <TabsTrigger value="graded">
        Graded
        <Badge className="ml-2 bg-green-500">12</Badge>
      </TabsTrigger>
      <TabsTrigger value="overdue">
        Overdue
        <Badge className="ml-2 bg-red-500">1</Badge>
      </TabsTrigger>
    </TabsList>
    
    <TabsContent value="pending" className="space-y-4 mt-6">
      {/* Assignment Card */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Mathematics</Badge>
                <Badge className="bg-amber-100 text-amber-800">
                  Due in 2 days
                </Badge>
              </div>
              <CardTitle className="text-lg">
                Chapter 5 Problem Set
              </CardTitle>
              <CardDescription className="mt-1">
                Complete problems 1-20 from the textbook
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Assigned: Nov 15, 2024</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Due: Nov 25, 2024</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Max Points: 100</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Submit Assignment
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* More assignment cards */}
    </TabsContent>
    
    {/* Other tab contents */}
  </Tabs>
</div>
```

### Performance Page Theme

**File:** `src/app/student/performance/overview/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Performance Overview</h1>
    <p className="text-muted-foreground mt-1">
      Track your academic progress and achievements
    </p>
  </div>
  
  {/* Summary Cards */}
  <div className="grid gap-4 md:grid-cols-3">
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-blue-900">
          Overall Percentage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-blue-900">85.5%</div>
        <p className="text-xs text-blue-700 mt-1">
          <TrendingUp className="h-3 w-3 inline mr-1" />
          +2.5% from last term
        </p>
      </CardContent>
    </Card>
    
    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-green-900">
          Grade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-green-900">A</div>
        <p className="text-xs text-green-700 mt-1">
          Excellent performance
        </p>
      </CardContent>
    </Card>
    
    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-purple-900">
          Class Rank
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-purple-900">5th</div>
        <p className="text-xs text-purple-700 mt-1">
          Out of 45 students
        </p>
      </CardContent>
    </Card>
  </div>
  
  {/* Subject Performance Table */}
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Subject Performance</CardTitle>
      <CardDescription>
        Your performance across all subjects
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Subject
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Marks
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Grade
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-accent/50">
                <td className="py-3 px-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium">Mathematics</span>
                  </div>
                </td>
                <td className="py-3 px-4 align-middle text-center">
                  <span className="font-semibold">92%</span>
                </td>
                <td className="py-3 px-4 align-middle text-center">
                  <Badge className="bg-green-100 text-green-800">A+</Badge>
                </td>
                <td className="py-3 px-4 align-middle text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">+5%</span>
                  </div>
                </td>
              </tr>
              {/* More subject rows */}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Performance Chart */}
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Performance Trend</CardTitle>
      <CardDescription>
        Your performance over the last 6 months
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        {/* Chart component */}
      </div>
    </CardContent>
  </Card>
</div>
```

### Attendance Page Theme

**File:** `src/app/student/attendance/report/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Attendance Report</h1>
    <p className="text-muted-foreground mt-1">
      Track your attendance record
    </p>
  </div>
  
  {/* Attendance Summary */}
  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-green-900 mb-1">Current Attendance</p>
          <div className="text-5xl font-bold text-green-900">92.5%</div>
          <p className="text-sm text-green-700 mt-2">
            185 present out of 200 days
          </p>
        </div>
        <div className="w-32 h-32 relative">
          {/* Circular progress chart */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Stats Grid */}
  <div className="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-md text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Present Days
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">185</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-md text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Absent Days
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">15</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-md text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Late Arrivals
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">3</div>
      </CardContent>
    </Card>
  </div>
  
  {/* Calendar View */}
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-xl">Attendance Calendar</CardTitle>
          <CardDescription>November 2024</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {/* Present day */}
        <div className="aspect-square p-2 rounded-md bg-green-100 border-2 border-green-500 flex items-center justify-center">
          <span className="text-sm font-medium text-green-900">15</span>
        </div>
        
        {/* Absent day */}
        <div className="aspect-square p-2 rounded-md bg-red-100 border-2 border-red-500 flex items-center justify-center">
          <span className="text-sm font-medium text-red-900">16</span>
        </div>
        
        {/* Regular day */}
        <div className="aspect-square p-2 rounded-md hover:bg-accent flex items-center justify-center cursor-pointer">
          <span className="text-sm">17</span>
        </div>
        
        {/* Today */}
        <div className="aspect-square p-2 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
          <span className="text-sm font-bold">23</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-muted-foreground">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-muted-foreground">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-sm text-muted-foreground">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span className="text-sm text-muted-foreground">Today</span>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```


### Fees Page Theme

**File:** `src/app/student/fees/details/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Fee Details</h1>
    <p className="text-muted-foreground mt-1">
      View your fee structure and payment status
    </p>
  </div>
  
  {/* Fee Summary Card */}
  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-blue-900 mb-1">Total Fees</p>
          <div className="text-3xl font-bold text-blue-900">₹50,000</div>
        </div>
        <div>
          <p className="text-sm text-green-900 mb-1">Paid Amount</p>
          <div className="text-3xl font-bold text-green-900">₹35,000</div>
        </div>
        <div>
          <p className="text-sm text-red-900 mb-1">Outstanding</p>
          <div className="text-3xl font-bold text-red-900">₹15,000</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-900">Payment Progress</span>
          <span className="font-medium text-blue-900">70%</span>
        </div>
        <Progress value={70} className="h-3" />
      </div>
    </CardContent>
  </Card>
  
  {/* Overdue Alert (if applicable) */}
  <Alert className="border-red-200 bg-red-50">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertTitle className="text-red-800">Payment Overdue</AlertTitle>
    <AlertDescription className="text-red-700">
      You have an overdue payment of ₹5,000. Please make payment by Nov 30, 2024.
    </AlertDescription>
  </Alert>
  
  {/* Fee Breakdown */}
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Fee Breakdown</CardTitle>
      <CardDescription>
        Detailed breakdown of all fee components
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Fee Type
                </th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">
                  Paid
                </th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">
                  Balance
                </th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-accent/50">
                <td className="py-3 px-4 align-middle font-medium">
                  Tuition Fee
                </td>
                <td className="py-3 px-4 align-middle text-right">
                  ₹30,000
                </td>
                <td className="py-3 px-4 align-middle text-right text-green-600">
                  ₹30,000
                </td>
                <td className="py-3 px-4 align-middle text-right">
                  ₹0
                </td>
                <td className="py-3 px-4 align-middle text-center">
                  <Badge className="bg-green-100 text-green-800">Paid</Badge>
                </td>
              </tr>
              <tr className="border-b hover:bg-accent/50">
                <td className="py-3 px-4 align-middle font-medium">
                  Library Fee
                </td>
                <td className="py-3 px-4 align-middle text-right">
                  ₹5,000
                </td>
                <td className="py-3 px-4 align-middle text-right text-green-600">
                  ₹5,000
                </td>
                <td className="py-3 px-4 align-middle text-right">
                  ₹0
                </td>
                <td className="py-3 px-4 align-middle text-center">
                  <Badge className="bg-green-100 text-green-800">Paid</Badge>
                </td>
              </tr>
              <tr className="border-b hover:bg-accent/50">
                <td className="py-3 px-4 align-middle font-medium">
                  Lab Fee
                </td>
                <td className="py-3 px-4 align-middle text-right">
                  ₹10,000
                </td>
                <td className="py-3 px-4 align-middle text-right text-amber-600">
                  ₹5,000
                </td>
                <td className="py-3 px-4 align-middle text-right text-red-600">
                  ₹5,000
                </td>
                <td className="py-3 px-4 align-middle text-center">
                  <Badge className="bg-amber-100 text-amber-800">Partial</Badge>
                </td>
              </tr>
              <tr className="border-b hover:bg-accent/50">
                <td className="py-3 px-4 align-middle font-medium">
                  Sports Fee
                </td>
                <td className="py-3 px-4 align-middle text-right">
                  ₹5,000
                </td>
                <td className="py-3 px-4 align-middle text-right">
                  ₹0
                </td>
                <td className="py-3 px-4 align-middle text-right text-red-600">
                  ₹5,000
                </td>
                <td className="py-3 px-4 align-middle text-center">
                  <Badge className="bg-red-100 text-red-800">Pending</Badge>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-accent font-semibold">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-right">₹50,000</td>
                <td className="py-3 px-4 text-right text-green-600">₹35,000</td>
                <td className="py-3 px-4 text-right text-red-600">₹15,000</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Payment Actions */}
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Make Payment</CardTitle>
      <CardDescription>
        Pay your outstanding fees online
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex gap-4">
        <Button size="lg" className="flex-1 min-h-[48px]">
          <CreditCard className="h-5 w-5 mr-2" />
          Pay Now
        </Button>
        <Button variant="outline" size="lg" className="min-h-[48px]">
          <Download className="h-5 w-5 mr-2" />
          Download Invoice
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
```

### Messages Page Theme

**File:** `src/app/student/communication/messages/page.tsx`

```tsx
<div className="h-full p-6 space-y-6">
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">Messages</h1>
    <Button>
      <PlusCircle className="mr-2 h-4 w-4" />
      Compose Message
    </Button>
  </div>
  
  {/* Tabs */}
  <Tabs defaultValue="inbox" className="w-full">
    <TabsList>
      <TabsTrigger value="inbox">
        Inbox
        <Badge className="ml-2 bg-primary">5</Badge>
      </TabsTrigger>
      <TabsTrigger value="sent">Sent</TabsTrigger>
    </TabsList>
    
    <TabsContent value="inbox" className="mt-6">
      <Card>
        <CardContent className="p-0">
          {/* Message List */}
          <div className="divide-y">
            {/* Unread Message */}
            <div className="p-4 hover:bg-accent cursor-pointer bg-blue-50/50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">Mr. John Smith</h4>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                  <p className="text-sm font-medium mb-1">
                    Assignment Feedback
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Great work on your recent assignment. I have a few suggestions...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Unread
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Teacher
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Read Message */}
            <div className="p-4 hover:bg-accent cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Ms. Sarah Johnson
                    </h4>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Class Schedule Update
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Please note that tomorrow's class has been rescheduled...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Teacher
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You don't have any messages yet. Start a conversation with your teachers.
            </p>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Compose Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
</div>
```

### Profile Page Theme

**File:** `src/app/student/profile/page.tsx`

```tsx
<div className="p-6 space-y-6">
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
      <p className="text-muted-foreground mt-1">
        View and manage your profile information
      </p>
    </div>
    <Button variant="outline">
      <Edit className="mr-2 h-4 w-4" />
      Edit Profile
    </Button>
  </div>
  
  {/* Profile Header Card */}
  <Card className="overflow-hidden">
    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
    <CardContent className="relative pt-0">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-12">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-card border-4 border-card shadow-lg overflow-hidden">
            <img
              src="/avatar.jpg"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 border-4 border-card"></div>
        </div>
        <div className="flex-1 pb-4">
          <h2 className="text-2xl font-bold">John Doe</h2>
          <p className="text-muted-foreground">Student ID: STU2024001</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className="bg-blue-100 text-blue-800">10th Grade</Badge>
            <Badge className="bg-green-100 text-green-800">Section A</Badge>
            <Badge className="bg-purple-100 text-purple-800">Roll No: 25</Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
  
  {/* Tabs */}
  <Tabs defaultValue="info" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="info">Profile Info</TabsTrigger>
      <TabsTrigger value="academic">Academic Details</TabsTrigger>
      <TabsTrigger value="password">Change Password</TabsTrigger>
    </TabsList>
    
    <TabsContent value="info" className="space-y-6 mt-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">First Name</p>
              <p className="font-medium">John</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Last Name</p>
              <p className="font-medium">Doe</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">john.doe@school.com</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <p className="font-medium">+1 234 567 8900</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
              <p className="font-medium">January 15, 2008</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Gender</p>
              <p className="font-medium">Male</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Street Address</p>
              <p className="font-medium">123 Main Street</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">City</p>
                <p className="font-medium">New York</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">State</p>
                <p className="font-medium">NY</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">ZIP Code</p>
                <p className="font-medium">10001</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Parent Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Parent/Guardian Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-md border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Jane Doe</h4>
                  <p className="text-sm text-muted-foreground">Mother</p>
                  <p className="text-sm text-muted-foreground">jane.doe@email.com</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
</div>
```

---

## Responsive Design Patterns

### Mobile (< 768px)

```tsx
{/* Stack elements vertically */}
<div className="flex flex-col gap-4">
  {/* Full width cards */}
  <Card className="w-full">...</Card>
  
  {/* Single column grid */}
  <div className="grid grid-cols-1 gap-4">...</div>
  
  {/* Hide on mobile */}
  <div className="hidden md:block">...</div>
  
  {/* Show only on mobile */}
  <div className="md:hidden">...</div>
</div>
```

### Tablet (768px - 1024px)

```tsx
{/* 2 column grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">...</div>

{/* Adjust padding */}
<div className="p-4 md:p-6">...</div>

{/* Adjust text size */}
<h1 className="text-xl md:text-2xl">...</h1>
```

### Desktop (> 1024px)

```tsx
{/* 3-4 column grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">...</div>

{/* Sidebar layout */}
<div className="flex flex-col lg:flex-row gap-6">
  <div className="lg:w-2/3">...</div>
  <div className="lg:w-1/3">...</div>
</div>
```

---

## Animation & Transitions

### Hover Effects

```tsx
{/* Card hover */}
<Card className="hover:shadow-md transition-shadow duration-200">

{/* Button hover */}
<Button className="hover:scale-105 transition-transform duration-200">

{/* Link hover */}
<Link className="hover:text-primary transition-colors duration-150">
```

### Loading States

```tsx
{/* Pulse animation */}
<div className="animate-pulse">
  <Skeleton className="h-4 w-full" />
</div>

{/* Spin animation */}
<Loader2 className="h-4 w-4 animate-spin" />

{/* Fade in */}
<div className="animate-in fade-in duration-500">
```

---

## Accessibility Patterns

### Focus States

```tsx
{/* Visible focus ring */}
<button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">

{/* Skip to content */}
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground">
  Skip to content
</a>
```

### ARIA Labels

```tsx
{/* Button with aria-label */}
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

{/* Section with aria-labelledby */}
<section aria-labelledby="section-title">
  <h2 id="section-title">Section Title</h2>
</section>
```

---

## Theme Implementation Checklist

### For Each Page:
- [ ] Use consistent spacing (gap-4, gap-6)
- [ ] Apply proper card styling with hover effects
- [ ] Implement responsive grid layouts
- [ ] Add loading skeletons
- [ ] Include empty states
- [ ] Use semantic color badges
- [ ] Ensure minimum touch targets (44px)
- [ ] Add proper ARIA labels
- [ ] Implement keyboard navigation
- [ ] Test in light and dark modes
- [ ] Verify responsive behavior
- [ ] Check color contrast ratios

### For Each Component:
- [ ] Match admin component styling
- [ ] Use design system colors
- [ ] Apply consistent typography
- [ ] Add hover and focus states
- [ ] Include loading states
- [ ] Handle error states
- [ ] Ensure accessibility
- [ ] Test responsiveness
- [ ] Verify theme compatibility

---

**Document Version:** 1.0  
**Last Updated:** November 23, 2025  
**Status:** Complete Theme Specification
