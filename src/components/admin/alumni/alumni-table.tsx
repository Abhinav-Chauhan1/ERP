"use client";

/**
 * Alumni Table Component
 * 
 * Displays alumni information in a table format with sortable columns.
 * 
 * Requirements: 6.4, 6.5
 */

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AlumniCardData } from "./alumni-card";

interface AlumniTableProps {
  alumni: AlumniCardData[];
  onRowClick?: (alumniId: string) => void;
  onSort?: (sortBy: "name" | "graduationDate" | "class", order: "asc" | "desc") => void;
}

type SortField = "name" | "graduationDate" | "class";
type SortOrder = "asc" | "desc";

export function AlumniTable({ alumni, onRowClick, onSort }: AlumniTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    let newOrder: SortOrder = "asc";

    if (sortField === field) {
      // Toggle order if same field
      newOrder = sortOrder === "asc" ? "desc" : "asc";
    }

    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field, newOrder);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (alumni.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No alumni found matching your criteria
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="h-8 px-2 lg:px-3"
              >
                Name
                {getSortIcon("name")}
              </Button>
            </TableHead>
            <TableHead>Admission ID</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("class")}
                className="h-8 px-2 lg:px-3"
              >
                Final Class
                {getSortIcon("class")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("graduationDate")}
                className="h-8 px-2 lg:px-3"
              >
                Graduation Date
                {getSortIcon("graduationDate")}
              </Button>
            </TableHead>
            <TableHead>Current Occupation</TableHead>
            <TableHead>Current Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alumni.map((alumnus) => {
            const initials = alumnus.studentName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow
                key={alumnus.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => onRowClick?.(alumnus.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={alumnus.profilePhoto}
                        alt={alumnus.studentName}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{alumnus.studentName}</span>
                  </div>
                </TableCell>
                <TableCell>{alumnus.admissionId}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {alumnus.finalClass} - {alumnus.finalSection}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(alumnus.graduationDate)}</TableCell>
                <TableCell>
                  {alumnus.currentOccupation || (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </TableCell>
                <TableCell>
                  {alumnus.currentCity || (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
