/**
 * Document Management Component Tests
 * Tests for the document management UI components
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DocumentManagement } from "../document-management";

// Mock the server actions
vi.mock("@/lib/actions/syllabusDocumentActions", () => ({
  getDocumentsByParent: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  deleteDocument: vi.fn().mockResolvedValue({
    success: true,
    data: { deletedCount: 1 },
  }),
  validateFileType: vi.fn().mockResolvedValue({
    success: true,
    data: { valid: true },
  }),
  reorderDocuments: vi.fn().mockResolvedValue({
    success: true,
    data: { updatedCount: 1 },
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("DocumentManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(
      <DocumentManagement
        parentId="module-1"
        parentType="module"
        uploadedBy="user-1"
      />
    );

    // Should show loading indicator (Loader2 icon)
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it("should render empty state when no documents", async () => {
    render(
      <DocumentManagement
        parentId="module-1"
        parentType="module"
        uploadedBy="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no documents uploaded yet/i)).toBeInTheDocument();
    });
  });

  it("should render upload button when showActions is true", async () => {
    render(
      <DocumentManagement
        parentId="module-1"
        parentType="module"
        uploadedBy="user-1"
        showActions={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /upload documents/i })).toBeInTheDocument();
    });
  });

  it("should not render upload button when showActions is false", async () => {
    render(
      <DocumentManagement
        parentId="module-1"
        parentType="module"
        uploadedBy="user-1"
        showActions={false}
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /upload documents/i })).not.toBeInTheDocument();
    });
  });
});
