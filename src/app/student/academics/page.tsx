export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  BookMarked, 
  Presentation, 
  ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentAcademicDetails } from "@/lib/actions/student-academics-actions";

export const metadata: Metadata = {
  title: "Academics | Student Portal",
  description: "Access all your academic information and resources",
};

export default async function AcademicsPage() {
  const { student, currentEnrollment } = await getStudentAcademicDetails();
  
  const academicFeatures = [
    {
      title: "Class Schedule",
      description: "View your weekly timetable and class schedule",
      icon: Calendar,
      href: "/student/academics/schedule",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Subjects",
      description: "Explore all your enrolled subjects and teachers",
      icon: BookOpen,
      href: "/student/academics/subjects",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Curriculum",
      description: "Access your course curriculum and syllabi",
      icon: BookMarked,
      href: "/student/academics/curriculum",
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Learning Materials",
      description: "Find and download all your learning resources",
      icon: Presentation,
      href: "/student/academics/materials",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Academics</h1>
        <p className="text-gray-500">
          Class: {currentEnrollment.class.name} {currentEnrollment.section.name} • 
          Academic Year: {currentEnrollment.class.academicYear.name}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
          <CardDescription>Your current enrollment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-gray-500">Class</div>
              <div className="mt-1 text-lg font-semibold">{currentEnrollment.class.name}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-gray-500">Section</div>
              <div className="mt-1 text-lg font-semibold">{currentEnrollment.section.name}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-gray-500">Roll Number</div>
              <div className="mt-1 text-lg font-semibold">{currentEnrollment.rollNumber || "N/A"}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-gray-500">Academic Year</div>
              <div className="mt-1 text-lg font-semibold">{currentEnrollment.class.academicYear.name}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {academicFeatures.map((feature) => (
          <Card key={feature.href}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`rounded-lg p-2 mr-3 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href={feature.href}>
                  Access {feature.title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
