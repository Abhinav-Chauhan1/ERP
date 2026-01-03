import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleList } from "../module-list";

// Mock the server actions
vi.mock("@/lib/actions/moduleActions", () => ({
  deleteModule: vi.fn(),
  reorderModules: vi.fn(),
  updateModule: vi.fn(),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ModuleList", () => {
  const mockModules = [
    {
      id: "1",
      title: "Module 1",
      description: "Description 1",
      chapterNumber: 1,
      order: 1,
      syllabusId: "syllabus-1",
      subModules: [],
      documents: [],
    },
    {
      id: "2",
      title: "Module 2",
      description: "Description 2",
      chapterNumber: 2,
      order: 2,
      syllabusId: "syllabus-1",
      subModules: [],
      documents: [],
    },
  ];

  const mockOnRefresh = vi.fn();

  it("renders module list with modules", () => {
    render(
      <ModuleList
        modules={mockModules}
        syllabusId="syllabus-1"
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("Modules")).toBeInTheDocument();
    expect(screen.getByText("Module 1")).toBeInTheDocument();
    expect(screen.getByText("Module 2")).toBeInTheDocument();
  });

  it("renders empty state when no modules", () => {
    render(
      <ModuleList
        modules={[]}
        syllabusId="syllabus-1"
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("No Modules Yet")).toBeInTheDocument();
    expect(
      screen.getByText("Start building your syllabus by adding modules (chapters)")
    ).toBeInTheDocument();
  });

  it("displays module count badge", () => {
    render(
      <ModuleList
        modules={mockModules}
        syllabusId="syllabus-1"
        onRefresh={mockOnRefresh}
      />
    );

    // Check for the badge specifically
    const badges = screen.getAllByText("2");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows add module button", () => {
    render(
      <ModuleList
        modules={mockModules}
        syllabusId="syllabus-1"
        onRefresh={mockOnRefresh}
      />
    );

    const addButtons = screen.getAllByText("Add Module");
    expect(addButtons.length).toBeGreaterThan(0);
  });
});
