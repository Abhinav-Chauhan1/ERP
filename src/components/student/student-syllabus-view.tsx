"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Circle,
  FileIcon,
  FileVideo,
  FileImage,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  order: number;
}

interface SubModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  documents: Document[];
  progress: Array<{
    id: string;
    completed: boolean;
    completedAt: Date | null;
  }>;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  chapterNumber: number;
  order: number;
  subModules: SubModule[];
  documents: Document[];
}

interface StudentSyllabusViewProps {
  modules: Module[];
  syllabusTitle?: string;
  syllabusDescription?: string;
}

export function StudentSyllabusView({
  modules,
  syllabusTitle,
  syllabusDescription,
}: StudentSyllabusViewProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Calculate completion statistics
  const totalSubModules = modules.reduce(
    (sum, module) => sum + module.subModules.length,
    0
  );
  
  const completedSubModules = modules.reduce(
    (sum, module) =>
      sum +
      module.subModules.filter(
        (subModule) => subModule.progress.some((p) => p.completed)
      ).length,
    0
  );

  const completionPercentage =
    totalSubModules > 0
      ? Math.round((completedSubModules / totalSubModules) * 100)
      : 0;

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="h-4 w-4" />;
    } else if (fileType.includes("video")) {
      return <FileVideo className="h-4 w-4" />;
    } else if (fileType.includes("image")) {
      return <FileImage className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Check if a sub-module is completed
  const isSubModuleCompleted = (subModule: SubModule): boolean => {
    return subModule.progress.some((p) => p.completed);
  };

  // Calculate module completion
  const getModuleCompletion = (module: Module): number => {
    if (module.subModules.length === 0) return 0;
    const completed = module.subModules.filter(isSubModuleCompleted).length;
    return Math.round((completed / module.subModules.length) * 100);
  };

  return (
    <div className="space-y-4 md:space-y-6" role="main" aria-label="Course syllabus">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" aria-hidden="true" />
                {syllabusTitle || "Course Syllabus"}
              </CardTitle>
              {syllabusDescription && (
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  {syllabusDescription}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="text-left md:text-right" role="region" aria-label="Course completion status">
                <div className="text-2xl md:text-3xl font-bold text-primary" aria-label={`${completionPercentage} percent complete`}>
                  {completionPercentage}%
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {completedSubModules} of {totalSubModules} topics covered
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modules List */}
      <div className="space-y-4" role="region" aria-label="Course modules">
        {modules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-muted-foreground">
                No Modules Available
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                The syllabus structure has not been defined yet
              </p>
            </CardContent>
          </Card>
        ) : (
          modules.map((module) => {
            const moduleCompletion = getModuleCompletion(module);
            const isCompleted = moduleCompletion === 100;

            return (
              <Card key={module.id} className="overflow-hidden">
                <Accordion
                  type="multiple"
                  value={expandedModules}
                  onValueChange={setExpandedModules}
                >
                  <AccordionItem value={module.id} className="border-0">
                    <AccordionTrigger 
                      className="hover:no-underline px-4 md:px-6 py-4 hover:bg-accent/50 transition-colors"
                      aria-label={`Chapter ${module.chapterNumber}: ${module.title}, ${moduleCompletion}% complete`}
                    >
                      <div className="flex items-start gap-3 md:gap-4 text-left w-full">
                        {/* Chapter Number Badge */}
                        <div className="flex-shrink-0">
                          <div
                            className={cn(
                              "w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-base md:text-lg",
                              isCompleted
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                : "bg-primary/10 text-primary"
                            )}
                            aria-label={`Chapter ${module.chapterNumber}`}
                          >
                            {module.chapterNumber}
                          </div>
                        </div>

                        {/* Module Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base md:text-lg">
                              {module.title}
                            </h3>
                            {isCompleted && (
                              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" aria-label="Completed" />
                            )}
                          </div>
                          {module.description && (
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                              {module.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 text-xs md:text-sm text-muted-foreground">
                            <span>
                              <span className="sr-only">Number of topics:</span>
                              {module.subModules.length} topic
                              {module.subModules.length !== 1 ? "s" : ""}
                            </span>
                            {module.documents.length > 0 && (
                              <>
                                <span aria-hidden="true">•</span>
                                <span>
                                  <span className="sr-only">Number of documents:</span>
                                  {module.documents.length} document
                                  {module.documents.length !== 1 ? "s" : ""}
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">•</span>
                            <span className="font-medium text-primary">
                              <span className="sr-only">Completion:</span>
                              {moduleCompletion}% complete
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 md:px-6 pb-4">
                      <div className="space-y-4 pt-2">
                        {/* Module-level Documents */}
                        {module.documents.length > 0 && (
                          <div className="space-y-2" role="region" aria-label="Module resources">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Module Resources
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2" role="list">
                              {module.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                  role="listitem"
                                >
                                  <div className="flex-shrink-0 text-primary">
                                    {getFileIcon(doc.fileType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {doc.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(doc.fileSize)}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      asChild
                                    >
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`View ${doc.title}`}
                                      >
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                        <span className="sr-only">View</span>
                                      </a>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      asChild
                                    >
                                      <a
                                        href={doc.fileUrl}
                                        download={doc.filename}
                                        aria-label={`Download ${doc.title}`}
                                      >
                                        <Download className="h-4 w-4" aria-hidden="true" />
                                        <span className="sr-only">Download</span>
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sub-modules */}
                        {module.subModules.length > 0 && (
                          <div className="space-y-2" role="region" aria-label="Topics">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Topics
                            </h4>
                            <div className="space-y-2" role="list">
                              {module.subModules.map((subModule, index) => {
                                const completed = isSubModuleCompleted(subModule);

                                return (
                                  <div
                                    key={subModule.id}
                                    className={cn(
                                      "rounded-lg border p-3 md:p-4 transition-colors",
                                      completed
                                        ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                                        : "bg-card hover:bg-accent/50"
                                    )}
                                    role="listitem"
                                  >
                                    <div className="flex items-start gap-2 md:gap-3">
                                      {/* Completion Indicator */}
                                      <div className="flex-shrink-0 mt-0.5">
                                        {completed ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Covered" />
                                        ) : (
                                          <Circle className="h-5 w-5 text-muted-foreground" aria-label="Not covered" />
                                        )}
                                      </div>

                                      {/* Sub-module Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <h5 className="font-medium text-sm md:text-base">
                                              {index + 1}. {subModule.title}
                                            </h5>
                                            {subModule.description && (
                                              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                                {subModule.description}
                                              </p>
                                            )}
                                          </div>
                                          {completed && (
                                            <Badge
                                              variant="secondary"
                                              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 flex-shrink-0"
                                            >
                                              Covered
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Sub-module Documents */}
                                        {subModule.documents.length > 0 && (
                                          <div className="mt-3 space-y-2" role="region" aria-label="Topic materials">
                                            {subModule.documents.map((doc) => (
                                              <div
                                                key={doc.id}
                                                className="flex items-center gap-2 md:gap-3 p-2 rounded-md bg-background/50 border"
                                                role="listitem"
                                              >
                                                <div className="flex-shrink-0 text-primary">
                                                  {getFileIcon(doc.fileType)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">
                                                    {doc.title}
                                                  </p>
                                                  {doc.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                      {doc.description}
                                                    </p>
                                                  )}
                                                  <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(doc.fileSize)}
                                                  </p>
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    asChild
                                                  >
                                                    <a
                                                      href={doc.fileUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      aria-label={`View ${doc.title}`}
                                                    >
                                                      <Eye className="h-4 w-4" aria-hidden="true" />
                                                      <span className="sr-only">
                                                        View
                                                      </span>
                                                    </a>
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    asChild
                                                  >
                                                    <a
                                                      href={doc.fileUrl}
                                                      download={doc.filename}
                                                      aria-label={`Download ${doc.title}`}
                                                    >
                                                      <Download className="h-4 w-4" aria-hidden="true" />
                                                      <span className="sr-only">
                                                        Download
                                                      </span>
                                                    </a>
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {module.subModules.length === 0 &&
                          module.documents.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <p className="text-sm">
                                No content available for this module yet
                              </p>
                            </div>
                          )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
