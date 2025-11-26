# CourseModuleList Component

A sidebar navigation component for displaying course modules and lessons with progress tracking.

## Features

- ✅ Displays all modules in order
- ✅ Shows lesson count per module
- ✅ Expandable/collapsible modules
- ✅ Highlights current lesson
- ✅ Shows completion status for lessons and modules
- ✅ Displays lesson duration
- ✅ Responsive design with scroll area
- ✅ Accessible with keyboard navigation

## Usage

```tsx
import { CourseModuleList } from "@/components/student/course-module-list";

function CoursePage() {
  const modules = [
    {
      id: "module-1",
      title: "Introduction to Programming",
      order: 1,
      lessons: [
        {
          id: "lesson-1",
          title: "What is Programming?",
          duration: 15,
          isCompleted: true,
        },
        {
          id: "lesson-2",
          title: "Setting Up Your Environment",
          duration: 30,
          isCompleted: false,
        },
      ],
    },
    {
      id: "module-2",
      title: "Advanced Concepts",
      order: 2,
      lessons: [
        {
          id: "lesson-3",
          title: "Data Structures",
          duration: 45,
          isCompleted: false,
        },
      ],
    },
  ];

  const handleLessonClick = (lessonId: string) => {
    // Navigate to lesson or update current lesson
    router.push(`/student/courses/${courseId}/lessons/${lessonId}`);
  };

  return (
    <CourseModuleList
      modules={modules}
      currentLessonId="lesson-2"
      onLessonClick={handleLessonClick}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `modules` | `Module[]` | Yes | Array of course modules with lessons |
| `currentLessonId` | `string \| null` | Yes | ID of the currently active lesson |
| `onLessonClick` | `(lessonId: string) => void` | Yes | Callback when a lesson is clicked |
| `className` | `string` | No | Additional CSS classes |

## Module Type

```typescript
interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}
```

## Lesson Type

```typescript
interface Lesson {
  id: string;
  title: string;
  duration: number | null; // Duration in minutes
  isCompleted: boolean;
}
```

## Features in Detail

### Module Expansion

All modules are expanded by default. Users can click on a module header to collapse/expand it.

### Completion Indicators

- ✅ Green checkmark icon for completed lessons
- ⭕ Circle icon for incomplete lessons
- 🎯 Green badge for fully completed modules
- 📊 Progress percentage for partially completed modules

### Current Lesson Highlighting

The currently active lesson is highlighted with:
- Primary color background
- "Current" badge
- Border accent

### Duration Display

Lesson durations are formatted as:
- `15m` for lessons under 60 minutes
- `1h 30m` for lessons over 60 minutes
- Hidden if duration is null

### Responsive Design

- Fixed height with scroll area (600px)
- Touch-friendly buttons (min 44px)
- Keyboard accessible
- Works on mobile, tablet, and desktop

## Styling

The component uses Tailwind CSS and shadcn/ui components:
- Card for container
- Collapsible for module expansion
- ScrollArea for scrollable content
- Badge for status indicators
- Button for interactive elements

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader compatible
- Semantic HTML structure

## Example with Server Data

```tsx
import { CourseModuleList } from "@/components/student/course-module-list";
import { getModulesByCourse } from "@/lib/actions/student-course-actions";

async function CourseSidebar({ courseId, currentLessonId }: Props) {
  const result = await getModulesByCourse(courseId);
  
  if (!result.success || !result.data) {
    return <div>Failed to load modules</div>;
  }

  const handleLessonClick = (lessonId: string) => {
    "use server";
    redirect(`/student/courses/${courseId}/lessons/${lessonId}`);
  };

  return (
    <CourseModuleList
      modules={result.data}
      currentLessonId={currentLessonId}
      onLessonClick={handleLessonClick}
    />
  );
}
```

## Integration with Course Pages

This component is designed to be used as a sidebar in course detail and lesson viewer pages:

```tsx
// Course Detail Page Layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main course content */}
  </div>
  <div className="lg:col-span-1">
    <CourseModuleList
      modules={modules}
      currentLessonId={null}
      onLessonClick={handleLessonClick}
    />
  </div>
</div>
```

## Performance Considerations

- Uses React state for module expansion
- Efficient re-renders with proper key props
- Scroll area prevents layout shifts
- Lazy loading compatible

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Related Components

- `CourseDetail` - Main course information display
- `LessonViewer` - Individual lesson content viewer
- `CourseProgressTracker` - Overall course progress display
