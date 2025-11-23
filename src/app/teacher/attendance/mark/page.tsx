"use client";


import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock4, 
  ArrowLeft,
  UserX,
  FileText,
  Download,
  Loader2,
  ClipboardCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectClass } from "@/components/forms/select-class";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getClassStudentsForAttendance, 
  getTeacherClassesForAttendance,
  saveAttendanceRecords
} from "@/lib/actions/teacherAttendanceActions";
import { AttendanceStatus } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

function MarkAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const sectionIdParam = searchParams.get('sectionId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [classId, setClassId] = useState<string | null>(classIdParam);
  const [sectionId, setSectionId] = useState<string | null>(sectionIdParam);
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  
  const [classes, setClasses] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  
  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getTeacherClassesForAttendance();
        setClasses(data.classes);
        setTodayClasses(data.todayClasses);
        
        // If classId is provided in URL and exists in the classes, select it
        if (classIdParam) {
          const classInfo = data.classes.find((c: any) => c.id === classIdParam);
          if (classInfo) {
            setSelectedClass(classInfo);
          }
        } else if (data.todayClasses.length > 0) {
          // If no class is specified but there are classes today, select the current or next class
          const currentClass = data.todayClasses.find((c: any) => c.isNow);
          if (currentClass) {
            const classInfo = data.classes.find((c: any) => c.id === currentClass.classId);
            if (classInfo) {
              setSelectedClass(classInfo);
              setClassId(currentClass.classId);
              setSectionId(currentClass.sectionId);
            }
          } else {
            // Select the first class of the day if no current class
            const classInfo = data.classes.find((c: any) => c.id === data.todayClasses[0].classId);
            if (classInfo) {
              setSelectedClass(classInfo);
              setClassId(data.todayClasses[0].classId);
              setSectionId(data.todayClasses[0].sectionId);
            }
          }
        } else if (data.classes.length > 0) {
          // Otherwise select the first class
          setSelectedClass(data.classes[0]);
          setClassId(data.classes[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        toast.error("Failed to load classes");
      }
    };
    
    fetchClasses();
  }, [classIdParam]);
  
  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId) return;
      
      setLoading(true);
      try {
        const data = await getClassStudentsForAttendance(classId, sectionId || undefined);
        setStudents(data.students);
        setRecentAttendance(data.recentAttendance);
        setAlreadyMarked(data.alreadyMarked);
        setSections(data.classInfo.sections);
        
        // If no section is selected, use the default section from the response
        if (!sectionId && data.classInfo.selectedSection) {
          setSectionId(data.classInfo.selectedSection);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [classId, sectionId]);
  
  // Handle class selection
  const handleClassSelect = (cls: any) => {
    setSelectedClass(cls);
    setClassId(cls.id);
    setSectionId(null); // Reset section when class changes
    
    // Update URL
    router.push(`/teacher/attendance/mark?classId=${cls.id}`);
  };
  
  // Handle section selection
  const handleSectionChange = (sectionId: string) => {
    setSectionId(sectionId);
    
    // Update URL
    router.push(`/teacher/attendance/mark?classId=${classId}&sectionId=${sectionId}`);
  };
  
  // Handle attendance status change
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => 
      prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            attendance: {
              ...student.attendance,
              status,
            }
          };
        }
        return student;
      })
    );
  };
  
  // Handle reason change for absence
  const handleReasonChange = (studentId: string, reason: string) => {
    setStudents(prev => 
      prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            attendance: {
              ...student.attendance,
              reason,
            }
          };
        }
        return student;
      })
    );
  };
  
  // Save attendance
  const handleSaveAttendance = async () => {
    if (!classId || !sectionId) {
      toast.error("Please select a class and section");
      return;
    }
    
    setSaving(true);
    
    try {
      // Format attendance records
      const records = students.map(student => ({
        studentId: student.id,
        status: student.attendance.status,
        reason: student.attendance.status === "ABSENT" || student.attendance.status === "LEAVE" 
          ? student.attendance.reason 
          : undefined,
        date: new Date(attendanceDate),
      }));
      
      const result = await saveAttendanceRecords(classId, sectionId, records);
      
      if (result.success) {
        toast.success("Attendance saved successfully");
        setAlreadyMarked(true);
      } else {
        toast.error(result.error || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("An error occurred while saving attendance");
    } finally {
      setSaving(false);
    }
  };
  
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalStudents = students.length;
  const totalPresent = students.filter(student => student.attendance?.status === "PRESENT").length;
  const totalAbsent = students.filter(student => student.attendance?.status === "ABSENT").length;
  const totalLate = students.filter(student => student.attendance?.status === "LATE").length;
  const totalLeave = students.filter(student => student.attendance?.status === "LEAVE").length;
  const totalHalfDay = students.filter(student => student.attendance?.status === "HALF_DAY").length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher/attendance')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{format(attendanceDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle>Attendance Sheet</CardTitle>
              <CardDescription>Mark student attendance for today</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <SelectClass 
                classes={classes}
                selected={selectedClass}
                onSelect={handleClassSelect}
              />
              
              {sections.length > 0 && (
                <Select value={sectionId || ""} onValueChange={handleSectionChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {alreadyMarked && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-800">Attendance already marked</p>
                  <p className="text-sm text-amber-700">
                    You've already marked attendance for this class today. Any changes will update the existing records.
                  </p>
                </div>
              </div>
            )}
            
            {classId && sectionId ? (
              <>
                {filteredStudents.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Roll #</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                            <th className="py-3 px-4 text-center font-medium text-gray-500">Status</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr key={student.id} className="border-b">
                              <td className="py-3 px-4 align-middle">{student.rollNumber}</td>
                              <td className="py-3 px-4 align-middle font-medium">{student.name}</td>
                              <td className="py-3 px-4 align-middle text-center">
                                <div className="flex justify-center">
                                  {student.attendance?.status === "PRESENT" && (
                                    <Badge variant="default" className="capitalize bg-green-500 hover:bg-green-600">Present</Badge>
                                  )}
                                  {student.attendance?.status === "ABSENT" && (
                                    <Badge variant="destructive" className="capitalize">Absent</Badge>
                                  )}
                                  {student.attendance?.status === "LATE" && (
                                    <Badge variant="default" className="capitalize bg-amber-500 hover:bg-amber-600">Late</Badge>
                                  )}
                                  {student.attendance?.status === "LEAVE" && (
                                    <Badge variant="outline" className="capitalize">On Leave</Badge>
                                  )}
                                  {student.attendance?.status === "HALF_DAY" && (
                                    <Badge variant="default" className="capitalize bg-blue-500 hover:bg-blue-600">Half Day</Badge>
                                  )}
                                </div>
                                
                                {/* Show reason field for absent or leave students */}
                                {(student.attendance?.status === "ABSENT" || student.attendance?.status === "LEAVE") && (
                                  <div className="mt-2">
                                    <Textarea
                                      placeholder="Reason for absence..."
                                      className="min-h-0 h-16 text-xs"
                                      value={student.attendance?.reason || ""}
                                      onChange={(e) => handleReasonChange(student.id, e.target.value)}
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 align-middle text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant={student.attendance?.status === "PRESENT" ? "default" : "outline"} 
                                    className={student.attendance?.status === "PRESENT" ? "bg-green-500 hover:bg-green-600" : ""}
                                    onClick={() => handleAttendanceChange(student.id, "PRESENT")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" /> Present
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={student.attendance?.status === "ABSENT" ? "destructive" : "outline"}
                                    onClick={() => handleAttendanceChange(student.id, "ABSENT")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Absent
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={student.attendance?.status === "LATE" ? "default" : "outline"}
                                    className={student.attendance?.status === "LATE" ? "bg-amber-500 hover:bg-amber-600" : ""}
                                    onClick={() => handleAttendanceChange(student.id, "LATE")}
                                  >
                                    <Clock4 className="h-4 w-4 mr-1" /> Late
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <UserX className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No Students Found</h3>
                    {searchQuery ? (
                      <p className="text-gray-500">No students match your search criteria.</p>
                    ) : (
                      <p className="text-gray-500">There are no students enrolled in this class section.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No Class Selected</h3>
                <p className="text-gray-500">Please select a class and section to mark attendance.</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-bold text-lg">{totalStudents}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-green-500">Present</div>
                <div className="font-bold text-lg">{totalPresent}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-red-500">Absent</div>
                <div className="font-bold text-lg">{totalAbsent}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-amber-500">Late</div>
                <div className="font-bold text-lg">{totalLate}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/teacher/attendance')}>Cancel</Button>
              <Button
                onClick={handleSaveAttendance}
                disabled={saving || !classId || !sectionId || students.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Attendance"
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Schedule for {format(new Date(), "EEEE, MMMM d")}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((classItem, index) => (
                  <div 
                    key={classItem.id} 
                    className={`p-3 border rounded-lg ${classItem.isNow ? 'bg-green-50 border-green-200' : ''} ${
                      classItem.classId === classId && classItem.sectionId === sectionId ? 
                        'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{classItem.className}</div>
                      <Badge variant={classItem.isNow ? "default" : "outline"}>
                        {classItem.isNow ? "Now" : "Upcoming"}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                      <div className="flex gap-1 items-center">
                        <span>Section: {classItem.sectionName || "All"}</span>
                        <span>•</span>
                        <span>{classItem.subject}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{classItem.time}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setClassId(classItem.classId);
                          setSectionId(classItem.sectionId);
                          setSelectedClass(classes.find(c => c.id === classItem.classId));
                          
                          // Update URL
                          router.push(`/teacher/attendance/mark?classId=${classItem.classId}&sectionId=${classItem.sectionId}`);
                        }}
                      >
                        <ClipboardCheck className="mr-1 h-4 w-4" /> Mark Attendance
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No classes scheduled for today.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {recentAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Class attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAttendance.map((record, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{format(new Date(record.date), "EEEE, MMMM d")}</div>
                    <div className="flex gap-2 items-center">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs text-gray-500">Recorded</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-100 rounded p-2 text-center">
                      <div className="text-xs text-gray-500">Present</div>
                      <div className="font-medium">{record.present}/{record.total}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full" 
                          style={{ width: `${(record.present / record.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded p-2 text-center">
                      <div className="text-xs text-gray-500">Absent</div>
                      <div className="font-medium">{record.absent}/{record.total}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full" 
                          style={{ width: `${(record.absent / record.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Link href="/teacher/attendance/reports" className="w-full">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" /> View Full Attendance Reports
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}


export default function MarkAttendancePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <MarkAttendanceContent />
    </Suspense>
  );
}

