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

interface Administrator {
  id: string;
  position: string | null;
  department: string | null;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    active: boolean;
  };
}

interface AdministratorsTableProps {
  administrators: Administrator[];
}

export function AdministratorsTable({ administrators }: AdministratorsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedAdmins = useMemo(() => {
    let filtered = administrators.filter((admin) => {
      const fullName = `${admin.user.firstName} ${admin.user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
        admin.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && admin.user.active) ||
        (statusFilter === "inactive" && !admin.user.active);
      
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
  }, [administrators, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedAdmins.length / itemsPerPage);
  const paginatedAdmins = filteredAndSortedAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserSearch 
          placeholder="Search administrators by name, email, position..." 
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
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Position</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Department</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Joined</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={searchQuery ? "No administrators found" : "No administrators yet"}
                      description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first administrator to the system."}
                      actionLabel={!searchQuery ? "Add Administrator" : undefined}
                      actionHref={!searchQuery ? "/admin/users/administrators/create" : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {admin.user.avatar ? (
                          <img
                            src={admin.user.avatar}
                            alt={`${admin.user.firstName} ${admin.user.lastName}`}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                            {admin.user.firstName[0]}
                            {admin.user.lastName[0]}
                          </div>
                        )}
                        <div className="font-medium">
                          {admin.user.firstName} {admin.user.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle">{admin.user.email}</td>
                    <td className="py-3 px-4 align-middle">{admin.position || "N/A"}</td>
                    <td className="py-3 px-4 align-middle">{admin.department || "N/A"}</td>
                    <td className="py-3 px-4 align-middle">{formatDate(admin.createdAt)}</td>
                    <td className="py-3 px-4 align-middle">
                      <Badge 
                        className={admin.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                      >
                        {admin.user.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 align-middle text-right">
                      <Link href={`/admin/users/administrators/${admin.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Link href={`/admin/users/administrators/${admin.id}/edit`}>
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

      {filteredAndSortedAdmins.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedAdmins.length)} of {filteredAndSortedAdmins.length} administrators
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
