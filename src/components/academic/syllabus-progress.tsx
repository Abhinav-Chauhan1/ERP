"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SyllabusUpdateDialog } from "./syllabus-update-dialog";
import { updateSyllabusUnitProgress } from "@/lib/actions/teacherSubjectsActions";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SyllabusUnit {
  id: string;
  title: string;
  order: number;
  totalTopics: number;
  completedTopics: number;
  status: "not-started" | "in-progress" | "completed";
  lastUpdated: string;
}

interface SyllabusProgressProps {
  subjectName: string;
  className: string;
  academicYear: string;
  overallProgress: number;
  lastUpdated: string;
  units: SyllabusUnit[];
  subjectId?: string;
}

export function SyllabusProgress({
  subjectName,
  className,
  academicYear,
  overallProgress,
  lastUpdated,
  units,
  subjectId
}: SyllabusProgressProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const refreshData = () => {
    router.refresh();
  };

  const handleUpdate = async () => {
    if (!subjectId) return;
    
    try {
      setIsUpdating(true);
      await updateSyllabusUnitProgress(units[0]?.id || "", units[0]?.completedTopics || 0);
      toast.success("Syllabus progress updated successfully");
    } catch (error) {
      toast.error("Failed to update syllabus progress");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not-started":
        return <Badge variant="outline">Not Started</Badge>;
      case "in-progress":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{subjectName}</CardTitle>
            <CardDescription>
              {className} • {academicYear}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.success("Report generated successfully")}
            >
              <Download className="mr-2 h-4 w-4" /> Export Progress
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Syllabus Progress</span>
            <span className="text-sm font-medium">{overallProgress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full" 
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Last updated: {lastUpdated}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {units.map((unit) => (
            <div 
              key={unit.id} 
              className={`p-4 rounded-lg border ${
                unit.status === "completed" ? "bg-green-50 border-green-100" :
                unit.status === "in-progress" ? "bg-amber-50 border-amber-100" :
                "bg-gray-50 border-gray-100"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">
                    Unit {unit.order}: {unit.title}
                  </h3>
                  <div className="flex gap-1 items-center mt-1">
                    <span className="text-xs">{getStatusBadge(unit.status)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium">{unit.completedTopics}/{unit.totalTopics}</span>
                  <p className="text-xs text-gray-500">Topics covered</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    unit.status === "completed" ? "bg-green-500" :
                    unit.status === "in-progress" ? "bg-amber-500" :
                    "bg-gray-400"
                  }`}
                  style={{ width: `${(unit.completedTopics / unit.totalTopics) * 100}%` }}
                ></div>
              </div>

              {subjectId && (
                <div className="flex justify-end mt-3">
                  <SyllabusUpdateDialog 
                    unit={unit}
                    subjectId={subjectId}
                    onSuccess={refreshData}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>{units.filter(unit => unit.status === "completed").length}/{units.length} Units Completed</span>
        </div>
        
        <Button>Generate Report</Button>
      </CardFooter>
    </Card>
  );
}
