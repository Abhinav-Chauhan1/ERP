"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  FileText, 
  Search, 
  User, 
  BookMarked,
  GraduationCap,
  ChevronRight
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  hasSyllabus: boolean;
  teachers: {
    id: string;
    name: string;
  }[];
}

interface StudentSubjectListProps {
  subjects: Subject[];
}

export function StudentSubjectList({ subjects }: StudentSubjectListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  
  // Get unique departments for filtering
  const departments = ["all", ...Array.from(new Set(subjects.map(subject => subject.department)))];
  
  // Filter subjects based on search term and department
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.teachers.some(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
    const matchesDepartment = 
      filterDepartment === "all" || subject.department === filterDepartment;
      
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex items-center w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search subjects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs 
          defaultValue="all" 
          className="w-full md:w-auto"
          value={filterDepartment}
          onValueChange={setFilterDepartment}
        >
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 md:inline-flex">
            {departments.map(dept => (
              <TabsTrigger 
                key={dept} 
                value={dept}
                className="capitalize"
              >
                {dept === "all" ? "All Departments" : dept}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map(subject => (
            <Card key={subject.id} className="overflow-hidden">
              <CardHeader className="bg-blue-50 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                      {subject.name}
                    </CardTitle>
                    <div className="mt-1 flex items-center text-sm text-muted-foreground">
                      <Badge variant="outline" className="font-mono">
                        {subject.code}
                      </Badge>
                      <span className="mx-2">•</span>
                      <span>{subject.department}</span>
                    </div>
                  </div>
                  {subject.hasSyllabus && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <BookMarked className="h-3 w-3 mr-1" />
                      Syllabus
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <GraduationCap className="h-4 w-4 mr-1 text-gray-500" />
                  Instructors
                </h4>
                <div className="space-y-2">
                  {subject.teachers.map(teacher => (
                    <div key={teacher.id} className="flex items-center text-sm">
                      <User className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      {teacher.name}
                    </div>
                  ))}
                  {subject.teachers.length === 0 && (
                    <div className="text-sm text-gray-500">No instructors assigned</div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end">
                <Link href={`/student/academics/subjects/${subject.id}`}>
                  <Button variant="ghost" className="text-blue-600">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No subjects found</h3>
          <p className="mt-1 text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
