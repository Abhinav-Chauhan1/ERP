"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date: Date;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
};

type AchievementExportProps = {
  achievements: Achievement[];
  onClose: () => void;
};

const CATEGORY_LABELS = {
  AWARD: "Award",
  CERTIFICATION: "Certification",
  PROFESSIONAL_DEVELOPMENT: "Professional Development",
  PUBLICATION: "Publication",
  RECOGNITION: "Recognition",
  OTHER: "Other",
};

export function AchievementExport({ achievements, onClose }: AchievementExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToText = () => {
    const content = achievements
      .map((achievement) => {
        const category = CATEGORY_LABELS[achievement.category as keyof typeof CATEGORY_LABELS] || achievement.category;
        const date = format(new Date(achievement.date), "MMMM d, yyyy");
        
        return `
${achievement.title}
Category: ${category}
Date: ${date}
${achievement.description ? `Description: ${achievement.description}` : ""}
${achievement.documents.length > 0 ? `Documents: ${achievement.documents.length} attached` : ""}
${"=".repeat(80)}
`;
      })
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `achievements-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = achievements.map((achievement) => ({
      title: achievement.title,
      category: achievement.category,
      date: format(new Date(achievement.date), "yyyy-MM-dd"),
      description: achievement.description,
      documents: achievement.documents,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `achievements-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ["Title", "Category", "Date", "Description", "Documents"];
    const rows = achievements.map((achievement) => [
      achievement.title,
      CATEGORY_LABELS[achievement.category as keyof typeof CATEGORY_LABELS] || achievement.category,
      format(new Date(achievement.date), "yyyy-MM-dd"),
      achievement.description || "",
      achievement.documents.length.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `achievements-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "text" | "json" | "csv") => {
    setIsExporting(true);
    try {
      switch (format) {
        case "text":
          exportToText();
          break;
        case "json":
          exportToJSON();
          break;
        case "csv":
          exportToCSV();
          break;
      }

      toast({
        title: "Success",
        description: `Achievements exported as ${format.toUpperCase()}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export achievements",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Achievements</DialogTitle>
          <DialogDescription>
            Choose a format to export your achievements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Total achievements: {achievements.length}
            </p>
          </div>

          <div className="grid gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport("text")}
              disabled={isExporting}
              className="justify-start"
              aria-label="Export as text file"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export as Text (.txt)
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport("json")}
              disabled={isExporting}
              className="justify-start"
              aria-label="Export as JSON file"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export as JSON (.json)
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="justify-start"
              aria-label="Export as CSV file"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export as CSV (.csv)
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
