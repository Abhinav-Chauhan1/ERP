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

interface Teacher {
  id: string;
  employeeId: string;
  joinDate: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    active: boolean;
  };
  subjects: Array<{
    id: string;
    subject: { name: string };
  }>;
}

interface TeachersTableProps {
  teachers: Teacher[];
}

export function TeachersTable({ teachers }: TeachersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = teachers.filter((teacher) => {
      const fullName = `${teacher.user.firstName} ${teacher.user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
        teacher.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && teacher.user.active) ||
        (statusFilter === "inactive" && !teacher.user.active);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case "oldest":
          return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        case "name-asc":
          return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
        case "name-desc":
          return `${b.user.firstName} ${b.user.lastName}`.localeCompare(`${a.user.firstName} ${a.user.lastName}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [teachers, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredAndSortedTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: "name",
      label: "Name",
      isHeader: true,
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={teacher.user.avatar || undefined} alt={`${teacher.user.firstName} ${teacher.user.lastName}`} />
            <AvatarFallback>{teacher.user.firstName[0]}{teacher.user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="font-medium">
            {teacher.user.firstName} {teacher.user.lastName}
          </div>
        </div>
      ),
      mobileRender: (teacher: Teacher) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={teacher.user.avatar || undefined} alt={`${teacher.user.firstName} ${teacher.user.lastName}`} />
            <AvatarFallback className="text-xs">{teacher.user.firstName[0]}{teacher.user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {teacher.user.firstName} {teacher.user.lastName}
            </div>
          </div>
          <Badge
            className={teacher.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100 text-xs' : 'bg-red-100 text-red-800 hover:bg-red-100 text-xs'}
          >
            {teacher.user.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "employeeId",
      label: "Employee ID",
      mobileLabel: "Emp ID",
      render: (teacher: Teacher) => teacher.employeeId,
    },
    {
      key: "email",
      label: "Email",
      mobilePriority: "low" as const,
      render: (teacher: Teacher) => teacher.user.email,
      mobileRender: (teacher: Teacher) => (
        <span className="truncate max-w-[150px] inline-block">{teacher.user.email}</span>
      ),
    },
    {
      key: "subjects",
      label: "Subjects",
      render: (teacher: Teacher) => (
        <div className="flex flex-wrap gap-1">
          {teacher.subjects.length > 0 ? (
            <>
              {teacher.subjects.slice(0, 2).map((subjectTeacher) => (
                subjectTeacher.subject ? (
                  <Badge key={subjectTeacher.id} variant="outline" className="text-xs">
                    {subjectTeacher.subject.name}
                  </Badge>
                ) : null
              ))}
              {teacher.subjects.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{teacher.subjects.length - 2}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">None assigned</span>
          )}
        </div>
      ),
      mobileRender: (teacher: Teacher) => (
        <div className="flex flex-wrap gap-0.5 justify-end">
          {teacher.subjects.length > 0 ? (
            <>
              {teacher.subjects.slice(0, 1).map((subjectTeacher) => (
                subjectTeacher.subject ? (
                  <Badge key={subjectTeacher.id} variant="outline" className="text-[10px] px-1 py-0">
                    {subjectTeacher.subject.name}
                  </Badge>
                ) : null
              ))}
              {teacher.subjects.length > 1 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  +{teacher.subjects.length - 1}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-xs">None</span>
          )}
        </div>
      ),
    },
    {
      key: "joinDate",
      label: "Join Date",
      mobileLabel: "Joined",
      mobilePriority: "low" as const,
      render: (teacher: Teacher) => formatDate(teacher.joinDate),
    },
    {
      key: "status",
      label: "Status",
      mobilePriority: "low" as const, // Already shown in header on mobile
      render: (teacher: Teacher) => (
        <Badge
          className={teacher.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
        >
          {teacher.user.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      isAction: true,
      render: (teacher: Teacher) => (
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/users/teachers/${teacher.id}`}>View</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/users/teachers/${teacher.id}/edit`}>Edit</Link>
          </Button>
        </>
      ),
      mobileRender: (teacher: Teacher) => (
        <>
          <Link href={`/admin/users/teachers/${teacher.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
          </Link>
          <Link href={`/admin/users/teachers/${teacher.id}/edit`}>
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
          placeholder="Search teachers by name, email or employee ID..."
          onSearch={setSearchQuery}
        />
        <UserFilters
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
        />
      </div>

      <ResponsiveTable
        data={paginatedTeachers}
        columns={columns}
        keyExtractor={(teacher) => teacher.id}
        emptyState={
          <EmptyState
            title={searchQuery ? "No teachers found" : "No teachers yet"}
            description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first teacher to the system."}
            actionLabel={!searchQuery ? "Add Teacher" : undefined}
            actionHref={!searchQuery ? "/admin/users/teachers/create" : undefined}
          />
        }
      />

      {filteredAndSortedTeachers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTeachers.length)} of {filteredAndSortedTeachers.length} teachers
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
