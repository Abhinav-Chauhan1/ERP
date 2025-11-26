import { LessonViewerSkeleton } from '@/components/student/lesson-viewer';

export default function LessonViewerLoading() {
  return (
    <div className="p-6">
      <LessonViewerSkeleton />
    </div>
  );
}
