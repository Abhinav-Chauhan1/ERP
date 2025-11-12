"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, PlusCircle, Search, Bell, BellOff,
  Info, AlertTriangle, AlertCircle, CheckCircle, 
  Users, Clock, Calendar, RefreshCw, Filter, MoreVertical,
  Trash2, Send, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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

// Mock data for notifications (fallback)
const mockNotifications = [
  {
    id: "n1",
    title: "Exam Results Published",
    message: "The results for the Mid-term exams have been published. Students can now view their results in the student portal.",
    type: "INFO",
    link: "/admin/assessment/results",
    sentTo: "All Students",
    sentToCount: 1245,
    readCount: 934,
    deliveryRate: 98,
    createdAt: "2023-12-05T10:30:00",
    createdBy: "John Smith",
    creatorRole: "Admin",
  },
  {
    id: "n2",
    title: "Upcoming Maintenance",
    message: "The school's online portal will be undergoing maintenance on Sunday, December 10, from 2:00 AM to 5:00 AM. During this time, the portal may be unavailable.",
    type: "WARNING",
    link: null,
    sentTo: "All Users",
    sentToCount: 2500,
    readCount: 1200,
    deliveryRate: 98,
    createdAt: "2023-12-04T14:15:00",
    createdBy: "System",
    creatorRole: "System",
  },
  {
    id: "n3",
    title: "Fee Payment Reminder",
    message: "This is a reminder that the second installment of the annual school fee is due on December 15, 2023. Please ensure timely payment to avoid late fees.",
    type: "WARNING",
    link: "/admin/finance/payments",
    sentTo: "Parents",
    sentToCount: 875,
    readCount: 650,
    deliveryRate: 97,
    createdAt: "2023-12-03T09:45:00",
    createdBy: "Finance Department",
    creatorRole: "Department",
  },
  {
    id: "n4",
    title: "Library Books Due",
    message: "Please return all borrowed library books before the winter break. The library will be closed during the break period.",
    type: "INFO",
    link: null,
    sentTo: "Students",
    sentToCount: 1245,
    readCount: 980,
    deliveryRate: 99,
    createdAt: "2023-12-02T11:20:00",
    createdBy: "Library Staff",
    creatorRole: "Staff",
  },
  {
    id: "n5",
    title: "Emergency Drill",
    message: "An emergency evacuation drill will be conducted on December 12, 2023, at 10:00 AM. All students and staff are required to participate.",
    type: "ALERT",
    link: null,
    sentTo: "All Users",
    sentToCount: 2500,
    readCount: 2100,
    deliveryRate: 100,
    createdAt: "2023-12-01T13:10:00",
    createdBy: "Safety Committee",
    creatorRole: "Committee",
  },
  {
    id: "n6",
    title: "System Update Complete",
    message: "The student management system has been successfully updated to version 2.5. New features include improved grade reporting and attendance tracking.",
    type: "SUCCESS",
    link: null,
    sentTo: "Teachers",
    sentToCount: 85,
    readCount: 75,
    deliveryRate: 100,
    createdAt: "2023-11-30T16:45:00",
    createdBy: "IT Department",
    creatorRole: "Department",
  },
];

// Mock data for user segments
const userSegments = [
  { id: "all", name: "All Users" },
  { id: "students", name: "All Students" },
  { id: "teachers", name: "All Teachers" },
  { id: "parents", name: "All Parents" },
  { id: "staff", name: "Administrative Staff" },
  { id: "grade10", name: "Grade 10 Students" },
  { id: "grade11", name: "Grade 11 Students" },
  { id: "grade12", name: "Grade 12 Students" },
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

  // Load notifications
  useEffect(() => {
    loadNotifications();
    loadUsers();
    loadStats();
  }, [typeFilter, audienceFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (typeFilter !== "all") filters.type = typeFilter;
      if (audienceFilter !== "all") filters.recipientRole = audienceFilter.toUpperCase();

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
  };

  const loadUsers = async () => {
    try {
      const result = await getUsersForNotifications();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getNotificationStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

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

  // Filter notifications based on search, type, audience, and tab
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    
    const matchesAudience = audienceFilter === "all" || 
                            notification.sentTo === userSegments.find(seg => seg.id === audienceFilter)?.name;
    
    // For demonstration purposes, we're not actually filtering by tab since we don't have those properties
    // In a real app, you would have read/unread status per user
    const matchesTab = true;
    
    return matchesSearch && matchesType && matchesAudience && matchesTab;
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
        return "bg-blue-100 text-blue-700";
      case "WARNING":
        return "bg-amber-100 text-amber-700";
      case "ALERT":
        return "bg-red-100 text-red-700";
      case "SUCCESS":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/communications">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <Dialog open={createNotificationDialog} onOpenChange={setCreateNotificationDialog}>
          <DialogTrigger asChild>
            <Button>
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
                <p className="text-xs text-gray-500">
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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
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
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="rounded-md border">
                  {filteredNotifications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Notification</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Type</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Sent To</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Read Rate</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNotifications.map((notification) => (
                          <tr key={notification.id} className="border-b">
                            <td className="py-3 px-4 align-middle">
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {notification.message}
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <Badge className={getTypeColor(notification.type)}>
                                <div className="flex items-center gap-1">
                                  {getTypeIcon(notification.type)}
                                  <span>{notification.type}</span>
                                </div>
                              </Badge>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-gray-500" />
                                <span>{notification.recipientRole || "ALL"}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {notification.sender ? `By ${notification.sender.firstName} ${notification.sender.lastName}` : "System"}
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                <span>
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="text-xs text-gray-500">
                                Sent to {notification.recipientRole || "ALL"}
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewNotification(notification.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Resend
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BellOff className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
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
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm whitespace-pre-line">{selectedNotification.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-gray-500">Sent By</p>
                  <p className="font-medium">
                    {selectedNotification.sender 
                      ? `${selectedNotification.sender.firstName} ${selectedNotification.sender.lastName}`
                      : "System"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedNotification.sender?.role || "System"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sent To</p>
                  <p className="font-medium">{selectedNotification.recipientRole || "ALL"}</p>
                  <p className="text-xs text-gray-500">Role-based notification</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <Badge className={getTypeColor(selectedNotification.type)}>
                    {selectedNotification.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">Delivered</p>
                </div>
              </div>
              
              {selectedNotification.link && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500">Link</p>
                  <Link href={selectedNotification.link} className="text-blue-600 hover:underline">
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
