"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  ChevronLeft, Edit, Calendar, Users, BookOpen, 
  Clock, FileText, PlusCircle, Trash2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function AcademicYearDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchAcademicYear();
  }, [params.id]);

  async function fetchAcademicYear() {
    setLoading(true);
    setError(null);
    
    try {
      const id = params.id as string;
      const result = await getAcademicYearById(id);
      
      if (result.success) {
        setAcademicYear(result.data);
      } else {
        setError(result.error || "An error occurred");
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      const id = params.id as string;
      const result = await deleteAcademicYear(id);
      
      if (result.success) {
        toast.success("Academic year deleted successfully");
        router.push('/admin/academic/academic-years');
      } else {
        toast.error(result.error || "Failed to delete academic year");
        setDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/academic/academic-years')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Academic Years
        </Button>
      </div>
    );
  }

  if (!academicYear) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Academic year not found</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/academic/academic-years')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Academic Years
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/academic/academic-years">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Academic Years
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/academic/academic-years/${academicYear.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{academicYear.name}</CardTitle>
                <CardDescription>
                  {format(new Date(academicYear.startDate), 'MMMM d, yyyy')} - {format(new Date(academicYear.endDate), 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              <span 
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  academicYear.isCurrent ? 'bg-green-100 text-green-800' : 
                  new Date(academicYear.startDate) > new Date() ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {academicYear.isCurrent ? 'Current' : 
                 new Date(academicYear.startDate) > new Date() ? 'Planned' : 'Past'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Duration</span>
                <span className="text-xl font-bold">
                  {Math.round((new Date(academicYear.endDate).getTime() - new Date(academicYear.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Terms</span>
                <span className="text-xl font-bold">{academicYear.terms?.length || 0}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-500">Classes</span>
                <span className="text-xl font-bold">{academicYear.classes?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="terms">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Academic Terms</CardTitle>
                  <CardDescription>Terms and semesters in this academic year</CardDescription>
                </div>
                <Link href={`/admin/academic/terms/new?academicYearId=${academicYear.id}`}>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Term
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {academicYear.terms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No terms have been created for this academic year yet.</p>
                    <Link href={`/admin/academic/terms/new?academicYearId=${academicYear.id}`}>
                      <Button variant="outline" className="mt-4">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create First Term
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Term Name</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Start Date</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">End Date</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Duration</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {academicYear.terms.map((term: any) => (
                            <tr key={term.id} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{term.name}</td>
                              <td className="py-3 px-4 align-middle">{format(new Date(term.startDate), 'MMM d, yyyy')}</td>
                              <td className="py-3 px-4 align-middle">{format(new Date(term.endDate), 'MMM d, yyyy')}</td>
                              <td className="py-3 px-4 align-middle">
                                {Math.round((new Date(term.endDate).getTime() - new Date(term.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                              </td>
                              <td className="py-3 px-4 align-middle text-right">
                                <Link href={`/admin/academic/terms/${term.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Classes</CardTitle>
                  <CardDescription>Classes for this academic year</CardDescription>
                </div>
                <Link href={`/admin/academic/classes/new?academicYearId=${academicYear.id}`}>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {academicYear.classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No classes have been created for this academic year yet.</p>
                    <Link href={`/admin/academic/classes/new?academicYearId=${academicYear.id}`}>
                      <Button variant="outline" className="mt-4">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create First Class
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Class Name</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Sections</th>
                            <th className="py-3 px-4 text-left font-medium text-gray-500">Students</th>
                            <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {academicYear.classes.map((cls: any) => (
                            <tr key={cls.id} className="border-b">
                              <td className="py-3 px-4 align-middle font-medium">{cls.name}</td>
                              <td className="py-3 px-4 align-middle">{cls._count?.sections || 0}</td>
                              <td className="py-3 px-4 align-middle">{cls._count?.enrollments || 0}</td>
                              <td className="py-3 px-4 align-middle text-right">
                                <Link href={`/admin/academic/classes/${cls.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Academic Year</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this academic year? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
