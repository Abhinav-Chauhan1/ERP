"use client";

import { FileText, File, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DocumentHeaderProps {
  totalPersonalDocs: number;
  totalSchoolDocs: number;
}

export function DocumentHeader({ totalPersonalDocs, totalSchoolDocs }: DocumentHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-600">Total Documents</p>
            <p className="text-2xl font-bold text-blue-800">
              {totalPersonalDocs + totalSchoolDocs}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <File className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-600">My Documents</p>
            <p className="text-2xl font-bold text-green-800">
              {totalPersonalDocs}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <FolderOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-600">School Documents</p>
            <p className="text-2xl font-bold text-amber-800">
              {totalSchoolDocs}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
