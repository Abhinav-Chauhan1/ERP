import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonViewer } from "../lesson-viewer";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("LessonViewer Component", () => {
  const mockTextLesson = {
    id: "lesson-1",
    title: "Introduction to Variables",
    description: "Learn about variables in programming",
    lessonType: "TEXT" as const,
    duration: 30,
    sequence: 1,
    contents: [
      {
        id: "content-1",
        contentType: "TEXT" as const,
        title: "What are Variables?",
        url: null,
        content: "<p>Variables are containers for storing data values.</p>",
        duration: null,
        sequence: 1,
        isDownloadable: false,
      },
    ],
  };

  const mockVideoLesson = {
    id: "lesson-2",
    title: "Video Tutorial",
    description: "Watch this video tutorial",
    lessonType: "VIDEO" as const,
    duration: 45,
    sequence: 2,
    contents: [
      {
        id: "content-2",
        contentType: "VIDEO" as const,
        title: "Introduction Video",
        url: "https://example.com/video.mp4",
        content: null,
        duration: 2700,
        sequence: 1,
        isDownloadable: false,
      },
    ],
  };

  const mockProgress = {
    id: "progress-1",
    status: "IN_PROGRESS" as const,
    progress: 50,
    timeSpent: 600,
  };

  const mockNavigation = {
    previousLesson: { id: "lesson-0", title: "Previous Lesson" },
    nextLesson: { id: "lesson-3", title: "Next Lesson" },
  };

  const mockOnComplete = vi.fn();
  const mockOnProgressUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render text lesson content correctly", () => {
    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("Introduction to Variables")).toBeInTheDocument();
    expect(screen.getByText("Learn about variables in programming")).toBeInTheDocument();
    expect(screen.getByText("What are Variables?")).toBeInTheDocument();
  });

  it("should render video lesson content correctly", () => {
    render(
      <LessonViewer
        lesson={mockVideoLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("Video Tutorial")).toBeInTheDocument();
    expect(screen.getByText("Watch this video tutorial")).toBeInTheDocument();
    expect(screen.getByText("Introduction Video")).toBeInTheDocument();
  });

  it("should display progress bar for incomplete lessons", () => {
    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should display completed badge for completed lessons", () => {
    const completedProgress = {
      ...mockProgress,
      status: "COMPLETED" as const,
      progress: 100,
    };

    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={completedProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("should display mark as complete button for incomplete lessons", () => {
    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    const completeButton = screen.getByRole("button", { name: /mark as complete/i });
    expect(completeButton).toBeInTheDocument();
  });

  it("should not display mark as complete button for completed lessons", () => {
    const completedProgress = {
      ...mockProgress,
      status: "COMPLETED" as const,
      progress: 100,
    };

    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={completedProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    const completeButton = screen.queryByRole("button", { name: /mark as complete/i });
    expect(completeButton).not.toBeInTheDocument();
  });

  it("should call onComplete when mark as complete button is clicked", async () => {
    mockOnComplete.mockResolvedValue(undefined);

    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    const completeButton = screen.getByRole("button", { name: /mark as complete/i });
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it("should display navigation buttons", () => {
    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("should disable previous button when no previous lesson", () => {
    const noNavigation = {
      previousLesson: null,
      nextLesson: mockNavigation.nextLesson,
    };

    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={noNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    const previousButton = screen.getByRole("button", { name: /previous/i });
    expect(previousButton).toBeDisabled();
  });

  it("should disable next button when no next lesson", () => {
    const noNavigation = {
      previousLesson: mockNavigation.previousLesson,
      nextLesson: null,
    };

    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={noNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("should display lesson duration", () => {
    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("30 min")).toBeInTheDocument();
  });

  it("should display time spent", () => {
    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText(/time spent:/i)).toBeInTheDocument();
  });

  it("should render PDF content with iframe", () => {
    const pdfLesson = {
      ...mockTextLesson,
      lessonType: "DOCUMENT" as const,
      contents: [
        {
          id: "content-3",
          contentType: "PDF" as const,
          title: "Course Material",
          url: "https://example.com/document.pdf",
          content: null,
          duration: null,
          sequence: 1,
          isDownloadable: true,
        },
      ],
    };

    render(
      <LessonViewer
        lesson={pdfLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("Course Material")).toBeInTheDocument();
    expect(screen.getByText("Open in New Tab")).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();
  });

  it("should handle lessons with no progress", () => {
    render(
      <LessonViewer
        lesson={mockTextLesson}
        progress={null}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("Introduction to Variables")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark as complete/i })).toBeInTheDocument();
  });

  it("should render multiple content items in sequence", () => {
    const multiContentLesson = {
      ...mockTextLesson,
      contents: [
        {
          id: "content-1",
          contentType: "TEXT" as const,
          title: "Part 1",
          url: null,
          content: "<p>First part of the lesson</p>",
          duration: null,
          sequence: 1,
          isDownloadable: false,
        },
        {
          id: "content-2",
          contentType: "TEXT" as const,
          title: "Part 2",
          url: null,
          content: "<p>Second part of the lesson</p>",
          duration: null,
          sequence: 2,
          isDownloadable: false,
        },
      ],
    };

    render(
      <LessonViewer
        lesson={multiContentLesson}
        progress={mockProgress}
        navigation={mockNavigation}
        courseId="course-1"
        onComplete={mockOnComplete}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText("Part 1")).toBeInTheDocument();
    expect(screen.getByText("Part 2")).toBeInTheDocument();
  });
});
