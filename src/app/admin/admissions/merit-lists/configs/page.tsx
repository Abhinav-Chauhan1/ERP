"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMeritListConfigs, deleteMeritListConfig } from "@/lib/actions/meritListActions";
import { getAvailableClasses } from "@/lib/actions/admissionActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
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

export default function MeritListConfigsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
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

  // Fetch configurations
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getMeritListConfigs(classFilter === "all" ? undefined : classFilter);
        setConfigs(data);
      } catch (error) {
        console.error("Error fetching configs:", error);
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
      const result = await deleteMeritListConfig(deleteId);
      if (result.success) {
        setConfigs(configs.filter((c) => c.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error deleting config:", error);
      alert("Failed to delete configuration");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/admissions/merit-lists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Merit List Configurations</h1>
        </div>
        <Link href="/admin/admissions/merit-lists/configs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Configuration
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Configurations</CardTitle>
          <div className="mt-4">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[200px]">
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
          ) : configs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No configurations found. Create your first configuration to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{config.name}</div>
                      <Badge variant="outline">{config.appliedClass.name}</Badge>
                      {config.isActive && (
                        <Badge variant="default" className="bg-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Criteria: {(config.criteria as any[]).length} rules
                    </div>
                    {config.meritLists.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Last used: {format(new Date(config.meritLists[0].generatedAt), "PPP")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/admissions/merit-lists/configs/${config.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(config.id)}
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
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this configuration? This action cannot be undone.
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

