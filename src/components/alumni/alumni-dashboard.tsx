"use client";

/**
 * Alumni Dashboard Component
 * 
 * Main dashboard for alumni users showing welcome message, quick stats,
 * recent school news, and quick links to profile and directory.
 * 
 * Requirements: 12.1, 12.5
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  Users,
  Calendar,
  Mail,
  User,
  BookOpen,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

export interface AlumniDashboardProps {
  alumniProfile: {
    id: string;
    studentName: string;
    graduationDate: Date;
    finalClass: string;
    finalSection: string;
    currentOccupation?: string;
    currentCity?: string;
    profilePhoto?: string;
  };
  stats: {
    totalAlumni: number;
    graduationYear: number;
    classmates: number;
    unreadMessages: number;
  };
  recentNews?: Array<{
    id: string;
    title: string;
    excerpt: string;
    date: Date;
    category: string;
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    date: Date;
    location: string;
  }>;
}

// ============================================================================
// Component
// ============================================================================

export function AlumniDashboard({
  alumniProfile,
  stats,
  recentNews = [],
  upcomingEvents = [],
}: AlumniDashboardProps) {
  const graduationYear = new Date(alumniProfile.graduationDate).getFullYear();

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {alumniProfile.studentName.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Class of {graduationYear} • {alumniProfile.finalClass} {alumniProfile.finalSection}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlumni.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered alumni network
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Batch</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classmates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Classmates from {graduationYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Events this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unread notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Links & Profile */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
              <CardDescription>Access your alumni portal features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/alumni/profile">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Button>
              </Link>
              <Link href="/alumni/directory">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Alumni Directory
                </Button>
              </Link>
              <Link href="/alumni/events">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Events & Reunions
                </Button>
              </Link>
              <Link href="/alumni/news">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BookOpen className="mr-2 h-4 w-4" />
                  School News
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
              <CardDescription>Keep your information up to date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{alumniProfile.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {alumniProfile.currentOccupation || "Update your occupation"}
                  </p>
                </div>
              </div>
              {alumniProfile.currentCity && (
                <div className="text-sm text-muted-foreground">
                  📍 {alumniProfile.currentCity}
                </div>
              )}
              <Separator />
              <Link href="/alumni/profile">
                <Button variant="link" className="w-full p-0 h-auto" size="sm">
                  Update Profile
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Recent News */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent School News */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent School News</CardTitle>
                  <CardDescription>Stay updated with the latest from campus</CardDescription>
                </div>
                <Link href="/alumni/news">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentNews.length > 0 ? (
                <div className="space-y-4">
                  {recentNews.slice(0, 3).map((news) => (
                    <div key={news.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {news.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(news.date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium leading-tight">{news.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {news.excerpt}
                          </p>
                        </div>
                      </div>
                      {recentNews.indexOf(news) < recentNews.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent news available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  <CardDescription>Don't miss out on alumni gatherings</CardDescription>
                </div>
                <Link href="/alumni/events">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium leading-tight">{event.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Career Growth Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Career & Networking
              </CardTitle>
              <CardDescription>Connect with fellow alumni and grow your network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Join our alumni network to discover career opportunities, mentorship programs,
                and professional connections.
              </p>
              <div className="flex gap-2">
                <Link href="/alumni/directory">
                  <Button variant="outline" size="sm">
                    Browse Alumni
                  </Button>
                </Link>
                <Link href="/alumni/profile">
                  <Button variant="outline" size="sm">
                    Update Career Info
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
