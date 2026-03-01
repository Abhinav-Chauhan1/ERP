/**
 * Tests for MessageReplyForm Component
 * Task 5.3: Create MessageReplyForm Component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MessageReplyForm } from "../message-reply-form";
import { replyToMessage } from "@/lib/actions/student-communication-actions";
import { useToast } from "@/hooks/use-toast";

// Mock the server action
jest.mock("@/lib/actions/student-communication-actions", () => ({
  replyToMessage: jest.fn(),
}));

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

const mockToast = jest.fn();
const mockReplyToMessage = replyToMessage as jest.MockedFunction<typeof replyToMessage>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe("MessageReplyForm", () => {
  const mockOriginalMessage = {
    id: "msg-123",
    subject: "Test Subject",
    content: "This is the original message content.",
    sender: {
      id: "user-456",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@school.com",
      avatar: null,
      role: "TEACHER",
    },
  };

  const mockOnReply = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast } as any);
  });

  it("should render the reply form with original message context", () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    // Check if title is rendered
    expect(screen.getByText("Reply to Message")).toBeInTheDocument();

    // Check if sender name is displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    // Check if original message content is displayed
    expect(screen.getByText("This is the original message content.")).toBeInTheDocument();

    // Check if subject is pre-filled with "Re:"
    expect(screen.getByText("Re: Test Subject")).toBeInTheDocument();
  });

  it("should display sender information correctly", () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    // Check sender email
    expect(screen.getByText("john.doe@school.com")).toBeInTheDocument();

    // Check sender role badge
    expect(screen.getByText("TEACHER")).toBeInTheDocument();
  });

  it("should handle subject with existing 'Re:' prefix correctly", () => {
    const messageWithRePrefix = {
      ...mockOriginalMessage,
      subject: "Re: Test Subject",
    };

    render(
      <MessageReplyForm
        originalMessage={messageWithRePrefix}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    // Should not add another "Re:" prefix
    const reSubjects = screen.getAllByText("Re: Test Subject");
    expect(reSubjects.length).toBeGreaterThan(0);
  });

  it("should handle null subject correctly", () => {
    const messageWithNullSubject = {
      ...mockOriginalMessage,
      subject: null,
    };

    render(
      <MessageReplyForm
        originalMessage={messageWithNullSubject}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    // Should display "(No Subject)" with "Re:" prefix
    expect(screen.getByText("Re: (No Subject)")).toBeInTheDocument();
  });

  it("should show validation error when reply content is empty", async () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const sendButton = screen.getByRole("button", { name: /send reply/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("Reply content is required")).toBeInTheDocument();
    });

    expect(mockReplyToMessage).not.toHaveBeenCalled();
  });

  it("should show character counter", () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    // Initial character count should be 0
    expect(screen.getByText("0 / 10000 characters")).toBeInTheDocument();
  });

  it("should update character counter when typing", () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText("Type your reply here...");
    fireEvent.change(textarea, { target: { value: "Test reply" } });

    expect(screen.getByText("10 / 10000 characters")).toBeInTheDocument();
  });

  it("should call onCancel when cancel button is clicked", () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("should submit reply successfully", async () => {
    mockReplyToMessage.mockResolvedValue({
      success: true,
      message: "Reply sent successfully",
    });

    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText("Type your reply here...");
    fireEvent.change(textarea, { target: { value: "This is my reply" } });

    const sendButton = screen.getByRole("button", { name: /send reply/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockReplyToMessage).toHaveBeenCalledWith({
        messageId: "msg-123",
        content: "This is my reply",
      });
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Reply sent",
        description: "Your reply has been sent successfully",
      });
    });

    expect(mockOnReply).toHaveBeenCalledTimes(1);
  });

  it("should handle reply submission error", async () => {
    mockReplyToMessage.mockResolvedValue({
      success: false,
      message: "Failed to send reply",
    });

    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText("Type your reply here...");
    fireEvent.change(textarea, { target: { value: "This is my reply" } });

    const sendButton = screen.getByRole("button", { name: /send reply/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to send reply",
        description: "Failed to send reply",
        variant: "destructive",
      });
    });

    expect(mockOnReply).not.toHaveBeenCalled();
  });

  it("should disable form during submission", async () => {
    mockReplyToMessage.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText("Type your reply here...");
    fireEvent.change(textarea, { target: { value: "This is my reply" } });

    const sendButton = screen.getByRole("button", { name: /send reply/i });
    fireEvent.click(sendButton);

    // Check if textarea is disabled during submission
    await waitFor(() => {
      expect(textarea).toBeDisabled();
    });

    // Check if buttons show loading state
    expect(screen.getByText("Sending...")).toBeInTheDocument();
  });

  it("should show sender initials in avatar when no avatar image", () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    // Check if initials "JD" are displayed
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should apply correct role badge color for TEACHER", () => {
    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const badge = screen.getByText("TEACHER");
    expect(badge).toHaveClass("bg-blue-100", "text-blue-700", "border-blue-200");
  });

  it("should apply correct role badge color for ADMIN", () => {
    const adminMessage = {
      ...mockOriginalMessage,
      sender: {
        ...mockOriginalMessage.sender,
        role: "ADMIN",
      },
    };

    render(
      <MessageReplyForm
        originalMessage={adminMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const badge = screen.getByText("ADMIN");
    expect(badge).toHaveClass("bg-teal-100", "text-teal-700", "border-teal-200");
  });

  it("should clear form after successful submission", async () => {
    mockReplyToMessage.mockResolvedValue({
      success: true,
      message: "Reply sent successfully",
    });

    render(
      <MessageReplyForm
        originalMessage={mockOriginalMessage}
        onReply={mockOnReply}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText("Type your reply here...");
    fireEvent.change(textarea, { target: { value: "This is my reply" } });

    const sendButton = screen.getByRole("button", { name: /send reply/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnReply).toHaveBeenCalled();
    });

    // Form should be cleared
    expect(textarea).toHaveValue("");
  });
});
