export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, DownloadCloud, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getDocumentCategories } from "@/lib/actions/student-document-actions";

export const metadata: Metadata = {
  title: "Document Policies | Student Portal",
  description: "School document policies and guidelines",
};

export default async function DocumentPoliciesPage() {
  const documentCategories = await getDocumentCategories();
  
  // Example policy documents
  const policyDocuments = [
    {
      id: "1",
      title: "Document Submission Guidelines",
      description: "Guidelines for submitting and maintaining documents in the school system",
      fileUrl: "#",
      category: "Guidelines"
    },
    {
      id: "2",
      title: "Document Verification Policy",
      description: "Policy on how documents are verified and processed by the administration",
      fileUrl: "#",
      category: "Policy"
    },
    {
      id: "3", 
      title: "Digital Document Format Standards",
      description: "Acceptable formats and standards for digital document submissions",
      fileUrl: "#",
      category: "Standards"
    }
  ];
  
  return (
    <div className="container p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/documents">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Documents
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Document Policies</h1>
      </div>
      
      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>
          All students are required to review and adhere to these document policies. 
          Failure to comply may result in processing delays.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Document Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentCategories.length > 0 ? (
                documentCategories.map(category => (
                  <div key={category.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span>{category.name}</span>
                    {category.description && (
                      <span className="text-xs text-gray-500">{category.description}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No document categories defined</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Policy Documents
            </CardTitle>
            <CardDescription>
              Download and read the important document policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policyDocuments.map(doc => (
                <div key={doc.id} className="flex flex-col sm:flex-row justify-between gap-4 p-3 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 ml-6">
                      {doc.description}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-6 mt-2 sm:mt-0 self-start gap-1">
                    <DownloadCloud className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Document Submission Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">General Requirements</h3>
              <p className="text-gray-700">
                All documents submitted to the school system must adhere to the following requirements:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-600">
                <li>Must be clearly scanned or photographed with all text legible</li>
                <li>File size should not exceed 10MB per document</li>
                <li>Acceptable formats: PDF, JPEG, PNG, DOCX</li>
                <li>Documents must be properly named according to the naming convention</li>
                <li>All sensitive information must be properly redacted where necessary</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Document Verification Process</h3>
              <p className="text-gray-700">
                All submitted documents undergo the following verification process:
              </p>
              <ol className="list-decimal ml-6 mt-2 space-y-2 text-gray-600">
                <li>Initial upload by student or parent</li>
                <li>Automated system check for format compliance</li>
                <li>Document review by administrative staff</li>
                <li>Verification against original documents (if required)</li>
                <li>Approval and storage in student record</li>
              </ol>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Privacy and Retention Policy</h3>
              <p className="text-gray-700">
                The school maintains strict privacy and document retention policies:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-600">
                <li>All documents are stored securely with restricted access</li>
                <li>Personal documents are only accessible to authorized personnel</li>
                <li>Documents are retained for the duration of enrollment plus 5 years</li>
                <li>Parents/students may request document deletion after the retention period</li>
                <li>Public documents are reviewed annually for continued relevance</li>
              </ul>
            </div>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Falsification of documents or submission of forged documents is a serious offense 
                and may result in disciplinary action including dismissal from the institution.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
