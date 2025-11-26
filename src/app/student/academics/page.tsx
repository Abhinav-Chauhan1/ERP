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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col gap-4 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academics</h1>
        <p className="text-muted-foreground mt-1">
          Your academic information and resources
        </p>
      </div>

      {/* Academic Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="text-lg font-semibold">{currentEnrollment.class.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Section</p>
              <p className="text-lg font-semibold">{currentEnrollment.section.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="text-lg font-semibold">{currentEnrollment.rollNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academic Year</p>
              <p className="text-lg font-semibold">{currentEnrollment.class.academicYear.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {academicFeatures.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-md ${feature.color}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
