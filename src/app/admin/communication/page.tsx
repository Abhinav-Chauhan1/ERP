"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Bell, Megaphone, Users, FileText,
  PlusCircle, ArrowRight, Send, Eye, Loader2,
  CalendarClock, ArrowUp, ArrowDown, MessageCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Chart } from "@/components/dashboard/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMessages, getMessageStats } from "@/lib/actions/messageActions";
import { getAnnouncements, getAnnouncementStats } from "@/lib/actions/announcementActions";
import { getNotificationStats } from "@/lib/actions/notificationActions";
import { getParentMeetings, getMeetingStats } from "@/lib/actions/parentMeetingActions";

export default function CommunicationsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Stats
  const [messageStats, setMessageStats] = useState<any>(null);
  const [announcementStats, setAnnouncementStats] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [meetingStats, setMeetingStats] = useState<any>(null);

  // Data
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  const generateWeeklyData = useCallback(() => {
    // Generate mock weekly data for the chart
    // In a real app, this would come from the database
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({
      date: day,
      sent: Math.floor(Math.random() * 30) + 20,
      received: Math.floor(Math.random() * 35) + 25,
    }));
    setWeeklyData(data);
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Load stats
      const [msgStats, annStats, notifStats, mtgStats] = await Promise.all([
        getMessageStats(),
        getAnnouncementStats(),
        getNotificationStats(),
        getMeetingStats(),
      ]);

      setMessageStats(msgStats.success ? msgStats.data : null);
      setAnnouncementStats(annStats.success ? annStats.data : null);
      setNotificationStats(notifStats.success ? notifStats.data : null);
      setMeetingStats(mtgStats.success ? mtgStats.data : null);

      // Load recent data
      const [messages, announcements, meetings] = await Promise.all([
        getMessages("inbox"),
        getAnnouncements({ isActive: true, limit: 5 }),
        getParentMeetings({ status: "SCHEDULED", limit: 5 }),
      ]);

      if (messages.success && messages.data) {
        setRecentMessages(messages.data.slice(0, 5));
      }

      if (announcements.success && announcements.data) {
        setRecentAnnouncements(announcements.data);
      }

      if (meetings.success && meetings.data) {
        setUpcomingMeetings(meetings.data);
      }

      // Generate weekly data
      generateWeeklyData();

    } catch (error) {
      console.error("Error loading communication data:", error);
      toast.error("Failed to load communication data");
    } finally {
      setLoading(false);
    }
  }, [generateWeeklyData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const communicationCategories = [
    {
      title: "Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      description: "Private messaging system",
      href: "/admin/communication/messages",
      count: messageStats?.totalSent || 0,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Announcements",
      icon: <Megaphone className="h-5 w-5" />,
      description: "School-wide announcements",
      href: "/admin/communication/announcements",
      count: announcementStats?.activeAnnouncements || 0,
      color: "bg-purple-50 text-purple-700"
    },
    {
      title: "Bulk Messaging",
      icon: <Send className="h-5 w-5" />,
      description: "Send bulk SMS & emails",
      href: "/admin/communication/bulk-messaging",
      count: "—",
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "Message History",
      icon: <FileText className="h-5 w-5" />,
      description: "View sent messages & analytics",
      href: "/admin/communication/history",
      count: "—",
      color: "bg-cyan-50 text-cyan-700"
    },
    {
      title: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      description: "System alerts & notices",
      href: "/admin/communication/notifications",
      count: notificationStats?.totalNotifications || 0,
      color: "bg-amber-50 text-amber-700"
    },
    {
      title: "Parent Meetings",
      icon: <Users className="h-5 w-5" />,
      description: "Schedule parent conferences",
      href: "/admin/communication/parent-meetings",
      count: meetingStats?.scheduledMeetings || 0,
      color: "bg-green-50 text-green-700"
    },
  ];

  const getCommunicationType = (item: any) => {
    if (item.subject) return 'message';
    if (item.title) return 'announcement';
    return 'meeting';
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'announcement': return <Megaphone className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getCommunicationColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-primary/10 text-primary';
      case 'announcement': return 'bg-purple-100 text-purple-700';
      case 'meeting': return 'bg-green-100 text-green-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Communications Hub</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/communication/messages">
            <Button variant="outline" size="default">
              <MessageSquare className="mr-2 h-4 w-4" /> Compose Message
            </Button>
          </Link>
          <Link href="/admin/communication/announcements">
            <Button size="default">
              <Megaphone className="mr-2 h-4 w-4" /> Create Announcement
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Category Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communicationCategories.map((category) => (
              <Card key={category.title} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${category.color}`}>
                      {category.icon}
                    </div>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {loading ? "..." : category.count}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{category.title}</CardTitle>
                  <CardDescription className="text-sm">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <Link href={category.href}>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Communications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>
                  Latest messages and announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Recent Messages */}
                    {recentMessages.slice(0, 3).map((message) => (
                      <div key={message.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{message.subject}</p>
                            {!message.isRead && <Badge className="bg-primary/10 text-primary">New</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {message.sender?.firstName} {message.sender?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Link href={`/admin/communication/messages/${message.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}

                    {/* Recent Announcements */}
                    {recentAnnouncements.slice(0, 2).map((announcement) => (
                      <div key={announcement.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className="p-2 rounded-full bg-purple-100 text-purple-700">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{announcement.title}</p>
                            {announcement.isPinned && <Badge className="bg-purple-100 text-purple-800">Pinned</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            To: {announcement.targetAudience?.join(", ") || "All"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(announcement.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Link href={`/admin/communication/announcements/${announcement.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}

                    {recentMessages.length === 0 && recentAnnouncements.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No recent activity
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t flex justify-center pt-4">
                <Link href="/admin/communication/messages">
                  <Button variant="outline" size="sm">
                    View All Messages
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription>
                  Common communication tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/admin/communication/parent-meetings" className="block group">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-pointer">
                      <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Schedule Meeting</p>
                        <p className="text-xs text-muted-foreground">With parents or staff</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </Link>

                  <Link href="/admin/communication/templates" className="block group">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-purple-500/50 transition-all cursor-pointer">
                      <div className="p-2 rounded-md bg-purple-100 text-purple-700 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Use Template</p>
                        <p className="text-xs text-muted-foreground">For emails and messages</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors shrink-0" />
                    </div>
                  </Link>

                  <Link href="/admin/communication/notifications" className="block group">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-amber-500/50 transition-all cursor-pointer">
                      <div className="p-2 rounded-md bg-amber-100 text-amber-700 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Create Alert</p>
                        <p className="text-xs text-muted-foreground">Send system notifications</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors shrink-0" />
                    </div>
                  </Link>

                  <Link href="/admin/communication/bulk-messaging" className="block group">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-green-500/50 transition-all cursor-pointer">
                      <div className="p-2 rounded-md bg-green-100 text-green-700 shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <Send className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">SMS Alert</p>
                        <p className="text-xs text-muted-foreground">Send text messages</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors shrink-0" />
                    </div>
                  </Link>

                  <Link href="/admin/communication/whatsapp-profile" className="block group">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-emerald-500/50 transition-all cursor-pointer">
                      <div className="p-2 rounded-md bg-emerald-100 text-emerald-700 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">WhatsApp Profile</p>
                        <p className="text-xs text-muted-foreground">Configure business profile</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors shrink-0" />
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Parent Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Upcoming Parent Meetings</CardTitle>
                <CardDescription>
                  Scheduled conferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : upcomingMeetings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No upcoming meetings
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className="p-2 rounded-full bg-green-100 text-green-700">
                          <CalendarClock className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{meeting.title}</p>
                            <Badge className="bg-green-100 text-green-800">
                              {meeting.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {meeting.teacher?.user?.firstName} {meeting.teacher?.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(meeting.meetingDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t flex justify-center pt-4">
                <Link href="/admin/communication/parent-meetings">
                  <Button variant="outline" size="sm">
                    Manage Meetings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Communication Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Communication Stats</CardTitle>
                <CardDescription>
                  Current period overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Messages Sent</p>
                          <p className="text-sm font-medium">{messageStats?.totalSent || 0}</p>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <span>{messageStats?.unreadCount || 0} unread</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-purple-100 text-purple-700">
                        <Megaphone className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Announcements</p>
                          <p className="text-sm font-medium">{announcementStats?.activeAnnouncements || 0}</p>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <span>{announcementStats?.totalAnnouncements || 0} total</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-100 text-green-700">
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Parent Meetings</p>
                          <p className="text-sm font-medium">{meetingStats?.scheduledMeetings || 0}</p>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <span>{meetingStats?.completedMeetings || 0} completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-amber-100 text-amber-700">
                        <Bell className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Notifications</p>
                          <p className="text-sm font-medium">{notificationStats?.totalNotifications || 0}</p>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <span>System alerts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-full bg-muted inline-block">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Coming Soon</h2>
                <p className="text-muted-foreground">
                  Detailed communication analytics will be available in a future update.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  Return to Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

