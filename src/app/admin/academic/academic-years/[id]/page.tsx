"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, Edit, Calendar, Users, BookOpen, 
  Clock, FileText, PlusCircle, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

// Mock data - replace with actual API calls
const academicYears = [
  {
    id: "1",
    name: "2023-2024",
    startDate: new Date("2023-08-15"),
    endDate: new Date("2024-05-31"),
    isCurrent: true,
    terms: [
      { id: "t1", name: "Term 1", startDate: new Date("2023-08-15"), endDate: new Date("2023-12-15") },
      { id: "t2", name: "Term 2", startDate: new Date("2023-12-16"), endDate: new Date("2024-03-31") },
      { id: "t3", name: "Term 3", startDate: new Date("2024-04-01"), endDate: new Date("2024-05-31") },
    ],
    classes: [
      { id: "c1", name: "Grade 1", sections: 2, students: 54 },
      { id: "c2", name: "Grade 2", sections: 2, students: 58 },
      { id: "c3", name: "Grade 3", sections: 2, students: 60 },
      { id: "c4", name: "Grade 4", sections: 2, students: 52 },
      { id: "c5", name: "Grade 5", sections: 2, students: 56 },
    ],
    events: [
      { id: "e1", title: "First Day of School", date: new Date("2023-08-15"), type: "academic" },
      { id: "e2", title: "Mid-term Exams", date: new Date("2023-10-15"), type: "exam" },
      { id: "e3", title: "Winter Break", date: new Date("2023-12-20"), type: "holiday" },
      { id: "e4", title: "Sports Day", date: new Date("2024-02-10"), type: "event" },
      { id: "e5", title: "Final Exams", date: new Date("2024-05-10"), type: "exam" },
    ]
  },
  {
    id: "2",
    name: "2022-2023",
    startDate: new Date("2022-08-16"),
    endDate: new Date("2023-06-01"),
    isCurrent: false,
    terms: [
      { id: "t4", name: "Term 1", startDate: new Date("2022-08-16"), endDate: new Date("2022-12-16") },
      { id: "t5", name: "Term 2", startDate: new Date("2022-12-17"), endDate: new Date("2023-03-31") },
      { id: "t6", name: "Term 3", startDate: new Date("2023-04-01"), endDate: new Date("2023-06-01") },
    ],
    classes: [
      { id: "c6", name: "Grade 1", sections: 2, students: 50 },
      { id: "c7", name: "Grade 2", sections: 2, students: 52 },
      { id: "c8", name: "Grade 3", sections: 2, students: 54 },
      { id: "c9", name: "Grade 4", sections: 2, students: 48 },
      { id: "c10", name: "Grade 5", sections: 2, students: 56 },
    ],
    events: [
      { id: "e6", title: "First Day of School", date: new Date("2022-08-16"), type: "academic" },
      { id: "e7", title: "Mid-term Exams", date: new Date("2022-10-16"), type: "exam" },
      { id: "e8", title: "Winter Break", date: new Date("2022-12-21"), type: "holiday" },
      { id: "e9", title: "Sports Day", date: new Date("2023-02-11"), type: "event" },
      { id: "e10", title: "Final Exams", date: new Date("2023-05-11"), type: "exam" },
    ]
  },
  {
    id: "3",
    name: "2024-2025",
    startDate: new Date("2024-08-14"),
    endDate: new Date("2025-05-30"),
    isCurrent: false,
    terms: [],
    classes: [],
    events: [
      { id: "e11", title: "First Day of School", date: new Date("2024-08-14"), type: "academic" },
    ]
  },
];

export default function AcademicYearDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch academic year details - replace with actual API call
    const id = params.id as string;
    const year = academicYears.find(y => y.id === id);
    
    if (year) {
      setAcademicYear(year);
    } else {
      // Handle not found case
      router.push('/admin/academic/academic-years');
    }
    
    setLoading(false);
  }, [params.id, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!academicYear) {
    return <div>Academic year not found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic/academic-years">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Academic Years
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive">
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
                <CardTitle className="text-2xl">{academicYear.name}</CardTitle>
                <CardDescription>
                  {format(academicYear.startDate, 'MMMM d, yyyy')} - {format(academicYear.endDate, 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              <span 
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  academicYear.isCurrent ? 'bg-green-100 text-green-800' : 
                  academicYear.startDate > new Date() ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {academicYear.isCurrent ? 'Current' : 
                 academicYear.startDate > new Date() ? 'Planned' : 'Past'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Duration</span>
                <span className="text-xl font-bold">
                  {Math.round((academicYear.endDate.getTime() - academicYear.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Terms</span>
                <span className="text-xl font-bold">{academicYear.terms.length}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Classes</span>
                <span className="text-xl font-bold">{academicYear.classes.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="terms">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Academic Terms</CardTitle>
                  <CardDescription>Terms and semesters in this academic year</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Term
                </Button>
              </CardHeader>
              <CardContent>
                {academicYear.terms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No terms have been created for this academic year yet.</p>
                    <Button variant="outline" className="mt-4">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create First Term
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Term Name</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Start Date</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">End Date</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Duration</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {academicYear.terms.map((term: any) => (
                            <tr key={term.id} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{term.name}</td>
                              <td className="py-3 px-4 align-middle">{format(term.startDate, 'MMM d, yyyy')}</td>
                              <td className="py-3 px-4 align-middle">{format(term.endDate, 'MMM d, yyyy')}</td>
                              <td className="py-3 px-4 align-middle">
                                {Math.round((term.endDate.getTime() - term.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                              </td>
                              <td className="py-3 px-4 align-middle text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Classes</CardTitle>
                  <CardDescription>Classes for this academic year</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </CardHeader>
              <CardContent>
                {academicYear.classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No classes have been created for this academic year yet.</p>
                    <Button variant="outline" className="mt-4">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create First Class
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Class Name</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Sections</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Students</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {academicYear.classes.map((cls: any) => (
                            <tr key={cls.id} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{cls.name}</td>
                              <td className="py-3 px-4 align-middle">{cls.sections}</td>
                              <td className="py-3 px-4 align-middle">{cls.students}</td>
                              <td className="py-3 px-4 align-middle text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Academic Events</CardTitle>
                  <CardDescription>Important dates and events</CardDescription>
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Event Title</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500">Type</th>
                          <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {academicYear.events.map((event: any) => (
                          <tr key={event.id} className="border-b">
                            <td className="py-3 px-4 align-middle font-medium">{event.title}</td>
                            <td className="py-3 px-4 align-middle">{format(event.date, 'MMM d, yyyy')}</td>
                            <td className="py-3 px-4 align-middle">
                              <span 
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  event.type === 'academic' ? 'bg-blue-100 text-blue-800' : 
                                  event.type === 'exam' ? 'bg-purple-100 text-purple-800' : 
                                  event.type === 'holiday' ? 'bg-red-100 text-red-800' : 
                                  'bg-green-100 text-green-800'
                                }`}
                              >
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4 align-middle text-right">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
    </div>
  );
}
