"use client";


import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageList, MessageDetail } from "@/components/student/communication";
import { MessageCompose } from "@/components/student/communication/message-compose";
import { getMessages, getMessageById, markAsRead } from "@/lib/actions/student-communication-actions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PenSquare } from "lucide-react";

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
  const [stats, setStats] = useState({ unread: 0 });
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const loadingRef = React.useRef(false);

  // Fetch messages - memoized to prevent infinite loops
  const fetchMessages = React.useCallback(async (page: number = 1, newFilters: any = {}) => {
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
        // Calculate unread count for inbox
        if (activeTab === "inbox") {
          const unreadCount = result.data.messages.filter((m: any) => !m.isRead).length;
          setStats({ unread: unreadCount });
        }
      } else {
        toast.error(result.message || "Failed to fetch messages");
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

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
          // Don't refresh here to avoid infinite loop
          // The list will refresh when user goes back
        }
      } else {
        toast.error(result.message || "Failed to fetch message");
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Error fetching message:", error);
      toast.error("Failed to fetch message");
      setSelectedMessage(null);
    } finally {
      setMessageLoading(false);
    }
  };

  // Load messages when tab or filters change
  useEffect(() => {
    let mounted = true;
    
    const loadMessages = async () => {
      // Prevent multiple simultaneous calls
      if (loadingRef.current) return;
      if (!mounted) return;
      
      loadingRef.current = true;
      setLoading(true);
      
      try {
        const result = await getMessages({
          type: activeTab,
          page: 1,
          limit: 50,
          ...filters,
        });

        if (!mounted) return;

        if (result.success && result.data) {
          setMessages(result.data.messages);
          setPagination(result.data.pagination);
          if (activeTab === "inbox") {
            const unreadCount = result.data.messages.filter((m: any) => !m.isRead).length;
            setStats({ unread: unreadCount });
          }
        } else {
          toast.error(result.message || "Failed to fetch messages");
          setMessages([]);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error fetching messages:", error);
        toast.error("Failed to fetch messages");
        setMessages([]);
      } finally {
        if (mounted) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };

    loadMessages();

    return () => {
      mounted = false;
      loadingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.search, filters.isRead]);

  // Load message if ID is in URL
  useEffect(() => {
    if (messageId) {
      fetchMessageById(messageId);
    } else {
      setSelectedMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  const handleMessageClick = (id: string) => {
    router.push(`/student/communication/messages?id=${id}`);
  };

  const handleBack = () => {
    router.push("/student/communication/messages");
    setSelectedMessage(null);
  };

  const handlePageChange = React.useCallback((page: number) => {
    fetchMessages(page, filters);
  }, [fetchMessages, filters]);

  const handleFilterChange = React.useCallback((newFilters: any) => {
    setFilters(newFilters);
    // Don't call fetchMessages here - let the useEffect handle it
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "inbox" | "sent");
    setSelectedMessage(null);
    router.push("/student/communication/messages");
  };

  const handleComposeSuccess = React.useCallback(() => {
    // Refresh messages list after sending
    fetchMessages(pagination.page, filters);
    setIsComposeOpen(false);
  }, [fetchMessages, pagination.page, filters]);

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
          onReplySuccess={handleComposeSuccess}
          onDownloadAttachment={(url, fileName) => {
            // Open attachment in new tab for download
            window.open(url, "_blank");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <Button onClick={() => setIsComposeOpen(true)} className="min-h-[44px]">
          <PenSquare className="h-4 w-4 mr-2" />
          Compose Message
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox
            {stats.unread > 0 && (
              <Badge className="ml-2 bg-primary">{stats.unread}</Badge>
            )}
          </TabsTrigger>
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

      {/* Message Compose Dialog */}
      <MessageCompose
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={handleComposeSuccess}
      />
    </div>
  );
}

