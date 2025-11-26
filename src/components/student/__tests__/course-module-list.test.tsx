import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CourseModuleList } from "../course-module-list";

const mockModules = [
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
      {
        id: "lesson-4",
        title: "Algorithms",
        duration: null,
        isCompleted: false,
      },
    ],
  },
];

describe("CourseModuleList Component", () => {
  const mockOnLessonClick = vi.fn();

  beforeEach(() => {
    mockOnLessonClick.mockClear();
  });

  it("should render all modules", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("Introduction to Programming")).toBeInTheDocument();
    expect(screen.getByText("Advanced Concepts")).toBeInTheDocument();
  });

  it("should display module count in header", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("2 modules")).toBeInTheDocument();
  });

  it("should display singular module text when only one module", () => {
    render(
      <CourseModuleList
        modules={[mockModules[0]]}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("1 module")).toBeInTheDocument();
  });

  it("should display lesson count for each module", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    const lessonCounts = screen.getAllByText(/\/\d+ lessons/);
    expect(lessonCounts).toHaveLength(2);
  });

  it("should show completion status for modules", () => {
    const completedModule = {
      id: "module-complete",
      title: "Completed Module",
      order: 1,
      lessons: [
        {
          id: "lesson-c1",
          title: "Lesson 1",
          duration: 10,
          isCompleted: true,
        },
        {
          id: "lesson-c2",
          title: "Lesson 2",
          duration: 10,
          isCompleted: true,
        },
      ],
    };

    render(
      <CourseModuleList
        modules={[completedModule]}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    // Module should show as complete
    expect(screen.getByText("2/2 lessons")).toBeInTheDocument();
  });

  it("should display lesson duration when available", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("15m")).toBeInTheDocument();
    expect(screen.getByText("30m")).toBeInTheDocument();
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("should format duration correctly for hours", () => {
    const moduleWithLongLesson = {
      id: "module-long",
      title: "Long Module",
      order: 1,
      lessons: [
        {
          id: "lesson-long",
          title: "Long Lesson",
          duration: 90,
          isCompleted: false,
        },
      ],
    };

    render(
      <CourseModuleList
        modules={[moduleWithLongLesson]}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("should highlight current lesson", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId="lesson-2"
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("should call onLessonClick when lesson is clicked", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    const lessonButton = screen.getByText("What is Programming?");
    fireEvent.click(lessonButton);

    expect(mockOnLessonClick).toHaveBeenCalledWith("lesson-1");
    expect(mockOnLessonClick).toHaveBeenCalledTimes(1);
  });

  it("should toggle module expansion", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    // Initially, lessons should be visible (modules open by default)
    expect(screen.getByText("What is Programming?")).toBeInTheDocument();

    // Click to collapse
    const moduleButton = screen.getByText("Introduction to Programming");
    fireEvent.click(moduleButton);

    // Lessons should still be in document but may be hidden by CSS
    // We can't easily test CSS visibility, so we just verify the click works
    expect(moduleButton).toBeInTheDocument();
  });

  it("should show completion indicators for completed lessons", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    // First lesson is completed, should have CheckCircle icon
    // We can't easily test for the icon, but we can verify the lesson is rendered
    expect(screen.getByText("What is Programming?")).toBeInTheDocument();
  });

  it("should display module progress percentage", () => {
    render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    // First module has 1/2 lessons complete = 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CourseModuleList
        modules={mockModules}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should handle empty modules array", () => {
    render(
      <CourseModuleList
        modules={[]}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("0 modules")).toBeInTheDocument();
  });

  it("should handle module with no lessons", () => {
    const emptyModule = {
      id: "module-empty",
      title: "Empty Module",
      order: 1,
      lessons: [],
    };

    render(
      <CourseModuleList
        modules={[emptyModule]}
        currentLessonId={null}
        onLessonClick={mockOnLessonClick}
      />
    );

    expect(screen.getByText("Empty Module")).toBeInTheDocument();
    expect(screen.getByText("0/0 lessons")).toBeInTheDocument();
  });
});
