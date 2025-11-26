/**
 * Example: MessageReplyForm Integration
 * 
 * This file demonstrates how to integrate the MessageReplyForm component
 * with the MessageDetail component in a message detail page.
 * 
 * Task 5.3: Create MessageReplyForm Component
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";
import { MessageDetail } from "./message-detail";
import { MessageReplyForm } from "./message-reply-form";

interface Message {
  id: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  attachments: string | null;
}

interface MessageDetailWithReplyProps {
  message: Message;
  onBack: () => void;
}

/**
 * Example component showing MessageDetail with integrated reply functionality
 */
export function MessageDetailWithReply({
  message,
  onBack,
}: MessageDetailWithReplyProps) {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySuccess = () => {
    // Hide the reply form
    setShowReplyForm(false);
    
    // Refresh the page to show the new reply in the message list
    router.refresh();
    
    // Optionally, you could also navigate back to the messages list
    // router.push("/student/communication/messages");
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Message Detail */}
      <MessageDetail
        message={message}
        onBack={onBack}
      />

      {/* Reply Section */}
      <div className="space-y-4">
        {!showReplyForm ? (
          /* Reply Button */
          <div className="flex justify-end">
            <Button
              onClick={() => setShowReplyForm(true)}
              className="min-h-[44px]"
            >
              <Reply className="h-4 w-4 mr-2" />
              Reply to Message
            </Button>
          </div>
        ) : (
          /* Reply Form */
          <MessageReplyForm
            originalMessage={{
              id: message.id,
              subject: message.subject,
              content: message.content,
              sender: message.sender,
            }}
            onReply={handleReplySuccess}
            onCancel={handleCancelReply}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Alternative: Inline Reply Form (Always Visible)
 */
export function MessageDetailWithInlineReply({
  message,
  onBack,
}: MessageDetailWithReplyProps) {
  const router = useRouter();

  const handleReplySuccess = () => {
    router.refresh();
  };

  const handleCancelReply = () => {
    // In this version, we don't hide the form, just clear it
    // The form component handles clearing internally
  };

  return (
    <div className="space-y-6">
      {/* Message Detail */}
      <MessageDetail
        message={message}
        onBack={onBack}
      />

      {/* Always-Visible Reply Form */}
      <MessageReplyForm
        originalMessage={{
          id: message.id,
          subject: message.subject,
          content: message.content,
          sender: message.sender,
        }}
        onReply={handleReplySuccess}
        onCancel={handleCancelReply}
      />
    </div>
  );
}

/**
 * Alternative: Reply Form in Modal/Dialog
 */
export function MessageDetailWithModalReply({
  message,
  onBack,
}: MessageDetailWithReplyProps) {
  const router = useRouter();
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const handleReplySuccess = () => {
    setIsReplyModalOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Message Detail */}
      <MessageDetail
        message={message}
        onBack={onBack}
      />

      {/* Reply Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsReplyModalOpen(true)}
          className="min-h-[44px]"
        >
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>

      {/* Reply Form in Modal */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <MessageReplyForm
              originalMessage={{
                id: message.id,
                subject: message.subject,
                content: message.content,
                sender: message.sender,
              }}
              onReply={handleReplySuccess}
              onCancel={() => setIsReplyModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Usage in a page component:
 * 
 * ```tsx
 * // src/app/student/communication/messages/[id]/page.tsx
 * 
 * import { MessageDetailWithReply } from "@/components/student/communication/message-reply-integration-example";
 * import { getMessageById } from "@/lib/actions/student-communication-actions";
 * 
 * export default async function MessagePage({ params }: { params: { id: string } }) {
 *   const result = await getMessageById(params.id);
 *   
 *   if (!result.success || !result.data) {
 *     return <div>Message not found</div>;
 *   }
 *   
 *   return (
 *     <MessageDetailWithReply
 *       message={result.data}
 *       onBack={() => router.back()}
 *     />
 *   );
 * }
 * ```
 */
