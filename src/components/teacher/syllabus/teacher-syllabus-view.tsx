"use client";

/**
 * Teacher Syllabus View Component
 * Read-only view with progress tracking for teachers
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Circle, 
  Clock,
  FileIcon,
  FileImage,
  FileVideo,
  File
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markSubModuleComplete } from "@/lib/actions/progressTrackingActions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Document {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SubModuleProgress {
  id: string;
  completed: boolean;
  completedAt: Date | null;
}

interface SubModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  documents: Document[];
  progress: SubModuleProgress[];
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  chapterNumber: number;
  order: number;
  subModules: SubModule[];
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

interface TeacherSyllabusViewProps {
  modules: Module[];
  syllabusId: string;
  teacherId: string;
  subjectName: string;
  className?: string;
}

export function TeacherSyllabusView({
  modules,
  syllabusId,
  teacherId,
  subjectName,
  className
}: TeacherSyllabusViewProps) {
  const { toast } = useToast();
  const [loadingSubModules, setLoadingSubModules] = useState<Set<string>>(new Set());

  // Calculate overall progress
  const calculateModuleProgress = (module: Module) => {
    const totalSubModules = module.subModules.length;
    if (totalSubModules === 0) return 0;
    
    const completedSubModules = module.subModules.filter(
      (subModule) => subModule.progress.length > 0 && subModule.progress[0].completed
    ).length;
    
    return Math.round((completedSubModules / totalSubModules) * 100);
  };

  const calculateOverallProgress = () => {
    if (modules.length === 0) return 0;
    
    const totalProgress = modules.reduce((sum, module) => {
      return sum + calculateModuleProgress(module);
    }, 0);
    
    return Math.round(totalProgress / modules.length);
  };

  const getTotalSubModules = () => {
    return modules.reduce((sum, module) => sum + module.subModules.length, 0);
  };

  const getCompletedSubModules = () => {
    return modules.reduce((sum, module) => {
      return sum + module.subModules.filter(
        (subModule) => subModule.progress.length > 0 && subModule.progress[0].completed
      ).length;
    }, 0);
  };

  const handleSubModuleToggle = async (subModuleId: string, currentStatus: boolean) => {
    setLoadingSubModules(prev => new Set(prev).add(subModuleId));

    try {
      const result = await markSubModuleComplete({
        subModuleId,
        teacherId,
        completed: !currentStatus
      });

      if (result.success) {
        toast({
          title: !currentStatus ? "Sub-module completed" : "Sub-module marked incomplete",
          description: "Progress updated successfully",
        });
        
        // Refresh the page to show updated progress
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update progress",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingSubModules(prev => {
        const newSet = new Set(prev);
        newSet.delete(subModuleId);
        return newSet;
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <FileImage className="h-4 w-4" />;
    } else if (fileType.startsWith("video/")) {
      return <FileVideo className="h-4 w-4" />;
    } else if (fileType === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const overallProgress = calculateOverallProgress();
  const totalSubModules = getTotalSubModules();
  const completedSubModules = getCompletedSubModules();
  const lastUpdated = modules.length > 0 
    ? format(new Date(Math.max(...modules.map(m => new Date(m.updatedAt).getTime()))), "PPP")
    : "N/A";

  return (
    <div className={cn("space-y-4 md:space-y-6", className)} role="main" aria-label="Syllabus progress tracking">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-lg md:text-xl">{subjectName} - Syllabus Progress</CardTitle>
              <CardDescription className="text-sm">
                Track your teaching progress and access course materials
              </CardDescription>
            </div>
            <Badge 
              variant={overallProgress >= 75 ? "default" : overallProgress >= 50 ? "secondary" : "outline"}
              className="self-start"
              aria-label={`Progress status: ${overallProgress >= 75 ? "On Track" : overallProgress >= 50 ? "In Progress" : "Getting Started"}`}
            >
              {overallProgress >= 75 ? "On Track" : overallProgress >= 50 ? "In Progress" : "Getting Started"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2" role="region" aria-label="Overall completion progress">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-semibold" aria-label={`${overallProgress} percent complete`}>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" aria-label={`Progress bar showing ${overallProgress}% completion`} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
              <span>{completedSubModules} of {totalSubModules} topics completed</span>
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Chapters</p>
              <p className="text-xl md:text-2xl font-bold" aria-label={`${modules.length} total chapters`}>{modules.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-500" aria-label={`${modules.filter(m => calculateModuleProgress(m) === 100).length} completed chapters`}>
                {modules.filter(m => calculateModuleProgress(m) === 100).length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-500" aria-label={`${modules.filter(m => {
                  const progress = calculateModuleProgress(m);
                  return progress > 0 && progress < 100;
                }).length} chapters in progress`}>
                {modules.filter(m => {
                  const progress = calculateModuleProgress(m);
                  return progress > 0 && progress < 100;
                }).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Course Modules</CardTitle>
          <CardDescription className="text-sm">
            Click on a chapter to view topics and materials. Check off topics as you complete them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" role="status">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
              <p>No modules available yet</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4" role="list" aria-label="Course modules">
              {modules.map((module) => {
                const moduleProgress = calculateModuleProgress(module);
                const isModuleComplete = moduleProgress === 100;
                const completedCount = module.subModules.filter(
                  (sm) => sm.progress.length > 0 && sm.progress[0].completed
                ).length;

                return (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    className="border rounded-lg px-3 md:px-4"
                    role="listitem"
                  >
                    <AccordionTrigger 
                      className="hover:no-underline"
                      aria-label={`Chapter ${module.chapterNumber}: ${module.title}, ${moduleProgress}% complete`}
                    >
                      <div className="flex items-center justify-between w-full pr-2 md:pr-4">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          {isModuleComplete ? (
                            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-500 flex-shrink-0" aria-label="Completed" />
                          ) : moduleProgress > 0 ? (
                            <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-500 flex-shrink-0" aria-label="In progress" />
                          ) : (
                            <Circle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" aria-label="Not started" />
                          )}
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-semibold text-sm md:text-base truncate">
                              Chapter {module.chapterNumber}: {module.title}
                            </div>
                            {module.description && (
                              <div className="text-xs md:text-sm text-muted-foreground font-normal line-clamp-2">
                                {module.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs md:text-sm font-medium">{moduleProgress}%</div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {completedCount}/{module.subModules.length} topics
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-2">
                      <div className="space-y-4">
                        {/* Module Progress Bar */}
                        <div className="space-y-2 px-2" role="region" aria-label="Module progress">
                          <Progress value={moduleProgress} className="h-2" aria-label={`Module ${moduleProgress}% complete`} />
                        </div>

                        {/* Module-level Documents */}
                        {module.documents.length > 0 && (
                          <div className="space-y-2 px-2" role="region" aria-label="Chapter resources">
                            <h4 className="text-sm font-semibold text-muted-foreground">
                              Chapter Resources
                            </h4>
                            <div className="grid gap-2" role="list">
                              {module.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between p-2 md:p-3 border rounded-lg bg-muted/50"
                                  role="listitem"
                                >
                                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                    {getFileIcon(doc.fileType)}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs md:text-sm font-medium truncate">{doc.title}</p>
                                      {doc.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {doc.description}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        {formatFileSize(doc.fileSize)}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    aria-label={`Download ${doc.title}`}
                                  >
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                    >
                                      <Download className="h-4 w-4" aria-hidden="true" />
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sub-modules */}
                        {module.subModules.length > 0 ? (
                          <div className="space-y-2 px-2" role="region" aria-label="Topics">
                            <h4 className="text-sm font-semibold text-muted-foreground">
                              Topics
                            </h4>
                            <div className="space-y-3" role="list">
                              {module.subModules.map((subModule) => {
                                const isCompleted = subModule.progress.length > 0 && subModule.progress[0].completed;
                                const isLoading = loadingSubModules.has(subModule.id);

                                return (
                                  <div
                                    key={subModule.id}
                                    className={cn(
                                      "border rounded-lg p-3 md:p-4 space-y-3 transition-colors",
                                      isCompleted && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                                    )}
                                    role="listitem"
                                  >
                                    <div className="flex items-start gap-2 md:gap-3">
                                      <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={() => handleSubModuleToggle(subModule.id, isCompleted)}
                                        disabled={isLoading}
                                        className="mt-1"
                                        aria-label={`Mark ${subModule.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <h5 className={cn(
                                              "font-medium text-sm md:text-base",
                                              isCompleted && "line-through text-muted-foreground"
                                            )}>
                                              {subModule.title}
                                            </h5>
                                            {subModule.description && (
                                              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {subModule.description}
                                              </p>
                                            )}
                                          </div>
                                          {isCompleted && subModule.progress[0].completedAt && (
                                            <Badge variant="outline" className="text-xs flex-shrink-0">
                                              Completed {format(new Date(subModule.progress[0].completedAt), "PP")}
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Sub-module Documents */}
                                        {subModule.documents.length > 0 && (
                                          <div className="mt-3 space-y-2" role="region" aria-label="Topic materials">
                                            <p className="text-xs font-semibold text-muted-foreground">
                                              Materials
                                            </p>
                                            <div className="grid gap-2" role="list">
                                              {subModule.documents.map((doc) => (
                                                <div
                                                  key={doc.id}
                                                  className="flex items-center justify-between p-2 border rounded bg-background"
                                                  role="listitem"
                                                >
                                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {getFileIcon(doc.fileType)}
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-xs font-medium truncate">{doc.title}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(doc.fileSize)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    aria-label={`Download ${doc.title}`}
                                                  >
                                                    <a
                                                      href={doc.fileUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      download
                                                    >
                                                      <Download className="h-3 w-3" aria-hidden="true" />
                                                    </a>
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground px-2" role="status">
                            No topics available for this chapter
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
