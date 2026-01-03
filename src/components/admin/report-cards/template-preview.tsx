"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface TemplateSectionConfig {
    id: string;
    name: string;
    enabled: boolean;
    order: number;
    fields: string[];
}

interface TemplateStyles {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;
    headerHeight: number;
    footerHeight: number;
    // Advanced styling
    tableHeaderBg?: string;
    tableHeaderText?: string;
    tableBorderColor?: string;
    sectionTitleColor?: string;
    textColor?: string;
    alternateRowColor?: string;
    // Layout options
    headerStyle?: 'classic' | 'modern' | 'minimal';
    studentInfoStyle?: 'list' | 'grid' | 'boxed';
}

interface TemplatePreviewProps {
    name: string;
    type: string;
    pageSize: string;
    orientation: string;
    sections: TemplateSectionConfig[];
    styling: TemplateStyles;
    headerImage?: string;
    footerImage?: string;
    schoolLogo?: string;
}

// Sample data for preview
const SAMPLE_STUDENT = {
    name: "Aarav Sharma",
    rollNumber: "2024001",
    class: "10",
    section: "A",
    admissionNo: "ADM-2020-1234",
    fatherName: "Rajesh Sharma",
    motherName: "Priya Sharma",
};

const SAMPLE_SUBJECTS = [
    { name: "Mathematics", marksObtained: 92, maxMarks: 100, grade: "A1" },
    { name: "Science", marksObtained: 88, maxMarks: 100, grade: "A2" },
    { name: "English", marksObtained: 85, maxMarks: 100, grade: "A2" },
    { name: "Hindi", marksObtained: 78, maxMarks: 100, grade: "B1" },
    { name: "Social Science", marksObtained: 82, maxMarks: 100, grade: "A2" },
];

const SAMPLE_ATTENDANCE = {
    percentage: 94.5,
    daysPresent: 172,
    totalDays: 182,
};

const SAMPLE_ACTIVITIES = [
    { name: "Art & Craft", grade: "A" },
    { name: "Music", grade: "B" },
    { name: "Physical Education", grade: "A" },
];

export function TemplatePreview({
    name,
    type,
    pageSize,
    orientation,
    sections,
    styling,
    headerImage,
    footerImage,
    schoolLogo,
}: TemplatePreviewProps) {
    const enabledSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

    // Default values for new styling properties
    const tableHeaderBg = styling.tableHeaderBg || styling.primaryColor;
    const tableHeaderText = styling.tableHeaderText || '#FFFFFF';
    const tableBorderColor = styling.tableBorderColor || '#e2e8f0'; // slate-200
    const sectionTitleColor = styling.sectionTitleColor || styling.primaryColor;
    const textColor = styling.textColor || '#000000';
    const alternateRowColor = styling.alternateRowColor || '#f8fafc'; // slate-50

    // Calculate aspect ratio based on page size and orientation
    const getPreviewDimensions = () => {
        const isPortrait = orientation === "PORTRAIT";
        const baseWidth = 320;

        switch (pageSize) {
            case "A4":
                return {
                    width: baseWidth,
                    height: isPortrait ? baseWidth * 1.414 : baseWidth * 0.707,
                };
            case "LETTER":
                return {
                    width: baseWidth,
                    height: isPortrait ? baseWidth * 1.294 : baseWidth * 0.773,
                };
            case "LEGAL":
                return {
                    width: baseWidth,
                    height: isPortrait ? baseWidth * 1.647 : baseWidth * 0.607,
                };
            default:
                return { width: baseWidth, height: baseWidth * 1.414 };
        }
    };

    const dimensions = getPreviewDimensions();

    const renderStudentInfo = () => {
        const style = styling.studentInfoStyle || 'list';

        return (
            <div className="mb-3">
                <h3
                    className="text-sm font-semibold mb-2 pb-1 border-b"
                    style={{ color: sectionTitleColor, borderColor: sectionTitleColor }}
                >
                    Student Information
                </h3>

                {style === 'list' && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: textColor }}>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{SAMPLE_STUDENT.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Roll No:</span>
                            <span className="font-medium">{SAMPLE_STUDENT.rollNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Class:</span>
                            <span className="font-medium">{SAMPLE_STUDENT.class}-{SAMPLE_STUDENT.section}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Adm No:</span>
                            <span className="font-medium">{SAMPLE_STUDENT.admissionNo}</span>
                        </div>
                    </div>
                )}

                {style === 'grid' && (
                    <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: textColor }}>
                        <div className="p-1.5 bg-muted/20 border rounded">
                            <div className="text-muted-foreground text-[10px]">Student Name</div>
                            <div className="font-semibold">{SAMPLE_STUDENT.name}</div>
                        </div>
                        <div className="p-1.5 bg-muted/20 border rounded">
                            <div className="text-muted-foreground text-[10px]">Roll Number</div>
                            <div className="font-semibold">{SAMPLE_STUDENT.rollNumber}</div>
                        </div>
                        <div className="p-1.5 bg-muted/20 border rounded">
                            <div className="text-muted-foreground text-[10px]">Class & Section</div>
                            <div className="font-semibold">{SAMPLE_STUDENT.class} - {SAMPLE_STUDENT.section}</div>
                        </div>
                        <div className="p-1.5 bg-muted/20 border rounded">
                            <div className="text-muted-foreground text-[10px]">Admission No</div>
                            <div className="font-semibold">{SAMPLE_STUDENT.admissionNo}</div>
                        </div>
                    </div>
                )}

                {style === 'boxed' && (
                    <div className="border rounded-md overflow-hidden text-xs" style={{ borderColor: tableBorderColor, color: textColor }}>
                        <div className="grid grid-cols-4">
                            <div className="p-1.5 bg-muted/30 font-medium border-b border-r" style={{ borderColor: tableBorderColor }}>Name</div>
                            <div className="p-1.5 border-b col-span-3" style={{ borderColor: tableBorderColor }}>{SAMPLE_STUDENT.name}</div>

                            <div className="p-1.5 bg-muted/30 font-medium border-b border-r" style={{ borderColor: tableBorderColor }}>Roll No</div>
                            <div className="p-1.5 border-b border-r" style={{ borderColor: tableBorderColor }}>{SAMPLE_STUDENT.rollNumber}</div>

                            <div className="p-1.5 bg-muted/30 font-medium border-b border-r" style={{ borderColor: tableBorderColor }}>Class</div>
                            <div className="p-1.5 border-b" style={{ borderColor: tableBorderColor }}>{SAMPLE_STUDENT.class}-{SAMPLE_STUDENT.section}</div>

                            <div className="p-1.5 bg-muted/30 font-medium border-r" style={{ borderColor: tableBorderColor }}>Adm No</div>
                            <div className="p-1.5 col-span-3">{SAMPLE_STUDENT.admissionNo}</div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderAcademicPerformance = () => (
        <div className="mb-3">
            <h3
                className="text-sm font-semibold mb-2 pb-1 border-b"
                style={{ color: sectionTitleColor, borderColor: sectionTitleColor }}
            >
                Academic Performance
            </h3>
            <table className="w-full text-xs" style={{ border: `1px solid ${tableBorderColor}`, color: textColor }}>
                <thead>
                    <tr style={{ backgroundColor: tableHeaderBg, color: tableHeaderText }}>
                        <th className="text-left py-1 px-1 font-medium">Subject</th>
                        <th className="text-center py-1 px-1 font-medium">Marks</th>
                        <th className="text-center py-1 px-1 font-medium">Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {SAMPLE_SUBJECTS.map((subject, index) => (
                        <tr
                            key={index}
                            className={index % 2 === 1 ? "" : ""}
                            style={{
                                backgroundColor: index % 2 === 1 ? alternateRowColor : 'transparent',
                                borderBottom: `1px solid ${tableBorderColor}`
                            }}
                        >
                            <td className="py-0.5 px-1">{subject.name}</td>
                            <td className="text-center py-0.5 px-1">
                                {subject.marksObtained}/{subject.maxMarks}
                            </td>
                            <td className="text-center py-0.5 px-1">
                                <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0"
                                    style={{ borderColor: styling.primaryColor, color: styling.primaryColor }}
                                >
                                    {subject.grade}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: `${styling.primaryColor}10` }}>
                        <td className="py-1 px-1 font-semibold">Total</td>
                        <td className="text-center py-1 px-1 font-semibold">
                            {SAMPLE_SUBJECTS.reduce((sum, s) => sum + s.marksObtained, 0)}/
                            {SAMPLE_SUBJECTS.reduce((sum, s) => sum + s.maxMarks, 0)}
                        </td>
                        <td className="text-center py-1 px-1 font-semibold">
                            {(SAMPLE_SUBJECTS.reduce((sum, s) => sum + s.marksObtained, 0) /
                                SAMPLE_SUBJECTS.reduce((sum, s) => sum + s.maxMarks, 0) * 100).toFixed(1)}%
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );

    const renderAttendance = () => (
        <div className="mb-3">
            <h3
                className="text-sm font-semibold mb-2 pb-1 border-b"
                style={{ color: sectionTitleColor, borderColor: sectionTitleColor }}
            >
                Attendance
            </h3>
            <div className="flex justify-between items-center text-xs" style={{ color: textColor }}>
                <div className="flex gap-4">
                    <div>
                        <span className="text-muted-foreground">Present: </span>
                        <span className="font-medium">{SAMPLE_ATTENDANCE.daysPresent} days</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium">{SAMPLE_ATTENDANCE.totalDays} days</span>
                    </div>
                </div>
                <Badge
                    style={{ backgroundColor: styling.primaryColor }}
                    className="text-[10px]"
                >
                    {SAMPLE_ATTENDANCE.percentage}%
                </Badge>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{
                        width: `${SAMPLE_ATTENDANCE.percentage}%`,
                        backgroundColor: styling.primaryColor,
                    }}
                />
            </div>
        </div>
    );

    const renderCoScholastic = () => (
        <div className="mb-3">
            <h3
                className="text-sm font-semibold mb-2 pb-1 border-b"
                style={{ color: sectionTitleColor, borderColor: sectionTitleColor }}
            >
                Co-Scholastic Activities
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: textColor }}>
                {SAMPLE_ACTIVITIES.map((activity, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-1.5 rounded border"
                        style={{ borderColor: tableBorderColor }}
                    >
                        <span className="truncate">{activity.name}</span>
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 ml-1"
                            style={{ borderColor: styling.secondaryColor, color: styling.secondaryColor }}
                        >
                            {activity.grade}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderRemarks = () => (
        <div className="mb-3">
            <h3
                className="text-sm font-semibold mb-2 pb-1 border-b"
                style={{ color: sectionTitleColor, borderColor: sectionTitleColor }}
            >
                Remarks
            </h3>
            <div className="space-y-2 text-xs" style={{ color: textColor }}>
                <div>
                    <p className="text-muted-foreground mb-0.5">Teacher&apos;s Remarks:</p>
                    <p className="italic text-[11px] pl-2 border-l-2" style={{ borderColor: styling.secondaryColor }}>
                        &quot;Excellent progress this term. Keep up the good work!&quot;
                    </p>
                </div>
                <div>
                    <p className="text-muted-foreground mb-0.5">Principal&apos;s Remarks:</p>
                    <p className="italic text-[11px] pl-2 border-l-2" style={{ borderColor: styling.secondaryColor }}>
                        &quot;Well done. Consistent performer.&quot;
                    </p>
                </div>
            </div>
        </div>
    );

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case "student-info":
                return renderStudentInfo();
            case "academic-performance":
                return renderAcademicPerformance();
            case "attendance":
                return renderAttendance();
            case "co-scholastic":
                return renderCoScholastic();
            case "remarks":
                return renderRemarks();
            default:
                return null;
        }
    };

    // Header Rendering Logic
    const renderHeader = () => {
        const style = styling.headerStyle || 'classic';

        switch (style) {
            case 'modern':
                return (
                    <div
                        className="flex items-center justify-between px-3 border-b"
                        style={{
                            minHeight: Math.max(styling.headerHeight * 0.6, 40),
                            backgroundColor: styling.primaryColor,
                            color: 'white',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            {schoolLogo ? (
                                <div className="relative w-8 h-8 rounded bg-white/20 p-1">
                                    <Image
                                        src={schoolLogo}
                                        alt="Logo"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            ) : null}
                            <div>
                                <h2 className="font-bold text-sm">Sample School Name</h2>
                                <p className="text-[9px] opacity-80">Excellence in Education</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-xs">{type} Pattern</div>
                            <div className="text-[9px] opacity-80">2024-25</div>
                        </div>
                    </div>
                );
            case 'minimal':
                return (
                    <div
                        className="flex items-center justify-between px-3 border-b-2"
                        style={{
                            minHeight: Math.max(styling.headerHeight * 0.5, 30),
                            borderColor: styling.primaryColor,
                        }}
                    >
                        <h2 className="font-bold text-sm" style={{ color: styling.primaryColor }}>Sample School Name</h2>
                        <div className="text-[10px] text-muted-foreground">{type} | 2024-25</div>
                    </div>
                );
            case 'classic':
            default:
                return (
                    <div
                        className="flex items-center justify-center px-3 border-b"
                        style={{
                            minHeight: Math.max(styling.headerHeight * 0.6, 40),
                            backgroundColor: `${styling.primaryColor}10`,
                            borderColor: styling.primaryColor,
                        }}
                    >
                        {headerImage ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={headerImage}
                                    alt="Header"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {schoolLogo ? (
                                    <div className="relative w-8 h-8">
                                        <Image
                                            src={schoolLogo}
                                            alt="Logo"
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: styling.primaryColor }}
                                    >
                                        S
                                    </div>
                                )}
                                <div className="text-center">
                                    <h2
                                        className="font-bold text-sm"
                                        style={{ color: styling.primaryColor }}
                                    >
                                        Sample School Name
                                    </h2>
                                    <p className="text-[9px] text-muted-foreground">
                                        Academic Year 2024-25 • {type} Pattern
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <Card className="sticky top-4">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Live Preview</h3>
                    <Badge variant="outline" className="text-xs">
                        {pageSize} • {orientation}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                    Preview updates as you make changes
                </p>
            </CardHeader>
            <CardContent>
                {/* Preview Container */}
                <div
                    className="mx-auto bg-white border-2 rounded shadow-lg overflow-hidden transition-all duration-300"
                    style={{
                        width: dimensions.width,
                        minHeight: dimensions.height,
                        fontFamily: styling.fontFamily,
                        fontSize: `${Math.max(styling.fontSize * 0.7, 8)}px`,
                        color: textColor,
                    }}
                >
                    {/* Header */}
                    {renderHeader()}

                    {/* Report Card Title */}
                    <div
                        className="text-center py-1.5 font-bold text-sm border-b"
                        style={{
                            backgroundColor: styling.primaryColor,
                            color: "white",
                        }}
                    >
                        {name || "Report Card"}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                        {enabledSections.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-xs">
                                No sections enabled
                            </div>
                        ) : (
                            enabledSections.map((section) => (
                                <div key={section.id}>{renderSection(section.id)}</div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="flex items-center justify-between px-3 border-t mt-auto"
                        style={{
                            minHeight: Math.max(styling.footerHeight * 0.5, 25),
                            backgroundColor: `${styling.secondaryColor}10`,
                            borderColor: styling.secondaryColor,
                        }}
                    >
                        {footerImage ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={footerImage}
                                    alt="Footer"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <>
                                <div className="text-[9px] text-muted-foreground">
                                    Generated on: {new Date().toLocaleDateString()}
                                </div>
                                <div className="flex gap-4 text-[9px]">
                                    <div className="text-center">
                                        <div className="border-t border-dashed w-12 mb-0.5" style={{ borderColor: styling.secondaryColor }} />
                                        <span className="text-muted-foreground">Class Teacher</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-t border-dashed w-12 mb-0.5" style={{ borderColor: styling.secondaryColor }} />
                                        <span className="text-muted-foreground">Principal</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 p-2 bg-muted/50 rounded text-xs">
                    <p className="font-medium mb-1">Enabled Sections:</p>
                    <div className="flex flex-wrap gap-1">
                        {enabledSections.map((section) => (
                            <Badge key={section.id} variant="secondary" className="text-[10px]">
                                {section.name}
                            </Badge>
                        ))}
                        {enabledSections.length === 0 && (
                            <span className="text-muted-foreground italic">None selected</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
