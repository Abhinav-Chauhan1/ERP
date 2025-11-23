"use client";

import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Book, BookIssue, Student, User } from "@prisma/client";

interface BookDetailProps {
  book: Book & {
    issues: (BookIssue & {
      student: Student & {
        user: User;
      };
    })[];
    reservations: any[];
    _count: {
      issues: number;
      reservations: number;
    };
  };
}

export function BookDetail({ book }: BookDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Link href={`/admin/library/books/${book.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Book
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Book Cover</CardTitle>
          </CardHeader>
          <CardContent>
            {book.coverImage ? (
              <OptimizedImage
                src={book.coverImage}
                alt={book.title}
                width={400}
                height={600}
                className="w-full rounded-lg object-cover"
                qualityPreset="high"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                No Cover Image
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Book Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="text-lg font-semibold">{book.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Author</p>
                <p className="text-lg">{book.author}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                <p className="font-mono">{book.isbn}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Publisher
                </p>
                <p>{book.publisher || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Category
                </p>
                <Badge variant="secondary">{book.category}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p>{book.location || "N/A"}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Quantity
                </p>
                <p className="text-2xl font-bold">{book.quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Available
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {book.available}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Issued
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {book.quantity - book.available}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {book.issues.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No issue history available
            </p>
          ) : (
            <div className="space-y-4">
              {book.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {issue.student.user.firstName} {issue.student.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {issue.student.admissionId}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        issue.status === "ISSUED"
                          ? "default"
                          : issue.status === "RETURNED"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {issue.status}
                    </Badge>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Issued: {format(new Date(issue.issueDate), "MMM dd, yyyy")}
                    </p>
                    {issue.returnDate && (
                      <p className="text-sm text-muted-foreground">
                        Returned:{" "}
                        {format(new Date(issue.returnDate), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {book.reservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {book.reservations.map((reservation: any) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {reservation.student.user.firstName}{" "}
                      {reservation.student.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.student.admissionId}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge>{reservation.status}</Badge>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reserved:{" "}
                      {format(new Date(reservation.reservedAt), "MMM dd, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires:{" "}
                      {format(new Date(reservation.expiresAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
