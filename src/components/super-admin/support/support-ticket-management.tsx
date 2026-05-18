"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Ticket,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  ArrowUp,
  Calendar,
  Building,
  Tag,
  RefreshCw,
  Eye,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category?: string;
  createdAt: string;
  updatedAt: string;
  school?: { id: string; name: string } | null;
  creator?: { id: string; name: string | null; email: string | null } | null;
  assignee?: { id: string; name: string | null; email: string | null } | null;
  comments?: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: string;
    author?: { id: string; name: string | null } | null;
  }>;
}

interface TicketMetrics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT": return "destructive";
    case "HIGH":   return "destructive";
    case "MEDIUM": return "secondary";
    default:       return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":     return "destructive";
    case "IN_PROGRESS": return "secondary";
    case "RESOLVED": return "default";
    case "CLOSED":   return "default";
    default:         return "outline";
  }
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
};

export function SupportTicketManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    schoolId: "",
  });

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/super-admin/support/tickets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch (err) {
      toast.error("Failed to load tickets");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const handleSearch = () => {
    loadTickets();
  };

  const handleTicketAction = async (ticketId: string, action: string) => {
    const statusMap: Record<string, string> = {
      resolve: "RESOLVED",
      close: "CLOSED",
      reopen: "OPEN",
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;

    try {
      const res = await fetch(`/api/super-admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Ticket ${action}d`);
      await loadTickets();
    } catch {
      toast.error(`Failed to ${action} ticket`);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment }),
      });
      if (!res.ok) throw new Error();
      toast.success("Comment added");
      setNewComment("");
      await loadTickets();
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!createForm.title || !createForm.description) {
      toast.error("Title and description are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/super-admin/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          priority: createForm.priority,
          schoolId: createForm.schoolId || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ticket created");
      setShowCreateDialog(false);
      setCreateForm({ title: "", description: "", priority: "MEDIUM", schoolId: "" });
      await loadTickets();
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(q) ||
      ticket.description.toLowerCase().includes(q) ||
      ticket.ticketNumber.toLowerCase().includes(q) ||
      (ticket.school?.name ?? "").toLowerCase().includes(q)
    );
  });

  const metrics: TicketMetrics = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Ticket Management</h2>
          <p className="text-muted-foreground">Manage support tickets from schools</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTickets} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>Create a new support ticket</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={createForm.priority} onValueChange={(v) => setCreateForm((p) => ({ ...p, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>School ID (optional)</Label>
                    <Input
                      placeholder="School ID"
                      value={createForm.schoolId}
                      onChange={(e) => setCreateForm((p) => ({ ...p, schoolId: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={createForm.title}
                    onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Detailed description of the issue"
                    rows={4}
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateTicket} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: metrics.total, icon: Ticket },
          { label: "Open", value: metrics.open, icon: AlertTriangle },
          { label: "In Progress", value: metrics.inProgress, icon: Clock },
          { label: "Resolved/Closed", value: metrics.resolved, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING_FOR_CUSTOMER">Waiting</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : filteredTickets.length === 0 ? "No tickets found" : "Click View to manage a ticket"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No tickets found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{ticket.title}</h4>
                        <Badge variant={getPriorityColor(ticket.priority) as any}>{ticket.priority}</Badge>
                        <Badge variant={getStatusColor(ticket.status) as any}>
                          {ticket.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          {ticket.ticketNumber}
                        </div>
                        {ticket.school && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {ticket.school.name}
                          </div>
                        )}
                        {ticket.creator && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.creator.name ?? ticket.creator.email}
                          </div>
                        )}
                        {ticket.assignee && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Assigned: {ticket.assignee.name ?? ticket.assignee.email}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTimeAgo(ticket.createdAt)}
                        </div>
                        {ticket.comments && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.comments.length} comments
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedTicket(ticket); setShowTicketDialog(true); }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ticket.status !== "RESOLVED" && (
                            <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, "resolve")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Resolved
                            </DropdownMenuItem>
                          )}
                          {ticket.status !== "CLOSED" && (
                            <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, "close")}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Close
                            </DropdownMenuItem>
                          )}
                          {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
                            <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, "reopen")}>
                              <ArrowUp className="h-4 w-4 mr-2" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {selectedTicket.title}
                  <Badge variant={getPriorityColor(selectedTicket.priority) as any}>{selectedTicket.priority}</Badge>
                  <Badge variant={getStatusColor(selectedTicket.status) as any}>
                    {selectedTicket.status.replace(/_/g, " ")}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  #{selectedTicket.ticketNumber}
                  {selectedTicket.school ? ` • ${selectedTicket.school.name}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Created By</Label>
                    <p className="text-muted-foreground mt-1">
                      {selectedTicket.creator?.name ?? selectedTicket.creator?.email ?? "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    <p className="text-muted-foreground mt-1">
                      {selectedTicket.assignee
                        ? (selectedTicket.assignee.name ?? selectedTicket.assignee.email)
                        : "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-muted-foreground mt-1">
                      {new Date(selectedTicket.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-muted-foreground mt-1">
                      {new Date(selectedTicket.updatedAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <div className="text-sm bg-muted p-3 rounded-md mt-1 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </div>
                </div>

                {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                  <div>
                    <Label>Comments ({selectedTicket.comments.length})</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {selectedTicket.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 rounded-md text-sm ${
                            comment.isInternal
                              ? "bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-400"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{comment.author?.name ?? "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <p>{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <Label>Add Comment</Label>
                  <Textarea
                    placeholder="Type your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTicketDialog(false)}>Close</Button>
                    <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
