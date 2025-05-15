import { redirect } from "next/navigation";
import { Metadata } from "next";
import { File, FileText, UploadCloud, FolderIcon, Download } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserDetails } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DocumentUploadForm } from "@/components/student/document-upload-form";
import { DocumentList } from "@/components/student/document-list";

export const metadata: Metadata = {
  title: "Documents | Student Portal",
  description: "View and manage your documents",
};

export default async function StudentDocumentsPage() {
  const userDetails = await getCurrentUserDetails();
  
  if (!userDetails?.dbUser || userDetails.dbUser.role !== "STUDENT") {
    redirect("/login");
  }
  
  const student = await db.student.findUnique({
    where: {
      userId: userDetails.dbUser.id
    }
  });

  if (!student) {
    redirect("/student");
  }

  // Get document types
  const documentTypes = await db.documentType.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // Get student's personal documents
  const personalDocuments = await db.document.findMany({
    where: {
      userId: userDetails.dbUser.id
    },
    include: {
      documentType: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Get school documents (public)
  const schoolDocuments = await db.document.findMany({
    where: {
      isPublic: true
    },
    include: {
      documentType: true,
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      
      <Tabs defaultValue="my-documents" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="my-documents">My Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
          <TabsTrigger value="school-documents">School Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                My Documents
              </CardTitle>
              <CardDescription>
                View and manage your personal documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList 
                documents={personalDocuments} 
                emptyMessage="You haven't uploaded any documents yet. Go to the 'Upload Document' tab to add your first document."
                allowDownload={true}
                allowDelete={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-green-600" />
                Upload Document
              </CardTitle>
              <CardDescription>
                Upload new documents to your personal collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadForm 
                documentTypes={documentTypes} 
                userId={userDetails.dbUser.id} 
                studentId={student.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="school-documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FolderIcon className="h-5 w-5 text-amber-600" />
                School Documents
              </CardTitle>
              <CardDescription>
                Access important school documents and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList 
                documents={schoolDocuments}
                emptyMessage="No school documents available at this time."
                allowDownload={true}
                allowDelete={false}
                showUploader={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
