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
import { ResponsiveTable } from "@/components/shared/responsive-table";

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

interface StudentsTableProps {
  students: Student[];
}

export function StudentsTable({ students }: StudentsTableProps) {
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

  const columns = [
    {
      key: "name",
      label: "Name",
      isHeader: true,
      render: (student: Student) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.user.avatar || undefined} alt={`${student.user.firstName} ${student.user.lastName}`} />
            <AvatarFallback>{student.user.firstName[0]}{student.user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="font-medium">
            {student.user.firstName} {student.user.lastName}
          </div>
        </div>
      ),
      mobileRender: (student: Student) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={student.user.avatar || undefined} alt={`${student.user.firstName} ${student.user.lastName}`} />
            <AvatarFallback className="text-xs">{student.user.firstName[0]}{student.user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {student.user.firstName} {student.user.lastName}
            </div>
          </div>
          <Badge
            className={student.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100 text-xs' : 'bg-red-100 text-red-800 hover:bg-red-100 text-xs'}
          >
            {student.user.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "admissionId",
      label: "Admission ID",
      mobileLabel: "Adm. ID",
      render: (student: Student) => student.admissionId,
    },
    {
      key: "class",
      label: "Class",
      render: (student: Student) => (
        student.enrollments.length > 0 ? (
          <div>
            {student.enrollments[0].class.name} - {student.enrollments[0].section.name}
          </div>
        ) : (
          <span className="text-muted-foreground">Not enrolled</span>
        )
      ),
      mobileRender: (student: Student) => (
        student.enrollments.length > 0 ? (
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {student.enrollments[0].class.name} - {student.enrollments[0].section.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Not enrolled</span>
        )
      ),
    },
    {
      key: "gender",
      label: "Gender",
      mobilePriority: "low" as const,
      render: (student: Student) => (
        <span className="capitalize">{student.gender.toLowerCase()}</span>
      ),
    },
    {
      key: "admissionDate",
      label: "Admission Date",
      mobileLabel: "Admitted",
      mobilePriority: "low" as const,
      render: (student: Student) => formatDate(student.admissionDate),
    },
    {
      key: "status",
      label: "Status",
      mobilePriority: "low" as const, // Already shown in header on mobile
      render: (student: Student) => (
        <Badge
          className={student.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
        >
          {student.user.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      isAction: true,
      render: (student: Student) => (
        <>
          <Link href={`/admin/users/students/${student.id}`}>
            <Button variant="ghost" size="sm">View</Button>
          </Link>
          <Link href={`/admin/users/students/${student.id}/edit`}>
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
        </>
      ),
      mobileRender: (student: Student) => (
        <>
          <Link href={`/admin/users/students/${student.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
          </Link>
          <Link href={`/admin/users/students/${student.id}/edit`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
          </Link>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <UserSearch
          placeholder="Search students by name or admission ID..."
          onSearch={setSearchQuery}
        />
        <UserFilters
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
        />
      </div>

      <ResponsiveTable
        data={paginatedStudents}
        columns={columns}
        keyExtractor={(student) => student.id}
        emptyState={
          <EmptyState
            title={searchQuery ? "No students found" : "No students yet"}
            description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first student to the system."}
            actionLabel={!searchQuery ? "Add Student" : undefined}
            actionHref={!searchQuery ? "/admin/users/students/create" : undefined}
          />
        }
      />

      {filteredAndSortedStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
