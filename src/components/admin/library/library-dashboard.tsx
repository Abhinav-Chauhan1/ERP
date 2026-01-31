"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BookMarked,
  BookCheck,
  BookX,
  Clock,
  BookmarkPlus,
  Plus,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface LibraryDashboardProps {
  stats: {
    totalBooks: number;
    totalQuantity: number;
    availableBooks: number;
    issuedBooks: number;
    overdueBooks: number;
    activeReservations: number;
    totalFines: number;
  };
  recentActivity?: {
    recentIssues: Array<{
      id: string;
      issueDate: Date;
      dueDate: Date;
      status: string;
      book: {
        id: string;
        title: string;
        author: string;
        isbn: string;
      };
      student: {
        id: string;
        userId: string;
        user: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string | null;
        };
      };
    }>;
    recentReturns: Array<{
      id: string;
      issueDate: Date;
      dueDate: Date;
      returnDate: Date | null;
      fine: number;
      status: string;
      book: {
        id: string;
        title: string;
        author: string;
        isbn: string;
      };
      student: {
        id: string;
        userId: string;
        user: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string | null;
        };
      };
    }>;
  };
}

export function LibraryDashboard({ stats, recentActivity }: LibraryDashboardProps) {
  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks,
      description: `${stats.totalQuantity} copies`,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Available",
      value: stats.availableBooks,
      description: "Ready to issue",
      icon: BookCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Issued",
      value: stats.issuedBooks,
      description: "Currently borrowed",
      icon: BookMarked,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Overdue",
      value: stats.overdueBooks,
      description: "Past due date",
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Reservations",
      value: stats.activeReservations,
      description: "Active reservations",
      icon: BookmarkPlus,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Total Fines",
      value: `₹${stats.totalFines.toFixed(2)}`,
      description: "Collected fines",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <Link href="/admin/library/books">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold">Manage Books</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage book collection
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <Link href="/admin/library/reports">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold">Library Reports</h3>
                <p className="text-sm text-muted-foreground">
                  View analytics and reports
                </p>
              </div>
              <BookCheck className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/admin/library/books/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Book
            </Button>
          </Link>
          <Link href="/admin/library/reports">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </Link>
        </CardContent>
      </Card>

      {recentActivity && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Issues */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Issues</CardTitle>
              <Link href="/admin/library/books">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity.recentIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent issues</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.recentIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="rounded-full bg-purple-100 p-2">
                        <ArrowDownCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {issue.book.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {issue.book.author}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${issue.status === "OVERDUE"
                                ? "bg-red-100 text-red-700"
                                : "bg-purple-100 text-purple-700"
                              }`}
                          >
                            {issue.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{`${issue.student.user.firstName || ''} ${issue.student.user.lastName || ''}`.trim() || 'Unknown Student'}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(issue.issueDate), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Returns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Returns</CardTitle>
              <Link href="/admin/library/books">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity.recentReturns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent returns</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.recentReturns.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="rounded-full bg-green-100 p-2">
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {issue.book.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {issue.book.author}
                            </p>
                          </div>
                          {issue.fine > 0 && (
                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                              Fine: ₹{issue.fine.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{`${issue.student.user.firstName || ''} ${issue.student.user.lastName || ''}`.trim() || 'Unknown Student'}</span>
                          <span>•</span>
                          <span>
                            {issue.returnDate &&
                              formatDistanceToNow(new Date(issue.returnDate), {
                                addSuffix: true,
                              })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
