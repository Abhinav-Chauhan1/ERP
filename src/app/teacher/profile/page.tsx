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
} from "lucide-react";

// Example teacher data
const teacherData = {
  id: "1",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.johnson@school.edu",
  phone: "+1 (555) 123-4567",
  avatar: "/assets/avatars/teacher1.jpg",
  employeeId: "TCH-2023-001",
  qualification: "MSc in Mathematics, PhD in Applied Mathematics",
  joinDate: "August 15, 2020",
  department: "Mathematics",
  subjects: ["Algebra", "Calculus", "Statistics"],
  classes: ["Grade 10-A", "Grade 11-B", "Grade 9-C", "Grade 10-B"],
  address: "123 University Ave, Academic City, AC 12345",
  dateOfBirth: "March 12, 1985",
  experience: "10+ years in teaching mathematics at secondary level",
  expertise: "Advanced Calculus, Mathematical Modeling, Statistical Analysis",
  achievements: [
    "Mathematics Teacher of the Year 2022",
    "Published 3 research papers on mathematics education",
    "Mentored winning team in National Mathematics Olympiad",
  ],
};

export default function TeacherProfilePage() {
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
                <img
                  src={teacherData.avatar || "https://via.placeholder.com/128"}
                  alt={`${teacherData.firstName} ${teacherData.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold">{`${teacherData.firstName} ${teacherData.lastName}`}</h2>
              <p className="text-sm text-gray-500">{teacherData.department} Teacher</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">ID: {teacherData.employeeId}</p>
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{teacherData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{teacherData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Joined: {teacherData.joinDate}</span>
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
                    <p>{`${teacherData.firstName} ${teacherData.lastName}`}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Employee ID</h3>
                    <p>{teacherData.employeeId}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Date of Birth</h3>
                    <p>{teacherData.dateOfBirth}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Department</h3>
                    <p>{teacherData.department}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Email Address</h3>
                    <p>{teacherData.email}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Phone Number</h3>
                    <p>{teacherData.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-sm text-gray-500">Address</h3>
                    <p>{teacherData.address}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="academic">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Qualifications</h3>
                    <p className="mt-1">{teacherData.qualification}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Teaching Experience</h3>
                    <p className="mt-1">{teacherData.experience}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Areas of Expertise</h3>
                    <p className="mt-1">{teacherData.expertise}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Teaching Subjects</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {teacherData.subjects.map((subject, index) => (
                        <span 
                          key={index} 
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Assigned Classes</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {teacherData.classes.map((cls, index) => (
                        <span 
                          key={index} 
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="achievements">
                <div className="space-y-4">
                  <h3 className="font-medium">Achievements & Recognitions</h3>
                  <ul className="space-y-2">
                    {teacherData.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
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
                <p className="text-2xl font-bold">18 hrs</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Today's Classes</p>
                  <p className="text-sm font-medium">4 classes</p>
                </div>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded-md">
                    <div className="flex justify-between">
                      <span className="font-medium">Grade 10-A (Mathematics)</span>
                      <span className="text-sm">09:00 AM - 10:00 AM</span>
                    </div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <div className="flex justify-between">
                      <span className="font-medium">Grade 11-B (Mathematics)</span>
                      <span className="text-sm">10:30 AM - 11:30 AM</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Link href="/teacher/schedule">
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
            <ul className="space-y-3">
              <li className="flex items-start gap-3 p-2 bg-amber-50 border border-amber-100 rounded-md">
                <div className="p-1.5 rounded-full bg-amber-100">
                  <Briefcase className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Grade Mathematics Assignment</p>
                  <p className="text-xs text-gray-500">Grade 10-A • Due Dec 05, 2023</p>
                </div>
                <div className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  High Priority
                </div>
              </li>
              <li className="flex items-start gap-3 p-2 bg-gray-50 border border-gray-100 rounded-md">
                <div className="p-1.5 rounded-full bg-gray-200">
                  <GraduationCap className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Prepare Test Papers</p>
                  <p className="text-xs text-gray-500">Grade 11-B • Due Dec 07, 2023</p>
                </div>
                <div className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                  Medium Priority
                </div>
              </li>
              <li className="flex items-start gap-3 p-2 bg-gray-50 border border-gray-100 rounded-md">
                <div className="p-1.5 rounded-full bg-gray-200">
                  <GraduationCap className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Complete Progress Reports</p>
                  <p className="text-xs text-gray-500">All Classes • Due Dec 10, 2023</p>
                </div>
                <div className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  High Priority
                </div>
              </li>
            </ul>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline">View All Tasks</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
