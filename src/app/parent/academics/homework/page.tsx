"use client";


import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HomeworkList } from "@/components/parent/academics/homework-list";
import { AssignmentDetailCard } from "@/components/parent/academics/assignment-detail-card";
import { ChildSelector } from "@/components/parent/child-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function HomeworkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!childId) {
      // Fetch first child and redirect
      fetch("/api/parent/children")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.children && data.children.length > 0) {
            const firstChild = data.children[0];
            router.push(`/parent/academics/homework?childId=${firstChild.id}`);
          } else {
            router.push("/parent");
          }
        })
        .catch(() => router.push("/parent"));
      return;
    }

    fetchHomework();
  }, [childId, statusFilter, subjectFilter]);

  const fetchHomework = async () => {
    if (!childId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/parent/homework?childId=${childId}&status=${statusFilter}&subjectId=${subjectFilter !== "ALL" ? subjectFilter : ""}`
      );
      const data = await response.json();

      if (data.success) {
        setAssignments(data.homework || []);
        
        // Extract unique subjects
        const uniqueSubjects = Array.from(
          new Map(
            data.homework.map((hw: any) => [hw.subject.id, hw.subject])
          ).values()
        );
        setSubjects(uniqueSubjects as any[]);
      }
    } catch (error) {
      console.error("Failed to fetch homework:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      setIsDetailModalOpen(true);
    }
  };

  // Filter assignments by search query
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      searchQuery === "" ||
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.subject.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (!childId) {
    return null;
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Homework & Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Track assignments, submissions, and grades
          </p>
        </div>
        <ChildSelector selectedChildId={childId} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="GRADED">Graded</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
              </SelectContent>
            </Select>

            {/* Subject Filter */}
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <p>Loading assignments...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <HomeworkList
          assignments={filteredAssignments}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Assignment Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <AssignmentDetailCard
              assignment={selectedAssignment}
              submission={selectedAssignment.submissions[0]}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

