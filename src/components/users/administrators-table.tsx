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

interface Administrator {
  id: string;
  position: string | null;
  createdAt: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
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
      const fullName = `${admin.user.firstName || ''} ${admin.user.lastName || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
        (admin.user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.position?.toLowerCase().includes(searchQuery.toLowerCase());

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
          return `${a.user.firstName || ''} ${a.user.lastName || ''}`.localeCompare(`${b.user.firstName || ''} ${b.user.lastName || ''}`);
        case "name-desc":
          return `${b.user.firstName || ''} ${b.user.lastName || ''}`.localeCompare(`${a.user.firstName || ''} ${a.user.lastName || ''}`);
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

  const columns = [
    {
      key: "name",
      label: "Name",
      isHeader: true,
      render: (admin: Administrator) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={admin.user.avatar || undefined} alt={`${admin.user.firstName || ''} ${admin.user.lastName || ''}`} />
            <AvatarFallback>{(admin.user.firstName || 'A')[0]}{(admin.user.lastName || 'A')[0]}</AvatarFallback>
          </Avatar>
          <div className="font-medium">
            {admin.user.firstName || ''} {admin.user.lastName || ''}
          </div>
        </div>
      ),
      mobileRender: (admin: Administrator) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={admin.user.avatar || undefined} alt={`${admin.user.firstName || ''} ${admin.user.lastName || ''}`} />
            <AvatarFallback className="text-xs">{(admin.user.firstName || 'A')[0]}{(admin.user.lastName || 'A')[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {admin.user.firstName || ''} {admin.user.lastName || ''}
            </div>
          </div>
          <Badge
            className={admin.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100 text-xs' : 'bg-red-100 text-red-800 hover:bg-red-100 text-xs'}
          >
            {admin.user.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      mobilePriority: "low" as const,
      render: (admin: Administrator) => admin.user.email || "N/A",
      mobileRender: (admin: Administrator) => (
        <span className="truncate max-w-[150px] inline-block">{admin.user.email || "N/A"}</span>
      ),
    },
    {
      key: "position",
      label: "Position",
      render: (admin: Administrator) => admin.position || "N/A",
    },
    {
      key: "joined",
      label: "Joined",
      mobilePriority: "low" as const,
      render: (admin: Administrator) => formatDate(admin.createdAt),
    },
    {
      key: "status",
      label: "Status",
      mobilePriority: "low" as const, // Already shown in header on mobile
      render: (admin: Administrator) => (
        <Badge
          className={admin.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
        >
          {admin.user.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      isAction: true,
      render: (admin: Administrator) => (
        <>
          <Link href={`/admin/users/administrators/${admin.id}`}>
            <Button variant="ghost" size="sm">View</Button>
          </Link>
          <Link href={`/admin/users/administrators/${admin.id}/edit`}>
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
        </>
      ),
      mobileRender: (admin: Administrator) => (
        <>
          <Link href={`/admin/users/administrators/${admin.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
          </Link>
          <Link href={`/admin/users/administrators/${admin.id}/edit`}>
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
          placeholder="Search administrators by name, email, position..."
          onSearch={setSearchQuery}
        />
        <UserFilters
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
        />
      </div>

      <ResponsiveTable
        data={paginatedAdmins}
        columns={columns}
        keyExtractor={(admin) => admin.id}
        emptyState={
          <EmptyState
            title={searchQuery ? "No administrators found" : "No administrators yet"}
            description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first administrator to the system."}
            actionLabel={!searchQuery ? "Add Administrator" : undefined}
            actionHref={!searchQuery ? "/admin/users/administrators/create" : undefined}
          />
        }
      />

      {filteredAndSortedAdmins.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
