"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Ticket, 
  AlertTriangle, 
  Clock, 
  User, 
  MessageSquare, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  ArrowUp,
  Calendar,
  Building,
  Tag,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  school: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  comments: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    author: {
      id: string;
      name: string;
    };
  }>;
  slaStatus: 'ON_TIME' | 'AT_RISK' | 'OVERDUE';
  slaDeadline: Date;
  metadata?: Record<string, any>;
}

interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTime: number;
  slaCompliance: number;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
  escalatedTickets: number;
  overdueTickets: number;
  responseTimeMetrics: {
    average: number;
    median: number;
    percentile95: number;
  };
  resolutionTimeMetrics: {
    average: number;
    median: number;
    percentile95: number;
  };
}

export function SupportTicketManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    loadTickets();
    loadMetrics();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockTickets: SupportTicket[] = [
      {
        id: "ticket_1",
        ticketNumber: "TKT-1704067200-001",
        title: "Unable to access student dashboard",
        description: "Students are reporting that they cannot access their dashboard. The page loads but shows a blank screen.",
        status: "OPEN",
        priority: "HIGH",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        school: {
          id: "school_1",
          name: "Springfield Elementary"
        },
        creator: {
          id: "user_1",
          name: "John Smith",
          email: "john.smith@springfield.edu"
        },
        assignee: {
          id: "admin_1",
          name: "Sarah Johnson",
          email: "sarah.johnson@company.com"
        },
        comments: [
          {
            id: "comment_1",
            content: "We're investigating this issue. It appears to be related to a recent deployment.",
            isInternal: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000),
            author: {
              id: "admin_1",
              name: "Sarah Johnson"
            }
          }
        ],
        slaStatus: "AT_RISK",
        slaDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000),
        metadata: {
          category: "Technical",
          affectedUsers: 150
        }
      },
      {
        id: "ticket_2",
        ticketNumber: "TKT-1704067200-002",
        title: "Request for additional user licenses",
        description: "We need to add 25 more teacher accounts for the new semester.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        school: {
          id: "school_2",
          name: "Riverside High School"
        },
        creator: {
          id: "user_2",
          name: "Mary Davis",
          email: "mary.davis@riverside.edu"
        },
        assignee: {
          id: "admin_2",
          name: "Mike Wilson",
          email: "mike.wilson@company.com"
        },
        comments: [
          {
            id: "comment_2",
            content: "I've processed the license request. The new accounts will be available within 24 hours.",
            isInternal: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            author: {
              id: "admin_2",
              name: "Mike Wilson"
            }
          }
        ],
        slaStatus: "ON_TIME",
        slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000)
      },
      {
        id: "ticket_3",
        ticketNumber: "TKT-1704067200-003",
        title: "Payment processing error",
        description: "Monthly subscription payment failed with error code 4001. Please investigate.",
        status: "RESOLVED",
        priority: "URGENT",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        school: {
          id: "school_3",
          name: "Oak Valley Academy"
        },
        creator: {
          id: "user_3",
          name: "Robert Brown",
          email: "robert.brown@oakvalley.edu"
        },
        assignee: {
          id: "admin_1",
          name: "Sarah Johnson",
          email: "sarah.johnson@company.com"
        },
        comments: [
          {
            id: "comment_3",
            content: "The payment issue was caused by an expired credit card. I've updated the payment method and processed the payment manually.",
            isInternal: false,
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            author: {
              id: "admin_1",
              name: "Sarah Johnson"
            }
          }
        ],
        slaStatus: "ON_TIME",
        slaDeadline: new Date(Date.now() - 10 * 60 * 60 * 1000),
        metadata: {
          category: "Billing",
          paymentAmount: 299.99
        }
      }
    ];

    setTickets(mockTickets);
    setIsLoading(false);
  };

  const loadMetrics = async () => {
    // Simulate API call
    const mockMetrics: SupportMetrics = {
      totalTickets: 156,
      openTickets: 23,
      inProgressTickets: 18,
      resolvedTickets: 89,
      closedTickets: 26,
      averageResolutionTime: 18.5,
      slaCompliance: 94.2,
      ticketsByPriority: {
        LOW: 45,
        MEDIUM: 67,
        HIGH: 32,
        URGENT: 12
      },
      ticketsByStatus: {
        OPEN: 23,
        IN_PROGRESS: 18,
        WAITING_FOR_CUSTOMER: 8,
        RESOLVED: 89,
        CLOSED: 26
      },
      escalatedTickets: 7,
      overdueTickets: 4,
      responseTimeMetrics: {
        average: 2.3,
        median: 1.8,
        percentile95: 6.2
      },
      resolutionTimeMetrics: {
        average: 18.5,
        median: 14.2,
        percentile95: 45.8
      }
    };

    setMetrics(mockMetrics);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'destructive';
      case 'URGENT':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'destructive';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'WAITING_FOR_CUSTOMER':
        return 'outline';
      case 'RESOLVED':
        return 'default';
      case 'CLOSED':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getSLAStatusColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'ON_TIME':
        return 'text-green-600';
      case 'AT_RISK':
        return 'text-yellow-600';
      case 'OVERDUE':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSLAStatusIcon = (slaStatus: string) => {
    switch (slaStatus) {
      case 'ON_TIME':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'AT_RISK':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'OVERDUE':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.school.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === "all" || 
                           (assigneeFilter === "unassigned" && !ticket.assignee) ||
                           (ticket.assignee && ticket.assignee.id === assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const handleTicketAction = async (ticketId: string, action: string) => {
    // Simulate API call
    console.log(`Performing action ${action} on ticket ${ticketId}`);
    await loadTickets();
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;

    // Simulate API call
    console.log(`Adding comment to ticket ${selectedTicket.id}:`, {
      content: newComment,
      isInternal: isInternalComment
    });

    setNewComment("");
    setIsInternalComment(false);
    await loadTickets();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Ticket Management</h2>
          <p className="text-muted-foreground">
            Manage support tickets with SLA tracking and escalation workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTickets}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
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
                <DialogDescription>
                  Create a new support ticket for a school
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school_1">Springfield Elementary</SelectItem>
                        <SelectItem value="school_2">Riverside High School</SelectItem>
                        <SelectItem value="school_3">Oak Valley Academy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input placeholder="Brief description of the issue" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    placeholder="Detailed description of the issue"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_1">Sarah Johnson</SelectItem>
                      <SelectItem value="admin_2">Mike Wilson</SelectItem>
                      <SelectItem value="admin_3">Lisa Chen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCreateDialog(false)}>
                    Create Ticket
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTickets}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.openTickets} open, {metrics.inProgressTickets} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.slaCompliance}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.overdueTickets} overdue tickets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageResolutionTime}h</div>
              <p className="text-xs text-muted-foreground">
                Median: {metrics.resolutionTimeMetrics.median}h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalated Tickets</CardTitle>
              <ArrowUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.escalatedTickets}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING_FOR_CUSTOMER">Waiting</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="admin_1">Sarah Johnson</SelectItem>
                <SelectItem value="admin_2">Mike Wilson</SelectItem>
                <SelectItem value="admin_3">Lisa Chen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Manage and track support tickets with SLA monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tickets found matching your filters
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{ticket.title}</h4>
                        <Badge variant={getPriorityColor(ticket.priority) as any}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant={getStatusColor(ticket.status) as any}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getSLAStatusIcon(ticket.slaStatus)}
                          <span className={`text-xs ${getSLAStatusColor(ticket.slaStatus)}`}>
                            {ticket.slaStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          {ticket.ticketNumber}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {ticket.school.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.creator.name}
                        </div>
                        {ticket.assignee && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Assigned to {ticket.assignee.name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTimeAgo(ticket.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.comments.length} comments
                        </div>
                      </div>

                      {/* SLA Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>SLA Deadline</span>
                          <span>{format(ticket.slaDeadline, 'MMM dd, HH:mm')}</span>
                        </div>
                        <Progress 
                          value={ticket.slaStatus === 'OVERDUE' ? 100 : 
                                 ticket.slaStatus === 'AT_RISK' ? 75 : 25} 
                          className="h-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowTicketDialog(true);
                        }}
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
                          <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'assign')}>
                            <User className="h-4 w-4 mr-2" />
                            Assign
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'escalate')}>
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Escalate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'resolve')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'close')}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Close
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTicket.title}
                  <Badge variant={getPriorityColor(selectedTicket.priority) as any}>
                    {selectedTicket.priority}
                  </Badge>
                  <Badge variant={getStatusColor(selectedTicket.status) as any}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Ticket #{selectedTicket.ticketNumber} • {selectedTicket.school.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Ticket Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Created By</Label>
                    <div className="text-sm">
                      {selectedTicket.creator.name} ({selectedTicket.creator.email})
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <div className="text-sm">
                      {selectedTicket.assignee ? 
                        `${selectedTicket.assignee.name} (${selectedTicket.assignee.email})` : 
                        'Unassigned'
                      }
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <div className="text-sm">
                      {format(selectedTicket.createdAt, 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>SLA Deadline</Label>
                    <div className={`text-sm flex items-center gap-1 ${getSLAStatusColor(selectedTicket.slaStatus)}`}>
                      {getSLAStatusIcon(selectedTicket.slaStatus)}
                      {format(selectedTicket.slaDeadline, 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="text-sm bg-muted p-3 rounded-md">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <Label>Comments ({selectedTicket.comments.length})</Label>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTicket.comments.map((comment) => (
                      <div key={comment.id} className={`p-3 rounded-md ${
                        comment.isInternal ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-muted'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.author.name}</span>
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-xs">Internal</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(comment.createdAt, 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-3 border-t pt-4">
                    <Label>Add Comment</Label>
                    <Textarea
                      placeholder="Type your comment here..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="internal"
                          checked={isInternalComment}
                          onChange={(e) => setIsInternalComment(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="internal" className="text-sm">
                          Internal comment (not visible to customer)
                        </Label>
                      </div>
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Comment
                      </Button>
                    </div>
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