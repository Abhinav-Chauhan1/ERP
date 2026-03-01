"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Circle, BookOpen, FileText, Video, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { triggerHapticFeedback } from '@/lib/utils/mobile-navigation';

interface LessonContent {
  id: string;
  type: 'video' | 'text' | 'audio' | 'interactive';
  title: string;
  content: string;
  duration?: number;
  completed: boolean;
}

interface InteractiveLessonViewerProps {
  lessonId: string;
  title: string;
  description: string;
  contents: LessonContent[];
  progress: number;
  onComplete: (contentId: string) => void;
  onProgressUpdate: (progress: number) => void;
  className?: string;
}

export function InteractiveLessonViewer({
  lessonId,
  title,
  description,
  contents,
  progress,
  onComplete,
  onProgressUpdate,
  className
}: InteractiveLessonViewerProps) {
  const { isSimplified, isMobile } = useMobileNavigation({ className });
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [contentProgress, setContentProgress] = useState(0);

  const currentContent = contents[currentContentIndex];
  const completedCount = contents.filter(c => c.completed).length;
  const totalProgress = (completedCount / contents.length) * 100;

  const handleNext = () => {
    if (currentContentIndex < contents.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
      setContentProgress(0);
      if (isMobile) triggerHapticFeedback('light');
    }
  };

  const handlePrevious = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(prev => prev - 1);
      setContentProgress(0);
      if (isMobile) triggerHapticFeedback('light');
    }
  };

  const handleComplete = () => {
    onComplete(currentContent.id);
    if (isMobile) triggerHapticFeedback('medium');
    
    // Auto-advance to next content
    setTimeout(() => {
      if (currentContentIndex < contents.length - 1) {
        handleNext();
      }
    }, 1000);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isMobile) triggerHapticFeedback('light');
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Headphones;
      case 'text': return FileText;
      case 'interactive': return Circle;
      default: return BookOpen;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'audio': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      case 'text': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'interactive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Simulate content progress for demo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !currentContent.completed) {
      interval = setInterval(() => {
        setContentProgress(prev => {
          const newProgress = Math.min(prev + 2, 100);
          if (newProgress === 100) {
            setIsPlaying(false);
          }
          return newProgress;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentContent.completed]);

  // Update overall progress
  useEffect(() => {
    onProgressUpdate(totalProgress);
  }, [totalProgress, onProgressUpdate]);

  if (isSimplified) {
    // Simplified layout for primary classes (1-5)
    return (
      <div className="space-y-4">
        {/* Simple Progress */}
        <Card className="bg-gradient-to-r from-blue-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-2">{title}</h2>
            <div className="flex items-center gap-2">
              <Progress value={totalProgress} className="flex-1 bg-white/20" />
              <span className="text-sm font-medium">{Math.round(totalProgress)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Simple Content Viewer */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                {React.createElement(getContentIcon(currentContent.type), {
                  className: "h-8 w-8 text-blue-600"
                })}
              </div>
              
              <h3 className="text-lg font-semibold">{currentContent.title}</h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
                <p className="text-sm">{currentContent.content}</p>
              </div>

              {/* Simple Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePlayPause}
                  className="touch-target-primary"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                
                {contentProgress === 100 && (
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    className="touch-target-primary bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Done!
                  </Button>
                )}
              </div>

              {/* Simple Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentContentIndex === 0}
                  className="touch-target-primary"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  {currentContentIndex + 1} of {contents.length}
                </span>
                <Button
                  variant="ghost"
                  onClick={handleNext}
                  disabled={currentContentIndex === contents.length - 1}
                  className="touch-target-primary"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full layout for secondary classes (6-12)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Content List Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lesson Contents</CardTitle>
            <div className="flex items-center gap-2">
              <Progress value={totalProgress} className="flex-1" />
              <span className="text-sm text-muted-foreground">{Math.round(totalProgress)}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {contents.map((content, index) => {
              const Icon = getContentIcon(content.type);
              return (
                <button
                  key={content.id}
                  onClick={() => {
                    setCurrentContentIndex(index);
                    setContentProgress(0);
                    if (isMobile) triggerHapticFeedback('light');
                  }}
                  className={`
                    w-full p-3 rounded-lg text-left transition-all duration-200
                    ${index === currentContentIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent hover:text-accent-foreground'
                    }
                    ${isMobile ? 'touch-target-secondary' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{content.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getContentTypeColor(content.type)}`}
                        >
                          {content.type}
                        </Badge>
                        {content.completed && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Viewer */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{currentContent.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getContentTypeColor(currentContent.type)}>
                    {currentContent.type}
                  </Badge>
                  {currentContent.duration && (
                    <span className="text-sm text-muted-foreground">
                      {currentContent.duration} min
                    </span>
                  )}
                </div>
              </div>
              {currentContent.completed && (
                <CheckCircle className="h-6 w-6 text-green-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Area */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 min-h-[300px]">
              <div className="prose dark:prose-invert max-w-none">
                <p>{currentContent.content}</p>
              </div>
            </div>

            {/* Content Progress */}
            {!currentContent.completed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Content Progress</span>
                  <span className="text-sm text-muted-foreground">{Math.round(contentProgress)}%</span>
                </div>
                <Progress value={contentProgress} />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePlayPause}
                  disabled={currentContent.completed}
                  className={isMobile ? 'touch-target-secondary' : ''}
                >
                  {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isPlaying ? 'Pause' : 'Start'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setContentProgress(0);
                    setIsPlaying(false);
                    if (isMobile) triggerHapticFeedback('light');
                  }}
                  className={isMobile ? 'touch-target-secondary' : ''}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {contentProgress === 100 && !currentContent.completed && (
                <Button
                  onClick={handleComplete}
                  className={`bg-green-500 hover:bg-green-600 ${isMobile ? 'touch-target-secondary' : ''}`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentContentIndex === 0}
                className={isMobile ? 'touch-target-secondary' : ''}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {currentContentIndex + 1} of {contents.length}
              </span>
              
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentContentIndex === contents.length - 1}
                className={isMobile ? 'touch-target-secondary' : ''}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}