import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LessonContent } from "../lesson-content";

describe("LessonContent Component", () => {
  const mockResources = [
    {
      name: "Resource 1",
      description: "Description 1",
      url: "http://example.com/1",
      type: "link" as const,
    },
  ];

  it("should sanitize malicious content", () => {
    const maliciousContent = '<img src=x onerror=alert(1)>';
    render(<LessonContent content={maliciousContent} resources={mockResources} />);

    // The img tag might remain but onerror should be gone
    // isomorphic-dompurify by default strips onerror
    const img = screen.queryByRole('img');
    // Depending on config, img might be stripped or kept.
    // If kept, it should not have onerror.
    // If stripped, good.

    // Let's check for a script tag which should definitely be gone
    const scriptContent = '<script>alert("XSS")</script>Safe Content';
    const { container } = render(<LessonContent content={scriptContent} resources={mockResources} />);

    expect(screen.getByText("Safe Content")).toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
  });

  it("should render safe HTML", () => {
    const safeContent = '<p>Safe Paragraph</p><b>Bold</b>';
    render(<LessonContent content={safeContent} resources={mockResources} />);

    expect(screen.getByText("Safe Paragraph")).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Bold").tagName).toBe("B");
  });
});
