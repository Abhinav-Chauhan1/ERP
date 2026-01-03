"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Calendar, Edit, Trash2, ChevronLeft,
  AlertCircle, Clock, Users, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { getAcademicYearById, deleteAcademicYear } from "@/lib/actions/academicyearsActions";
import { AcademicErrorBoundary } from "@/components/academic/academic-error-boundary";

function AcademicYearDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [academicYear, setAcademicYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAcademicYear = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAcademicYearById(id);

      if (result.success && result.data) {
        setAcademicYear(result.data);
      } else {
        setError(result.error || "Academic year not found");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAcademicYear();
  }, [fetchAcademicYear, id]);

  async function handleDelete() {
    setDeleting(true);

    try {
      const result = await deleteAcademicYear(id);

      if (result.success) {
        toast.success("Academic year deleted successfully");
        router.push("/admin/academic/academic-years");
      } else {
        toast.error(result.error || "Failed to delete academic year");
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic/academic-years">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">Loading academic year details...</div>
      </div>
    );
  }

  if (error || !academicYear) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic/academic-years">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Academic year not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const status = academicYear.isCurrent ? 'Current' :
    new Date(academicYear.endDate) < new Date() ? 'Past' : 'Planned';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic/academic-years">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{academicYear.name}</h1>
          <Badge
            variant={status === 'Current' ? 'default' : 'secondary'}
            className={
              status === 'Current' ? 'bg-green-600 hover:bg-green-700' :
                status === 'Past' ? 'bg-gray-500 hover:bg-gray-600' :
                  'bg-blue-600 hover:bg-blue-700'
            }
          >
            {status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/academic/academic-years`}>
            <Button variant="outline" disabled={deleting}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" /> {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(academicYear.startDate), 'MMM d, yyyy')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              to {format(new Date(academicYear.endDate), 'MMM d, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Terms</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicYear.terms?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Academic terms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicYear.classes?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total classes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Terms</CardTitle>
          <CardDescription>Academic terms for this year</CardDescription>
        </CardHeader>
        <CardContent>
          {academicYear.terms && academicYear.terms.length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Term Name</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Start Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicYear.terms.map((term: any) => (
                      <tr key={term.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{term.name}</td>
                        <td className="py-3 px-4 align-middle">
                          {format(new Date(term.startDate), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {format(new Date(term.endDate), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No terms created for this academic year yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>Classes for this academic year</CardDescription>
        </CardHeader>
        <CardContent>
          {academicYear.classes && academicYear.classes.length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class Name</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Sections</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Enrollments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicYear.classes.map((cls: any) => (
                      <tr key={cls.id} className="border-b">
                        <td className="py-3 px-4 align-middle font-medium">{cls.name}</td>
                        <td className="py-3 px-4 align-middle">{cls._count?.sections || 0}</td>
                        <td className="py-3 px-4 align-middle">{cls._count?.enrollments || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No classes created for this academic year yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Academic Year</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this academic year? This action cannot be undone.
              {(academicYear.terms?.length > 0 || academicYear.classes?.length > 0) && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This academic year has {academicYear.terms?.length || 0} term(s) and {academicYear.classes?.length || 0} class(es).
                  You must remove them first before deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AcademicYearDetailPage() {
  return (
    <AcademicErrorBoundary context="detail">
      <AcademicYearDetailPageContent />
    </AcademicErrorBoundary>
  );
}
