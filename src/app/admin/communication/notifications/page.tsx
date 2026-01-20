"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, PlusCircle, Search, Bell, BellOff,
  Info, AlertTriangle, AlertCircle, CheckCircle,
  Users, Clock, Calendar, RefreshCw, Filter, MoreVertical,
  Trash2, Send, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { NotificationsTable } from "@/components/admin/notifications-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getNotifications,
  createNotification,
  deleteNotification,
  getNotificationStats,
  getUsersForNotifications,
} from "@/lib/actions/notificationActions";

// Mock data for user segments - aligned with UserRole enum
const userSegments = [
  { id: "all", name: "All Users" },
  { id: "STUDENT", name: "All Students" },
  { id: "TEACHER", name: "All Teachers" },
  { id: "PARENT", name: "All Parents" },
  { id: "ADMIN", name: "Administrators" },
];

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [createNotificationDialog, setCreateNotificationDialog] = useState(false);
  const [viewNotificationDialog, setViewNotificationDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "INFO",
    recipientRole: "ALL",
    link: "",
  });

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (typeFilter !== "all") filters.type = typeFilter;
      if (audienceFilter !== "all") filters.recipientRole = audienceFilter;

      const result = await getNotifications(filters);
      if (result.success && result.data) {
        setNotifications(result.data);
      } else {
        toast.error(result.error || "Failed to load notifications");
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, audienceFilter]);

  const loadUsers = useCallback(async () => {
    try {
      const result = await getUsersForNotifications();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const result = await getNotificationStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  // Load notifications
  useEffect(() => {
    loadNotifications();
    loadUsers();
    loadStats();
  }, [loadNotifications, loadUsers, loadStats]);

  const handleCreateNotification = async () => {
    try {
      if (!formData.title || !formData.message) {
        toast.error("Title and message are required");
        return;
      }

      const result = await createNotification(formData);
      if (result.success) {
        toast.success("Notification sent successfully");
        setCreateNotificationDialog(false);
        setFormData({
          title: "",
          message: "",
          type: "INFO",
          recipientRole: "ALL",
          link: "",
        });
        loadNotifications();
        loadStats();
      } else {
        toast.error(result.error || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Failed to send notification");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const result = await deleteNotification(id);
      if (result.success) {
        toast.success("Notification deleted successfully");
        loadNotifications();
        loadStats();
      } else {
        toast.error(result.error || "Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Filter notifications only based on search (others handled by API)
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleViewNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setSelectedNotification(notification);
      setViewNotificationDialog(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await loadStats();
    setRefreshing(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "INFO":
        return <Info className="h-4 w-4" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4" />;
      case "ALERT":
        return <AlertCircle className="h-4 w-4" />;
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INFO":
        return "bg-primary/10 text-primary";
      case "WARNING":
        return "bg-amber-100 text-amber-700";
      case "ALERT":
        return "bg-red-100 text-red-700";
      case "SUCCESS":
        return "bg-green-100 text-green-700";
      default:
        return "bg-muted text-gray-700";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Link href="/admin/communication">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <Dialog open={createNotificationDialog} onOpenChange={setCreateNotificationDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Send New Notification</DialogTitle>
              <DialogDescription>
                Create a notification to send to users
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Notification title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter notification message"
                  className="min-h-[100px]"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipients</label>
                  <Select
                    value={formData.recipientRole}
                    onValueChange={(value) => setFormData({ ...formData, recipientRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Users</SelectItem>
                      <SelectItem value="STUDENT">All Students</SelectItem>
                      <SelectItem value="TEACHER">All Teachers</SelectItem>
                      <SelectItem value="PARENT">All Parents</SelectItem>
                      <SelectItem value="ADMIN">Administrators</SelectItem>
                      <SelectItem value="STAFF">Staff Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INFO">Information</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="ALERT">Alert</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link (Optional)</label>
                <Input
                  placeholder="e.g., /admin/assessment/results"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Users will be directed to this link when they click on the notification
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="send-immediately" defaultChecked />
                <label
                  htmlFor="send-immediately"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send immediately
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateNotificationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateNotification}>
                <Send className="mr-2 h-4 w-4" /> Send Notification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle className="text-xl">System Notifications</CardTitle>
              <CardDescription>
                Manage notifications sent to users
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Type</p>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="INFO">Information</SelectItem>
                        <SelectItem value="WARNING">Warning</SelectItem>
                        <SelectItem value="ALERT">Alert</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Recipient</p>
                    <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Recipients</SelectItem>
                        {userSegments.map(segment => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">System</TabsTrigger>
              <TabsTrigger value="sent">Manual</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length > 0 ? (
                <NotificationsTable
                  notifications={filteredNotifications}
                  onView={handleViewNotification}
                  onDelete={handleDeleteNotification}
                  emptyMessage="No notifications found"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
                  <BellOff className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    {searchTerm || typeFilter !== "all" || audienceFilter !== "all"
                      ? "No notifications match your search criteria. Try adjusting your filters."
                      : "There are no notifications yet. Create your first notification to get started."}
                  </p>
                  <Button onClick={() => setCreateNotificationDialog(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Notification
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Notification Dialog */}
      <Dialog open={viewNotificationDialog} onOpenChange={setViewNotificationDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              View complete notification information
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4 py-2">
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${getTypeColor(selectedNotification.type)} mr-4`}>
                  {getTypeIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{selectedNotification.title}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-accent p-4 rounded-md">
                <p className="text-sm whitespace-pre-line">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Sent By</p>
                  <p className="font-medium">
                    {selectedNotification.sender
                      ? `${selectedNotification.sender.firstName} ${selectedNotification.sender.lastName}`
                      : "System"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedNotification.sender?.role || "System"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sent To</p>
                  <p className="font-medium">{selectedNotification.recipientRole || "ALL"}</p>
                  <p className="text-xs text-muted-foreground">Role-based notification</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge className={getTypeColor(selectedNotification.type)}>
                    {selectedNotification.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">Delivered</p>
                </div>
              </div>

              {selectedNotification.link && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">Link</p>
                  <Link href={selectedNotification.link} className="text-primary hover:underline">
                    {selectedNotification.link}
                  </Link>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewNotificationDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

