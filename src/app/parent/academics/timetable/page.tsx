"use client";


import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TimetableGrid } from "@/components/parent/academics/timetable-grid";
import { ChildSelector } from "@/components/parent/child-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns";

export default function TimetablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");

  const [timetable, setTimetable] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const fetchTimetable = useCallback(async () => {
    if (!childId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/parent/timetable?childId=${childId}&week=${currentWeek.toISOString()}`
      );
      const data = await response.json();

      if (data.success) {
        setTimetable(data.timetable || []);
        setEnrollment(data.enrollment);
      }
    } catch (error) {
      console.error("Failed to fetch timetable:", error);
    } finally {
      setLoading(false);
    }
  }, [childId, currentWeek]);

  useEffect(() => {
    if (!childId) {
      // Fetch first child and redirect
      fetch("/api/parent/children")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.children && data.children.length > 0) {
            const firstChild = data.children[0];
            router.push(`/parent/academics/timetable?childId=${firstChild.id}`);
          } else {
            router.push("/parent");
          }
        })
        .catch(() => router.push("/parent"));
      return;
    }

    fetchTimetable();
  }, [childId, currentWeek, fetchTimetable, router]);

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll use the browser's print to PDF functionality
    window.print();
  };

  const weekStart = currentWeek;
  const weekEnd = addWeeks(currentWeek, 1);

  const studentName = enrollment
    ? `${enrollment.class.name} - ${enrollment.section.name}`
    : undefined;

  if (!childId) {
    return null;
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Full Timetable</h1>
          <p className="text-muted-foreground mt-1">
            Complete weekly schedule with all periods
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ChildSelector selectedChildId={childId} />
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="hidden md:flex"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="hidden md:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Week Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Week
            </Button>

            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <div className="text-center">
                <p className="font-semibold">
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleCurrentWeek}
                  className="h-auto p-0 text-xs text-blue-600"
                >
                  Go to current week
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
            >
              Next Week
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timetable */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <p>Loading timetable...</p>
            </div>
          </CardContent>
        </Card>
      ) : timetable.length > 0 ? (
        <div className="print-area">
          <TimetableGrid schedule={timetable} studentName={studentName} />

          {/* Additional Details for Print */}
          <Card className="mt-6 print-only">
            <CardHeader>
              <CardTitle>Timetable Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Class</p>
                  <p className="font-medium">{enrollment?.class.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Section</p>
                  <p className="font-medium">{enrollment?.section.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Week</p>
                  <p className="font-medium">
                    {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Classes</p>
                  <p className="font-medium">{timetable.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Timetable Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                No timetable has been set up for this student yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-only {
            display: block !important;
          }
          button,
          nav,
          aside,
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}

