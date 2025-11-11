"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

interface UserFiltersProps {
  onStatusChange?: (status: string) => void;
  onSortChange?: (sort: string) => void;
}

export function UserFilters({ onStatusChange, onSortChange }: UserFiltersProps) {
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onStatusChange?.(value);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    onSortChange?.(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={status} onValueChange={handleStatusChange}>
          <DropdownMenuRadioItem value="all">All Users</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="active">Active Only</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="inactive">Inactive Only</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sort} onValueChange={handleSortChange}>
          <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
