import { 
  Users, BookOpen, Calendar, CreditCard, 
  GraduationCap, School, PenTool, ClipboardCheck 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Chart } from "@/components/dashboard/chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";

// Define the CalendarEvent type to match the component's expected type
type CalendarEventType = "exam" | "holiday" | "event" | "meeting";
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: CalendarEventType;
}

const studentAttendanceData = [
  { month: 'Jan', present: 92 },
  { month: 'Feb', present: 88 },
  { month: 'Mar', present: 90 },
  { month: 'Apr', present: 93 },
  { month: 'May', present: 89 },
  { month: 'Jun', present: 87 },
  { month: 'Jul', present: 92 },
  { month: 'Aug', present: 94 },
  { month: 'Sep', present: 91 },
  { month: 'Oct', present: 89 },
  { month: 'Nov', present: 93 },
  { month: 'Dec', present: 90 },
];

const examResultsData = [
  { subject: 'Math', average: 76 },
  { subject: 'Science', average: 82 },
  { subject: 'English', average: 78 },
  { subject: 'History', average: 74 },
  { subject: 'Geography', average: 79 },
  { subject: 'Art', average: 88 },
];

const enrollmentDistributionData = [
  { grade: 'Grade 1', students: 120 },
  { grade: 'Grade 2', students: 105 },
  { grade: 'Grade 3', students: 132 },
  { grade: 'Grade 4', students: 115 },
  { grade: 'Grade 5', students: 125 },
  { grade: 'Grade 6', students: 98 },
];

const recentActivities = [
  {
    id: '1',
    user: { name: 'John Smith', role: 'teacher' },
    action: 'created a new assignment in',
    target: 'Mathematics Grade 10',
    date: new Date('2023-11-25T10:30:00'),
  },
  {
    id: '2',
    user: { name: 'Sarah Johnson', role: 'admin' },
    action: 'updated the timetable for',
    target: 'Grade 9 Section A',
    date: new Date('2023-11-25T09:15:00'),
  },
  {
    id: '3',
    user: { name: 'Robert Clark', role: 'teacher' },
    action: 'marked attendance for',
    target: 'Physics Class',
    date: new Date('2023-11-24T16:45:00'),
  },
  {
    id: '4',
    user: { name: 'Amanda Lewis', role: 'admin' },
    action: 'created a new announcement for',
    target: 'All Staff',
    date: new Date('2023-11-24T14:20:00'),
  },
  {
    id: '5',
    user: { name: 'Michael Brown', role: 'teacher' },
    action: 'submitted exam results for',
    target: 'Grade 11 Biology',
    date: new Date('2023-11-23T11:10:00'),
  },
];

const upcomingEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Mid-term Exams',
    date: new Date('2023-12-10T09:00:00'),
    type: 'exam',
  },
  {
    id: '2',
    title: 'School Sports Day',
    date: new Date('2023-12-15T08:30:00'),
    type: 'event',
  },
  {
    id: '3',
    title: 'Staff Meeting',
    date: new Date('2023-12-05T14:00:00'),
    type: 'meeting',
  },
  {
    id: '4',
    title: 'Winter Break',
    date: new Date('2023-12-22'),
    type: 'holiday',
  },
  {
    id: '5',
    title: 'Parent-Teacher Conference',
    date: new Date('2023-12-08T15:30:00'),
    type: 'meeting',
  },
];

export default function AdminDashboard() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        
        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value="1,245"
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
            description="vs. last month"
          />
          <StatsCard
            title="Total Teachers"
            value="85"
            icon={<GraduationCap className="h-5 w-5" />}
            trend={{ value: 4, isPositive: true }}
            description="new this month"
          />
          <StatsCard
            title="Classes"
            value="32"
            icon={<School className="h-5 w-5" />}
            description="across 6 grades"
          />
          <StatsCard
            title="Subjects"
            value="48"
            icon={<BookOpen className="h-5 w-5" />}
            description="in curriculum"
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Chart
            title="Student Attendance Rate"
            description="Monthly attendance percentage"
            data={studentAttendanceData}
            xKey="month"
            yKey="present"
            categories={["present"]}
            colors={["#3b82f6"]}
            type="area"
          />
          <Chart
            title="Average Exam Results"
            description="By subject"
            data={examResultsData}
            xKey="subject"
            yKey="average"
            categories={["average"]}
            colors={["#10b981"]}
            type="bar"
          />
        </div>

        {/* Third row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-medium">Enrollment Distribution</CardTitle>
              <CardDescription>Students per grade</CardDescription>
            </CardHeader>
            <CardContent>
              <Chart
                title=""
                data={enrollmentDistributionData}
                xKey="grade"
                yKey="students"
                type="pie"
                colors={["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"]}
              />
            </CardContent>
          </Card>

          <ActivityFeed activities={recentActivities} className="lg:col-span-1" />

          <CalendarWidget events={upcomingEvents} className="lg:col-span-1" />
        </div>

        {/* Fourth row */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Add Student</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Add Teacher</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Take Attendance</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">Record Payment</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-red-100 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Absence Rate Alert</p>
                  <p className="text-xs text-gray-600">Grade 10B has an absence rate of 15% this week.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-yellow-100 text-yellow-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fee Payment Reminder</p>
                  <p className="text-xs text-gray-600">15 students have pending fee payments due this week.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4l3 3"></path>
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Upcoming Events</p>
                  <p className="text-xs text-gray-600">Parent-Teacher meeting scheduled for Friday.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
