"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StudentForPromotion {
  id: string;
  name: string;
  admissionId: string;
  rollNumber: string;
  className: string;
  sectionName?: string;
  hasWarnings?: boolean;
  warnings?: string[];
}

interface StudentSelectionTableProps {
  students: StudentForPromotion[];
  selectedStudentIds: string[];
  onSelectionChange: (studentIds: string[]) => void;
  isLoading?: boolean;
}

export function StudentSelectionTable({
  students,
  selectedStudentIds,
  onSelectionChange,
  isLoading = false,
}: StudentSelectionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    
    const lowerSearch = searchTerm.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(lowerSearch) ||
        student.admissionId.toLowerCase().includes(lowerSearch) ||
        student.rollNumber.toLowerCase().includes(lowerSearch)
    );
  }, [students, searchTerm]);

  // Check if all filtered students are selected
  const allSelected = filteredStudents.length > 0 && 
    filteredStudents.every((student) => selectedStudentIds.includes(student.id));

  // Check if some (but not all) filtered students are selected
  const someSelected = filteredStudents.some((student) => 
    selectedStudentIds.includes(student.id)
  ) && !allSelected;

  // Handle select all toggle
  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all filtered students
      const filteredIds = filteredStudents.map((s) => s.id);
      onSelectionChange(
        selectedStudentIds.filter((id) => !filteredIds.includes(id))
      );
    } else {
      // Select all filtered students
      const filteredIds = filteredStudents.map((s) => s.id);
      const newSelection = Array.from(
        new Set([...selectedStudentIds, ...filteredIds])
      );
      onSelectionChange(newSelection);
    }
  };

  // Handle individual student selection
  const handleStudentToggle = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      onSelectionChange(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      onSelectionChange([...selectedStudentIds, studentId]);
    }
  };

  const selectedCount = selectedStudentIds.length;
  const studentsWithWarnings = students.filter((s) => s.hasWarnings).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Students</CardTitle>
            <CardDescription>
              Choose students to promote to the next academic year
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {studentsWithWarnings > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {studentsWithWarnings} with warnings
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {selectedCount} selected
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, admission ID, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Students Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all students"
                    disabled={isLoading || filteredStudents.length === 0}
                    className={cn(
                      someSelected && "data-[state=checked]:bg-primary/50"
                    )}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Admission ID</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No students found matching your search" : "No students available"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <TableRow
                      key={student.id}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "bg-muted/50"
                      )}
                      onClick={() => handleStudentToggle(student.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleStudentToggle(student.id)}
                          aria-label={`Select ${student.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.admissionId}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>
                        {student.className}
                        {student.sectionName && ` - ${student.sectionName}`}
                      </TableCell>
                      <TableCell>
                        {student.hasWarnings ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Has warnings
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Eligible</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {filteredStudents.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {students.length} students
            {selectedCount > 0 && ` • ${selectedCount} selected for promotion`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
