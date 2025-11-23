"use client";


import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList, MessageDetail } from "@/components/student/communication";
import { getMessages, getMessageById, markAsRead } from "@/lib/actions/student-communication-actions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageId = searchParams.get("id");
  
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  // Fetch messages
  const fetchMessages = async (page: number = 1, newFilters: any = {}) => {
    setLoading(true);
    try {
      const result = await getMessages({
        type: activeTab,
        page,
        limit: 50,
        ...newFilters,
      });

      if (result.success && result.data) {
        setMessages(result.data.messages);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  // Fetch message by ID
  const fetchMessageById = async (id: string) => {
    setMessageLoading(true);
    try {
      const result = await getMessageById(id);

      if (result.success && result.data) {
        setSelectedMessage(result.data);
        
        // Mark as read if it's an inbox message and unread
        if (activeTab === "inbox" && !result.data.isRead) {
          await markAsRead({ id, type: "message" });
          // Refresh messages list to update read status
          fetchMessages(pagination.page, filters);
        }
      } else {
        toast.error(result.message || "Failed to fetch message");
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Error fetching message:", error);
      toast.error("Failed to fetch message");
    } finally {
      setMessageLoading(false);
    }
  };

  // Load messages when tab or filters change
  useEffect(() => {
    fetchMessages(1, filters);
  }, [activeTab]);

  // Load message if ID is in URL
  useEffect(() => {
    if (messageId) {
      fetchMessageById(messageId);
    } else {
      setSelectedMessage(null);
    }
  }, [messageId]);

  const handleMessageClick = (id: string) => {
    router.push(`/student/communication/messages?id=${id}`);
  };

  const handleBack = () => {
    router.push("/student/communication/messages");
    setSelectedMessage(null);
  };

  const handlePageChange = (page: number) => {
    fetchMessages(page, filters);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchMessages(1, newFilters);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "inbox" | "sent");
    setSelectedMessage(null);
    router.push("/student/communication/messages");
  };

  if (messageLoading) {
    return (
      <div className="h-full p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (selectedMessage) {
    return (
      <div className="h-full p-6">
        <MessageDetail
          message={selectedMessage}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : (
            <MessageList
              messages={messages}
              type={activeTab}
              pagination={pagination}
              onMessageClick={handleMessageClick}
              onPageChange={handlePageChange}
              onFilterChange={handleFilterChange}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

