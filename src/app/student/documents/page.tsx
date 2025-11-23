export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { File, FileText, UploadCloud, FolderIcon, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DocumentUploadForm } from "@/components/student/document-upload-form";
import { DocumentList } from "@/components/student/document-list";
import { DocumentHeader } from "@/components/student/document-header";
import { getStudentDocuments } from "@/lib/actions/student-document-actions";

export const metadata: Metadata = {
  title: "Documents | Student Portal",
  description: "View and manage your documents",
};

export default async function StudentDocumentsPage() {
  const { user, documentTypes, personalDocuments, schoolDocuments } = await getStudentDocuments();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      
      <DocumentHeader 
        totalPersonalDocs={personalDocuments.length} 
        totalSchoolDocs={schoolDocuments.length} 
      />
      
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
                userId={user.id} 
                studentId=""
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
