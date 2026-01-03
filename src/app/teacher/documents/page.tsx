export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { FileText, Upload, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentList } from "@/components/teacher/documents/document-list";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documents | Teacher Portal",
  description: "Manage your teaching documents",
};

async function getTeacherDocuments(userId: string, searchTerm?: string, category?: string) {
  const where: any = {
    userId,
  };

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { fileName: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  if (category && category !== 'ALL') {
    where.category = category;
  }

  const documents = await db.document.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      documentType: true,
    },
  });

  return documents;
}

export default async function TeacherDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
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

  const resolvedSearchParams = await searchParams;

  const documents = await getTeacherDocuments(
    user.id,
    resolvedSearchParams.search,
    resolvedSearchParams.category
  );

  // Calculate statistics
  const totalDocuments = documents.length;
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'OTHER';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teaching materials and documents
          </p>
        </div>
        <Link href="/teacher/documents/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Teaching Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsByCategory.TEACHING_MATERIAL || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lesson Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsByCategory.LESSON_PLAN || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsByCategory.CERTIFICATE || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>
            Search and filter your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-9"
                name="search"
                defaultValue={resolvedSearchParams.search}
              />
            </div>
            <Select name="category" defaultValue={resolvedSearchParams.category || 'ALL'}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="CERTIFICATE">Certificates</SelectItem>
                <SelectItem value="ID_PROOF">ID Proof</SelectItem>
                <SelectItem value="TEACHING_MATERIAL">Teaching Materials</SelectItem>
                <SelectItem value="LESSON_PLAN">Lesson Plans</SelectItem>
                <SelectItem value="CURRICULUM">Curriculum</SelectItem>
                <SelectItem value="POLICY">Policy</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DocumentList documents={documents} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
