"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, Edit, Trash2, PlusCircle, 
  Users, BookOpen, Clock, Calendar, 
  GraduationCap, Building, Search, Download,
  UploadCloud, Check, X, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Mock data - replace with actual API calls
const classData = {
  "1": {
    id: "1",
    name: "Grade 10 - Science",
    year: "2023-2024",
    section: "A",
    strength: 35,
    classTeacher: "Emily Johnson",
    classTeacherId: "t1",
    room: "Science Block - 101",
    subjects: [
      { id: "s1", name: "Mathematics", teacher: "John Smith" },
      { id: "s2", name: "Physics", teacher: "Emily Johnson" },
      { id: "s3", name: "Chemistry", teacher: "Robert Brown" },
      { id: "s4", name: "Biology", teacher: "Sarah Thompson" },
      { id: "s5", name: "English", teacher: "Michael Davis" },
    ],
    students: [
      { id: "st1", rollNumber: "1001", name: "Alice Brown", gender: "Female", attendance: "95%", performance: "Excellent" },
      { id: "st2", rollNumber: "1002", name: "Bob Smith", gender: "Male", attendance: "88%", performance: "Good" },
      { id: "st3", rollNumber: "1003", name: "Charlie Davis", gender: "Male", attendance: "92%", performance: "Very Good" },
      { id: "st4", rollNumber: "1004", name: "Diana Wilson", gender: "Female", attendance: "98%", performance: "Excellent" },
      { id: "st5", rollNumber: "1005", name: "Edward Jones", gender: "Male", attendance: "85%", performance: "Good" },
      { id: "st6", rollNumber: "1006", name: "Fiona Miller", gender: "Female", attendance: "90%", performance: "Very Good" },
      { id: "st7", rollNumber: "1007", name: "George Taylor", gender: "Male", attendance: "82%", performance: "Average" },
      { id: "st8", rollNumber: "1008", name: "Hannah White", gender: "Female", attendance: "94%", performance: "Very Good" },
    ],
    timetable: [
      { 
        day: "Monday", 
        periods: [
          { id: "p1", time: "9:00 - 9:45", subject: "Mathematics", teacher: "John Smith", room: "Science Block - 101" },
          { id: "p2", time: "9:50 - 10:35", subject: "Physics", teacher: "Emily Johnson", room: "Science Block - 101" },
          { id: "p3", time: "10:40 - 11:25", subject: "Chemistry", teacher: "Robert Brown", room: "Science Block - Lab" },
          { id: "p4", time: "11:45 - 12:30", subject: "Biology", teacher: "Sarah Thompson", room: "Science Block - Lab" },
          { id: "p5", time: "1:15 - 2:00", subject: "English", teacher: "Michael Davis", room: "Science Block - 101" },
        ] 
      },
      { 
        day: "Tuesday", 
        periods: [
          { id: "p6", time: "9:00 - 9:45", subject: "Physics", teacher: "Emily Johnson", room: "Science Block - 101" },
          { id: "p7", time: "9:50 - 10:35", subject: "Mathematics", teacher: "John Smith", room: "Science Block - 101" },
          { id: "p8", time: "10:40 - 11:25", subject: "English", teacher: "Michael Davis", room: "Science Block - 101" },
          { id: "p9", time: "11:45 - 12:30", subject: "Chemistry", teacher: "Robert Brown", room: "Science Block - Lab" },
          { id: "p10", time: "1:15 - 2:00", subject: "Biology", teacher: "Sarah Thompson", room: "Science Block - Lab" },
        ] 
      }
    ],
    exams: [
      { id: "e1", name: "Mid-term Examination", startDate: "2023-10-15", endDate: "2023-10-25", status: "Completed", results: "Released" },
      { id: "e2", name: "Final Examination", startDate: "2024-03-10", endDate: "2024-03-20", status: "Upcoming", results: "Pending" },
    ]
  },
  "2": {
    id: "2",
    name: "Grade 10 - Science",
    year: "2023-2024",
    section: "B",
    strength: 32,
    classTeacher: "Michael Davis",
    classTeacherId: "t5",
    room: "Science Block - 102",
    subjects: [
      { id: "s1", name: "Mathematics", teacher: "John Smith" },
      { id: "s2", name: "Physics", teacher: "Emily Johnson" },
      { id: "s3", name: "Chemistry", teacher: "Robert Brown" },
      { id: "s4", name: "Biology", teacher: "Sarah Thompson" },
      { id: "s5", name: "English", teacher: "Michael Davis" },
    ],
    students: [
      { id: "st9", rollNumber: "1009", name: "Ian Clark", gender: "Male", attendance: "89%", performance: "Good" },
      { id: "st10", rollNumber: "1010", name: "Julia Roberts", gender: "Female", attendance: "95%", performance: "Excellent" },
    ],
    timetable: [
      { 
        day: "Monday", 
        periods: [
          { id: "p11", time: "9:00 - 9:45", subject: "English", teacher: "Michael Davis", room: "Science Block - 102" },
          { id: "p12", time: "9:50 - 10:35", subject: "Mathematics", teacher: "John Smith", room: "Science Block - 102" },
        ] 
      }
    ],
    exams: [
      { id: "e1", name: "Mid-term Examination", startDate: "2023-10-15", endDate: "2023-10-25", status: "Completed", results: "Released" },
    ]
  }
};

// Student upload format help content
const studentUploadHelp = [
  { header: "Student List Upload Format", content: "The file should be in CSV or Excel format with the following columns:" },
  { header: "Required Fields", content: "Roll Number, First Name, Last Name, Gender, Date of Birth, Contact Email, Parent Contact, Address" },
  { header: "Example", content: "1001, John, Smith, Male, 2006-05-15, john.smith@example.com, +1234567890, 123 Main St" },
];

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [classDetails, setClassDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentUploadDialogOpen, setStudentUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Fetch class details - replace with actual API call
    const id = params.id as string;
    const details = classData[id as keyof typeof classData];
    
    if (details) {
      setClassDetails(details);
    } else {
      // Handle not found case
      router.push('/admin/classes');
    }
    
    setLoading(false);
  }, [params.id, router]);

  const filteredStudents = classDetails?.students.filter((student: any) => 
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.rollNumber.includes(studentSearch)
  );

  function handleDeleteClass() {
    console.log("Deleting class:", classDetails.id);
    setDeleteDialogOpen(false);
    router.push('/admin/classes');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  }

  function handleFileUpload() {
    if (selectedFile) {
      console.log("Uploading file:", selectedFile.name);
      // Here you would process the file and add students to the class
      setStudentUploadDialogOpen(false);
      setSelectedFile(null);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!classDetails) {
    return <div>Class not found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/classes">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Classes
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/classes/${classDetails.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{classDetails.name} <span className="text-gray-400">({classDetails.section})</span></CardTitle>
                <CardDescription>
                  Academic Year: {classDetails.year}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Students</span>
                <span className="text-xl font-bold">{classDetails.strength}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <GraduationCap className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Class Teacher</span>
                <span className="text-xl font-bold">{classDetails.classTeacher}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Subjects</span>
                <span className="text-xl font-bold">{classDetails.subjects.length}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
                <Building className="h-8 w-8 text-yellow-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Room</span>
                <span className="text-xl font-bold">{classDetails.room}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage students enrolled in this class</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={studentUploadDialogOpen} onOpenChange={setStudentUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Upload Students
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Student List</DialogTitle>
                        <DialogDescription>
                          Upload a CSV or Excel file with student details to add multiple students at once.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="border rounded-md p-4">
                          <div className="mb-4">
                            <Input
                              type="file"
                              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                              onChange={handleFileChange}
                            />
                          </div>
                          {selectedFile && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Check className="h-4 w-4" />
                              <span>{selectedFile.name} selected</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="border rounded-md p-4 bg-gray-50">
                          <h4 className="font-medium text-sm mb-2">Format Help</h4>
                          {studentUploadHelp.map((item, index) => (
                            <div key={index} className="mb-2">
                              <p className="text-xs font-medium">{item.header}</p>
                              <p className="text-xs text-gray-500">{item.content}</p>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="mt-2">
                            <Download className="h-3 w-3 mr-1" />
                            Download Template
                          </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setStudentUploadDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleFileUpload} disabled={!selectedFile}>
                          Upload and Process
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Link href={`/admin/students/create?classId=${classDetails.id}`}>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search by name or roll number..."
                      className="pl-9"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-10">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Roll No.</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Gender</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Attendance</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Performance</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student: any) => (
                            <tr key={student.id} className="border-b">
                              <td className="py-3 px-4 align-middle">{student.rollNumber}</td>
                              <td className="py-3 px-4 align-middle font-medium">{student.name}</td>
                              <td className="py-3 px-4 align-middle">{student.gender}</td>
                              <td className="py-3 px-4 align-middle">{student.attendance}</td>
                              <td className="py-3 px-4 align-middle">{student.performance}</td>
                              <td className="py-3 px-4 align-middle text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">Actions</Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Student Actions</DropdownMenuLabel>
                                    <Link href={`/admin/students/${student.id}`}>
                                      <DropdownMenuItem>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Profile
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem>
                                      <Check className="h-4 w-4 mr-2" />
                                      Mark Attendance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <X className="h-4 w-4 mr-2" />
                                      Remove from Class
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-gray-500">
                              {studentSearch ? "No students match your search" : "No students enrolled yet"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Subjects</CardTitle>
                  <CardDescription>Subjects taught in this class</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classDetails.subjects.map((subject: any) => (
                          <tr key={subject.id} className="border-b">
                            <td className="py-3 px-4 align-middle font-medium">{subject.name}</td>
                            <td className="py-3 px-4 align-middle">{subject.teacher}</td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Button variant="ghost" size="sm">Edit</Button>
                              <Button variant="ghost" size="sm" className="text-red-500">Remove</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Class Timetable</CardTitle>
                  <CardDescription>Weekly schedule for this class</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    Change Timing
                  </Button>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Edit Timetable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {classDetails.timetable.map((day: any) => (
                  <div key={day.day} className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{day.day}</h3>
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="py-3 px-4 text-left font-medium text-gray-500">Time</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-500">Teacher</th>
                              <th className="py-3 px-4 text-left font-medium text-gray-500">Room</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.periods.map((period: any) => (
                              <tr key={period.id} className="border-b">
                                <td className="py-3 px-4 align-middle">{period.time}</td>
                                <td className="py-3 px-4 align-middle font-medium">{period.subject}</td>
                                <td className="py-3 px-4 align-middle">{period.teacher}</td>
                                <td className="py-3 px-4 align-middle">{period.room}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Timetable
                </Button>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Day
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="exams">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Examinations</CardTitle>
                  <CardDescription>Exams scheduled for this class</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Schedule Exam
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Exam Name</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Start Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">End Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Results</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classDetails.exams.map((exam: any) => (
                          <tr key={exam.id} className="border-b">
                            <td className="py-3 px-4 align-middle font-medium">{exam.name}</td>
                            <td className="py-3 px-4 align-middle">{exam.startDate}</td>
                            <td className="py-3 px-4 align-middle">{exam.endDate}</td>
                            <td className="py-3 px-4 align-middle">
                              <Badge 
                                className={`${
                                  exam.status === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                  exam.status === 'Upcoming' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                  'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                }`}
                              >
                                {exam.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              {exam.results === 'Released' ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Released
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Button variant="ghost" size="sm">View</Button>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class? This will remove all students, subjects, and timetable entries associated with this class. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
