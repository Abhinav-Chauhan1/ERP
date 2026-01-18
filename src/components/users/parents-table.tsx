"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSearch } from "./user-search";
import { UserFilters } from "./user-filters";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { ResponsiveTable } from "@/components/shared/responsive-table";

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

  const columns = [
    {
      key: "name",
      label: "Name",
      isHeader: true,
      render: (parent: Parent) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={parent.user.avatar || undefined} alt={`${parent.user.firstName} ${parent.user.lastName}`} />
            <AvatarFallback>{parent.user.firstName[0]}{parent.user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="font-medium">
            {parent.user.firstName} {parent.user.lastName}
          </div>
        </div>
      ),
      mobileRender: (parent: Parent) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={parent.user.avatar || undefined} alt={`${parent.user.firstName} ${parent.user.lastName}`} />
            <AvatarFallback className="text-xs">{parent.user.firstName[0]}{parent.user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {parent.user.firstName} {parent.user.lastName}
            </div>
          </div>
          <Badge
            className={parent.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100 text-xs' : 'bg-red-100 text-red-800 hover:bg-red-100 text-xs'}
          >
            {parent.user.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      mobilePriority: "low" as const,
      render: (parent: Parent) => parent.user.email,
      mobileRender: (parent: Parent) => (
        <span className="truncate max-w-[150px] inline-block">{parent.user.email}</span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (parent: Parent) => parent.user.phone || parent.alternatePhone || "N/A",
    },
    {
      key: "children",
      label: "Children",
      render: (parent: Parent) => (
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
      ),
      mobileRender: (parent: Parent) => (
        <div className="flex flex-wrap gap-0.5 justify-end">
          {parent.children.length > 0 ? (
            <>
              {parent.children.slice(0, 1).map((child) => (
                <Badge key={child.id} variant="outline" className="text-[10px] px-1 py-0">
                  {child.student.user.firstName}
                </Badge>
              ))}
              {parent.children.length > 1 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  +{parent.children.length - 1}
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
      key: "relation",
      label: "Relation",
      mobilePriority: "low" as const,
      render: (parent: Parent) => (
        <span className="capitalize">{parent.relation?.toLowerCase() || "N/A"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      mobilePriority: "low" as const, // Already shown in header on mobile
      render: (parent: Parent) => (
        <Badge
          className={parent.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
        >
          {parent.user.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      isAction: true,
      render: (parent: Parent) => (
        <>
          <Link href={`/admin/users/parents/${parent.id}`}>
            <Button variant="ghost" size="sm">View</Button>
          </Link>
          <Link href={`/admin/users/parents/${parent.id}/edit`}>
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
        </>
      ),
      mobileRender: (parent: Parent) => (
        <>
          <Link href={`/admin/users/parents/${parent.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
          </Link>
          <Link href={`/admin/users/parents/${parent.id}/edit`}>
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
          placeholder="Search parents by name, email or phone..."
          onSearch={setSearchQuery}
        />
        <UserFilters
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
        />
      </div>

      <ResponsiveTable
        data={paginatedParents}
        columns={columns}
        keyExtractor={(parent) => parent.id}
        emptyState={
          <EmptyState
            title={searchQuery ? "No parents found" : "No parents yet"}
            description={searchQuery ? "Try adjusting your search or filters." : "Get started by adding your first parent to the system."}
            actionLabel={!searchQuery ? "Add Parent" : undefined}
            actionHref={!searchQuery ? "/admin/users/parents/create" : undefined}
          />
        }
      />

      {filteredAndSortedParents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
