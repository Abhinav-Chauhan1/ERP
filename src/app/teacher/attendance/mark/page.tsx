"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Search, CheckCircle, XCircle, AlertCircle, Clock4 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectClass } from "@/components/forms/select-class";

// Define types for attendance
type AttendanceStatus = "present" | "absent" | "late";

type AttendanceRecord = {
  status: AttendanceStatus;
  date: string;
  reason?: string;
  lateMinutes?: number;
};

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  attendance: AttendanceRecord;
};

// Mock data for student attendance with proper typing
const classData = {
  id: "1",
  name: "Grade 10-A",
  subject: "Mathematics",
  students: [
    {
      id: "s1",
      name: "John Smith",
      rollNumber: "101",
      attendance: {
        status: "present" as AttendanceStatus,
        date: "2023-12-01",
      }
    },
    {
      id: "s2",
      name: "Emily Johnson",
      rollNumber: "102",
      attendance: {
        status: "present" as AttendanceStatus,
        date: "2023-12-01",
      }
    },
    {
      id: "s3",
      name: "Michael Brown",
      rollNumber: "103",
      attendance: {
        status: "absent" as AttendanceStatus,
        date: "2023-12-01",
        reason: "Medical leave"
      }
    },
    {
      id: "s4",
      name: "Sarah Williams",
      rollNumber: "104",
      attendance: {
        status: "present" as AttendanceStatus,
        date: "2023-12-01",
      }
    },
    {
      id: "s5",
      name: "James Davis",
      rollNumber: "105",
      attendance: {
        status: "late" as AttendanceStatus,
        date: "2023-12-01",
        lateMinutes: 15
      }
    },
    {
      id: "s6",
      name: "Jennifer Garcia",
      rollNumber: "106",
      attendance: {
        status: "present" as AttendanceStatus,
        date: "2023-12-01",
      }
    },
    {
      id: "s7",
      name: "Robert Martinez",
      rollNumber: "107",
      attendance: {
        status: "present" as AttendanceStatus,
        date: "2023-12-01",
      }
    },
    {
      id: "s8",
      name: "Lisa Robinson",
      rollNumber: "108",
      attendance: {
        status: "absent" as AttendanceStatus,
        date: "2023-12-01",
        reason: "Family emergency"
      }
    }
  ] as Student[],
  previousClasses: [
    { date: "2023-11-30", present: 26, absent: 2, total: 28 },
    { date: "2023-11-28", present: 27, absent: 1, total: 28 },
    { date: "2023-11-26", present: 25, absent: 3, total: 28 },
  ]
};

const teacherClasses = [
  { id: "1", name: "Grade 10-A", subject: "Mathematics" },
  { id: "2", name: "Grade 11-B", subject: "Mathematics" },
  { id: "3", name: "Grade 9-C", subject: "Mathematics" },
  { id: "4", name: "Grade 10-B", subject: "Mathematics" },
];

export default function MarkAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<Student[]>(classData.students);
  const [selectedClass, setSelectedClass] = useState(teacherClasses[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => 
      prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            attendance: {
              ...student.attendance,
              status,
              date: "2023-12-01"
            }
          };
        }
        return student;
      })
    );
  };

  const filteredStudents = attendanceData.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.includes(searchQuery)
  );

  const totalPresent = attendanceData.filter(student => student.attendance?.status === "present").length;
  const totalAbsent = attendanceData.filter(student => student.attendance?.status === "absent").length;
  const totalLate = attendanceData.filter(student => student.attendance?.status === "late").length;
  const totalStudents = attendanceData.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span>December 1, 2023</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <CardTitle>Current Class</CardTitle>
                <CardDescription>Mark student attendance</CardDescription>
              </div>
              <div className="flex gap-2">
                <SelectClass 
                  classes={teacherClasses}
                  selected={selectedClass}
                  onSelect={(cls) => setSelectedClass(cls)}
                />
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    className="pl-9 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                            {student.attendance?.status === "present" && (
                              <Badge variant="success" className="capitalize">Present</Badge>
                            )}
                            {student.attendance?.status === "absent" && (
                              <Badge variant="destructive" className="capitalize">Absent</Badge>
                            )}
                            {student.attendance?.status === "late" && (
                              <Badge variant="warning" className="capitalize">Late</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant={student.attendance?.status === "present" ? "default" : "outline"} 
                              className={student.attendance?.status === "present" ? "bg-green-500 hover:bg-green-600" : ""}
                              onClick={() => handleAttendanceChange(student.id, "present")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Present
                            </Button>
                            <Button
                              size="sm"
                              variant={student.attendance?.status === "absent" ? "destructive" : "outline"}
                              onClick={() => handleAttendanceChange(student.id, "absent")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Absent
                            </Button>
                            <Button
                              size="sm"
                              variant={student.attendance?.status === "late" ? "default" : "outline"}
                              className={student.attendance?.status === "late" ? "bg-amber-500 hover:bg-amber-600" : ""}
                              onClick={() => handleAttendanceChange(student.id, "late")}
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
              <Button variant="outline">Cancel</Button>
              <Button>Save Attendance</Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Recent class attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classData.previousClasses.map((record, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{record.date}</div>
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
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(record.present / record.total) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded p-2 text-center">
                      <div className="text-xs text-gray-500">Absent</div>
                      <div className="font-medium">{record.absent}/{record.total}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(record.absent / record.total) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Full Attendance Records
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
