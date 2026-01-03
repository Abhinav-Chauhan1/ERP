"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getAdmissionApplicationById, 
  updateApplicationStatus,
  updateApplicationRemarks 
} from "@/lib/actions/admissionActions";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplication() {
      try {
        const data = await getAdmissionApplicationById(params.id as string);
        setApplication(data);
        setRemarks(data?.remarks || "");
      } catch (error) {
        console.error("Error fetching application:", error);
        toast.error("Failed to load application");
      } finally {
        setLoading(false);
      }
    }

    fetchApplication();
  }, [params.id]);

  const handleStatusUpdate = async (status: "ACCEPTED" | "REJECTED" | "WAITLISTED" | "UNDER_REVIEW") => {
    setPendingStatus(status);
    setShowConfirmDialog(true);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatus) return;

    setUpdatingStatus(true);
    try {
      const result = await updateApplicationStatus(
        params.id as string,
        pendingStatus as any,
        remarks,
        session?.user?.id || undefined
      );

      if (result.success) {
        toast.success(result.message || "Status updated successfully");
        setApplication(result.data);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update application status");
    } finally {
      setUpdatingStatus(false);
      setShowConfirmDialog(false);
      setPendingStatus(null);
    }
  };

  const handleSaveRemarks = async () => {
    setSavingRemarks(true);
    try {
      const result = await updateApplicationRemarks(params.id as string, remarks);

      if (result.success) {
        toast.success(result.message || "Remarks saved successfully");
        setApplication(result.data);
      } else {
        toast.error(result.error || "Failed to save remarks");
      }
    } catch (error) {
      console.error("Error saving remarks:", error);
      toast.error("Failed to save remarks");
    } finally {
      setSavingRemarks(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "text-blue-600 bg-blue-50";
      case "UNDER_REVIEW":
        return "text-yellow-600 bg-yellow-50";
      case "ACCEPTED":
        return "text-green-600 bg-green-50";
      case "REJECTED":
        return "text-red-600 bg-red-50";
      case "WAITLISTED":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "BIRTH_CERTIFICATE":
        return "Birth Certificate";
      case "PREVIOUS_REPORT_CARD":
        return "Previous Report Card";
      case "PHOTOGRAPH":
        return "Photograph";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Application not found</p>
        <Link href="/admin/admissions">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/admissions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{application.studentName}</h1>
            <p className="text-muted-foreground">
              Application #{application.applicationNumber}
            </p>
          </div>
        </div>
        <Badge className={cn("text-sm px-3 py-1", getStatusColor(application.status))}>
          {application.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium">{application.studentName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date of Birth</Label>
              <p className="font-medium">
                {format(new Date(application.dateOfBirth), "PPP")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Gender</Label>
              <p className="font-medium">{application.gender}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Applied Class</Label>
              <p className="font-medium">{application.appliedClass.name}</p>
              {application.appliedClass.academicYear && (
                <p className="text-sm text-muted-foreground">
                  {application.appliedClass.academicYear.name}
                </p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Previous School</Label>
              <p className="font-medium">{application.previousSchool || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <p className="font-medium">{application.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Parent Information */}
        <Card>
          <CardHeader>
            <CardTitle>Parent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Parent Name</Label>
              <p className="font-medium">{application.parentName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{application.parentEmail}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{application.parentPhone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Submitted On</Label>
              <p className="font-medium">
                {format(new Date(application.submittedAt), "PPP 'at' p")}
              </p>
            </div>
            {application.reviewedAt && (
              <div>
                <Label className="text-muted-foreground">Reviewed On</Label>
                <p className="font-medium">
                  {format(new Date(application.reviewedAt), "PPP 'at' p")}
                </p>
              </div>
            )}
            {application.reviewedBy && (
              <div>
                <Label className="text-muted-foreground">Reviewed By</Label>
                <p className="font-medium">{application.reviewedBy}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {application.documents && application.documents.length > 0 ? (
              <div className="space-y-3">
                {application.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {getDocumentTypeLabel(doc.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.filename}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No documents uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remarks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Remarks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Add remarks or notes about this application..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleSaveRemarks} disabled={savingRemarks}>
            {savingRemarks ? "Saving..." : "Save Remarks"}
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Application Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleStatusUpdate("UNDER_REVIEW")}
              disabled={updatingStatus || application.status === "UNDER_REVIEW"}
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark Under Review
            </Button>
            <Button
              onClick={() => handleStatusUpdate("ACCEPTED")}
              disabled={updatingStatus || application.status === "ACCEPTED"}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Application
            </Button>
            <Button
              onClick={() => handleStatusUpdate("WAITLISTED")}
              disabled={updatingStatus || application.status === "WAITLISTED"}
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Add to Waitlist
            </Button>
            <Button
              onClick={() => handleStatusUpdate("REJECTED")}
              disabled={updatingStatus || application.status === "REJECTED"}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the application status to{" "}
              <strong>{pendingStatus?.replace('_', ' ')}</strong>?
              {pendingStatus === "ACCEPTED" && (
                <span className="block mt-2 text-green-600">
                  This will mark the application as accepted.
                </span>
              )}
              {pendingStatus === "REJECTED" && (
                <span className="block mt-2 text-red-600">
                  This will reject the application.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusUpdate}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
