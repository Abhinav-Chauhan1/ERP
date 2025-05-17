"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  FileText, 
  BarChart2, 
  Calendar, 
  UserX, 
  Users, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  FileBarChart,
  Download,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chart } from "@/components/dashboard/chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { getTeacherClassesForAttendance } from "@/lib/actions/teacherAttendanceActions";
import { toast } from "react-hot-toast";
import { format, addDays, isSameDay } from "date-fns";

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Sample attendance data for charts and overview
  const attendanceData = [
    { date: 'Mon', present: 92, absent: 8 },
    { date: 'Tue', present: 88, absent: 12 },
    { date: 'Wed', present: 95, absent: 5 },
    { date: 'Thu', present: 90, absent: 10 },
    { date: 'Fri', present: 94, absent: 6 },
  ];
  
  // Mock attendance events for calendar
  const attendanceEvents = [
    {
      id: '1',
      title: 'Low Attendance - Grade 10-A',
      date: new Date(new Date().setDate(new Date().getDate() - 5)),
      type: 'warning'
    },
    {
      id: '2',
      title: 'Perfect Attendance - Grade 11-B',
      date: new Date(new Date().setDate(new Date().getDate() - 2)),
      type: 'success'
    },
    {
      id: '3',
      title: 'Attendance Due - Grade 9-C',
      date: new Date(),
      type: 'alert'
    }
  ];
  
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const data = await getTeacherClassesForAttendance();
        setClasses(data.classes);
        setTodayClasses(data.todayClasses);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
        toast.error("Failed to load classes");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
        <Link href="/teacher/attendance/mark">
          <Button>
            <ClipboardCheck className="mr-2 h-4 w-4" /> Mark Attendance
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today's Classes</CardTitle>
            <CardDescription>Classes requiring attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayClasses.length}</div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>Next: {todayClasses.length > 0 ? todayClasses[0].time : "No classes today"}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Average</CardTitle>
            <CardDescription>Overall attendance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">92%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Absent Students</CardTitle>
            <CardDescription>This week's absences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14</div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <span>12 with valid reasons</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending</CardTitle>
            <CardDescription>Attendance records to mark</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{
              todayClasses.filter(c => c.isNow || new Date(c.startTime) > new Date()).length
            }</div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{format(new Date(), "MMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-8">
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Weekly attendance statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart 
              title="Weekly Attendance"
              data={attendanceData}
              type="bar"
              xKey="date"
              yKey="present"
              categories={["present", "absent"]}
              colors={["#10b981", "#ef4444"]}
            />
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline">
              <FileBarChart className="mr-2 h-4 w-4" /> View Detailed Stats
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>Important dates and events</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarWidget events={attendanceEvents} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Classes</CardTitle>
          <CardDescription>Mark attendance for your scheduled classes</CardDescription>
        </CardHeader>
        <CardContent>
          {todayClasses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayClasses.map((classInfo) => (
                <Card key={classInfo.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-base">{classInfo.className}</CardTitle>
                        <CardDescription>{classInfo.subject}</CardDescription>
                      </div>
                      {classInfo.isNow && (
                        <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                          Now
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Section:</span>
                        <span className="font-medium">{classInfo.sectionName || "All"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium">{classInfo.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Room:</span>
                        <span className="font-medium">{classInfo.room}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link href={`/teacher/attendance/mark?classId=${classInfo.classId}&sectionId=${classInfo.sectionId}`} className="w-full">
                      <Button className="w-full">
                        <ClipboardCheck className="mr-2 h-4 w-4" /> Mark Attendance
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Classes Today</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any classes scheduled for today. Check back later or view previous attendance records.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <Tabs defaultValue="classes">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Attendance Summary</CardTitle>
              <TabsList>
                <TabsTrigger value="classes">By Class</TabsTrigger>
                <TabsTrigger value="students">By Student</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="classes" className="mt-0 space-y-6">
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Attendance</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">This Week</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map(classInfo => (
                      <tr key={classInfo.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{classInfo.name}</div>
                          <div className="text-sm text-gray-500">{classInfo.subject}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <span>{classInfo.studentCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                              ></div>
                            </div>
                            <span>{Math.floor(Math.random() * 40) + 60}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{Math.floor(Math.random() * 20) + 20}</span>
                            <XCircle className="h-4 w-4 text-red-500 ml-2" />
                            <span>{Math.floor(Math.random() * 5) + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Good
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/teacher/attendance/reports?classId=${classInfo.id}`}>
                            <Button variant="link" className="h-auto p-0">View Report</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center">
                <Link href="/teacher/attendance/reports">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" /> View All Reports <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="students" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absences</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Sample student data */}
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                              S
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">Student {i}</div>
                              <div className="text-sm text-gray-500">ID: S100{i}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">Grade 10-A</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${Math.floor(Math.random() * 30) + 70}%` }}
                              ></div>
                            </div>
                            <span>{Math.floor(Math.random() * 30) + 70}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {Math.floor(Math.random() * 5)} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            i % 3 === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {i % 3 === 0 ? 'Needs attention' : 'Good'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/teacher/students/${i}/attendance`}>
                            <Button variant="link" className="h-auto p-0">View Details</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center mt-6">
                <Link href="/teacher/students/attendance-report">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" /> Detailed Student Reports
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/teacher/attendance/mark">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Mark Attendance</span>
            </div>
          </Link>
          <Link href="/teacher/attendance/reports">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Attendance Reports</span>
            </div>
          </Link>
          <Link href="/teacher/students/attendance-analysis">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <BarChart2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Attendance Analysis</span>
            </div>
          </Link>
          <Link href="/teacher/communication/messages/compose?template=attendance">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-white hover:border-primary/20 hover:bg-primary/5 transition-colors text-center">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <UserX className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Contact Absent Students</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
