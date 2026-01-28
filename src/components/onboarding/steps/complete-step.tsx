"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, PartyPopper, ArrowRight } from "lucide-react";
import type { WizardData } from "../setup-wizard";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { completeSetup } from "@/lib/actions/onboarding/setup-actions";
import { format } from "date-fns";

interface CompleteStepProps {
    data: WizardData;
    redirectUrl?: string;
    schoolId?: string;
}

export function CompleteStep({ data, redirectUrl, schoolId }: CompleteStepProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleComplete = async () => {
        setIsSubmitting(true);

        try {
            const result = await completeSetup(data);

            if (!result.success) {
                toast({
                    title: "Setup failed",
                    description: result.error || "Something went wrong",
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }

            setIsComplete(true);
            toast({
                title: "Setup complete! 🎉",
                description: "Your school ERP is ready to use",
            });

            // Redirect to admin dashboard after a short delay
            setTimeout(() => {
                router.push(redirectUrl || "/admin");
            }, 2000);
        } catch (error) {
            console.error("Setup error:", error);
            toast({
                title: "Setup failed",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
            setIsSubmitting(false);
        }
    };

    if (isComplete) {
        return (
            <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                        <PartyPopper className="h-10 w-10 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-green-600">All Done!</h2>
                    <p className="text-muted-foreground">
                        Redirecting to your dashboard...
                    </p>
                </div>

                <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">Review & Complete</h2>
                <p className="text-muted-foreground">
                    Review your configuration before finishing setup
                </p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
                {/* School Info */}
                <div className="border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                        School Information
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Name:</span>{" "}
                            <strong>{data.schoolName || "Not set"}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <strong>{data.schoolEmail || "Not set"}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Phone:</span>{" "}
                            <strong>{data.schoolPhone || "Not set"}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Timezone:</span>{" "}
                            <strong>{data.timezone}</strong>
                        </div>
                    </div>
                </div>

                {/* Admin Account */}
                <div className="border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                        Administrator Account
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Name:</span>{" "}
                            <strong>{data.adminFirstName} {data.adminLastName}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <strong>{data.adminEmail}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Position:</span>{" "}
                            <strong>{data.adminPosition || "Administrator"}</strong>
                        </div>
                    </div>
                </div>

                {/* Academic Year */}
                <div className="border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                        Academic Year
                    </h3>
                    <div className="text-sm">
                        <strong>{data.academicYearName}</strong>
                        {data.academicYearStart && data.academicYearEnd && (
                            <span className="text-muted-foreground">
                                {" "}({format(data.academicYearStart, "MMM yyyy")} - {format(data.academicYearEnd, "MMM yyyy")})
                            </span>
                        )}
                    </div>
                    <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Terms:</span>{" "}
                        <strong>{data.terms.length}</strong>
                        <span className="text-muted-foreground"> - </span>
                        {data.terms.map((t) => t.name).join(", ")}
                    </div>
                </div>

                {/* Classes */}
                <div className="border rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                        Classes & Sections
                    </h3>
                    <div className="text-sm">
                        {data.selectedClasses.length > 0 ? (
                            <>
                                <strong>{data.selectedClasses.length}</strong> classes with sections{" "}
                                <strong>{data.sections.join(", ")}</strong>
                            </>
                        ) : (
                            <span className="text-muted-foreground italic">
                                No classes selected (can be configured later)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-800">What&apos;s Next?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Add teachers and staff members</li>
                    <li>• Create subjects and assign to classes</li>
                    <li>• Set up fee structures</li>
                    <li>• Enroll students</li>
                </ul>
            </div>

            {/* Complete Button */}
            <div className="pt-4">
                <Button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Setting up your school...
                        </>
                    ) : (
                        <>
                            Complete Setup
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
