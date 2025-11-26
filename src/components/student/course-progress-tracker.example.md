# CourseProgressTracker Component

A reusable component for displaying course progress with visual indicators and statistics.

## Features

- **Compact View**: Minimal progress bar with percentage and lesson count
- **Detailed View**: Full card with statistics, progress bar, and motivational messages
- **Responsive Design**: Works on all screen sizes
- **Color-coded Progress**: Visual feedback based on completion percentage
- **Completion Messages**: Congratulatory message at 100% or encouragement for ongoing progress

## Usage

### Compact View (Default)

```tsx
import { CourseProgressTracker } from '@/components/student/course-progress-tracker';

<CourseProgressTracker
  progress={50}
  completedLessons={5}
  totalLessons={10}
/>
```

### Detailed View

```tsx
import { CourseProgressTracker } from '@/components/student/course-progress-tracker';

<CourseProgressTracker
  progress={75}
  completedLessons={15}
  totalLessons={20}
  showDetails={true}
/>
```

### With Custom Styling

```tsx
<CourseProgressTracker
  progress={30}
  completedLessons={3}
  totalLessons={10}
  showDetails={true}
  className="my-4"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `progress` | `number` | Yes | - | Progress percentage (0-100). Values outside this range are clamped. |
| `completedLessons` | `number` | Yes | - | Number of lessons completed |
| `totalLessons` | `number` | Yes | - | Total number of lessons in the course |
| `showDetails` | `boolean` | No | `false` | Show detailed card view with statistics |
| `className` | `string` | No | - | Additional CSS classes |

## Examples

### 0% Progress (Just Started)

```tsx
<CourseProgressTracker
  progress={0}
  completedLessons={0}
  totalLessons={20}
  showDetails={true}
/>
```

Shows "Keep Going!" message with full lesson count remaining.

### 50% Progress (Halfway)

```tsx
<CourseProgressTracker
  progress={50}
  completedLessons={10}
  totalLessons={20}
  showDetails={true}
/>
```

Shows yellow/amber progress indicator with encouragement message.

### 100% Progress (Completed)

```tsx
<CourseProgressTracker
  progress={100}
  completedLessons={20}
  totalLessons={20}
  showDetails={true}
/>
```

Shows "Congratulations!" message with green completion badge.

## Integration Example

### In Course Detail Page

```tsx
import { CourseProgressTracker } from '@/components/student/course-progress-tracker';

export function CourseDetailPage({ course, enrollment }) {
  if (!enrollment) {
    return <div>Not enrolled</div>;
  }

  const totalLessons = course.modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );

  const completedLessons = enrollment.lessonProgress.filter(
    (progress) => progress.isCompleted
  ).length;

  return (
    <div>
      <h1>{course.title}</h1>
      
      <CourseProgressTracker
        progress={enrollment.progress}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        showDetails={true}
      />
      
      {/* Rest of course content */}
    </div>
  );
}
```

### In Course Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>{course.title}</CardTitle>
  </CardHeader>
  <CardContent>
    <CourseProgressTracker
      progress={enrollment.progress}
      completedLessons={completedLessons}
      totalLessons={totalLessons}
    />
  </CardContent>
</Card>
```

## Color Coding

The component automatically applies color coding based on progress:

- **0%**: Muted gray (not started)
- **1-29%**: Red (just started)
- **30-69%**: Yellow/Amber (in progress)
- **70-99%**: Green (almost done)
- **100%**: Green with completion badge

## Accessibility

- Proper ARIA labels for screen readers
- Semantic HTML structure
- Keyboard navigation support
- High contrast colors for visibility
- Responsive text sizing

## Testing

The component includes comprehensive tests covering:
- Compact and detailed views
- Progress at 0%, 50%, and 100%
- Singular vs plural lesson text
- Progress value clamping
- Custom className application

Run tests with:
```bash
npm test -- course-progress-tracker.test.tsx
```
