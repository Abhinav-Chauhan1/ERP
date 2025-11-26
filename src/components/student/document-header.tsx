"use client";

import { FileText, File, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DocumentHeaderProps {
  totalPersonalDocs: number;
  totalSchoolDocs: number;
}

export function DocumentHeader({ totalPersonalDocs, totalSchoolDocs }: DocumentHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
              <p className="text-3xl font-bold">
                {totalPersonalDocs + totalSchoolDocs}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <File className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">My Documents</p>
              <p className="text-3xl font-bold">
                {totalPersonalDocs}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <FolderOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">School Documents</p>
              <p className="text-3xl font-bold">
                {totalSchoolDocs}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
