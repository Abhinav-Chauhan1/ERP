"use client"

import { Suspense } from 'react';
import { InteractiveLessonViewer } from '@/components/student/lms/interactive-lesson-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data - replace with actual data fetching
const mockLessonData = {
  id: '1',
  title: 'Introduction to Photosynthesis',
  description: 'Learn how plants make their own food using sunlight, water, and carbon dioxide.',
  contents: [
    {
      id: 'content-1',
      type: 'text' as const,
      title: 'What is Photosynthesis?',
      content: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar. This process is essential for life on Earth as it produces the oxygen we breathe.',
      duration: 5,
      completed: false
    },
    {
      id: 'content-2',
      type: 'video' as const,
      title: 'The Photosynthesis Process',
      content: 'Watch this animated video to see how photosynthesis works step by step. You will learn about chloroplasts, chlorophyll, and the chemical equation for photosynthesis.',
      duration: 8,
      completed: false
    },
    {
      id: 'content-3',
      type: 'interactive' as const,
      title: 'Label the Plant Parts',
      content: 'Interactive activity: Click on different parts of the plant and learn their role in photosynthesis. Identify the leaves, roots, stem, and understand how each contributes to the process.',
      duration: 10,
      completed: false
    },
    {
      id: 'content-4',
      type: 'audio' as const,
      title: 'Photosynthesis Song',
      content: 'Listen to this catchy song about photosynthesis to help you remember the key concepts. The song covers the inputs (sunlight, water, CO2) and outputs (oxygen, glucose) of the process.',
      duration: 3,
      completed: false
    }
  ],
  progress: 0
};

interface LessonPageProps {
  params: {
    id: string;
  };
}

function LessonSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-2 w-full" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LessonPage({ params }: LessonPageProps) {
  // In a real app, you would fetch lesson data based on params.id
  const lessonData = mockLessonData;

  const handleComplete = (contentId: string) => {
    // Handle content completion
    console.log('Content completed:', contentId);
    // In a real app, you would update the database
  };

  const handleProgressUpdate = (progress: number) => {
    // Handle progress update
    console.log('Progress updated:', progress);
    // In a real app, you would save progress to database
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<LessonSkeleton />}>
        <InteractiveLessonViewer
          lessonId={lessonData.id}
          title={lessonData.title}
          description={lessonData.description}
          contents={lessonData.contents}
          progress={lessonData.progress}
          onComplete={handleComplete}
          onProgressUpdate={handleProgressUpdate}
        />
      </Suspense>
    </div>
  );
}