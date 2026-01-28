/**
 * Enhanced Onboarding Management Component
 * Task 9.5: Implement independent onboarding progress tracking per school
 * Requirements: 9.5 - THE System SHALL track onboarding progress per school independently
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  PlayCircle, 
  RotateCcw,
  Calendar,
  User,
  School,
  TrendingUp,
  AlertTriangle,
  Pause,
  X,
  Info,
  Timer,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { 
  getSchoolOnboardingProgress,
  resetSchoolOnboardingProgress,
  initializeSchoolOnboardingProgress
} from "@/lib/actions/onboarding-progress-actions";
import { SchoolOnboardingProgress, OnboardingStepProgress, ONBOARDING_STEPS } from "@/lib/models/onboarding-progress";
import { formatDistanceToNow } from "date-fns";

interface EnhancedOnboardingManagementProps {
  school: {
    id: string;
    name: string;
    isOnboarded: boolean;
    onboardingStep?: number;
    onboardingCompletedAt?: Date | null;
    createdAt: Date;
    primaryAdmin?: {
      name: string;
      email: string;
    } | null;
  };
  onUpdate?: () => void;
}

export function EnhancedOnboardingManagement({ school, onUpdate }: EnhancedOnboardingManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<SchoolOnboardingProgress | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Load detailed progress on component mount
  useEffect(() => {
    loadProgress();
  }, [school.id]);

  const loadProgress = async () => {
    try {
      const result = await getSchoolOnboardingProgress(school.id);
      if (result.success) {
        setProgress(result.data);
      } else {
        // Initialize progress if it doesn't exist
        const initResult = await initializeSchoolOnboardingProgress(school.id);
        if (initResult.success) {
          setProgress(initResult.data.progress);
        }
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const handleResetOnboarding = async () => {
    setIsLoading(true);
    try {
      const result = await resetSchoolOnboardingProgress(school.id);
      if (result.success) {
        toast.success("Onboarding progress reset successfully");
        setProgress(result.data.progress);
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to reset onboarding");
      }
    } catch (error) {
      toast.error("Failed to reset onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatusInfo = (step: OnboardingStepProgress) => {
    switch (step.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          badge: <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>,
          color: "text-green-600"
        };
      case 'in_progress':
        return {
          icon: <Clock className="h-4 w-4 text-blue-600" />,
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>,
          color: "text-blue-600"
        };
      case 'failed':
        return {
          icon: <X className="h-4 w-4 text-red-600" />,
          badge: <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Failed</Badge>,
          color: "text-red-600"
        };
      case 'skipped':
        return {
          icon: <Pause className="h-4 w-4 text-gray-600" />,
          badge: <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Skipped</Badge>,
          color: "text-gray-600"
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
          badge: <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Not Started</Badge>,
          color: "text-gray-400"
        };
    }
  };

  const getOverallStatusInfo = () => {
    if (!progress) return { status: "loading", badge: null, description: "Loading...", color: "text-gray-500" };

    if (progress.isOnboarded) {
      return {
        status: "completed",
        badge: (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        ),
        description: "School setup is complete and active",
        color: "text-green-600"
      };
    }

    const failedSteps = progress.steps.filter(s => s.status === 'failed').length;
    const inProgressSteps = progress.steps.filter(s => s.status === 'in_progress').length;
    
    if (failedSteps > 0) {
      return {
        status: "failed",
        badge: (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Issues Found
          </Badge>
        ),
        description: `${failedSteps} step(s) failed, needs attention`,
        color: "text-red-600"
      };
    }

    if (inProgressSteps > 0) {
      return {
        status: "in-progress",
        badge: (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Activity className="h-3 w-3 mr-1" />
            {progress.completionPercentage}% Complete
          </Badge>
        ),
        description: `Step ${progress.currentStep} of ${progress.totalSteps}`,
        color: "text-blue-600"
      };
    }

    return {
      status: "not-started",
      badge: (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          <Clock className="h-3 w-3 mr-1" />
          Not Started
        </Badge>
      ),
      description: "Onboarding has not been initiated",
      color: "text-gray-600"
    };
  };

  const statusInfo = getOverallStatusInfo();

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Loading Onboarding Progress...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Enhanced Onboarding Management
            </CardTitle>
            <CardDescription>
              Detailed progress tracking for {school.name}
            </CardDescription>
          </div>
          {statusInfo.badge}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="steps">Step Details</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Progress Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Progress Overview</h3>
                <div className="text-sm text-muted-foreground">
                  {progress.completionPercentage}% Complete
                </div>
              </div>
              <Progress value={progress.completionPercentage} className="w-full" />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className={`text-lg font-semibold ${statusInfo.color}`}>
                  {statusInfo.description}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Current Step</div>
                <div className="text-lg font-semibold">
                  {progress.currentStep} of {progress.totalSteps}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Started</div>
                <div className="text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(progress.startedAt), { addSuffix: true })}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Last Activity</div>
                <div className="text-sm flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {formatDistanceToNow(new Date(progress.lastActivityAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {progress.steps.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {progress.steps.filter(s => s.status === 'in_progress').length}
                </div>
                <div className="text-sm text-blue-600">In Progress</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {progress.steps.filter(s => s.status === 'failed').length}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {progress.steps.filter(s => s.status === 'not_started').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="steps" className="space-y-4">
            <h3 className="text-lg font-semibold">Step-by-Step Progress</h3>
            <div className="space-y-3">
              {progress.steps.map((step) => {
                const stepDef = ONBOARDING_STEPS.find(def => def.step === step.step);
                const statusInfo = getStepStatusInfo(step);
                
                return (
                  <div
                    key={step.step}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {statusInfo.icon}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{stepDef?.title || `Step ${step.step}`}</h4>
                          <p className="text-sm text-muted-foreground">
                            {stepDef?.description || "No description available"}
                          </p>
                        </div>
                        {statusInfo.badge}
                      </div>
                      
                      {/* Step metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Attempts:</span> {step.attempts}
                        </div>
                        {step.startedAt && (
                          <div>
                            <span className="font-medium">Started:</span> {formatDistanceToNow(new Date(step.startedAt), { addSuffix: true })}
                          </div>
                        )}
                        {step.completedAt && (
                          <div>
                            <span className="font-medium">Completed:</span> {formatDistanceToNow(new Date(step.completedAt), { addSuffix: true })}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Updated:</span> {formatDistanceToNow(new Date(step.lastUpdatedAt), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Error message */}
                      {step.errorMessage && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Error:</strong> {step.errorMessage}
                        </div>
                      )}

                      {/* Step metadata */}
                      {Object.keys(step.metadata || {}).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(step.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h3 className="text-lg font-semibold">Progress Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Time Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Started:</span>
                    <span className="text-sm">{new Date(progress.startedAt).toLocaleDateString()}</span>
                  </div>
                  {progress.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed:</span>
                      <span className="text-sm">{new Date(progress.completedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Activity:</span>
                    <span className="text-sm">{formatDistanceToNow(new Date(progress.lastActivityAt), { addSuffix: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Version:</span>
                    <span className="text-sm">{progress.metadata.version}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Step Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Step Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['setup', 'configuration', 'content', 'verification'].map(category => {
                      const categorySteps = ONBOARDING_STEPS.filter(def => def.category === category);
                      const completedInCategory = categorySteps.filter(def => {
                        const stepProgress = progress.steps.find(s => s.step === def.step);
                        return stepProgress?.status === 'completed';
                      }).length;
                      
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{category}</span>
                            <span>{completedInCategory}/{categorySteps.length}</span>
                          </div>
                          <Progress 
                            value={(completedInCategory / categorySteps.length) * 100} 
                            className="h-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional metadata */}
            {progress.metadata.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{progress.metadata.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleResetOnboarding}
            disabled={isLoading}
            variant="outline"
            className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Progress
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-4">
          <strong>Enhanced Tracking:</strong> This system provides detailed, independent progress tracking for each school's onboarding journey. 
          Each step is tracked with timestamps, attempt counts, error messages, and custom metadata. 
          Progress is isolated per school and can be reset or analyzed independently.
        </div>
      </CardContent>
    </Card>
  );
}