"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UserSearch } from "./user-search";
import { UserFilters } from "./user-filters";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserSearch 
          placeholder="Search teachers by name, email or employee ID..." 
          onSearch={setSearchQuery}
        />
        <UserFilters 
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
        />
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent border-b">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Employee ID</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Email</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Subjects</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Join Date</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={searchQuery ? "No teachers found" : "No teachers yet"}
                      description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first teacher to the system."}
                      actionLabel={!searchQuery ? "Add Teacher" : undefined}
                      actionHref={!searchQuery ? "/admin/users/teachers/create" : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {teacher.user.avatar ? (
                          <img
                            src={teacher.user.avatar}
                            alt={`${teacher.user.firstName} ${teacher.user.lastName}`}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                            {teacher.user.firstName[0]}
                            {teacher.user.lastName[0]}
                          </div>
                        )}
                        <div className="font-medium">
                          {teacher.user.firstName} {teacher.user.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle">{teacher.employeeId}</td>
                    <td className="py-3 px-4 align-middle">{teacher.user.email}</td>
                    <td className="py-3 px-4 align-middle">
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
                    </td>
                    <td className="py-3 px-4 align-middle">{formatDate(teacher.joinDate)}</td>
                    <td className="py-3 px-4 align-middle">
                      <Badge 
                        className={teacher.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                      >
                        {teacher.user.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/teachers/${teacher.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/teachers/${teacher.id}/edit`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedTeachers.length > 0 && (
        <div className="flex items-center justify-between">
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
