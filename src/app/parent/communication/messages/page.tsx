"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList } from "@/components/parent/communication/message-list";
import { MessageDetail } from "@/components/parent/communication/message-detail";
import { ComposeMessage } from "@/components/parent/communication/compose-message";
import {
  getMessages,
  markMessageAsRead,
  deleteMessage,
  sendMessage,
} from "@/lib/actions/parent-communication-actions";
import { toast } from "react-hot-toast";

interface MessageData {
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
  hasAttachments: boolean;
  attachments?: string | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "drafts">("inbox");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<{
    isRead?: boolean;
    search?: string;
  }>({});
  const [recipients, setRecipients] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  }>>([]);

  // Load messages
  const loadMessages = async (
    type: "inbox" | "sent" | "drafts",
    page: number = 1,
    currentFilters: typeof filters = {}
  ) => {
    setIsLoading(true);
    try {
      const result = await getMessages({
        type,
        page,
        limit: pagination.limit,
        ...currentFilters,
      });

      if (result.success && result.data) {
        setMessages(result.data.messages as MessageData[]);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to load messages");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("An error occurred while loading messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Load recipients for compose
  const loadRecipients = async () => {
    // In a real implementation, this would fetch teachers and admins
    // For now, we'll use a placeholder
    setRecipients([]);
  };

  useEffect(() => {
    loadMessages(activeTab, 1, filters);
    loadRecipients();
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "inbox" | "sent" | "drafts");
    setSelectedMessage(null);
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleMessageClick = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setSelectedMessage(message);

      // Mark as read if it's an inbox message and unread
      if (activeTab === "inbox" && !message.isRead) {
        const result = await markMessageAsRead({ messageId });
        if (result.success) {
          // Update local state
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, isRead: true, readAt: new Date() } : m
            )
          );
        }
      }
    }
  };

  const handleBack = () => {
    setSelectedMessage(null);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    loadMessages(activeTab, page, filters);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadMessages(activeTab, 1, newFilters);
  };

  const handleBulkDelete = async (messageIds: string[]) => {
    try {
      const promises = messageIds.map((id) => deleteMessage({ messageId: id }));
      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} message(s) deleted`);
        loadMessages(activeTab, pagination.page, filters);
      }
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast.error("Failed to delete messages");
    }
  };

  const handleBulkMarkAsRead = async (messageIds: string[]) => {
    try {
      const promises = messageIds.map((id) => markMessageAsRead({ messageId: id }));
      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} message(s) marked as read`);
        loadMessages(activeTab, pagination.page, filters);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      toast.error("Failed to mark messages as read");
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const result = await deleteMessage({ messageId });
      if (result.success) {
        toast.success("Message deleted");
        setSelectedMessage(null);
        loadMessages(activeTab, pagination.page, filters);
      } else {
        toast.error(result.message || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("An error occurred while deleting the message");
    }
  };

  const handleSendMessage = async (data: {
    recipientId: string;
    subject: string;
    content: string;
    attachments?: string[];
  }) => {
    try {
      // Convert attachments array to string if needed
      const messageData = {
        ...data,
        attachments: data.attachments ? data.attachments.join(',') : undefined
      };
      const result = await sendMessage(messageData);
      if (result.success) {
        toast.success("Message sent successfully");
        setIsComposeOpen(false);
        // Refresh sent messages if on sent tab
        if (activeTab === "sent") {
          loadMessages(activeTab, pagination.page, filters);
        }
      }
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, message: "An error occurred while sending the message" };
    }
  };

  const handleReply = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      // Open compose with pre-filled recipient and subject
      setIsComposeOpen(true);
      // Note: You would need to modify ComposeMessage to accept reply data
    }
  };

  const handleForward = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      // Open compose with pre-filled content
      setIsComposeOpen(true);
      // Note: You would need to modify ComposeMessage to accept forward data
    }
  };

  return (
    <div className="h-full p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-gray-600 mt-1">
              Communicate with teachers and administrators
            </p>
          </div>
          <Button onClick={() => setIsComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>

        {/* Messages Content */}
        {selectedMessage ? (
          <MessageDetail
            message={selectedMessage}
            type={activeTab === "sent" ? "sent" : "inbox"}
            onBack={handleBack}
            onReply={activeTab === "inbox" ? handleReply : undefined}
            onForward={handleForward}
            onDelete={handleDelete}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  type="inbox"
                  pagination={pagination}
                  onMessageClick={handleMessageClick}
                  onPageChange={handlePageChange}
                  onFilterChange={handleFilterChange}
                  onBulkDelete={handleBulkDelete}
                  onBulkMarkAsRead={handleBulkMarkAsRead}
                />
              )}
            </TabsContent>

            <TabsContent value="sent" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  type="sent"
                  pagination={pagination}
                  onMessageClick={handleMessageClick}
                  onPageChange={handlePageChange}
                  onBulkDelete={handleBulkDelete}
                />
              )}
            </TabsContent>

            <TabsContent value="drafts" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  type="drafts"
                  pagination={pagination}
                  onMessageClick={handleMessageClick}
                  onPageChange={handlePageChange}
                  onBulkDelete={handleBulkDelete}
                />
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Compose Message Modal */}
        <ComposeMessage
          open={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          recipients={recipients}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
}
