"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PromotionWizard, PromotionWizardData } from "@/components/academic/promotion/promotion-wizard";
import { StudentSelectionTable, StudentForPromotion } from "@/components/academic/promotion/student-selection-table";
import { PromotionPreview } from "@/components/academic/promotion/promotion-preview";
import { PromotionConfirmDialog } from "@/components/academic/promotion/promotion-confirm-dialog";
import { PromotionProgressDialog } from "@/components/academic/promotion/promotion-progress-dialog";
import { PromotionResultsDialog } from "@/components/academic/promotion/promotion-results-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStudentsForPromotion, previewPromotion, executeBulkPromotion } from "@/lib/actions/promotionActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";

interface PromotionManagerContentProps {
  userId: string;
}

export function PromotionManagerContent({ userId }: PromotionManagerContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data for dropdowns
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  
  // Students data
  const [students, setStudents] = useState<StudentForPromotion[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Preview data
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Execution state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    
    try {
      const [yearsResult, classesResult] = await Promise.all([
        getAcademicYears(),
        getClasses(),
      ]);

      if (yearsResult.success && yearsResult.data) {
        setAcademicYears(yearsResult.data);
      } else {
        throw new Error(yearsResult.error || "Failed to load academic years");
      }

      if (classesResult.success && classesResult.data) {
        setClasses(classesResult.data);
      } else {
        throw new Error(classesResult.error || "Failed to load classes");
      }
    } catch (err: any) {
      console.error("Error loading initial data:", err);
      setError(err.message || "Failed to load data");
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Load students when source class is selected
  async function loadStudents(classId: string, sectionId?: string) {
    setLoadingStudents(true);
    setError(null);
    
    try {
      const result = await getStudentsForPromotion({
        classId,
        sectionId,
      });
      
      if (result.success && result.data) {
        // Transform the data to match StudentForPromotion interface
        const transformedStudents: StudentForPromotion[] = result.data.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          admissionId: s.admissionId,
          rollNumber: s.rollNumber,
          className: s.className,
          sectionName: s.sectionName,
          hasWarnings: s.warnings && s.warnings.length > 0,
          warnings: s.warnings,
        }));
        
        setStudents(transformedStudents);
      } else {
        throw new Error(result.error || "Failed to load students");
      }
    } catch (err: any) {
      console.error("Error loading students:", err);
      setError(err.message || "Failed to load students");
      toast.error(err.message || "Failed to load students");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  // Load preview data
  async function loadPreview(data: PromotionWizardData) {
    setLoadingPreview(true);
    setError(null);
    
    try {
      const result = await previewPromotion({
        sourceClassId: data.sourceClassId,
        sourceSectionId: data.sourceSectionId,
        targetAcademicYearId: data.targetAcademicYearId,
        targetClassId: data.targetClassId,
        targetSectionId: data.targetSectionId,
        studentIds: data.selectedStudentIds,
      });
      
      if (result.success && result.data) {
        setPreviewData(result.data);
      } else {
        throw new Error(result.error || "Failed to load preview");
      }
    } catch (err: any) {
      console.error("Error loading preview:", err);
      setError(err.message || "Failed to load preview");
      toast.error(err.message || "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  }

  // Load preview when moving to step 2
  useEffect(() => {
    // This will be triggered by the wizard when needed
  }, []);

  // Execute promotion
  async function executePromotion(data: PromotionWizardData) {
    setExecuting(true);
    setShowProgressDialog(true);
    setError(null);
    
    try {
      const result = await executeBulkPromotion({
        sourceClassId: data.sourceClassId,
        sourceSectionId: data.sourceSectionId,
        targetAcademicYearId: data.targetAcademicYearId,
        targetClassId: data.targetClassId,
        targetSectionId: data.targetSectionId,
        studentIds: data.selectedStudentIds,
        excludedStudents: data.excludedStudents,
        rollNumberStrategy: data.rollNumberStrategy,
        rollNumberMapping: data.rollNumberMapping,
        sendNotifications: data.sendNotifications,
      });
      
      if (result.success && result.data) {
        setExecutionResults(result.data);
        setShowProgressDialog(false);
        setShowResultsDialog(true);
        
        if (result.data.summary.failed === 0) {
          toast.success(`Successfully promoted ${result.data.summary.promoted} students`);
        } else {
          toast.error(`Promotion completed with ${result.data.summary.failed} failures`);
        }
      } else {
        throw new Error(result.error || "Failed to execute promotion");
      }
    } catch (err: any) {
      console.error("Error executing promotion:", err);
      setError(err.message || "Failed to execute promotion");
      toast.error(err.message || "Failed to execute promotion");
      setShowProgressDialog(false);
    } finally {
      setExecuting(false);
    }
  }

  // Handle wizard completion
  function handleWizardComplete(data: PromotionWizardData) {
    // Show confirmation dialog before executing
    setShowConfirmDialog(true);
  }

  // Handle cancel
  function handleCancel() {
    router.push("/admin/academic");
  }

  // Handle results dialog close
  function handleResultsClose() {
    setShowResultsDialog(false);
    router.push("/admin/academic/promotion/history");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading promotion manager...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/admin/academic">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Academic
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">Student Promotion</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Promotion</h1>
        <p className="text-muted-foreground mt-1">
          Promote students to the next academic year in bulk
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Promotion Wizard */}
      <PromotionWizard onComplete={handleWizardComplete} onCancel={handleCancel}>
        {({ currentStep, data, updateData, nextStep, prevStep, canGoNext, canGoPrev }) => {
          // Load preview when moving from step 1 to step 2
          const handleNext = () => {
            if (currentStep === 0 && canGoNext) {
              // Moving to preview step - load preview data
              loadPreview(data);
            }
            nextStep();
          };

          return (
            <>
              {/* Step 1: Select Students */}
              {currentStep === 0 && (
              <div className="space-y-4">
                {/* Source and Target Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Promotion Configuration</CardTitle>
                    <CardDescription>
                      Select source class and target academic year/class
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Source Class */}
                      <div className="space-y-2">
                        <Label>Source Class</Label>
                        <Select
                          value={data.sourceClassId}
                          onValueChange={(value) => {
                            const selectedClass = classes.find((c) => c.id === value);
                            updateData({
                              sourceClassId: value,
                              sourceClassName: selectedClass?.name,
                              sourceSectionId: undefined,
                              sourceSectionName: undefined,
                              selectedStudentIds: [],
                            });
                            setSections(selectedClass?.sections || []);
                            setStudents([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Source Section (Optional) */}
                      {sections.length > 0 && (
                        <div className="space-y-2">
                          <Label>Source Section (Optional)</Label>
                          <Select
                            value={data.sourceSectionId || "all"}
                            onValueChange={(value) => {
                              const selectedSection = sections.find((s) => s.id === value);
                              updateData({
                                sourceSectionId: value === "all" ? undefined : value,
                                sourceSectionName: value === "all" ? undefined : selectedSection?.name,
                                selectedStudentIds: [],
                              });
                              setStudents([]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All sections" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sections</SelectItem>
                              {sections.map((section) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Target Academic Year */}
                      <div className="space-y-2">
                        <Label>Target Academic Year</Label>
                        <Select
                          value={data.targetAcademicYearId}
                          onValueChange={(value) => {
                            const selectedYear = academicYears.find((y) => y.id === value);
                            updateData({
                              targetAcademicYearId: value,
                              targetAcademicYearName: selectedYear?.name,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target year" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year.id} value={year.id}>
                                {year.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Target Class */}
                      <div className="space-y-2">
                        <Label>Target Class</Label>
                        <Select
                          value={data.targetClassId}
                          onValueChange={(value) => {
                            const selectedClass = classes.find((c) => c.id === value);
                            updateData({
                              targetClassId: value,
                              targetClassName: selectedClass?.name,
                              targetSectionId: undefined,
                              targetSectionName: undefined,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Load Students Button */}
                    {data.sourceClassId && data.targetAcademicYearId && data.targetClassId && (
                      <Button
                        onClick={() => loadStudents(data.sourceClassId, data.sourceSectionId)}
                        disabled={loadingStudents}
                      >
                        {loadingStudents ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading Students...
                          </>
                        ) : (
                          "Load Students"
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Student Selection Table */}
                {students.length > 0 && (
                  <StudentSelectionTable
                    students={students}
                    selectedStudentIds={data.selectedStudentIds}
                    onSelectionChange={(ids) => updateData({ selectedStudentIds: ids })}
                    isLoading={loadingStudents}
                  />
                )}
              </div>
            )}

            {/* Step 2: Preview */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {loadingPreview || !previewData ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading preview...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <PromotionPreview
                    data={data}
                    previewData={previewData}
                    onExcludeStudent={(studentId, reason) => {
                      updateData({
                        excludedStudents: [
                          ...data.excludedStudents,
                          { studentId, reason },
                        ],
                        selectedStudentIds: data.selectedStudentIds.filter(
                          (id) => id !== studentId
                        ),
                      });
                    }}
                  />
                )}
              </div>
            )}

            {/* Step 3: Execute (handled by dialogs) */}
            {currentStep === 2 && (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-muted-foreground">
                      Click "Review & Execute" to proceed with promotion
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        );
        }}
      </PromotionWizard>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <PromotionConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={(confirmedData) => {
            setShowConfirmDialog(false);
            executePromotion(confirmedData);
          }}
          data={{} as PromotionWizardData}
          previewData={previewData}
        />
      )}

      {/* Progress Dialog */}
      {showProgressDialog && (
        <PromotionProgressDialog
          open={showProgressDialog}
          progress={executing ? 50 : 100}
          status={executing ? "Processing promotion..." : "Completed"}
        />
      )}

      {/* Results Dialog */}
      {showResultsDialog && executionResults && (
        <PromotionResultsDialog
          open={showResultsDialog}
          onOpenChange={setShowResultsDialog}
          results={executionResults}
          onClose={handleResultsClose}
        />
      )}
    </div>
  );
}
