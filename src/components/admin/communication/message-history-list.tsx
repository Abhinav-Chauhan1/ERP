"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getMessageHistory,
  type MessageHistoryFilters,
} from "@/lib/actions/messageHistoryActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { MessageType, MessageStatus } from "@prisma/client";

interface MessageHistoryData {
  id: string;
  messageType: MessageType;
  subject: string | null;
  body: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  smsCount: number;
  emailCount: number;
  totalCost: number;
  status: MessageStatus;
  sentAt: Date;
  sender: {
    firstName: string;
    lastName: string;
  };
}

export function MessageHistoryList() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<MessageHistoryFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMessageHistory(filters, page, 50);
      if (result.success && result.data) {
        setMessages(result.data.messages as any);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
    setPage(1);
  };

  const handleFilterChange = (key: keyof MessageHistoryFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(1);
  };

  const getStatusBadge = (status: MessageStatus) => {
    const variants: Record<MessageStatus, "default" | "secondary" | "destructive" | "outline"> = {
      SENT: "default",
      PARTIALLY_SENT: "secondary",
      FAILED: "destructive",
      PENDING: "outline",
    };

    return (
      <Badge variant={variants[status]}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: MessageType) => {
    const colors: Record<MessageType, string> = {
      SMS: "bg-blue-100 text-blue-800",
      EMAIL: "bg-green-100 text-green-800",
      BOTH: "bg-teal-100 text-teal-800",
      WHATSAPP: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={colors[type]} variant="outline">
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter message history by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search subject or body..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Message Type Filter */}
            <Select
              value={filters.messageType || "all"}
              onValueChange={(value) =>
                handleFilterChange("messageType", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Message Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PARTIALLY_SENT">Partially Sent</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            View all sent messages with delivery statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(message.sentAt), "MMM dd, yyyy HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(message.messageType)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {message.subject || "No subject"}
                        </TableCell>
                        <TableCell>{message.recipientCount}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {message.sentCount}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {message.failedCount}
                        </TableCell>
                        <TableCell>₹{message.totalCost.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(message.status)}</TableCell>
                        <TableCell>
                          {message.sender.firstName} {message.sender.lastName}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/communication/history/${message.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
