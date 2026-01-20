"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMeritLists, deleteMeritList } from "@/lib/actions/meritListActions";
import { getAvailableClasses } from "@/lib/actions/admissionActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Plus, Download } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MeritListsPage() {
  const router = useRouter();
  const [meritLists, setMeritLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load classes on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        const classesData = await getAvailableClasses();
        setClasses(classesData);
      } catch (error) {
        console.error("Error loading classes:", error);
      }
    }
    loadClasses();
  }, []);

  // Fetch merit lists
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getMeritLists(classFilter === "all" ? undefined : classFilter);
        setMeritLists(data);
      } catch (error) {
        console.error("Error fetching merit lists:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [classFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const result = await deleteMeritList(deleteId);
      if (result.success) {
        setMeritLists(meritLists.filter((ml) => ml.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error deleting merit list:", error);
      alert("Failed to delete merit list");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Merit Lists</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/admin/admissions/merit-lists/configs" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Manage Configurations
            </Button>
          </Link>
          <Link href="/admin/admissions/merit-lists/generate" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Generate Merit List
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Merit Lists</CardTitle>
          <div className="mt-4">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : meritLists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No merit lists found. Generate your first merit list to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {meritLists.map((meritList) => (
                <div
                  key={meritList.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{meritList.config.name}</div>
                      <Badge variant="outline">{meritList.appliedClass.name}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Generated: {format(new Date(meritList.generatedAt), "PPP 'at' p")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Applications: {meritList.totalApplications}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/admissions/merit-lists/${meritList.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/admin/admissions/merit-lists/${meritList.id}/export`}>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(meritList.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Merit List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this merit list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

