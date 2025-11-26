export const dynamic = 'force-dynamic';

import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft, Download, Trash2, FileText, Calendar, Tag, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentViewer } from "@/components/teacher/documents/document-viewer";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Document Details | Teacher Portal",
  description: "View document details",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCategoryLabel(category: string | null): string {
  if (!category) return "Other";
  
  const labels: Record<string, string> = {
    CERTIFICATE: "Certificate",
    ID_PROOF: "ID Proof",
    TEACHING_MATERIAL: "Teaching Material",
    LESSON_PLAN: "Lesson Plan",
    CURRICULUM: "Curriculum",
    POLICY: "Policy",
    OTHER: "Other",
  };
  
  return labels[category] || category;
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacher: true,
    },
  });

  if (!user || !user.teacher) {
    redirect("/login");
  }

  const { id } = await params;

  const document = await db.document.findUnique({
    where: {
      id,
    },
    include: {
      documentType: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!document) {
    notFound();
  }

  // Ensure the document belongs to the current user
  if (document.userId !== user.id) {
    redirect("/teacher/documents");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
          <p className="text-muted-foreground mt-1">
            {document.description || "No description provided"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={document.fileUrl} target="_blank" download>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Document Viewer */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentViewer
                fileUrl={document.fileUrl}
                fileType={document.fileType || ""}
                fileName={document.fileName}
              />
            </CardContent>
          </Card>
        </div>

        {/* Document Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">File Name</p>
                  <p className="text-sm text-muted-foreground">{document.fileName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Category</p>
                  <Badge variant="secondary" className="mt-1">
                    {getCategoryLabel(document.category)}
                  </Badge>
                </div>
              </div>

              {document.documentType && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document Type</p>
                    <p className="text-sm text-muted-foreground">{document.documentType.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">File Size</p>
                  <p className="text-sm text-muted-foreground">
                    {document.fileSize ? formatFileSize(document.fileSize) : "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Uploaded On</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(document.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Uploaded By</p>
                  <p className="text-sm text-muted-foreground">
                    {document.user.firstName} {document.user.lastName}
                  </p>
                </div>
              </div>

              {document.tags && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {document.tags.split(',').map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
