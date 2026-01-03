"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { UserSearch } from "./user-search";
import { UserFilters } from "./user-filters";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { SmartExportButton } from "@/components/shared/smart-export-button";
import { ExportField } from "@/components/shared/data-export-button";

interface Student {
  id: string;
  admissionId: string;
  gender: string;
  admissionDate: Date;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
    active: boolean;
  };
  enrollments: Array<{
    class: { name: string };
    section: { name: string };
  }>;
}

interface StudentsTableWithExportProps {
  students: Student[];
}

export function StudentsTableWithExport({ students }: StudentsTableWithExportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter((student) => {
      const fullName = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
        student.admissionId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && student.user.active) ||
        (statusFilter === "inactive" && !student.user.active);

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime();
        case "oldest":
          return new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime();
        case "name-asc":
          return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
        case "name-desc":
          return `${b.user.firstName} ${b.user.lastName}`.localeCompare(`${a.user.firstName} ${a.user.lastName}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [students, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const paginatedStudents = filteredAndSortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Prepare data for export
  const exportData = useMemo(() => {
    return filteredAndSortedStudents.map(student => ({
      admissionId: student.admissionId,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      fullName: `${student.user.firstName} ${student.user.lastName}`,
      gender: student.gender,
      class: student.enrollments.length > 0 ? student.enrollments[0].class.name : "Not enrolled",
      section: student.enrollments.length > 0 ? student.enrollments[0].section.name : "N/A",
      admissionDate: formatDate(student.admissionDate),
      status: student.user.active ? "Active" : "Inactive",
    }));
  }, [filteredAndSortedStudents]);

  // Define exportable fields
  const exportFields: ExportField[] = [
    { key: "admissionId", label: "Admission ID", selected: true },
    { key: "firstName", label: "First Name", selected: true },
    { key: "lastName", label: "Last Name", selected: true },
    { key: "fullName", label: "Full Name", selected: true },
    { key: "gender", label: "Gender", selected: true },
    { key: "class", label: "Class", selected: true },
    { key: "section", label: "Section", selected: true },
    { key: "admissionDate", label: "Admission Date", selected: true },
    { key: "status", label: "Status", selected: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <UserSearch
            placeholder="Search students by name or admission ID..."
            onSearch={setSearchQuery}
          />
          <UserFilters
            onStatusChange={setStatusFilter}
            onSortChange={setSortBy}
          />
        </div>
        <SmartExportButton
          data={exportData}
          filename="students"
          title="Students List"
          subtitle={`Total: ${filteredAndSortedStudents.length} students`}
          fields={exportFields}
        />
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Admission ID</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Gender</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Admission Date</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={searchQuery ? "No students found" : "No students yet"}
                      description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first student to the system."}
                      actionLabel={!searchQuery ? "Add Student" : undefined}
                      actionHref={!searchQuery ? "/admin/users/students/create" : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.user.avatar || undefined} alt={`${student.user.firstName} ${student.user.lastName}`} />
                          <AvatarFallback>{student.user.firstName[0]}{student.user.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                          {student.user.firstName} {student.user.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle">{student.admissionId}</td>
                    <td className="py-3 px-4 align-middle">
                      {student.enrollments.length > 0 ? (
                        <div>
                          {student.enrollments[0].class.name} - {student.enrollments[0].section.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not enrolled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-middle capitalize">{student.gender.toLowerCase()}</td>
                    <td className="py-3 px-4 align-middle">{formatDate(student.admissionDate)}</td>
                    <td className="py-3 px-4 align-middle">
                      <Badge
                        className={student.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                      >
                        {student.user.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      <Link href={`/admin/users/students/${student.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Link href={`/admin/users/students/${student.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedStudents.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} students
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
