"use client";


import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusSquare, Loader2 } from "lucide-react";
import { MessageList, MessageDetail, ComposeMessage } from "@/components/teacher/communication";
import {
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  getContacts,
  getMessageById,
} from "@/lib/actions/teacher-communication-actions";
import { toast } from "sonner";

export default function TeacherMessagesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "drafts">("inbox");
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<{
    isRead?: boolean;
    search?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward'>('new');
  const [composeData, setComposeData] = useState<{
    recipientId?: string;
    subject?: string;
    content?: string;
  }>({});

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMessages({
        type: activeTab,
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      if (result.success && result.data) {
        setMessages(result.data.messages);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("An error occurred while fetching messages");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, filters]);

  // Fetch contacts for compose dialog
  const fetchContacts = useCallback(async () => {
    try {
      const result = await getContacts();
      if (result.success && result.data) {
        setContacts(result.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  }, []);

  // Fetch message details
  const fetchMessageDetails = useCallback(async (messageId: string) => {
    try {
      const result = await getMessageById(messageId);
      if (result.success && result.data) {
        setSelectedMessage(result.data);

        // Mark as read if it's an inbox message
        if (activeTab === "inbox" && !result.data.isRead) {
          await markAsRead({ id: messageId, type: "message" });
          // Don't refresh here to avoid issues
        }
      } else {
        toast.error(result.message || "Failed to fetch message details");
        setSelectedMessageId(null);
      }
    } catch (error) {
      console.error("Error fetching message details:", error);
      toast.error("An error occurred while fetching message details");
      setSelectedMessageId(null);
    }
  }, [activeTab]);

  // Load messages when dependencies change
  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page, filters.search, filters.isRead]);

  // Load contacts when compose dialog opens
  useEffect(() => {
    if (isComposeOpen && contacts.length === 0) {
      fetchContacts();
    }
  }, [isComposeOpen, contacts.length, fetchContacts]);

  // Load message details when selected
  useEffect(() => {
    if (selectedMessageId) {
      fetchMessageDetails(selectedMessageId);
    } else {
      setSelectedMessage(null);
    }
  }, [selectedMessageId, fetchMessageDetails]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "inbox" | "sent" | "drafts");
    setSelectedMessageId(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleMessageClick = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  const handleBackToList = () => {
    setSelectedMessageId(null);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters: { isRead?: boolean; search?: string }) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    // Don't call fetchMessages here - let the useEffect handle it
  };

  const handleBulkDelete = async (messageIds: string[]) => {
    try {
      const promises = messageIds.map((id) => deleteMessage({ id }));
      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} message(s) deleted successfully`);
        fetchMessages();
      }

      const failCount = results.filter((r) => !r.success).length;
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} message(s)`);
      }
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast.error("An error occurred while deleting messages");
    }
  };

  const handleBulkMarkAsRead = async (messageIds: string[]) => {
    try {
      const promises = messageIds.map((id) => markAsRead({ id, type: "message" }));
      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} message(s) marked as read`);
        fetchMessages();
      }

      const failCount = results.filter((r) => !r.success).length;
      if (failCount > 0) {
        toast.error(`Failed to mark ${failCount} message(s) as read`);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      toast.error("An error occurred while marking messages as read");
    }
  };

  const handleSendMessage = async (data: {
    recipientId: string;
    subject: string;
    content: string;
    attachments?: string;
  }) => {
    try {
      const result = await sendMessage(data);
      if (result.success) {
        toast.success("Message sent successfully");
        setIsComposeOpen(false);
        // Refresh messages if on sent tab
        if (activeTab === "sent") {
          fetchMessages();
        }
      } else {
        toast.error(result.message || "Failed to send message");
      }
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An error occurred while sending the message");
      return { success: false, message: "An error occurred" };
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const result = await deleteMessage({ id: messageId });
      if (result.success) {
        toast.success("Message deleted successfully");
        setSelectedMessageId(null);
        fetchMessages();
      } else {
        toast.error(result.message || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("An error occurred while deleting the message");
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button onClick={() => setIsComposeOpen(true)}>
          <PlusSquare className="h-4 w-4 mr-2" />
          Compose Message
        </Button>
      </div>

      {selectedMessage ? (
        <MessageDetail
          message={selectedMessage}
          onBack={handleBackToList}
          onReply={(messageId) => {
            // Prepare reply data
            if (selectedMessage) {
              setComposeMode('reply');
              setComposeData({
                recipientId: selectedMessage.senderId || selectedMessage.sender?.id,
                subject: `Re: ${selectedMessage.subject}`,
                content: `\n\n---\nOn ${new Date(selectedMessage.createdAt).toLocaleString()}, ${selectedMessage.senderName || selectedMessage.sender?.firstName || 'User'} wrote:\n> ${selectedMessage.content?.replace(/\n/g, '\n> ') || ''}`,
              });
              setIsComposeOpen(true);
            }
          }}
          onForward={(messageId) => {
            // Prepare forward data
            if (selectedMessage) {
              setComposeMode('forward');
              setComposeData({
                subject: `Fwd: ${selectedMessage.subject}`,
                content: `\n\n---\nForwarded message:\nFrom: ${selectedMessage.senderName || selectedMessage.sender?.firstName || 'User'}\nDate: ${new Date(selectedMessage.createdAt).toLocaleString()}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.content || ''}`,
              });
              setIsComposeOpen(true);
            }
          }}
          onDelete={handleDeleteMessage}
          onDownloadAttachment={async (url, fileName) => {
            // Implement actual download
            try {
              const response = await fetch(url);
              const blob = await response.blob();
              const downloadUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = fileName || 'attachment';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(downloadUrl);
              toast.success('Attachment downloaded');
            } catch (error) {
              console.error('Error downloading attachment:', error);
              toast.error('Failed to download attachment');
              // Fallback to opening in new tab
              window.open(url, '_blank');
            }
          }}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <MessageList
                messages={messages}
                type={activeTab}
                pagination={pagination}
                onMessageClick={handleMessageClick}
                onPageChange={handlePageChange}
                onFilterChange={handleFilterChange}
                onBulkDelete={handleBulkDelete}
                onBulkMarkAsRead={handleBulkMarkAsRead}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      <ComposeMessage
        open={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setComposeMode('new');
          setComposeData({});
        }}
        recipients={contacts}
        onSend={handleSendMessage}
        defaultRecipientId={composeData.recipientId}
        defaultSubject={composeData.subject}
        defaultContent={composeData.content}
      />
    </div>
  );
}

