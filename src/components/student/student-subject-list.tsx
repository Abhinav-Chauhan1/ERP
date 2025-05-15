"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Search, BookOpen, Users, Filter, LayoutGrid, List
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type Subject = {
  id: string;
  name: string;
  code: string;
  department: string;
  hasSyllabus: boolean;
  teachers: {
    id: string;
    name: string;
  }[];
};

interface StudentSubjectListProps {
  subjects: Subject[];
}

export function StudentSubjectList({ subjects }: StudentSubjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get unique departments for filtering
  const departments = Array.from(new Set(subjects.map(subject => subject.department)));

  // Filter subjects based on search and department filter
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          subject.code.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesDept = !filterDept || subject.department === filterDept;
    
    return matchesSearch && matchesDept;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search subjects..."
            className="pl-10 max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                {filterDept ? filterDept : "All Departments"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterDept(null)}>
                All Departments
              </DropdownMenuItem>
              {departments.map(dept => (
                <DropdownMenuItem key={dept} onClick={() => setFilterDept(dept)}>
                  {dept}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="bg-muted rounded-md flex">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No subjects found</h3>
          <p className="mt-2 text-gray-500">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <Link key={subject.id} href={`/student/academics/subjects/${subject.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="bg-blue-100 text-blue-700 p-3 rounded-lg">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                        {subject.code}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mt-4">{subject.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{subject.department}</p>
                    
                    <div className="flex items-center mt-4 text-sm">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {subject.teachers.length > 0 
                          ? `${subject.teachers[0].name}${subject.teachers.length > 1 ? ` + ${subject.teachers.length - 1} more` : ''}`
                          : 'No teacher assigned'
                        }
                      </span>
                    </div>

                    {subject.hasSyllabus && (
                      <div className="mt-4 pt-4 border-t text-sm">
                        <span className="text-blue-600 font-medium">
                          View syllabus →
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubjects.map((subject) => (
              <Link key={subject.id} href={`/student/academics/subjects/${subject.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-700 p-3 rounded-lg">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-semibold">{subject.name}</h3>
                          <div className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                            {subject.code}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{subject.department}</p>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {subject.teachers.length > 0 
                            ? `${subject.teachers.length} ${subject.teachers.length === 1 ? 'teacher' : 'teachers'}`
                            : 'No teacher'
                          }
                        </span>
                      </div>
                      {subject.hasSyllabus && (
                        <span className="text-xs text-blue-600 font-medium">
                          View syllabus →
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
