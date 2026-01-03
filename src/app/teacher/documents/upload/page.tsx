export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentUploadForm } from "@/components/teacher/documents/document-upload-form";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Upload Document | Teacher Portal",
  description: "Upload a new document",
};

export default async function UploadDocumentPage() {
  const session = await auth();
    const userId = session?.user?.id;
  
  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      teacher: true,
    },
  });

  if (!user || !user.teacher) {
    redirect("/login");
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-muted-foreground mt-1">
            Add a new document to your collection
          </p>
        </div>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>
            Fill in the information below to upload your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
