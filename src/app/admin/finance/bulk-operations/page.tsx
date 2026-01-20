"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkClassAssignment } from "@/components/fees/bulk-class-assignment";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";
import toast from "react-hot-toast";

export default function BulkOperationsPage() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [yearsResult, classesResult] = await Promise.all([
        getAcademicYears(),
        getClasses(),
      ]);

      if (yearsResult.success) setAcademicYears(yearsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance/fee-structure">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Fee Structure
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Operations</h1>
        </div>
      </div>

      {/* Bulk Assignment Component */}
      <BulkClassAssignment
        classes={classes}
        academicYears={academicYears}
        onComplete={fetchData}
      />
    </div>
  );
}
