import { render, screen, fireEvent } from "@testing-library/react";
import { CourseDetail } from "../course-detail";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}));

describe("CourseDetail Component", () => {
  const mockCourse = {
    id: "course-1",
    title: "Introduction to Programming",
    description: "Learn the basics of programming",
    thumbnail: "/course-thumbnail.jpg",
    level: "BEGINNER",
    duration: 40,
    subject: { id: "subject-1", name: "Computer Science" },
    teacher: {
      id: "teacher-1",
      user: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        avatar: null,
      },
    },
    modules: [
      {
        id: "module-1",
        title: "Module 1: Basics",
        description: "Introduction to programming concepts",
        sequence: 1,
        lessons: [
          {
            id: "lesson-1",
            title: "Lesson 1: Variables",
            duration: 30,
            sequence: 1,
          },
          {
            id: "lesson-2",
            title: "Lesson 2: Data Types",
            duration: 45,
            sequence: 2,
          },
        ],
      },
    ],
  };

  const mockEnrollment = {
    id: "enrollment-1",
    progress: 50,
    status: "ACTIVE",
    enrolledAt: new Date("2024-01-01"),
  };

  const mockOnEnroll = jest.fn();
  const mockOnUnenroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render course information correctly", () => {
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={null}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    expect(screen.getByText("Introduction to Programming")).toBeInTheDocument();
    expect(screen.getByText("Learn the basics of programming")).toBeInTheDocument();
    expect(screen.getByText("BEGINNER")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should display enroll button when not enrolled", () => {
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={null}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    const enrollButton = screen.getByRole("button", { name: /enroll now/i });
    expect(enrollButton).toBeInTheDocument();
  });

  it("should display progress bar when enrolled", () => {
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={mockEnrollment}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    expect(screen.getByText("Course Progress")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should display continue learning button when enrolled with progress", () => {
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={mockEnrollment}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    const continueButton = screen.getByRole("button", { name: /continue learning/i });
    expect(continueButton).toBeInTheDocument();
  });

  it("should display start course button when enrolled with no progress", () => {
    const enrollmentNoProgress = { ...mockEnrollment, progress: 0 };
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={enrollmentNoProgress}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    const startButton = screen.getByRole("button", { name: /start course/i });
    expect(startButton).toBeInTheDocument();
  });

  it("should display all modules and lessons", () => {
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={null}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    expect(screen.getByText("Module 1: Basics")).toBeInTheDocument();
    expect(screen.getByText("2 lessons")).toBeInTheDocument();
  });

  it("should call onEnroll when enroll button is clicked", async () => {
    mockOnEnroll.mockResolvedValue(undefined);

    render(
      <CourseDetail
        course={mockCourse}
        enrollment={null}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    const enrollButton = screen.getByRole("button", { name: /enroll now/i });
    fireEvent.click(enrollButton);

    expect(mockOnEnroll).toHaveBeenCalled();
  });

  it("should display unenroll button when enrolled", () => {
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={mockEnrollment}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    const unenrollButton = screen.getByRole("button", { name: /unenroll/i });
    expect(unenrollButton).toBeInTheDocument();
  });

  it("should display lesson count correctly", () => {
    render(
      <CourseDetail
        course={mockCourse}
        enrollment={null}
        onEnroll={mockOnEnroll}
        onUnenroll={mockOnUnenroll}
      />
    );

    // Total lessons should be 2
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
