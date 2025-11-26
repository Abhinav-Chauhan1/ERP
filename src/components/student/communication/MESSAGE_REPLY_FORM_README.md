# MessageReplyForm Component

## Overview

The `MessageReplyForm` component provides a user-friendly interface for students to reply to messages from teachers and administrators. It displays the original message context and provides a form to compose a reply.

## Features

- **Original Message Context**: Displays sender information, subject, and original message content
- **Pre-filled Fields**: Automatically sets recipient and subject with "Re:" prefix
- **Form Validation**: Uses Zod schema validation for reply content
- **Character Counter**: Shows character count (max 10,000 characters)
- **Loading States**: Displays loading indicator during submission
- **Error Handling**: Shows toast notifications for success/error states
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Props

```typescript
interface MessageReplyFormProps {
  originalMessage: {
    id: string;
    subject: string | null;
    content: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
      role: string;
    };
  };
  onReply?: () => void;
  onCancel: () => void;
}
```

### Prop Descriptions

- **originalMessage**: The message being replied to
  - `id`: Message ID (required for reply action)
  - `subject`: Original message subject
  - `content`: Original message content
  - `sender`: Information about the message sender
- **onReply**: Optional callback function called after successful reply
- **onCancel**: Callback function called when user cancels the reply

## Usage Example

### Basic Usage

```tsx
import { MessageReplyForm } from "@/components/student/communication";

function MessageDetailPage() {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const message = {
    id: "msg-123",
    subject: "Assignment Question",
    content: "Can you explain the homework assignment?",
    sender: {
      id: "user-456",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@school.com",
      avatar: "/avatars/john.jpg",
      role: "TEACHER",
    },
  };

  return (
    <div>
      {/* Message Detail Display */}
      <MessageDetail message={message} />

      {/* Reply Button */}
      <Button onClick={() => setShowReplyForm(true)}>
        Reply
      </Button>

      {/* Reply Form */}
      {showReplyForm && (
        <MessageReplyForm
          originalMessage={message}
          onReply={() => {
            setShowReplyForm(false);
            // Optionally refresh message list
          }}
          onCancel={() => setShowReplyForm(false)}
        />
      )}
    </div>
  );
}
```

### With Router Refresh

```tsx
import { useRouter } from "next/navigation";
import { MessageReplyForm } from "@/components/student/communication";

function MessagePage() {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <MessageReplyForm
      originalMessage={message}
      onReply={() => {
        setShowReplyForm(false);
        router.refresh(); // Refresh to show new reply in list
      }}
      onCancel={() => setShowReplyForm(false)}
    />
  );
}
```

### Conditional Rendering

```tsx
function MessageThread({ message, canReply }) {
  const [isReplying, setIsReplying] = useState(false);

  if (!canReply) {
    return <MessageDetail message={message} />;
  }

  return (
    <div className="space-y-4">
      <MessageDetail message={message} />
      
      {!isReplying ? (
        <Button onClick={() => setIsReplying(true)}>
          Reply to this message
        </Button>
      ) : (
        <MessageReplyForm
          originalMessage={message}
          onReply={() => setIsReplying(false)}
          onCancel={() => setIsReplying(false)}
        />
      )}
    </div>
  );
}
```

## Validation Rules

The component validates the reply content with the following rules:

- **Required**: Reply content cannot be empty
- **Max Length**: 10,000 characters maximum
- **XSS Protection**: Content is sanitized on the server side

## Server Action

The component uses the `replyToMessage` server action from `@/lib/actions/student-communication-actions`:

```typescript
export async function replyToMessage(data: {
  messageId: string;
  content: string;
}): Promise<ActionResult>
```

## Styling

The component uses:
- **shadcn/ui** components (Card, Button, Textarea, etc.)
- **Tailwind CSS** for styling
- **Lucide React** icons (Reply, Send, X, Loader2)

## Accessibility

- Proper ARIA labels for form fields
- Keyboard navigation support
- Screen reader compatible
- Minimum touch target size (44px)
- Clear error messages
- Loading state indicators

## Error Handling

The component handles the following error scenarios:

1. **Validation Errors**: Shows inline error messages for invalid input
2. **Network Errors**: Displays toast notification with error message
3. **Server Errors**: Shows user-friendly error message
4. **Loading States**: Disables form during submission

## Best Practices

1. **Always provide onCancel**: Users should be able to cancel the reply
2. **Handle onReply callback**: Refresh data or navigate after successful reply
3. **Show confirmation**: The component shows a success toast automatically
4. **Preserve context**: The original message is always visible while replying
5. **Responsive layout**: Test on different screen sizes

## Related Components

- **MessageCompose**: For composing new messages
- **MessageDetail**: For displaying message details
- **MessageList**: For listing messages

## Requirements Validation

This component satisfies the following requirements:

- **AC6**: Message Reply - ✅
- **FR3.2**: Reply to received messages - ✅
- **NFR2**: XSS protection for message content - ✅
- **NFR3**: WCAG 2.1 Level AA compliance - ✅
- **NFR4**: Intuitive navigation and clear labels - ✅

## Task Reference

- **Task 5.3**: Create MessageReplyForm Component
- **Dependencies**: Task 5.1 (Message Actions)
