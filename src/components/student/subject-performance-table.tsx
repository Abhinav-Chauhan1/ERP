"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronUp, 
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SubjectPerformance {
  id: string;
  name: string;
  code: string;
  percentage: number;
  examsTaken: number;
  lastScore: number | null;
  lastScoreTotal: number | null;
}

interface SubjectPerformanceTableProps {
  subjects: SubjectPerformance[];
}

export function SubjectPerformanceTable({ subjects }: SubjectPerformanceTableProps) {
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sortable properties
  const getSortableProps = (field: string) => ({
    onClick: () => handleSort(field),
    className: "cursor-pointer select-none",
  });

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  // Filter and sort subjects
  const filteredAndSortedSubjects = [...subjects]
    .filter(subject => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "code":
          comparison = a.code.localeCompare(b.code);
          break;
        case "percentage":
          comparison = a.percentage - b.percentage;
          break;
        case "examsTaken":
          comparison = a.examsTaken - b.examsTaken;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Get performance status
  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 80) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <TrendingUp className="h-3 w-3 mr-1" />
          Excellent
        </Badge>
      );
    } else if (percentage >= 60) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          Good
        </Badge>
      );
    } else if (percentage >= 40) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <Minus className="h-3 w-3 mr-1" />
          Average
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <TrendingDown className="h-3 w-3 mr-1" />
          Needs Improvement
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search subjects..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead {...getSortableProps("name")}>
                Subject {getSortIndicator("name")}
              </TableHead>
              <TableHead {...getSortableProps("code")} className="hidden md:table-cell">
                Code {getSortIndicator("code")}
              </TableHead>
              <TableHead {...getSortableProps("percentage")}>
                Performance {getSortIndicator("percentage")}
              </TableHead>
              <TableHead {...getSortableProps("examsTaken")} className="hidden sm:table-cell">
                Exams Taken {getSortIndicator("examsTaken")}
              </TableHead>
              <TableHead className="hidden md:table-cell">Last Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No subjects found matching your search
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{subject.code}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {subject.percentage.toFixed(1)}%
                        </span>
                        <span className="hidden sm:block">
                          {getPerformanceStatus(subject.percentage)}
                        </span>
                      </div>
                      <Progress 
                        value={subject.percentage}
                        className={`h-2 ${subject.percentage >= 80 ? 'bg-green-500' : subject.percentage >= 60 ? 'bg-blue-500' : subject.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {subject.examsTaken}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {subject.lastScore !== null && subject.lastScoreTotal !== null ? (
                      <span>
                        {subject.lastScore}/{subject.lastScoreTotal} 
                        <span className="text-gray-500 ml-1">
                          ({((subject.lastScore / subject.lastScoreTotal) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
