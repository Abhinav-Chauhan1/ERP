"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, BookOpen, ClipboardList, Clock, Search, Filter, 
  GraduationCap, FileText, Calendar, LayoutGrid, ArrowRight, Edit,
  Users, School, Layers, CheckCircle
} from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const teachingCategories = [
  {
    title: "Subjects",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Manage academic subjects",
    href: "/admin/teaching/subjects",
    count: 48
  },
  {
    title: "Lessons",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "Create and manage lessons",
    href: "/admin/teaching/lessons",
    count: 324
  },
  {
    title: "Timetable",
    icon: <Clock className="h-5 w-5" />,
    description: "Schedule management",
    href: "/admin/teaching/timetable",
    count: 32
  }
];

const teachingQuickActions = [
  {
    title: "Assessment",
    icon: <FileText className="h-5 w-5" />,
    description: "Create exams and assignments",
    href: "/admin/teaching/assessment",
    color: "bg-amber-50 text-amber-600"
  },
  {
    title: "Planning",
    icon: <Calendar className="h-5 w-5" />,
    description: "Academic planning & calendars",
    href: "/admin/teaching/planning",
    color: "bg-purple-50 text-purple-600"
  },
  {
    title: "Resources",
    icon: <LayoutGrid className="h-5 w-5" />,
    description: "Teaching materials & resources",
    href: "/admin/teaching/resources",
    color: "bg-green-50 text-green-600"
  },
];

const subjectsByDepartment = [
  {
    department: "Science",
    subjects: [
      { id: "s1", name: "Physics", teachers: 6, classes: 10 },
      { id: "s2", name: "Chemistry", teachers: 5, classes: 10 },
      { id: "s3", name: "Biology", teachers: 4, classes: 8 },
    ]
  },
  {
    department: "Mathematics",
    subjects: [
      { id: "m1", name: "Algebra", teachers: 8, classes: 15 },
      { id: "m2", name: "Geometry", teachers: 5, classes: 12 },
      { id: "m3", name: "Statistics", teachers: 3, classes: 6 },
    ]
  },
  {
    department: "Languages",
    subjects: [
      { id: "l1", name: "English", teachers: 10, classes: 32 },
      { id: "l2", name: "Spanish", teachers: 4, classes: 16 },
      { id: "l3", name: "French", teachers: 3, classes: 8 },
    ]
  },
  {
    department: "Social Studies",
    subjects: [
      { id: "ss1", name: "History", teachers: 6, classes: 18 },
      { id: "ss2", name: "Geography", teachers: 4, classes: 16 },
      { id: "ss3", name: "Civics", teachers: 3, classes: 10 },
    ]
  },
];

// Recent activities data
const recentActivities = [
  {
    id: '1',
    action: 'New syllabus added',
    subject: 'Physics - Grade 11',
    user: 'John Smith',
    userRole: 'Teacher',
    timestamp: '1 hour ago'
  },
  {
    id: '2',
    action: 'Lesson updated',
    subject: 'Algebra - Quadratic Equations',
    user: 'Emily Johnson',
    userRole: 'Teacher',
    timestamp: '3 hours ago'
  },
  {
    id: '3',
    action: 'Timetable modified',
    subject: 'Grade 10 - Science',
    user: 'Admin',
    userRole: 'Administrator',
    timestamp: '1 day ago'
  },
  {
    id: '4',
    action: 'New lesson resource added',
    subject: 'Biology - Cell Structure',
    user: 'Robert Brown',
    userRole: 'Teacher',
    timestamp: '2 days ago'
  },
];

// Teaching stats data
const teachingStats = [
  {
    title: "Active Teachers",
    value: "85",
    icon: <Users className="h-5 w-5" />,
    trend: "+5%",
    color: "text-green-600"
  },
  {
    title: "Total Classes",
    value: "32",
    icon: <School className="h-5 w-5" />,
    trend: "0%",
    color: "text-gray-600"
  },
  {
    title: "Subjects",
    value: "48",
    icon: <BookOpen className="h-5 w-5" />,
    trend: "+10%",
    color: "text-green-600"
  },
  {
    title: "Lessons",
    value: "324",
    icon: <Layers className="h-5 w-5" />,
    trend: "+15%",
    color: "text-green-600"
  }
];

// Subject form schema
const subjectFormSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters"),
  code: z.string().min(3, "Subject code must be at least 3 characters"),
  department: z.string({
    required_error: "Please select a department",
  }),
  description: z.string().optional(),
});

export default function TeachingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Initialize subject form
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  // Filter subjects based on search and department
  const filteredDepartments = subjectsByDepartment.filter(dept => 
    departmentFilter === "all" || dept.department === departmentFilter
  );

  const filteredSubjects = filteredDepartments.flatMap(dept => 
    dept.subjects.filter(subject => 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).map(subject => ({ ...subject, department: dept.department }))
  );

  function onSubmit(values: z.infer<typeof subjectFormSchema>) {
    console.log("Form submitted:", values);
    // Here you would handle the API call to create the subject
    setDialogOpen(false);
    form.reset();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Teaching Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Create a new subject for your curriculum
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mathematics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MATH101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectsByDepartment.map(dept => (
                            <SelectItem key={dept.department} value={dept.department}>
                              {dept.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the subject" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Subject</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {teachingCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                  {category.icon}
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{category.count}</div>
                <Link href={category.href}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-4">
        {teachingQuickActions.map((action) => (
          <Link href={action.href} key={action.title}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-md ${action.color}`}>
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardFooter className="border-t pt-3">
                <Button variant="ghost" size="sm" className="ml-auto">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Subjects</CardTitle>
                <CardDescription>
                  Browse and manage all subjects
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search subjects..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {subjectsByDepartment.map(dept => (
                      <SelectItem key={dept.department} value={dept.department}>
                        {dept.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Subject</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Department</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Teachers</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Classes</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{subject.name}</td>
                        <td className="py-3 px-4 align-middle">{subject.department}</td>
                        <td className="py-3 px-4 align-middle">{subject.teachers}</td>
                        <td className="py-3 px-4 align-middle">{subject.classes}</td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={`/admin/teaching/subjects/${subject.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        {searchTerm || departmentFilter !== "all" 
                          ? "No subjects match your search criteria"
                          : "No subjects found, add one to get started"
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredSubjects.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing {filteredSubjects.length} out of {
                    subjectsByDepartment.reduce((acc, dept) => acc + dept.subjects.length, 0)
                  } subjects
                </p>
                <Link href="/admin/teaching/subjects">
                  <Button variant="outline" size="sm">
                    View All Subjects
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quick Stats</CardTitle>
            <CardDescription>
              Teaching and academic overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {teachingStats.map((stat) => (
              <div key={stat.title} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-md text-gray-700">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
                <Badge className={`${stat.color} bg-opacity-10`}>
                  {stat.trend}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xl">Recent Activities</CardTitle>
          <CardDescription>
            Latest updates in teaching and curriculum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="p-2 bg-blue-50 rounded-full h-fit text-blue-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{activity.action} <span className="text-blue-600">{activity.subject}</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    By {activity.user} ({activity.userRole}) · {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t">
          <Button variant="outline" size="sm" className="ml-auto">
            View All Activities
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
