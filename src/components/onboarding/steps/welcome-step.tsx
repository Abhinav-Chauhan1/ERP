"use client";

import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle } from "lucide-react";
import type { WizardData } from "../setup-wizard";

interface WelcomeStepProps {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
    return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Rocket className="h-10 w-10 text-white" />
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome to <span className="text-red-500">SIKSHA</span>
                    <span className="text-gray-900">MITRA</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                    Let&apos;s set up your school management system
                </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 text-left">
                <h3 className="font-semibold mb-4">What we&apos;ll configure:</h3>
                <ul className="space-y-3">
                    {[
                        "School Information (name, logo, contact)",
                        "Administrator Account",
                        "Academic Year & Terms",
                        "Classes & Sections",
                    ].map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="text-sm text-muted-foreground">
                ⏱️ This will take approximately <strong>5-10 minutes</strong>
            </div>

            <Button
                size="lg"
                onClick={onNext}
                className="w-full sm:w-auto px-8"
            >
                Get Started
                <Rocket className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}
