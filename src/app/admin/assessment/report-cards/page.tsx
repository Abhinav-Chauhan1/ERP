"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Mail, FileText, Printer } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface SubjectResult {
  subject: string;
  marks: number;
  totalMarks: number;
  grade: string;
}

const reportCardsData = [
  {
    id: "1",
    studentName: "John Doe",
    studentId: "S12345",
    grade: "Grade 10",
    section: "A",
    term: "Term 1",
    overallGrade: "A",
    overallPercentage: 92.5,
    rank: 1,
    attendance: 95,
    issueDate: "2023-12-01",
    status: "Published",
    teacherRemarks: "Excellent performance throughout the term.",
    principalRemarks: "Keep up the great work!",
    subjectResults: [
      { subject: "Mathematics", marks: 95, totalMarks: 100, grade: "A+" },
      { subject: "Science", marks: 90, totalMarks: 100, grade: "A" },
      { subject: "English", marks: 88, totalMarks: 100, grade: "A" },
    ],
  },
  {
    id: "2",
    studentName: "Jane Smith",
    studentId: "S12346",
    grade: "Grade 10",
    section: "B",
    term: "Term 1",
    overallGrade: "B",
    overallPercentage: 85.0,
    rank: 5,
    attendance: 90,
    issueDate: null,
    status: "Draft",
    teacherRemarks: "",
    principalRemarks: "",
    subjectResults: [
      { subject: "Mathematics", marks: 80, totalMarks: 100, grade: "B+" },
      { subject: "Science", marks: 85, totalMarks: 100, grade: "B" },
      { subject: "English", marks: 90, totalMarks: 100, grade: "A" },
    ],
  },
];

const remarksSchema = z.object({
  teacherRemarks: z.string().min(5, "Remarks must be at least 5 characters"),
  principalRemarks: z.string().min(5, "Remarks must be at least 5 characters"),
});

export default function ReportCardsPage() {
  const [viewReportCardDialogOpen, setViewReportCardDialogOpen] = useState(false);
  const [addRemarksDialogOpen, setAddRemarksDialogOpen] = useState(false);
  const [selectedReportCard, setSelectedReportCard] = useState<any>(null);

  const remarksForm = useForm<z.infer<typeof remarksSchema>>({
    resolver: zodResolver(remarksSchema),
    defaultValues: {
      teacherRemarks: "",
      principalRemarks: "",
    },
  });

  const publishedReportCards = reportCardsData.filter((rc) => rc.status === "Published");
  const draftReportCards = reportCardsData.filter((rc) => rc.status === "Draft");

  const handleViewReportCard = (id: string) => {
    const reportCard = reportCardsData.find((rc) => rc.id === id);
    setSelectedReportCard(reportCard);
    setViewReportCardDialogOpen(true);
  };

  const handleAddRemarks = (id: string) => {
    const reportCard = reportCardsData.find((rc) => rc.id === id);
    setSelectedReportCard(reportCard);
    remarksForm.reset({
      teacherRemarks: reportCard?.teacherRemarks || "",
      principalRemarks: reportCard?.principalRemarks || "",
    });
    setAddRemarksDialogOpen(true);
  };

  const handlePublishReportCard = (id: string) => {
    console.log("Publishing report card:", id);
  };

  const onRemarksSubmit = (values: z.infer<typeof remarksSchema>) => {
    console.log("Remarks submitted:", values);
    setAddRemarksDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        <Button>
          <FileText className="mr-2 h-4 w-4" /> Generate Report Card
        </Button>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Published Report Cards</CardTitle>
              <CardDescription>
                Report cards that have been finalized and issued
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publishedReportCards.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Term</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Result</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Issue Date</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishedReportCards.map((reportCard) => (
                        <tr key={reportCard.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="font-medium">{reportCard.studentName}</div>
                            <div className="text-xs text-gray-500">{reportCard.studentId}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{reportCard.grade} {reportCard.section}</td>
                          <td className="py-3 px-4 align-middle">{reportCard.term}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Badge className={
                                reportCard.overallGrade.startsWith('A') ? "bg-green-100 text-green-800" :
                                reportCard.overallGrade.startsWith('B') ? "bg-blue-100 text-blue-800" :
                                reportCard.overallGrade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {reportCard.overallGrade}
                              </Badge>
                              <span className="text-sm">({reportCard.overallPercentage.toFixed(1)}%)</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {reportCard.issueDate && new Date(reportCard.issueDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewReportCard(reportCard.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No published report cards</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    No report cards have been published yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Draft Report Cards</CardTitle>
              <CardDescription>
                Report cards that are in preparation and not yet published
              </CardDescription>
            </CardHeader>
            <CardContent>
              {draftReportCards.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Term</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Result</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftReportCards.map((reportCard) => (
                        <tr key={reportCard.id} className="border-b">
                          <td className="py-3 px-4 align-middle">
                            <div className="font-medium">{reportCard.studentName}</div>
                            <div className="text-xs text-gray-500">{reportCard.studentId}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">{reportCard.grade} {reportCard.section}</td>
                          <td className="py-3 px-4 align-middle">{reportCard.term}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Badge className={
                                reportCard.overallGrade.startsWith('A') ? "bg-green-100 text-green-800" :
                                reportCard.overallGrade.startsWith('B') ? "bg-blue-100 text-blue-800" :
                                reportCard.overallGrade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {reportCard.overallGrade}
                              </Badge>
                              <span className="text-sm">({reportCard.overallPercentage.toFixed(1)}%)</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <Badge className="bg-amber-100 text-amber-800">
                              {reportCard.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewReportCard(reportCard.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAddRemarks(reportCard.id)}
                            >
                              Add Remarks
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePublishReportCard(reportCard.id)}
                            >
                              Publish
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No draft report cards</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    All report cards have been published
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Report Card Dialog */}
      <Dialog open={viewReportCardDialogOpen} onOpenChange={setViewReportCardDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Card: {selectedReportCard?.studentName}</DialogTitle>
            <DialogDescription>
              {selectedReportCard?.grade} | {selectedReportCard?.section} | {selectedReportCard?.term}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReportCard && (
            <div className="max-h-[70vh] overflow-auto pr-2">
              <div className="border-b pb-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Student Information</h3>
                    <p className="font-medium text-lg">{selectedReportCard.studentName}</p>
                    <p className="text-sm">ID: {selectedReportCard.studentId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Report Details</h3>
                    <p className="text-sm">Term: {selectedReportCard.term}</p>
                    <p className="text-sm">Generated on: {
                      selectedReportCard.issueDate 
                      ? new Date(selectedReportCard.issueDate).toLocaleDateString() 
                      : "Not issued yet"
                    }</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Performance Summary</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Overall Grade:</span>
                      <Badge className={
                        selectedReportCard.overallGrade.startsWith('A') ? "bg-green-100 text-green-800" :
                        selectedReportCard.overallGrade.startsWith('B') ? "bg-blue-100 text-blue-800" :
                        selectedReportCard.overallGrade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {selectedReportCard.overallGrade}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Overall Percentage</p>
                      <p className="text-2xl font-bold">{selectedReportCard.overallPercentage.toFixed(1)}%</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Class Rank</p>
                      <p className="text-2xl font-bold">{selectedReportCard.rank}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Attendance</p>
                      <p className="text-2xl font-bold">{selectedReportCard.attendance}%</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Subject Grades</h3>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Marks Obtained</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Maximum Marks</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Percentage</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReportCard.subjectResults.map((result: SubjectResult) => (
                          <tr key={result.subject} className="border-b">
                            <td className="py-3 px-4 font-medium">{result.subject}</td>
                            <td className="py-3 px-4">{result.marks}</td>
                            <td className="py-3 px-4">{result.totalMarks}</td>
                            <td className="py-3 px-4">{((result.marks / result.totalMarks) * 100).toFixed(1)}%</td>
                            <td className="py-3 px-4">
                              <Badge className={
                                result.grade.startsWith('A') ? "bg-green-100 text-green-800" :
                                result.grade.startsWith('B') ? "bg-blue-100 text-blue-800" :
                                result.grade.startsWith('C') ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {result.grade}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Teacher's Remarks</h3>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm">
                        {selectedReportCard.teacherRemarks || "No remarks provided."}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Principal's Remarks</h3>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm">
                        {selectedReportCard.principalRemarks || "No remarks provided."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReportCardDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Report Card
            </Button>
            {selectedReportCard?.status === "Draft" && (
              <Button onClick={() => handlePublishReportCard(selectedReportCard.id)}>
                Publish
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Remarks Dialog */}
      <Dialog open={addRemarksDialogOpen} onOpenChange={setAddRemarksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remarks</DialogTitle>
            <DialogDescription>
              Add teacher and principal remarks for {selectedReportCard?.studentName}
            </DialogDescription>
          </DialogHeader>
          <Form {...remarksForm}>
            <form onSubmit={remarksForm.handleSubmit(onRemarksSubmit)} className="space-y-4">
              <FormField
                control={remarksForm.control}
                name="teacherRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher's Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Comments on student's performance, areas of improvement, etc."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={remarksForm.control}
                name="principalRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal's Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Principal's comments and recommendations"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddRemarksDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Remarks
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}