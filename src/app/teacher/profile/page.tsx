import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Award,
  Calendar,
  GraduationCap,
  Briefcase,
  Clock,
  Edit,
  AlertCircle,
  UserCircle,
} from "lucide-react";
import { getTeacherProfile } from "@/lib/actions/teacherProfileActions";

export const dynamic = 'force-dynamic';

export default async function TeacherProfilePage() {
  const result = await getTeacherProfile();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load profile</h2>
        <p className="text-muted-foreground">{result.error || "An error occurred"}</p>
      </div>
    );
  }

  const { profile, schedule, tasks } = result.data;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <div className="flex gap-2">
          <Link href="/teacher/profile/edit">
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <UserCircle className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold">{`${profile.firstName} ${profile.lastName}`}</h2>
              <p className="text-sm text-gray-500">{profile.department} Teacher</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">ID: {profile.employeeId}</p>
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Joined: {profile.joinDate}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Link href="/teacher/profile/change-password">
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  Download ID Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="info">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Teacher Information</CardTitle>
                <TabsList>
                  <TabsTrigger value="info">General Info</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>Personal and professional details</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="info" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Full Name</h3>
                    <p>{`${profile.firstName} ${profile.lastName}`}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Employee ID</h3>
                    <p>{profile.employeeId}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Join Date</h3>
                    <p>{profile.joinDate}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Department</h3>
                    <p>{profile.department}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Email Address</h3>
                    <p>{profile.email}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Phone Number</h3>
                    <p>{profile.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-sm text-gray-500">Qualification</h3>
                    <p>{profile.qualification}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="academic">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Qualifications</h3>
                    <p className="mt-1">{profile.qualification}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Teaching Subjects</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.subjects.length > 0 ? (
                        profile.subjects.map((subject, index) => (
                          <span 
                            key={index} 
                            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {subject}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No subjects assigned yet</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Assigned Classes</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.classes.length > 0 ? (
                        profile.classes.map((cls, index) => (
                          <span 
                            key={index} 
                            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                          >
                            {cls}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No classes assigned yet</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Department</h3>
                    <p className="mt-1">{profile.department}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="achievements">
                <div className="space-y-4">
                  <h3 className="font-medium">Achievements & Recognitions</h3>
                  <div className="p-6 text-center text-gray-500">
                    <Award className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p>Achievements and recognitions will be displayed here.</p>
                    <p className="text-sm mt-1">Contact administration to add your achievements.</p>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teaching Schedule Overview</CardTitle>
            <CardDescription>Current week's timetable summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-medium">Total Teaching Hours</p>
                    <p className="text-sm text-gray-500">This week</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{schedule.totalWeeklyHours} hrs</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Today's Classes</p>
                  <p className="text-sm font-medium">{schedule.todayClassesCount} classes</p>
                </div>
                {schedule.todayClasses.length > 0 ? (
                  <div className="space-y-2">
                    {schedule.todayClasses.slice(0, 2).map((cls) => (
                      <div key={cls.id} className="p-2 bg-gray-50 rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {cls.className} {cls.section && `- ${cls.section}`} ({cls.subject})
                          </span>
                          <span className="text-sm">{cls.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No classes today</p>
                )}
              </div>
              
              <div className="flex justify-center">
                <Link href="/teacher/teaching/timetable">
                  <Button variant="outline">View Full Schedule</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Tasks</CardTitle>
            <CardDescription>Pending work and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {tasks.map((task) => (
                    <li key={task.id} className={`flex items-start gap-3 p-2 border rounded-md ${
                      task.priority === "High Priority" ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"
                    }`}>
                      <div className={`p-1.5 rounded-full ${
                        task.priority === "High Priority" ? "bg-amber-100" : "bg-gray-200"
                      }`}>
                        <Briefcase className={`h-4 w-4 ${
                          task.priority === "High Priority" ? "text-amber-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.description} • Due {task.dueDate}</p>
                        <p className="text-xs text-gray-600 mt-1">{task.count} submissions to grade</p>
                      </div>
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.priority === "High Priority" ? "bg-amber-100 text-amber-700" :
                        task.priority === "Medium Priority" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-200 text-gray-700"
                      }`}>
                        {task.priority}
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-center mt-4">
                  <Link href="/teacher/assessments/assignments">
                    <Button variant="outline">View All Tasks</Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>No pending tasks</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
