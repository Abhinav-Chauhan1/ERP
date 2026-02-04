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
  Settings,
  Activity,
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SetupWizardManagementProps {
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

interface OnboardingStatus {
  basic: {
    id: string;
    name: string;
    isOnboarded: boolean;
    onboardingStep: number;
    onboardingCompletedAt: Date | null;
    requiresSetup: boolean;
  };
  detailed?: {
    schoolId: string;
    isOnboarded: boolean;
    currentStep: number;
    totalSteps: number;
    completionPercentage: number;
    startedAt: Date;
    completedAt?: Date;
    lastActivityAt: Date;
    steps: Array<{
      step: number;
      status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'failed';
      startedAt?: Date;
      completedAt?: Date;
      lastUpdatedAt: Date;
      attempts: number;
      errorMessage?: string;
      metadata?: Record<string, any>;
      completedBy?: string;
    }>;
    metadata: {
      version: string;
      assignedTo?: string;
      notes?: string;
    };
  };
}

const ONBOARDING_STEPS = [
  { step: 1, title: "School Information", description: "Basic school details and contact information" },
  { step: 2, title: "Admin Account Verification", description: "Administrator account setup and email verification" },
  { step: 3, title: "Academic Year Configuration", description: "Current academic year setup and calendar" },
  { step: 4, title: "Terms & Semesters", description: "Academic terms and semester structure" },
  { step: 5, title: "Classes & Sections", description: "Class structure and section organization" },
  { step: 6, title: "Grade Scale Setup", description: "Grading system and evaluation criteria" },
  { step: 7, title: "System Verification", description: "Final setup verification and system activation" },
];

export function SetupWizardManagement({ school, onUpdate }: SetupWizardManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadOnboardingStatus();
  }, [school.id]);

  const loadOnboardingStatus = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${school.id}/onboarding`);
      const result = await response.json();
      
      if (result.success) {
        setOnboardingStatus(result.data);
      } else {
        toast.error("Failed to load onboarding status");
      }
    } catch (error) {
      console.error("Error loading onboarding status:", error);
      toast.error("Failed to load onboarding status");
    }
  };

  const handleResetOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${school.id}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.data?.message || "Onboarding reset successfully");
        await loadOnboardingStatus();
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

  const handleLaunchSetupWizard = async () => {
    setIsLoading(true);
    try {
      console.log("🚀 Launching setup wizard for school:", school.id);
      
      const response = await fetch(`/api/super-admin/schools/${school.id}/onboarding`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ action: "launch" }),
      });
      
      console.log("📡 API Response status:", response.status);
      console.log("📡 API Response headers:", Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log("📋 API Response data:", result);
      
      if (result.success) {
        toast.success(result.data?.message || "Setup wizard launched successfully");
        await loadOnboardingStatus();
        onUpdate?.();
      } else {
        console.error("❌ Setup wizard launch failed:", result);
        toast.error(result.error || "Failed to launch setup wizard");
        
        // Show more detailed error information
        if (result.error?.includes("Super admin access required")) {
          toast.error("Authentication issue: Please log out and log back in as super admin");
        } else if (result.error?.includes("School not found")) {
          toast.error("School not found. Please refresh the page and try again.");
        }
      }
    } catch (error) {
      console.error("🔥 Setup wizard launch error:", error);
      toast.error("Network error: Failed to launch setup wizard");
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallStatusInfo = () => {
    if (!onboardingStatus) {
      return {
        status: "loading",
        badge: <Badge variant="outline">Loading...</Badge>,
        description: "Loading onboarding status...",
        color: "text-gray-500"
      };
    }

    const { basic, detailed } = onboardingStatus;

    if (basic.isOnboarded) {
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

    if (detailed) {
      const failedSteps = detailed.steps.filter(s => s.status === 'failed').length;
      const inProgressSteps = detailed.steps.filter(s => s.status === 'in_progress').length;
      
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
              {detailed.completionPercentage}% Complete
            </Badge>
          ),
          description: `Step ${detailed.currentStep} of ${detailed.totalSteps}`,
          color: "text-blue-600"
        };
      }
    }

    const step = basic.onboardingStep || 0;
    if (step === 0) {
      return {
        status: "not-started",
        badge: (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        ),
        description: "Onboarding has not been initiated",
        color: "text-red-600"
      };
    } else {
      return {
        status: "in-progress",
        badge: (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Step {step}/7
          </Badge>
        ),
        description: `Currently on step ${step} of 7`,
        color: "text-yellow-600"
      };
    }
  };

  const getStepStatusInfo = (stepNumber: number) => {
    if (!onboardingStatus?.detailed) {
      // Fallback to basic status
      const currentStep = onboardingStatus?.basic.onboardingStep || 0;
      const isCompleted = onboardingStatus?.basic.isOnboarded || currentStep > stepNumber;
      const isCurrent = !onboardingStatus?.basic.isOnboarded && currentStep === stepNumber;
      
      if (isCompleted) {
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          badge: <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>,
          color: "bg-green-50 border-green-200"
        };
      } else if (isCurrent) {
        return {
          icon: <Clock className="h-4 w-4 text-blue-600" />,
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800">Current</Badge>,
          color: "bg-blue-50 border-blue-200"
        };
      } else {
        return {
          icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
          badge: <Badge variant="outline" className="bg-gray-50 text-gray-600">Pending</Badge>,
          color: "bg-gray-50 border-gray-200"
        };
      }
    }

    const stepProgress = onboardingStatus.detailed.steps.find(s => s.step === stepNumber);
    if (!stepProgress) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
        badge: <Badge variant="outline">Unknown</Badge>,
        color: "bg-gray-50 border-gray-200"
      };
    }

    switch (stepProgress.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          badge: <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>,
          color: "bg-green-50 border-green-200"
        };
      case 'in_progress':
        return {
          icon: <Clock className="h-4 w-4 text-blue-600" />,
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>,
          color: "bg-blue-50 border-blue-200"
        };
      case 'failed':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
          badge: <Badge variant="destructive" className="bg-red-100 text-red-800">Failed</Badge>,
          color: "bg-red-50 border-red-200"
        };
      case 'skipped':
        return {
          icon: <Settings className="h-4 w-4 text-gray-600" />,
          badge: <Badge variant="outline" className="bg-gray-100 text-gray-800">Skipped</Badge>,
          color: "bg-gray-50 border-gray-200"
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
          badge: <Badge variant="outline" className="bg-gray-50 text-gray-600">Not Started</Badge>,
          color: "bg-gray-50 border-gray-200"
        };
    }
  };

  const statusInfo = getOverallStatusInfo();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Setup Wizard Management
            </CardTitle>
            <CardDescription>
              Launch and manage onboarding setup for {school.name}
            </CardDescription>
          </div>
          {statusInfo.badge}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Step Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className={`text-lg font-semibold ${statusInfo.color}`}>
                  {statusInfo.description}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(school.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Completed</div>
                <div className="text-sm flex items-center gap-1">
                  {school.onboardingCompletedAt ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {new Date(school.onboardingCompletedAt).toLocaleDateString()}
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Not completed
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {onboardingStatus?.detailed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {onboardingStatus.detailed.completionPercentage}%
                  </span>
                </div>
                <Progress value={onboardingStatus.detailed.completionPercentage} className="w-full" />
              </div>
            )}

            <Separator />

            {/* Quick Step Overview */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Setup Steps</div>
              <div className="grid gap-2">
                {ONBOARDING_STEPS.map((step) => {
                  const stepInfo = getStepStatusInfo(step.step);
                  
                  return (
                    <div
                      key={step.step}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${stepInfo.color}`}
                    >
                      <div className="flex-shrink-0">
                        {stepInfo.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{step.title}</div>
                        <div className="text-xs text-muted-foreground">{step.description}</div>
                      </div>
                      {stepInfo.badge}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Admin Info */}
            {school.primaryAdmin && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Primary Administrator</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{school.primaryAdmin.name}</div>
                      <div className="text-xs text-muted-foreground">{school.primaryAdmin.email}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {onboardingStatus?.detailed ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Detailed Progress</h3>
                  <div className="text-sm text-muted-foreground">
                    Last activity: {formatDistanceToNow(new Date(onboardingStatus.detailed.lastActivityAt), { addSuffix: true })}
                  </div>
                </div>

                <div className="space-y-3">
                  {onboardingStatus.detailed.steps.map((step) => {
                    const stepDef = ONBOARDING_STEPS.find(def => def.step === step.step);
                    const stepInfo = getStepStatusInfo(step.step);
                    
                    return (
                      <div
                        key={step.step}
                        className={`p-4 rounded-lg border ${stepInfo.color}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {stepInfo.icon}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{stepDef?.title || `Step ${step.step}`}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {stepDef?.description || "No description available"}
                                </p>
                              </div>
                              {stepInfo.badge}
                            </div>
                            
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

                            {step.errorMessage && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                <strong>Error:</strong> {step.errorMessage}
                              </div>
                            )}

                            {step.completedBy && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Completed by:</span> {step.completedBy}
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
              <div className="text-center py-8">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Detailed progress tracking is not available. Basic progress information is shown in the Overview tab.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {school.isOnboarded ? (
            <Button
              onClick={handleResetOnboarding}
              disabled={isLoading}
              variant="outline"
              className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reset Onboarding
            </Button>
          ) : (
            <Button
              onClick={handleLaunchSetupWizard}
              disabled={isLoading}
              variant="outline"
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Launch Setup Wizard
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-4">
          <strong>Setup Wizard Management:</strong> {school.isOnboarded 
            ? "Resetting onboarding will set the school back to step 0 and require the admin to complete setup again on their next login. This will clear all onboarding progress and audit logs will track this action."
            : onboardingStatus?.basic.onboardingStep === 0
            ? "Launching the setup wizard will guide the school admin through the initial setup process on their next login. The system will track detailed progress for each step."
            : "The school admin is currently in the middle of setup. You can reset to start over or let them continue from their current step. All progress is tracked independently for this school."
          }
        </div>
      </CardContent>
    </Card>
  );
}