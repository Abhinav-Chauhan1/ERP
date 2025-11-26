export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { format } from "date-fns";
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaveApplicationForm } from "@/components/student/leave-application-form";
import { getStudentLeaveApplications, cancelLeaveApplication } from "@/lib/actions/student-attendance-actions";
import { LeaveStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Leave Applications | Student Portal",
  description: "Submit and track your leave applications",
};

export default async function StudentLeaveApplicationsPage() {
  const leaveApplications = await getStudentLeaveApplications();
  
  // Group applications by status
  const pendingApplications = leaveApplications.filter(app => app.status === LeaveStatus.PENDING);
  const approvedApplications = leaveApplications.filter(app => app.status === LeaveStatus.APPROVED);
  const rejectedApplications = leaveApplications.filter(app => app.status === LeaveStatus.REJECTED);
  const cancelledApplications = leaveApplications.filter(app => app.status === LeaveStatus.CANCELLED);
  
  // Get badge styling based on status
  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.PENDING:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>;
      case LeaveStatus.APPROVED:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case LeaveStatus.REJECTED:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case LeaveStatus.CANCELLED:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Format date range
  const formatDateRange = (fromDate: Date, toDate: Date) => {
    if (fromDate.toDateString() === toDate.toDateString()) {
      return format(fromDate, "MMMM d, yyyy");
    }
    return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leave Applications</h1>
        <p className="text-muted-foreground mt-1">
          Submit and track your leave applications
        </p>
      </div>
      
      <Tabs defaultValue="apply" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="apply">Apply for Leave</TabsTrigger>
          <TabsTrigger value="history">Application History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apply" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Submit Leave Application</CardTitle>
                  <CardDescription>
                    Fill in the details to request a leave of absence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaveApplicationForm />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Leave Policy</CardTitle>
                  <CardDescription>Important guidelines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Eligibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Students are eligible for up to 10 days of leave per academic year.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Application Process</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Submit applications at least 3 days in advance when possible</li>
                      <li>Medical emergencies should include supporting documents</li>
                      <li>Applications are reviewed by the class teacher</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Important Notes</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Leave during examination periods is generally not approved</li>
                      <li>Excessive absences may affect academic performance</li>
                      <li>Cancellation is only possible for pending applications</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {pendingApplications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Pending Applications</CardTitle>
                <CardDescription>
                  Your leave applications awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApplications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-medium flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                            Leave Application
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDateRange(new Date(application.fromDate), new Date(application.toDate))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(application.status)}
                          <form action={async () => {
                            "use server";
                            await cancelLeaveApplication(application.id);
                          }}>
                            <Button variant="outline" size="sm" type="submit" className="min-h-[40px]">
                              Cancel Application
                            </Button>
                          </form>
                        </div>
                      </div>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        {application.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted on {format(new Date(application.createdAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Application History</CardTitle>
              <CardDescription>
                All your leave applications from the current academic year
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaveApplications.length > 0 ? (
                <div className="space-y-6">
                  {/* Approved Applications */}
                  {approvedApplications.length > 0 && (
                    <div>
                      <h3 className="font-medium text-green-600 flex items-center mb-3">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approved Applications
                      </h3>
                      <div className="space-y-3">
                        {approvedApplications.map((application) => (
                          <div key={application.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                              <div>
                                <p className="font-medium">
                                  {formatDateRange(new Date(application.fromDate), new Date(application.toDate))}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted on {format(new Date(application.createdAt), "MMMM d, yyyy")}
                                </p>
                              </div>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm p-2 bg-white rounded-md border border-green-100">
                              {application.reason}
                            </p>
                            {application.approvedOn && (
                              <p className="text-xs text-green-600 mt-2">
                                Approved on {format(new Date(application.approvedOn), "MMMM d, yyyy")}
                              </p>
                            )}
                            {application.remarks && (
                              <p className="text-xs mt-2">
                                <span className="font-medium">Remarks:</span> {application.remarks}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Rejected Applications */}
                  {rejectedApplications.length > 0 && (
                    <div>
                      <h3 className="font-medium text-red-600 flex items-center mb-3">
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejected Applications
                      </h3>
                      <div className="space-y-3">
                        {rejectedApplications.map((application) => (
                          <div key={application.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                              <div>
                                <p className="font-medium">
                                  {formatDateRange(new Date(application.fromDate), new Date(application.toDate))}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted on {format(new Date(application.createdAt), "MMMM d, yyyy")}
                                </p>
                              </div>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm p-2 bg-white rounded-md border border-red-100">
                              {application.reason}
                            </p>
                            {application.remarks && (
                              <p className="text-xs mt-2">
                                <span className="font-medium">Remarks:</span> {application.remarks}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Cancelled Applications */}
                  {cancelledApplications.length > 0 && (
                    <div>
                      <h3 className="font-medium text-muted-foreground flex items-center mb-3">
                        <Clock className="h-4 w-4 mr-1" />
                        Cancelled Applications
                      </h3>
                      <div className="space-y-3">
                        {cancelledApplications.map((application) => (
                          <div key={application.id} className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                              <div>
                                <p className="font-medium">
                                  {formatDateRange(new Date(application.fromDate), new Date(application.toDate))}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted on {format(new Date(application.createdAt), "MMMM d, yyyy")}
                                </p>
                              </div>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm p-2 bg-white rounded-md border">
                              {application.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No leave applications</h3>
                  <p className="text-muted-foreground">
                    You haven't submitted any leave applications yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
