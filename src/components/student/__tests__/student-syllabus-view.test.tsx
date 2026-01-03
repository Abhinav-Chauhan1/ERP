import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudentSyllabusView } from "../student-syllabus-view";

describe("StudentSyllabusView", () => {
  const mockModules = [
    {
      id: "module-1",
      title: "Introduction to Programming",
      description: "Learn the basics of programming",
      chapterNumber: 1,
      order: 1,
      subModules: [
        {
          id: "submodule-1",
          title: "Variables and Data Types",
          description: "Understanding variables",
          order: 1,
          documents: [
            {
              id: "doc-1",
              title: "Variables Guide",
              description: "Complete guide to variables",
              filename: "variables.pdf",
              fileUrl: "https://example.com/variables.pdf",
              fileType: "application/pdf",
              fileSize: 1024000,
              order: 1,
            },
          ],
          progress: [],
        },
        {
          id: "submodule-2",
          title: "Control Structures",
          description: "If statements and loops",
          order: 2,
          documents: [],
          progress: [
            {
              id: "progress-1",
              completed: true,
              completedAt: new Date(),
            },
          ],
        },
      ],
      documents: [
        {
          id: "module-doc-1",
          title: "Course Overview",
          description: null,
          filename: "overview.pdf",
          fileUrl: "https://example.com/overview.pdf",
          fileType: "application/pdf",
          fileSize: 2048000,
          order: 1,
        },
      ],
    },
  ];

  it("renders syllabus title and description", () => {
    render(
      <StudentSyllabusView
        modules={mockModules}
        syllabusTitle="Computer Science 101"
        syllabusDescription="Introduction to Computer Science"
      />
    );

    expect(screen.getByText("Computer Science 101")).toBeInTheDocument();
    expect(
      screen.getByText("Introduction to Computer Science")
    ).toBeInTheDocument();
  });

  it("displays completion percentage", () => {
    render(
      <StudentSyllabusView
        modules={mockModules}
        syllabusTitle="Computer Science 101"
      />
    );

    // 1 out of 2 submodules completed = 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 topics covered")).toBeInTheDocument();
  });

  it("renders module with chapter number", () => {
    render(
      <StudentSyllabusView
        modules={mockModules}
        syllabusTitle="Computer Science 101"
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument(); // Chapter number
    expect(screen.getByText("Introduction to Programming")).toBeInTheDocument();
  });

  it("displays module statistics", () => {
    render(
      <StudentSyllabusView
        modules={mockModules}
        syllabusTitle="Computer Science 101"
      />
    );

    expect(screen.getByText("2 topics")).toBeInTheDocument();
    expect(screen.getByText("1 document")).toBeInTheDocument();
  });

  it("shows empty state when no modules", () => {
    render(
      <StudentSyllabusView
        modules={[]}
        syllabusTitle="Computer Science 101"
      />
    );

    expect(screen.getByText("No Modules Available")).toBeInTheDocument();
    expect(
      screen.getByText("The syllabus structure has not been defined yet")
    ).toBeInTheDocument();
  });

  it("displays document information with file size when expanded", async () => {
    render(
      <StudentSyllabusView
        modules={mockModules}
        syllabusTitle="Computer Science 101"
      />
    );

    const user = userEvent.setup();

    // Click to expand the accordion
    const moduleButton = screen.getByRole("button", {
      name: /Introduction to Programming/i,
    });
    await user.click(moduleButton);

    // Module-level document should now be visible
    expect(screen.getByText("Course Overview")).toBeInTheDocument();
    // File size should be formatted (2048000 bytes = 1.95 MB)
    expect(screen.getByText(/MB/)).toBeInTheDocument();
  });

  it("marks completed sub-modules with badge when expanded", async () => {
    render(
      <StudentSyllabusView
        modules={mockModules}
        syllabusTitle="Computer Science 101"
      />
    );

    const user = userEvent.setup();

    // Click to expand the accordion
    const moduleButton = screen.getByRole("button", {
      name: /Introduction to Programming/i,
    });
    await user.click(moduleButton);

    // The completed submodule should have a "Covered" badge
    expect(screen.getByText("Covered")).toBeInTheDocument();
  });
});
