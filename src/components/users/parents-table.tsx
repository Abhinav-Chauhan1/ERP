"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSearch } from "./user-search";
import { UserFilters } from "./user-filters";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";

interface Parent {
  id: string;
  relation: string | null;
  alternatePhone: string | null;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    active: boolean;
  };
  children: Array<{
    id: string;
    student: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
}

interface ParentsTableProps {
  parents: Parent[];
}

export function ParentsTable({ parents }: ParentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedParents = useMemo(() => {
    let filtered = parents.filter((parent) => {
      const fullName = `${parent.user.firstName} ${parent.user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
        parent.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && parent.user.active) ||
        (statusFilter === "inactive" && !parent.user.active);
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-asc":
          return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
        case "name-desc":
          return `${b.user.firstName} ${b.user.lastName}`.localeCompare(`${a.user.firstName} ${a.user.lastName}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [parents, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedParents.length / itemsPerPage);
  const paginatedParents = filteredAndSortedParents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserSearch 
          placeholder="Search parents by name, email or phone..." 
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
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Email</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Phone</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Children</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Relation</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedParents.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={searchQuery ? "No parents found" : "No parents yet"}
                      description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first parent to the system."}
                      actionLabel={!searchQuery ? "Add Parent" : undefined}
                      actionHref={!searchQuery ? "/admin/users/parents/create" : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedParents.map((parent) => (
                  <tr key={parent.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {parent.user.avatar ? (
                          <img
                            src={parent.user.avatar}
                            alt={`${parent.user.firstName} ${parent.user.lastName}`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                            {parent.user.firstName[0]}
                            {parent.user.lastName[0]}
                          </div>
                        )}
                        <div className="font-medium">
                          {parent.user.firstName} {parent.user.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle">{parent.user.email}</td>
                    <td className="py-3 px-4 align-middle">{parent.user.phone || parent.alternatePhone || "N/A"}</td>
                    <td className="py-3 px-4 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {parent.children.length > 0 ? (
                          <>
                            {parent.children.slice(0, 2).map((child) => (
                              <Badge key={child.id} variant="outline" className="text-xs">
                                {child.student.user.firstName} {child.student.user.lastName}
                              </Badge>
                            ))}
                            {parent.children.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{parent.children.length - 2}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">No children</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle capitalize">{parent.relation?.toLowerCase() || "N/A"}</td>
                    <td className="py-3 px-4 align-middle">
                      <Badge 
                        className={parent.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                      >
                        {parent.user.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      <Link href={`/admin/users/parents/${parent.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Link href={`/admin/users/parents/${parent.id}/edit`}>
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

      {filteredAndSortedParents.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedParents.length)} of {filteredAndSortedParents.length} parents
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
