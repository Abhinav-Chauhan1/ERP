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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserSearch 
          placeholder="Search students by name or admission ID..." 
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
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500">Admission ID</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500">Class</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500">Gender</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500">Admission Date</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
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
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {student.user.avatar ? (
                          <img
                            src={student.user.avatar}
                            alt={`${student.user.firstName} ${student.user.lastName}`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">
                            {student.user.firstName[0]}
                            {student.user.lastName[0]}
                          </div>
                        )}
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
                        <span className="text-gray-500">Not enrolled</span>
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
          <div className="text-sm text-gray-500">
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
