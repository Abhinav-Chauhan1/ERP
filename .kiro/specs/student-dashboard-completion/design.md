# Student Dashboard Completion - Design

## Architecture Overview

This design document outlines the technical implementation for completing the student dashboard with course functionality, message composition, and updated UI components matching the admin dashboard design.

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Student Portal                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Sidebar    │  │    Header    │  │   Content    │     │
│  │  Navigation  │  │   (Navbar)   │  │     Area     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    Feature Modules                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Courses    │  │   Lessons    │  │  Messages    │     │
│  │   Module     │  │   Viewer     │  │   Module     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                   Backend Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Course     │  │   Message    │  │   File       │     │
│  │   Actions    │  │   Actions    │  │   Upload     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma ORM + Database                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

### P1: Consistency
- Match admin dashboard design exactly (sidebar, header, styling)
- Use same component library and patterns
- Maintain consistent spacing, typography, and colors

### P2: Reusability
- Create reusable components for common patterns
- Share components between different portal types where possible
- Use composition over duplication

### P3: Performance
- Implement lazy loading for heavy components
- Use pagination for large data sets
- Cache frequently accessed data
- Optimize images and videos

### P4: Accessibility
- Follow WCAG 2.1 Level AA guidelines
- Ensure keyboard navigation
- Provide proper ARIA labels
- Maintain color contrast ratios

### P5: Scalability
- Design for growth (1000+ concurrent users)
- Use efficient database queries
- Implement proper error handling
- Plan for future enhancements

## Component Architecture

### Layout Components

#### Updated Student Sidebar

**Location:** `src/components/layout/student-sidebar.tsx`

**Design Pattern:** Match admin sidebar exactly with student-specific routes

**Key Features:**
- School logo at top with "Student Portal" subtitle
- Collapsible menu sections with icons
- Active state highlighting
- Smooth expand/collapse animations
- UserButton at bottom
- Responsive mobile drawer

**Props:**
```typescript
// No props needed - uses pathname from Next.js router
```

**State Management:**
```typescript
const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
```

#### Updated Student Header

**Location:** `src/components/layout/student-header.tsx`

**Design Pattern:** Match admin header exactly

**Key Features:**
- Mobile hamburger menu
- Page title display (desktop only)
- Global search bar (tablet and up)
- Theme toggle (light/dark)
- Color theme toggle
- Notification center with badge
- UserButton for account

**Props:**
```typescript
// No props needed - uses pathname from Next.js router
```

### Course Components

#### CourseDetail Component

**Location:** `src/components/student/course-detail.tsx`


**Purpose:** Display comprehensive course information and enrollment status

**Props:**
```typescript
interface CourseDetailProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    level: string;
    duration: number | null;
    subject: { id: string; name: string; } | null;
    teacher: {
      id: string;
      user: { firstName: string; lastName: string; avatar: string | null; };
    };
    modules: Array<{
      id: string;
      title: string;
      description: string | null;
      order: number;
      lessons: Array<{ id: string; title: string; }>;
    }>;
  };
  enrollment: {
    id: string;
    progress: number;
    status: string;
    enrolledAt: Date;
  } | null;
  onEnroll: () => Promise<void>;
  onUnenroll: () => Promise<void>;
}
```

**UI Structure:**
```
┌─────────────────────────────────────────┐
│  Course Header (thumbnail, title)       │
├─────────────────────────────────────────┤
│  Course Info (level, duration, teacher) │
├─────────────────────────────────────────┤
│  Description                             │
├─────────────────────────────────────────┤
│  Progress Bar (if enrolled)             │
├─────────────────────────────────────────┤
│  Enroll/Unenroll Button                 │
├─────────────────────────────────────────┤
│  Modules List (expandable)              │
│    ├─ Module 1                          │
│    │   ├─ Lesson 1                      │
│    │   └─ Lesson 2                      │
│    └─ Module 2                          │
└─────────────────────────────────────────┘
```


#### LessonViewer Component

**Location:** `src/components/student/lesson-viewer.tsx`

**Purpose:** Display lesson content based on content type with progress tracking

**Props:**
```typescript
interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    content: string;
    contentType: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ';
    videoUrl: string | null;
    duration: number | null;
    order: number;
  };
  progress: {
    isCompleted: boolean;
    progress: number;
  };
  navigation: {
    previousLesson: { id: string; title: string; } | null;
    nextLesson: { id: string; title: string; } | null;
  };
  onComplete: () => Promise<void>;
  onProgressUpdate: (progress: number) => Promise<void>;
}
```

**Content Type Handlers:**
- VIDEO: React Player or HTML5 video with controls
- TEXT: Rendered HTML with proper sanitization
- PDF: PDF.js viewer or iframe
- QUIZ: Future implementation placeholder

#### CourseProgressTracker Component

**Location:** `src/components/student/course-progress-tracker.tsx`

**Purpose:** Visual progress indicator for course completion

**Props:**
```typescript
interface CourseProgressTrackerProps {
  progress: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  showDetails?: boolean;
}
```


#### CourseModuleList Component

**Location:** `src/components/student/course-module-list.tsx`

**Purpose:** Sidebar navigation for course modules and lessons

**Props:**
```typescript
interface CourseModuleListProps {
  modules: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      duration: number | null;
      isCompleted: boolean;
    }>;
  }>;
  currentLessonId: string | null;
  onLessonClick: (lessonId: string) => void;
}
```

### Communication Components

#### MessageCompose Component

**Location:** `src/components/student/communication/message-compose.tsx`

**Purpose:** Form for composing new messages

**Props:**
```typescript
interface MessageComposeProps {
  recipientId?: string;
  onSend: (data: MessageData) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

interface MessageData {
  recipientId: string;
  subject: string;
  content: string;
  attachments?: File[];
}
```

**UI Structure:**
- Modal/Dialog wrapper
- Recipient selector (teachers/admins only)
- Subject input field
- Rich text editor for content
- File attachment uploader
- Send and Cancel buttons


#### MessageReplyForm Component

**Location:** `src/components/student/communication/message-reply-form.tsx`

**Purpose:** Quick reply form for responding to messages

**Props:**
```typescript
interface MessageReplyFormProps {
  originalMessage: {
    id: string;
    subject: string;
    sender: { id: string; firstName: string; lastName: string; };
  };
  onReply: (content: string) => Promise<void>;
  onCancel: () => void;
}
```

## Page Architecture

### Course Detail Page

**Location:** `src/app/student/courses/[courseId]/page.tsx`

**Route:** `/student/courses/[courseId]`

**Data Fetching:**
```typescript
async function getCourseWithEnrollment(courseId: string, studentId: string) {
  // Fetch course with modules, lessons, teacher, subject
  // Fetch enrollment status and progress
  // Return combined data
}
```

**Page Structure:**
```typescript
export default async function CourseDetailPage({ 
  params 
}: { 
  params: { courseId: string } 
}) {
  // 1. Authenticate student
  // 2. Fetch course data
  // 3. Fetch enrollment data
  // 4. Render CourseDetail component
}
```


### Lesson Viewer Page

**Location:** `src/app/student/courses/[courseId]/lessons/[lessonId]/page.tsx`

**Route:** `/student/courses/[courseId]/lessons/[lessonId]`

**Data Fetching:**
```typescript
async function getLessonWithProgress(
  lessonId: string, 
  courseId: string, 
  studentId: string
) {
  // 1. Verify student is enrolled in course
  // 2. Fetch lesson data
  // 3. Fetch lesson progress
  // 4. Fetch previous/next lesson info
  // 5. Return combined data
}
```

**Page Structure:**
```typescript
export default async function LessonViewerPage({ 
  params 
}: { 
  params: { courseId: string; lessonId: string } 
}) {
  // 1. Authenticate student
  // 2. Verify enrollment
  // 3. Fetch lesson data
  // 4. Render LessonViewer component
}
```

## Backend Actions

### Course Actions

**Location:** `src/lib/actions/student-course-actions.ts`

**Functions:**

```typescript
// Get course by ID with enrollment status
export async function getCourseById(courseId: string): Promise<ActionResult>

// Enroll student in course
export async function enrollInCourse(courseId: string): Promise<ActionResult>

// Unenroll student from course
export async function unenrollFromCourse(courseId: string): Promise<ActionResult>

// Get course modules with lessons
export async function getModulesByCourse(courseId: string): Promise<ActionResult>

// Get lesson by ID with progress
export async function getLessonById(
  lessonId: string, 
  courseId: string
): Promise<ActionResult>

// Mark lesson as complete
export async function markLessonComplete(
  lessonId: string, 
  enrollmentId: string
): Promise<ActionResult>

// Update lesson progress
export async function updateLessonProgress(
  lessonId: string, 
  enrollmentId: string, 
  progress: number
): Promise<ActionResult>

// Get course progress summary
export async function getCourseProgress(
  courseId: string
): Promise<ActionResult>

// Get next lesson in sequence
export async function getNextLesson(
  currentLessonId: string, 
  courseId: string
): Promise<ActionResult>

// Get previous lesson in sequence
export async function getPreviousLesson(
  currentLessonId: string, 
  courseId: string
): Promise<ActionResult>
```


### Message Actions (Extensions)

**Location:** `src/lib/actions/student-communication-actions.ts`

**New Functions to Add:**

```typescript
// Send new message
export async function sendMessage(data: {
  recipientId: string;
  subject: string;
  content: string;
  attachments?: string[]; // URLs after upload
}): Promise<ActionResult>

// Reply to message
export async function replyToMessage(
  messageId: string,
  content: string
): Promise<ActionResult>

// Delete message (soft delete)
export async function deleteMessage(messageId: string): Promise<ActionResult>

// Archive message
export async function archiveMessage(messageId: string): Promise<ActionResult>

// Upload message attachment
export async function uploadMessageAttachment(
  file: File
): Promise<ActionResult>
```

## Data Flow

### Course Enrollment Flow

```
Student clicks "Enroll" button
    ↓
enrollInCourse() action called
    ↓
Verify course is published and available
    ↓
Create CourseEnrollment record
    ↓
Initialize LessonProgress records (all at 0%)
    ↓
Revalidate course pages
    ↓
Return success with enrollment data
    ↓
UI updates to show enrolled state
```


### Lesson Progress Flow

```
Student views lesson
    ↓
Track video watch time / content scroll
    ↓
updateLessonProgress() called periodically
    ↓
Update LessonProgress.progress field
    ↓
If progress >= 100%, mark as complete
    ↓
Recalculate course progress
    ↓
Update CourseEnrollment.progress
    ↓
Revalidate course pages
    ↓
UI updates progress indicators
```

### Message Sending Flow

```
Student composes message
    ↓
Uploads attachments (if any)
    ↓
sendMessage() action called
    ↓
Validate recipient (must be teacher/admin)
    ↓
Sanitize content (XSS prevention)
    ↓
Create Message record
    ↓
Create Notification for recipient
    ↓
Revalidate message pages
    ↓
Return success
    ↓
UI shows success message and closes form
```

## Database Queries

### Optimized Course Query

```typescript
const course = await db.course.findUnique({
  where: { id: courseId },
  include: {
    subject: true,
    teacher: {
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    },
    modules: {
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            duration: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    },
    enrollments: {
      where: { studentId },
      include: {
        lessonProgress: true,
      },
    },
  },
});
```


### Optimized Lesson Query

```typescript
const lesson = await db.lesson.findUnique({
  where: { id: lessonId },
  include: {
    module: {
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    },
  },
});
```

## UI/UX Design Specifications

### Color Scheme (Match Admin)

```typescript
// Primary colors
primary: "hsl(var(--primary))"
primaryForeground: "hsl(var(--primary-foreground))"

// Background colors
background: "hsl(var(--background))"
foreground: "hsl(var(--foreground))"
card: "hsl(var(--card))"
cardForeground: "hsl(var(--card-foreground))"

// Accent colors
accent: "hsl(var(--accent))"
accentForeground: "hsl(var(--accent-foreground))"

// Muted colors
muted: "hsl(var(--muted))"
mutedForeground: "hsl(var(--muted-foreground))"

// Border and input
border: "hsl(var(--border))"
input: "hsl(var(--input))"
ring: "hsl(var(--ring))"
```

### Typography

```typescript
// Font family
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
}

// Font sizes
text-xs: 0.75rem (12px)
text-sm: 0.875rem (14px)
text-base: 1rem (16px)
text-lg: 1.125rem (18px)
text-xl: 1.25rem (20px)
text-2xl: 1.5rem (24px)
text-3xl: 1.875rem (30px)
```


### Spacing System

```typescript
// Padding/Margin scale
0: 0px
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
```

### Responsive Breakpoints

```typescript
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large desktop
```

### Component Styling Patterns

**Card Pattern:**
```typescript
<Card className="border shadow-sm">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Button Pattern:**
```typescript
<Button 
  variant="default" // default, outline, ghost, destructive
  size="default"    // default, sm, lg, icon
  className="min-h-[44px]" // Accessibility
>
  Button Text
</Button>
```

**Input Pattern:**
```typescript
<div className="space-y-2">
  <Label htmlFor="input-id">Label</Label>
  <Input 
    id="input-id"
    type="text"
    placeholder="Placeholder"
    className="min-h-[44px]"
  />
</div>
```

## Error Handling

### Client-Side Error Handling

```typescript
try {
  const result = await enrollInCourse(courseId);
  
  if (!result.success) {
    toast.error(result.message || "Failed to enroll");
    return;
  }
  
  toast.success("Successfully enrolled in course");
  router.refresh();
} catch (error) {
  console.error("Enrollment error:", error);
  toast.error("An unexpected error occurred");
}
```


### Server-Side Error Handling

```typescript
export async function enrollInCourse(courseId: string) {
  try {
    // Get current student
    const studentData = await getCurrentStudent();
    if (!studentData) {
      return { success: false, message: "Unauthorized" };
    }
    
    // Verify course exists and is published
    const course = await db.course.findUnique({
      where: { id: courseId },
    });
    
    if (!course) {
      return { success: false, message: "Course not found" };
    }
    
    if (!course.isPublished) {
      return { success: false, message: "Course not available" };
    }
    
    // Check if already enrolled
    const existing = await db.courseEnrollment.findFirst({
      where: {
        studentId: studentData.student.id,
        courseId,
      },
    });
    
    if (existing) {
      return { success: false, message: "Already enrolled" };
    }
    
    // Create enrollment
    const enrollment = await db.courseEnrollment.create({
      data: {
        studentId: studentData.student.id,
        courseId,
        progress: 0,
        status: 'ACTIVE',
      },
    });
    
    revalidatePath('/student/courses');
    
    return { 
      success: true, 
      data: enrollment,
      message: "Successfully enrolled" 
    };
  } catch (error) {
    console.error("Enrollment error:", error);
    return { 
      success: false, 
      message: "Failed to enroll in course" 
    };
  }
}
```

## Performance Optimizations

### 1. Data Caching Strategy

```typescript
// Cache course list for 5 minutes
export const revalidate = 300;

// Cache individual course for 10 minutes
const course = await unstable_cache(
  async () => getCourseById(courseId),
  [`course-${courseId}`],
  { revalidate: 600 }
)();
```


### 2. Lazy Loading Components

```typescript
// Lazy load video player
const VideoPlayer = dynamic(
  () => import('@/components/student/video-player'),
  { 
    loading: () => <Skeleton className="aspect-video" />,
    ssr: false 
  }
);

// Lazy load PDF viewer
const PDFViewer = dynamic(
  () => import('@/components/student/pdf-viewer'),
  { 
    loading: () => <Skeleton className="h-96" />,
    ssr: false 
  }
);
```

### 3. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={course.thumbnail || '/placeholder-course.jpg'}
  alt={course.title}
  width={800}
  height={450}
  className="rounded-lg object-cover"
  priority={false}
  loading="lazy"
/>
```

### 4. Pagination Implementation

```typescript
// Paginate course list
const ITEMS_PER_PAGE = 12;

const courses = await db.course.findMany({
  where: { isPublished: true },
  skip: (page - 1) * ITEMS_PER_PAGE,
  take: ITEMS_PER_PAGE,
  orderBy: { createdAt: 'desc' },
});

const totalCount = await db.course.count({
  where: { isPublished: true },
});

const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
```

## Security Measures

### 1. Authentication Verification

```typescript
async function getCurrentStudent() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  const dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { student: true },
  });
  
  if (!dbUser || dbUser.role !== UserRole.STUDENT || !dbUser.student) {
    return null;
  }
  
  return { user: dbUser, student: dbUser.student };
}
```


### 2. Enrollment Verification

```typescript
async function verifyEnrollment(courseId: string, studentId: string) {
  const enrollment = await db.courseEnrollment.findFirst({
    where: {
      courseId,
      studentId,
      status: 'ACTIVE',
    },
  });
  
  return enrollment !== null;
}
```

### 3. Content Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML content before rendering
const sanitizedContent = DOMPurify.sanitize(lesson.content, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
});
```

### 4. File Upload Validation

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  return { valid: true };
}
```

### 5. Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function sendMessage(data: MessageData) {
  const studentData = await getCurrentStudent();
  if (!studentData) {
    return { success: false, message: 'Unauthorized' };
  }
  
  // Check rate limit
  const { success: rateLimitOk } = await ratelimit.limit(
    `message:${studentData.user.id}`
  );
  
  if (!rateLimitOk) {
    return { 
      success: false, 
      message: 'Too many requests. Please try again later.' 
    };
  }
  
  // Continue with message sending...
}
```


## Accessibility Implementation

### 1. Keyboard Navigation

```typescript
// Ensure all interactive elements are keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="min-h-[44px] min-w-[44px]"
  aria-label="Enroll in course"
>
  Enroll
</button>
```

### 2. ARIA Labels

```typescript
<nav aria-label="Course navigation">
  <ul role="list">
    {modules.map((module) => (
      <li key={module.id} role="listitem">
        <button
          aria-expanded={isExpanded}
          aria-controls={`module-${module.id}`}
        >
          {module.title}
        </button>
      </li>
    ))}
  </ul>
</nav>
```

### 3. Focus Management

```typescript
import { useEffect, useRef } from 'react';

function LessonViewer({ lesson }: LessonViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Focus on content when lesson changes
    contentRef.current?.focus();
  }, [lesson.id]);
  
  return (
    <div 
      ref={contentRef}
      tabIndex={-1}
      className="focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Lesson content */}
    </div>
  );
}
```

### 4. Screen Reader Support

```typescript
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading && <span className="sr-only">Loading course content...</span>}
  {error && <span className="sr-only">Error: {error}</span>}
  {success && <span className="sr-only">Course loaded successfully</span>}
</div>
```

## Testing Strategy

### Unit Tests

```typescript
// src/lib/actions/__tests__/student-course-actions.test.ts
describe('enrollInCourse', () => {
  it('should enroll student in published course', async () => {
    const result = await enrollInCourse('course-123');
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
  });
  
  it('should reject enrollment in unpublished course', async () => {
    const result = await enrollInCourse('unpublished-course');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not available');
  });
  
  it('should prevent duplicate enrollment', async () => {
    await enrollInCourse('course-123');
    const result = await enrollInCourse('course-123');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Already enrolled');
  });
});
```


### Component Tests

```typescript
// src/components/student/__tests__/lesson-viewer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonViewer } from '../lesson-viewer';

describe('LessonViewer', () => {
  const mockLesson = {
    id: 'lesson-1',
    title: 'Introduction',
    content: '<p>Lesson content</p>',
    contentType: 'TEXT' as const,
    videoUrl: null,
    duration: 30,
    order: 1,
  };
  
  it('should render text lesson content', () => {
    render(
      <LessonViewer
        lesson={mockLesson}
        progress={{ isCompleted: false, progress: 0 }}
        navigation={{ previousLesson: null, nextLesson: null }}
        onComplete={jest.fn()}
        onProgressUpdate={jest.fn()}
      />
    );
    
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Lesson content')).toBeInTheDocument();
  });
  
  it('should call onComplete when mark complete button clicked', () => {
    const onComplete = jest.fn();
    render(
      <LessonViewer
        lesson={mockLesson}
        progress={{ isCompleted: false, progress: 0 }}
        navigation={{ previousLesson: null, nextLesson: null }}
        onComplete={onComplete}
        onProgressUpdate={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Mark as Complete'));
    expect(onComplete).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
// src/app/student/courses/__tests__/course-enrollment.test.ts
describe('Course Enrollment Flow', () => {
  it('should complete full enrollment flow', async () => {
    // 1. Navigate to courses page
    // 2. Click on a course
    // 3. Verify course details displayed
    // 4. Click enroll button
    // 5. Verify enrollment success
    // 6. Verify course appears in "My Courses"
    // 7. Verify progress is initialized at 0%
  });
});
```

## Deployment Considerations

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Build Configuration

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  experimental: {
    serverActions: true,
  },
};
```

### Database Indexes

```sql
-- Add indexes for performance
CREATE INDEX idx_course_enrollment_student ON "CourseEnrollment"("studentId");
CREATE INDEX idx_course_enrollment_course ON "CourseEnrollment"("courseId");
CREATE INDEX idx_lesson_progress_enrollment ON "LessonProgress"("enrollmentId");
CREATE INDEX idx_lesson_progress_lesson ON "LessonProgress"("lessonId");
CREATE INDEX idx_message_recipient ON "Message"("recipientId");
CREATE INDEX idx_message_sender ON "Message"("senderId");
```

## Migration Plan

### Phase 1: UI Updates (Week 1)
1. Update StudentSidebar to match AdminSidebar design
2. Update StudentHeader to match AdminHeader design
3. Test responsive behavior
4. Verify theme switching works

### Phase 2: Course Functionality (Week 2)
1. Create student-course-actions.ts
2. Create CourseDetail component
3. Create course detail page
4. Create LessonViewer component
5. Create lesson viewer page
6. Implement progress tracking
7. Test enrollment flow

### Phase 3: Message Composition (Week 3)
1. Create MessageCompose component
2. Add sendMessage action
3. Add replyToMessage action
4. Integrate with existing message pages
5. Test message sending flow

### Phase 4: Testing & Polish (Week 4)
1. Write unit tests
2. Write integration tests
3. Perform accessibility audit
4. Performance optimization
5. Bug fixes
6. Documentation

## Success Metrics

### Performance Metrics
- Page load time < 2 seconds
- Time to interactive < 3 seconds
- First contentful paint < 1.5 seconds
- Largest contentful paint < 2.5 seconds

### User Experience Metrics
- Task completion rate > 95%
- Error rate < 1%
- User satisfaction score > 4.5/5
- Support ticket reduction > 50%

### Technical Metrics
- Test coverage > 80%
- Zero critical security vulnerabilities
- Accessibility score > 95 (Lighthouse)
- Performance score > 90 (Lighthouse)
