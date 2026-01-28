/**
 * Onboarding Progress Tracking Models
 * Task 9.5: Implement independent onboarding progress tracking per school
 * Requirements: 9.5 - THE System SHALL track onboarding progress per school independently
 */

export interface OnboardingStepDefinition {
  step: number;
  title: string;
  description: string;
  required: boolean;
  dependencies?: number[]; // Steps that must be completed before this one
  estimatedMinutes?: number;
  category: 'setup' | 'configuration' | 'content' | 'verification';
}

export interface OnboardingStepProgress {
  step: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  lastUpdatedAt: Date;
  attempts: number;
  errorMessage?: string;
  metadata?: Record<string, any>; // Step-specific data
  completedBy?: string; // User ID who completed this step
}

export interface SchoolOnboardingProgress {
  schoolId: string;
  isOnboarded: boolean;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  steps: OnboardingStepProgress[];
  metadata: {
    version: string; // Onboarding flow version
    assignedTo?: string; // Primary admin responsible
    notes?: string;
    customizations?: Record<string, any>;
  };
}

export interface OnboardingProgressSummary {
  schoolId: string;
  schoolName: string;
  isOnboarded: boolean;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'stalled' | 'failed';
  lastActivityAt: Date;
  estimatedTimeRemaining?: number; // in minutes
  blockedSteps: number[]; // Steps that are blocked due to dependencies
  failedSteps: number[]; // Steps that have failed
}

// Standard onboarding steps definition
export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    step: 1,
    title: "School Information",
    description: "Basic school details and contact information",
    required: true,
    category: 'setup',
    estimatedMinutes: 10
  },
  {
    step: 2,
    title: "Admin Account Verification",
    description: "Administrator account setup and email verification",
    required: true,
    dependencies: [1],
    category: 'setup',
    estimatedMinutes: 5
  },
  {
    step: 3,
    title: "Academic Year Configuration",
    description: "Current academic year setup and calendar",
    required: true,
    dependencies: [2],
    category: 'configuration',
    estimatedMinutes: 15
  },
  {
    step: 4,
    title: "Terms & Semesters",
    description: "Academic terms and semester structure",
    required: true,
    dependencies: [3],
    category: 'configuration',
    estimatedMinutes: 10
  },
  {
    step: 5,
    title: "Classes & Sections",
    description: "Class structure and section organization",
    required: true,
    dependencies: [4],
    category: 'content',
    estimatedMinutes: 20
  },
  {
    step: 6,
    title: "Grade Scale Setup",
    description: "Grading system and evaluation criteria",
    required: true,
    dependencies: [5],
    category: 'configuration',
    estimatedMinutes: 15
  },
  {
    step: 7,
    title: "System Verification",
    description: "Final setup verification and system activation",
    required: true,
    dependencies: [1, 2, 3, 4, 5, 6],
    category: 'verification',
    estimatedMinutes: 5
  }
];

export const ONBOARDING_VERSION = "1.0.0";

// Helper functions
export function calculateCompletionPercentage(steps: OnboardingStepProgress[]): number {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  return Math.round((completedSteps / steps.length) * 100);
}

export function getOnboardingStatus(progress: SchoolOnboardingProgress): 'not_started' | 'in_progress' | 'completed' | 'stalled' | 'failed' {
  if (progress.isOnboarded) return 'completed';
  
  const hasStarted = progress.steps.some(step => step.status !== 'not_started');
  if (!hasStarted) return 'not_started';
  
  const hasFailed = progress.steps.some(step => step.status === 'failed');
  if (hasFailed) return 'failed';
  
  const lastActivity = new Date(progress.lastActivityAt);
  const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActivity > 7) return 'stalled'; // No activity for 7 days
  
  return 'in_progress';
}

export function getBlockedSteps(steps: OnboardingStepProgress[]): number[] {
  const completedSteps = new Set(
    steps.filter(step => step.status === 'completed').map(step => step.step)
  );
  
  return ONBOARDING_STEPS
    .filter(stepDef => {
      if (!stepDef.dependencies) return false;
      return !stepDef.dependencies.every(dep => completedSteps.has(dep));
    })
    .map(stepDef => stepDef.step);
}

export function getFailedSteps(steps: OnboardingStepProgress[]): number[] {
  return steps
    .filter(step => step.status === 'failed')
    .map(step => step.step);
}

export function estimateTimeRemaining(steps: OnboardingStepProgress[]): number {
  const remainingSteps = steps.filter(step => 
    step.status === 'not_started' || step.status === 'failed'
  );
  
  return remainingSteps.reduce((total, step) => {
    const stepDef = ONBOARDING_STEPS.find(def => def.step === step.step);
    return total + (stepDef?.estimatedMinutes || 10);
  }, 0);
}