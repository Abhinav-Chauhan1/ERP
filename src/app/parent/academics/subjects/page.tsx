import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { getMyChildren } from "@/lib/actions/parent-children-actions";
import { getChildAcademicProcess } from "@/lib/actions/parent-academic-actions";

export const metadata: Metadata = {
  title: "Subjects | Parent Portal",
  description: "View your children's subjects and academic progress",
};

export default async function ParentSubjectsPage({
  searchParams
}: {
  searchParams: { childId?: string }
}) {
  // Await searchParams before using
  const params = await searchParams;
  
  const { children } = await getMyChildren();
  
  if (!children || children.length === 0) {
    return (
      <div className="container p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">No children found in your account. Please contact the school administration.</p>
              <Button className="mt-4" asChild>
                <Link href="/parent">Return to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Use selected child from query params or default to first child
  const selectedChildId = params.childId || children[0].id;
  const academicData = await getChildAcademicProcess(selectedChildId);
  
  return (
    <div className="container p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-gray-500">View your children's subjects and academic details</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/parent/academics">
            Back to Academics
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue={selectedChildId} className="space-y-6">
        <TabsList className="mb-4">
          {children.map(child => (
            <TabsTrigger key={child.id} value={child.id}>
              {child.user.firstName} {child.user.lastName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {children.map(child => (
          <TabsContent key={child.id} value={child.id} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    {child.user.firstName}'s Subjects
                  </CardTitle>
                  
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search subjects..." 
                      className="pl-8"
                      type="search"
                    />
                  </div>
                </div>
                <CardDescription>
                  {child.enrollments[0] 
                    ? `Class: ${child.enrollments[0].class.name} - ${child.enrollments[0].section.name}`
                    : "Not enrolled in any class"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {academicData.subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {academicData.subjects.map((subject: any) => (
                      <div key={subject.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{subject.name}</h3>
                            <p className="text-sm text-gray-500">Code: {subject.code}</p>
                          </div>
                          <Link 
                            href={`/parent/academics/subjects/${subject.id}?childId=${child.id}`} 
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Teacher(s):</p>
                          <ul className="text-sm">
                            {subject.teachers.map((teacher: { id: string; name: string }) => (
                              <li key={teacher.id}>{teacher.name}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No subjects assigned yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
