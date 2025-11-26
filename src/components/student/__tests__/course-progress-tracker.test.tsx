import { render, screen } from "@testing-library/react";
import { CourseProgressTracker } from "../course-progress-tracker";

describe("CourseProgressTracker Component", () => {
  it("should render compact view by default", () => {
    render(
      <CourseProgressTracker
        progress={50}
        completedLessons={5}
        totalLessons={10}
      />
    );

    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("5 of 10 lessons completed")).toBeInTheDocument();
  });

  it("should render detailed view when showDetails is true", () => {
    render(
      <CourseProgressTracker
        progress={50}
        completedLessons={5}
        totalLessons={10}
        showDetails={true}
      />
    );

    expect(screen.getByText("Course Progress")).toBeInTheDocument();
    expect(screen.getByText("Total Lessons")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
  });

  it("should display 0% progress correctly", () => {
    render(
      <CourseProgressTracker
        progress={0}
        completedLessons={0}
        totalLessons={10}
      />
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0 of 10 lessons completed")).toBeInTheDocument();
  });

  it("should display 100% progress correctly", () => {
    render(
      <CourseProgressTracker
        progress={100}
        completedLessons={10}
        totalLessons={10}
        showDetails={true}
      />
    );

    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
    expect(screen.getByText(/You've completed all lessons/i)).toBeInTheDocument();
  });

  it("should display partial progress correctly", () => {
    render(
      <CourseProgressTracker
        progress={75}
        completedLessons={15}
        totalLessons={20}
        showDetails={true}
      />
    );

    expect(screen.getAllByText("75%")).toHaveLength(2); // Badge and progress section
    expect(screen.getByText("15 completed")).toBeInTheDocument();
    expect(screen.getByText("Keep Going!")).toBeInTheDocument();
    expect(screen.getByText("5 lessons remaining to complete this course.")).toBeInTheDocument();
  });

  it("should handle singular lesson correctly", () => {
    render(
      <CourseProgressTracker
        progress={90}
        completedLessons={9}
        totalLessons={10}
        showDetails={true}
      />
    );

    expect(screen.getByText("1 lesson remaining to complete this course.")).toBeInTheDocument();
  });

  it("should clamp progress values outside 0-100 range", () => {
    const { rerender } = render(
      <CourseProgressTracker
        progress={150}
        completedLessons={10}
        totalLessons={10}
      />
    );

    // Should display 100% even though input was 150
    expect(screen.getByText("100%")).toBeInTheDocument();

    rerender(
      <CourseProgressTracker
        progress={-10}
        completedLessons={0}
        totalLessons={10}
      />
    );

    // Should display 0% even though input was -10
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should display lesson statistics in detailed view", () => {
    render(
      <CourseProgressTracker
        progress={60}
        completedLessons={12}
        totalLessons={20}
        showDetails={true}
      />
    );

    expect(screen.getByText("20")).toBeInTheDocument(); // Total lessons
    expect(screen.getByText("12")).toBeInTheDocument(); // Completed
    expect(screen.getByText("8")).toBeInTheDocument(); // Remaining
  });

  it("should apply custom className", () => {
    const { container } = render(
      <CourseProgressTracker
        progress={50}
        completedLessons={5}
        totalLessons={10}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
