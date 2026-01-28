"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  PlayCircle, 
  RotateCcw,
  Calendar,
  User,
  School
} from "lucide-react";
import { toast } from "sonner";
import { 
  resetSchoolOnboarding, 
  launchSetupWizard 
} from "@/lib/actions/school-management-actions";

interface OnboardingManagementProps {
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

const ONBOARDING_STEPS = [
  { step: 1, title: "School Information", description: "Basic school details and contact information" },
  { step: 2, title: "Admin Account", description: "Administrator account setup and verification" },
  { step: 3, title: "Academic Year", description: "Current academic year configuration" },
  { step: 4, title: "Terms & Semesters", description: "Academic terms and semester setup" },
  { step: 5, title: "Classes & Sections", description: "Class structure and section organization" },
  { step: 6, title: "Grade Scale", description: "Grading system and evaluation criteria" },
  { step: 7, title: "Completion", description: "Final setup and system activation" },
];

export function OnboardingManagement({ school, onUpdate }: OnboardingManagementProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleResetOnboarding = async () => {
    setIsLoading(true);
    try {
      const result = await resetSchoolOnboarding(school.id);
      if (result.success) {
        toast.success(result.data?.message || "Onboarding reset successfully");
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
      const result = await launchSetupWizard(school.id);
      if (result.success) {
        toast.success(result.data?.message || "Setup wizard launched successfully");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to launch setup wizard");
      }
    } catch (error) {
      toast.error("Failed to launch setup wizard");
    } finally {
      setIsLoading(false);
    }
  };

  const getOnboardingStatusInfo = () => {
    if (school.isOnboarded) {
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
    } else {
      const step = school.onboardingStep || 0;
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
    }
  };

  const statusInfo = getOnboardingStatusInfo();
  const currentStep = school.onboardingStep || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Onboarding Management
            </CardTitle>
            <CardDescription>
              Manage setup wizard and onboarding progress for {school.name}
            </CardDescription>
          </div>
          {statusInfo.badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <Separator />

        {/* Progress Steps */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Setup Progress</div>
          <div className="space-y-2">
            {ONBOARDING_STEPS.map((step) => {
              const isCompleted = school.isOnboarded || currentStep > step.step;
              const isCurrent = !school.isOnboarded && currentStep === step.step;
              const isPending = !school.isOnboarded && currentStep < step.step;

              return (
                <div
                  key={step.step}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isCompleted
                      ? "bg-green-50 border-green-200"
                      : isCurrent
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      isCompleted
                        ? "bg-green-600 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : step.step}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      isCompleted ? "text-green-800" : isCurrent ? "text-blue-800" : "text-gray-600"
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs ${
                      isCompleted ? "text-green-600" : isCurrent ? "text-blue-600" : "text-gray-500"
                    }`}>
                      {step.description}
                    </div>
                  </div>
                  {isCurrent && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Current
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Primary Admin Info */}
        {school.primaryAdmin && (
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
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {school.isOnboarded ? (
            <Button
              onClick={handleResetOnboarding}
              disabled={isLoading}
              variant="outline"
              className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Onboarding
            </Button>
          ) : (
            <Button
              onClick={handleLaunchSetupWizard}
              disabled={isLoading}
              variant="outline"
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Launch Setup Wizard
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Note:</strong> {school.isOnboarded 
            ? "Resetting onboarding will set the school back to step 0 and require the admin to complete setup again on their next login."
            : currentStep === 0
            ? "Launching the setup wizard will guide the school admin through the initial setup process on their next login."
            : "The school admin is currently in the middle of setup. You can reset to start over or let them continue from their current step."
          }
        </div>
      </CardContent>
    </Card>
  );
}