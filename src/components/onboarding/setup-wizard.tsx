"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeStep } from "./steps/welcome-step";
import { SchoolDetailsStep } from "./steps/school-details-step";
import { AdminCreationStep } from "./steps/admin-creation-step";
import { AcademicYearStep } from "./steps/academic-year-step";
import { TermsStep } from "./steps/terms-step";
import { ClassesStep } from "./steps/classes-step";
import { CompleteStep } from "./steps/complete-step";
import { WizardProgress } from "./wizard-progress";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface SetupWizardProps {
    currentStep: number;
    hasExistingAdmin: boolean;
}

export interface WizardData {
    // School Details
    schoolName: string;
    schoolEmail: string;
    schoolPhone: string;
    schoolAddress: string;
    schoolWebsite: string;
    timezone: string;
    schoolLogo: string;
    tagline: string;

    // Admin Details
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPassword: string;
    adminPhone: string;
    adminPosition: string;

    // Academic Year
    academicYearName: string;
    academicYearStart: Date | null;
    academicYearEnd: Date | null;

    // Terms
    terms: {
        name: string;
        startDate: Date | null;
        endDate: Date | null;
    }[];

    // Classes
    selectedClasses: string[];
    sections: string[];
}

const STEPS = [
    { id: 0, name: "Welcome", description: "Get started" },
    { id: 1, name: "School Details", description: "Basic information" },
    { id: 2, name: "Admin Account", description: "Create administrator" },
    { id: 3, name: "Academic Year", description: "Current session" },
    { id: 4, name: "Terms", description: "Academic periods" },
    { id: 5, name: "Classes", description: "Grade levels" },
    { id: 6, name: "Complete", description: "Finish setup" },
];

const initialData: WizardData = {
    schoolName: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    schoolWebsite: "",
    timezone: "Asia/Kolkata",
    schoolLogo: "",
    tagline: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
    adminPosition: "Principal",
    academicYearName: "",
    academicYearStart: null,
    academicYearEnd: null,
    terms: [
        { name: "Term 1", startDate: null, endDate: null },
        { name: "Term 2", startDate: null, endDate: null },
        { name: "Term 3", startDate: null, endDate: null },
    ],
    selectedClasses: [],
    sections: ["A", "B"],
};

export function SetupWizard({ currentStep: initialStep, hasExistingAdmin }: SetupWizardProps) {
    const [step, setStep] = useState(initialStep);
    const [data, setData] = useState<WizardData>(initialData);
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

    const updateData = (updates: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    const nextStep = () => {
        setDirection(1);
        setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    };

    const prevStep = () => {
        setDirection(-1);
        setStep((prev) => Math.max(prev - 1, 0));
    };

    const goToStep = (targetStep: number) => {
        setDirection(targetStep > step ? 1 : -1);
        setStep(targetStep);
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    const renderStep = () => {
        const commonProps = {
            data,
            updateData,
            onNext: nextStep,
            onPrev: prevStep,
        };

        switch (step) {
            case 0:
                return <WelcomeStep {...commonProps} />;
            case 1:
                return <SchoolDetailsStep {...commonProps} />;
            case 2:
                return (
                    <AdminCreationStep
                        {...commonProps}
                        skipStep={hasExistingAdmin ? nextStep : undefined}
                    />
                );
            case 3:
                return <AcademicYearStep {...commonProps} />;
            case 4:
                return <TermsStep {...commonProps} />;
            case 5:
                return <ClassesStep {...commonProps} />;
            case 6:
                return <CompleteStep data={data} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="py-6 px-8 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="SikshaMitra"
                        width={160}
                        height={40}
                        className="h-10 w-auto"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Setup Wizard
                </div>
            </header>

            {/* Progress */}
            <div className="bg-white border-b px-8 py-4">
                <WizardProgress
                    steps={STEPS}
                    currentStep={step}
                    onStepClick={goToStep}
                />
            </div>

            {/* Content */}
            <main className="flex-1 flex items-center justify-center p-8">
                <Card className="w-full max-w-2xl p-8 shadow-xl border-0 bg-white/90 backdrop-blur">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </main>

            {/* Footer */}
            <footer className="py-4 px-8 text-center text-sm text-muted-foreground border-t bg-white/80">
                © {new Date().getFullYear()} SikshaMitra. All rights reserved.
            </footer>
        </div>
    );
}
