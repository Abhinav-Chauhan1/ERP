export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkImportDialog } from "@/components/admin/bulk-import-dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BulkImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Data Import</h1>
          <p className="text-muted-foreground mt-1">
            Import multiple records from CSV files
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription>
          Before importing data, please ensure your CSV file follows the correct format.
          Download the template for your import type to see the required fields and format.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Students
            </CardTitle>
            <CardDescription>
              Bulk import student records with class assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkImportDialog
              trigger={
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Students
                </Button>
              }
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Required Fields:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>First Name, Last Name</li>
                <li>Email, Admission ID</li>
                <li>Date of Birth, Gender</li>
                <li>Class ID</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Teachers
            </CardTitle>
            <CardDescription>
              Bulk import teacher records with department assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkImportDialog
              trigger={
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Teachers
                </Button>
              }
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Required Fields:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>First Name, Last Name</li>
                <li>Email, Employee ID</li>
                <li>Qualification</li>
                <li>Join Date</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Parents
            </CardTitle>
            <CardDescription>
              Bulk import parent records and link to students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkImportDialog
              trigger={
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Parents
                </Button>
              }
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Required Fields:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>First Name, Last Name</li>
                <li>Email</li>
                <li>Student Admission ID</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Guidelines</CardTitle>
          <CardDescription>
            Follow these guidelines for successful data import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Best Practices
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Download and use the provided CSV template</li>
                <li>Ensure all required fields are filled</li>
                <li>Use consistent date format (YYYY-MM-DD)</li>
                <li>Verify email addresses are valid and unique</li>
                <li>Check that referenced IDs (class, section) exist</li>
                <li>Test with a small batch first</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Common Issues
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Duplicate email addresses or IDs</li>
                <li>Invalid date formats</li>
                <li>Missing required fields</li>
                <li>Invalid gender values (use MALE, FEMALE, OTHER)</li>
                <li>Non-existent class or section IDs</li>
                <li>Special characters in CSV file</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Duplicate Handling Options</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <strong>Skip:</strong> Existing records will be skipped, no changes made (recommended)
                </div>
                <div>
                  <strong>Update:</strong> Existing records will be updated with new data
                </div>
                <div>
                  <strong>Create:</strong> New records will be created even if duplicates exist (may cause issues)
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Process</CardTitle>
          <CardDescription>
            Step-by-step guide to importing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <div>
                <h4 className="font-medium">Select Import Type</h4>
                <p className="text-sm text-muted-foreground">
                  Choose whether you want to import students, teachers, or parents
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <div>
                <h4 className="font-medium">Download Template</h4>
                <p className="text-sm text-muted-foreground">
                  Download the CSV template to see the required format and fields
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <div>
                <h4 className="font-medium">Prepare Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Fill in the template with your data, ensuring all required fields are complete
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                4
              </div>
              <div>
                <h4 className="font-medium">Upload and Validate</h4>
                <p className="text-sm text-muted-foreground">
                  Upload your CSV file and the system will validate the data before import
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                5
              </div>
              <div>
                <h4 className="font-medium">Review and Import</h4>
                <p className="text-sm text-muted-foreground">
                  Review any validation errors, fix them if needed, and start the import
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                6
              </div>
              <div>
                <h4 className="font-medium">View Results</h4>
                <p className="text-sm text-muted-foreground">
                  See a summary of created, updated, skipped, and failed records
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
