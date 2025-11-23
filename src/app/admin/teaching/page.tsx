"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, BookOpen, ClipboardList, Clock, Search, Filter, 
  GraduationCap, FileText, Calendar, LayoutGrid, ArrowRight, Edit,
  Users, School, Layers, CheckCircle, Loader2
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
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

// Import schema validation and server actions
import { subjectFormSchema, SubjectFormValues } from "@/lib/schemaValidation/teachingSchemaValidation";
import { 
  getTeachingStats, 
  getAllSubjects, 
  getSubjectsByDepartment, 
  getDepartments, 
  getClasses,
  createSubject,
  getRecentTeachingActivities
} from "@/lib/actions/teachingActions";

const teachingCategories = [
  {
    title: "Subjects",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Manage academic subjects",
    href: "/admin/teaching/subjects",
    countKey: "subjects"
  },
  {
    title: "Lessons",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "Create and manage lessons",
    href: "/admin/teaching/lessons",
    countKey: "lessons"
  },
  {
    title: "Timetable",
    icon: <Clock className="h-5 w-5" />,
    description: "Schedule management",
    href: "/admin/teaching/timetable",
    countKey: "timetableSlots"
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

export default function TeachingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  const [stats, setStats] = useState<any>({});
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departmentsWithSubjects, setDepartmentsWithSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Initialize subject form
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      departmentId: "",
      classIds: [],
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchDepartments();
    fetchClasses();
    fetchData();
    fetchStats();
    fetchActivities();
  }, []);

  // Fetch subjects data
  async function fetchData() {
    setLoading(true);
    try {
      const result = await getSubjectsByDepartment();
      if (result.success && result.data) {
        setDepartmentsWithSubjects(result.data);
      } else {
        toast.error(result.error || "Failed to fetch subjects");
      }
      
      const subjectsResult = await getAllSubjects();
      if (subjectsResult.success && subjectsResult.data) {
        setSubjects(subjectsResult.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }
  
  // Fetch teaching stats
  async function fetchStats() {
    setStatsLoading(true);
    try {
      const result = await getTeachingStats();
      if (result.success) {
        setStats(result.data);
      } else {
        toast.error(result.error || "Failed to fetch teaching stats");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }
  
  // Fetch recent activities
  async function fetchActivities() {
    setActivitiesLoading(true);
    try {
      const result = await getRecentTeachingActivities();
      if (result.success) {
        setActivities(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch recent activities");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  }

  // Fetch departments for dropdown
  async function fetchDepartments() {
    try {
      const result = await getDepartments();
      if (result.success && result.data) {
        setDepartments(result.data);
      } else {
        toast.error(result.error || "Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Fetch classes for multiselect
  async function fetchClasses() {
    try {
      const result = await getClasses();
      if (result.success && result.data) {
        setClasses(result.data);
      } else {
        toast.error(result.error || "Failed to fetch classes");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Handle form submission for new subject
  async function onSubmit(values: SubjectFormValues) {
    try {
      const result = await createSubject(values);
      
      if (result.success) {
        toast.success("Subject created successfully");
        setDialogOpen(false);
        form.reset();
        
        // Refresh data
        fetchData();
        fetchStats();
      } else {
        toast.error(result.error || "Failed to create subject");
      }
    } catch (error) {
      console.error("Error creating subject:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Filter subjects based on search term and department filter
  const filteredDepartments = departmentsWithSubjects.filter(dept => 
    departmentFilter === "all" || dept.name === departmentFilter
  );

  // Get flattened list of subjects for the table
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || 
                             (subject.department && subject.department.name === departmentFilter);
    return matchesSearch && matchesDepartment;
  });

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
          <DialogContent className="max-w-2xl">
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
                  name="departmentId"
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
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
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
                  name="classIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Classes</FormLabel>
                      <div className="grid grid-cols-3 gap-2 border rounded-md p-3 max-h-60 overflow-y-auto">
                        {classes.map((classItem) => (
                          <div key={classItem.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`class-${classItem.id}`}
                              checked={form.watch("classIds").includes(classItem.id)}
                              onChange={(e) => {
                                const currentClasses = form.watch("classIds");
                                if (e.target.checked) {
                                  form.setValue("classIds", [...currentClasses, classItem.id]);
                                } else {
                                  form.setValue(
                                    "classIds",
                                    currentClasses.filter((c) => c !== classItem.id)
                                  );
                                }
                              }}
                              className="rounded text-primary"
                            />
                            <label htmlFor={`class-${classItem.id}`} className="text-sm">
                              {classItem.name}
                              {classItem.academicYear?.isCurrent && 
                                <span className="ml-1 text-xs text-green-600">(Current)</span>
                              }
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage>{form.formState.errors.classIds?.message}</FormMessage>
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
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  {category.icon}
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    stats[category.countKey] || 0
                  )}
                </div>
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
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subject</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Department</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Teachers</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Classes</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map((subject) => (
                        <tr key={subject.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">
                            <div>
                              {subject.name}
                              <div className="text-xs text-muted-foreground">{subject.code}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">{subject.department?.name || "—"}</td>
                          <td className="py-3 px-4 align-middle">{subject._count?.teachers || 0}</td>
                          <td className="py-3 px-4 align-middle">{subject._count?.classes || 0}</td>
                          <td className="py-3 px-4 align-middle text-right">
                            <Link href={`/admin/teaching/subjects/${subject.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Link href={`/admin/teaching/subjects/${subject.id}/edit`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
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
            )}
            {filteredSubjects.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredSubjects.length} out of {subjects.length} subjects
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
            {statsLoading ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-md text-gray-700">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Active Teachers</p>
                      <p className="text-2xl font-bold">{stats.activeTeachers || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-md text-gray-700">
                      <School className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Classes</p>
                      <p className="text-2xl font-bold">{stats.totalClasses || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-md text-gray-700">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Subjects</p>
                      <p className="text-2xl font-bold">{stats.subjects || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-md text-gray-700">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Lessons</p>
                      <p className="text-2xl font-bold">{stats.lessons || 0}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
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
          {activitiesLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No recent activities found
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className="p-2 bg-primary/10 rounded-full h-fit text-primary">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {activity.type === 'lesson' ? 'Lesson' : 'Syllabus'} {activity.action} {' '}
                      <span className="text-primary">{activity.entityName}</span> 
                      {activity.subjectName && <span> for {activity.subjectName}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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

