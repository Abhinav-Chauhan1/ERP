"use client";

import { useState } from "react";
import { format } from "date-fns";
import { BarChart2, Book, Calendar, CheckCircle2, Clock, DollarSign, FileText, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setPrimaryParent } from "@/lib/actions/parent-children-actions";
import { toast } from "react-hot-toast";

interface ChildDetailTabsProps {
  childDetails: any;
}

export function ChildDetailTabs({ childDetails }: ChildDetailTabsProps) {
  const [isPrimaryLoading, setIsPrimaryLoading] = useState(false);
  
  const handleSetPrimary = async (isPrimary: boolean) => {
    setIsPrimaryLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('childId', childDetails.student.id);
      formData.append('isPrimary', isPrimary.toString());
      
      const result = await setPrimaryParent(formData);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred while updating primary status");
    } finally {
      setIsPrimaryLoading(false);
    }
  };
  
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="academics">Academics</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="fees">Fees</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details and academic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {childDetails.student.user.firstName} {childDetails.student.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Admission ID</p>
                  <p className="font-medium">{childDetails.student.admissionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">
                    {format(new Date(childDetails.student.dateOfBirth), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{childDetails.student.gender.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{childDetails.student.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <p className="font-medium">{childDetails.student.bloodGroup || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Class</p>
                  <p className="font-medium">
                    {childDetails.currentEnrollment ? (
                      `${childDetails.currentEnrollment.class.name} - ${childDetails.currentEnrollment.section.name}`
                    ) : (
                      "Not enrolled in any class"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Roll Number</p>
                  <p className="font-medium">{childDetails.student.rollNumber || "Not assigned"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Address</p>
                <p className="font-medium">
                  {childDetails.student.address || "No address provided"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Parent Relationship</h4>
                <div className="flex items-center gap-2">
                  <Badge variant={childDetails.isPrimary ? "default" : "outline"}>
                    {childDetails.isPrimary ? "Primary Parent" : "Secondary Parent"}
                  </Badge>
                  {childDetails.isPrimary ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSetPrimary(false)} 
                      disabled={isPrimaryLoading}
                    >
                      Set as Secondary
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSetPrimary(true)} 
                      disabled={isPrimaryLoading}
                    >
                      Set as Primary
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Last 30 days attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-2xl font-bold">
                    {childDetails.attendanceStats.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <Progress value={childDetails.attendanceStats.percentage} className="h-2" />
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-green-50 p-2">
                  <p className="text-xs text-gray-500">Present</p>
                  <p className="font-medium">{childDetails.attendanceStats.presentDays}</p>
                </div>
                <div className="rounded-md bg-red-50 p-2">
                  <p className="text-xs text-gray-500">Absent</p>
                  <p className="font-medium">{childDetails.attendanceStats.absentDays}</p>
                </div>
                <div className="rounded-md bg-amber-50 p-2">
                  <p className="text-xs text-gray-500">Late</p>
                  <p className="font-medium">{childDetails.attendanceStats.lateDays}</p>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="#attendance">View Full Attendance</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exam Results</CardTitle>
              <CardDescription>Latest performance in exams</CardDescription>
            </CardHeader>
            <CardContent>
              {childDetails.examResults.length > 0 ? (
                <div className="space-y-3">
                  {childDetails.examResults.slice(0, 3).map((result: any) => (
                    <div key={result.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{result.exam.subject.name}</p>
                        <p className="text-xs text-gray-500">{result.exam.title}</p>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getScoreColor(result.marks / result.exam.totalMarks * 100)}`}>
                          {result.marks}/{result.exam.totalMarks}
                        </div>
                        <p className="text-xs text-gray-500">
                          {(result.marks / result.exam.totalMarks * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No exam results available</p>
              )}
              
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <a href="/parent/performance/results">View All Results</a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Fee Status</CardTitle>
              <CardDescription>Payment status and fee details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Total Fees</p>
                  <p className="font-medium">${childDetails.feeStats.totalFees.toFixed(2)}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="font-medium text-green-600">${childDetails.feeStats.paidAmount.toFixed(2)}</p>
                </div>
              </div>
              
              {childDetails.feeStats.pendingAmount > 0 && (
                <div className="bg-amber-50 p-3 rounded-md">
                  <p className="text-xs text-amber-700">Pending Payment</p>
                  <p className="font-medium text-amber-700">${childDetails.feeStats.pendingAmount.toFixed(2)}</p>
                </div>
              )}
              
              <Button size="sm" className="w-full" asChild>
                <a href="/parent/fees/overview">View Fee Details</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="academics" className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Current subjects and teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {childDetails.subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childDetails.subjects.map((subject: any) => (
                  <div key={subject.id} className="border rounded-md p-3 flex items-center gap-3">
                    <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center text-blue-700">
                      <Book className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-xs text-gray-500">Code: {subject.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No subjects assigned</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
            <CardDescription>Performance in assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {childDetails.examResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childDetails.examResults.map((result: any) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.exam.subject.name}</TableCell>
                      <TableCell>{result.exam.title}</TableCell>
                      <TableCell>{result.exam.examType.name}</TableCell>
                      <TableCell>{format(new Date(result.exam.examDate), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">{result.marks}/{result.exam.totalMarks}</TableCell>
                      <TableCell className={`text-right ${getScoreColor(result.marks / result.exam.totalMarks * 100)}`}>
                        {(result.marks / result.exam.totalMarks * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">No exam results available</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="attendance" id="attendance" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Last 3 months attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-md p-4 text-center">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mb-1" />
                    <p className="text-lg font-bold">{childDetails.attendanceStats.presentDays}</p>
                    <p className="text-sm text-gray-600">Present Days</p>
                  </div>
                </div>
                <div className="bg-red-50 rounded-md p-4 text-center">
                  <div className="flex flex-col items-center">
                    <XCircle className="h-8 w-8 text-red-500 mb-1" />
                    <p className="text-lg font-bold">{childDetails.attendanceStats.absentDays}</p>
                    <p className="text-sm text-gray-600">Absent Days</p>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-md p-4 text-center">
                  <div className="flex flex-col items-center">
                    <Clock className="h-8 w-8 text-amber-500 mb-1" />
                    <p className="text-lg font-bold">{childDetails.attendanceStats.lateDays}</p>
                    <p className="text-sm text-gray-600">Late Days</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Attendance History</h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Section</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {childDetails.attendanceRecords.slice(0, 15).map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getAttendanceBadgeColor(record.status)}
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.section?.name || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="assignments" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Upcoming and recent assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {childDetails.assignments.length > 0 ? (
              <div className="space-y-4">
                {childDetails.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="border rounded-md p-4">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{assignment.title}</h4>
                      <Badge variant={assignment.submissions.length > 0 ? "default" : "secondary"}>
                        {assignment.submissions.length > 0 ? "Submitted" : "Pending"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Book className="h-4 w-4 mr-1.5 text-gray-400" />
                        Subject: {assignment.subject.name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      {assignment.description && <p>{assignment.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No upcoming assignments</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="fees" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Details</CardTitle>
            <CardDescription>Payment history and fee status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-500">Total Fee Amount</p>
                <p className="text-xl font-bold">${childDetails.feeStats.totalFees.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 rounded-md p-4">
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="text-xl font-bold text-green-600">${childDetails.feeStats.paidAmount.toFixed(2)}</p>
              </div>
              <div className={`rounded-md p-4 ${childDetails.feeStats.pendingAmount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <p className="text-sm text-gray-500">Pending Amount</p>
                <p className={`text-xl font-bold ${childDetails.feeStats.pendingAmount > 0 ? 'text-amber-600' : ''}`}>
                  ${childDetails.feeStats.pendingAmount.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Payment History</h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt No.</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childDetails.feeStats.payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.paymentDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{payment.receiptNumber || "-"}</TableCell>
                        <TableCell>${payment.paidAmount.toFixed(2)}</TableCell>
                        <TableCell>{formatPaymentMethod(payment.paymentMethod)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "COMPLETED" ? "default" :
                              payment.status === "PENDING" ? "outline" :
                              payment.status === "PARTIAL" ? "secondary" : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <Button asChild>
              <a href={`/parent/fees/overview?childId=${childDetails.student.id}`}>
                <DollarSign className="h-4 w-4 mr-1.5" />
                Make Payment
              </a>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Helper functions
function getScoreColor(percentage: number): string {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 75) return "text-emerald-600";
  if (percentage >= 60) return "text-amber-600";
  if (percentage >= 40) return "text-orange-600";
  return "text-red-600";
}

function getAttendanceBadgeColor(status: string): string {
  switch (status) {
    case "PRESENT":
      return "bg-green-50 text-green-700 border-green-200";
    case "ABSENT":
      return "bg-red-50 text-red-700 border-red-200";
    case "LATE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "LEAVE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-700";
  }
}

function formatPaymentMethod(method: string): string {
  return method.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}
