import {
    User, BookOpen, FileText,
    BarChart2, Clock, DollarSign, MessageSquare,
    FolderOpen, Award, CalendarDays, Settings,
    GraduationCap,
} from "lucide-react";
import { RouteItem, SidebarConfig, HeaderConfig } from "./types";

export const studentRoutes: RouteItem[] = [
    {
        label: "Dashboard",
        icon: User,
        href: "/student",
    },
    {
        label: "Academics",
        icon: BookOpen,
        href: "/student/academics",
        submenu: [
            { label: "Class Schedule", href: "/student/academics/schedule" },
            { label: "Subjects", href: "/student/academics/subjects" },
            { label: "Curriculum", href: "/student/academics/curriculum" },
            { label: "Learning Materials", href: "/student/academics/materials" },
        ]
    },
    {
        label: "Courses",
        icon: GraduationCap,
        href: "/student/courses",
    },
    {
        label: "Assessments",
        icon: FileText,
        href: "/student/assessments",
        submenu: [
            { label: "Upcoming Exams", href: "/student/assessments/exams" },
            { label: "Exam Results", href: "/student/assessments/results" },
            { label: "Assignments", href: "/student/assessments/assignments" },
            { label: "Report Cards", href: "/student/assessments/report-cards" },
        ]
    },
    {
        label: "Performance",
        icon: BarChart2,
        href: "/student/performance",
        submenu: [
            { label: "Overview", href: "/student/performance/overview" },
            { label: "Subject Analysis", href: "/student/performance/subjects" },
            { label: "Progress Trends", href: "/student/performance/trends" },
            { label: "Class Rank", href: "/student/performance/rank" },
        ]
    },
    {
        label: "Attendance",
        icon: Clock,
        href: "/student/attendance",
        submenu: [
            { label: "My Attendance", href: "/student/attendance/report" },
            { label: "Leave Applications", href: "/student/attendance/leave" },
        ]
    },
    {
        label: "Fees",
        icon: DollarSign,
        href: "/student/fees",
        submenu: [
            { label: "Fee Details", href: "/student/fees/details" },
            { label: "Payment History", href: "/student/fees/payments" },
            { label: "Due Payments", href: "/student/fees/due" },
            { label: "Scholarships", href: "/student/fees/scholarships" },
        ]
    },
    {
        label: "Communication",
        icon: MessageSquare,
        href: "/student/communication",
        submenu: [
            { label: "Messages", href: "/student/communication/messages" },
            { label: "Announcements", href: "/student/communication/announcements" },
            { label: "Notifications", href: "/student/communication/notifications" },
        ]
    },
    {
        label: "Documents",
        icon: FolderOpen,
        href: "/student/documents",
    },
    {
        label: "Achievements",
        icon: Award,
        href: "/student/achievements",
    },
    {
        label: "Calendar",
        icon: CalendarDays,
        href: "/student/calendar",
    },
    {
        label: "Events",
        icon: CalendarDays,
        href: "/student/events",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/student/settings",
    },
];

export const studentSidebarConfig: SidebarConfig = {
    routes: studentRoutes,
    portalLabel: "Student Portal",
    dashboardHref: "/student",
    accountLabel: "Student Account",
};

export const studentHeaderConfig: HeaderConfig = {
    dashboardHref: "/student",
    pageTitleMappings: {
        "/student/academics": "Academics",
        "/student/courses": "Courses",
        "/student/assessments": "Assessments",
        "/student/performance": "Performance",
        "/student/attendance": "Attendance",
        "/student/fees": "Fees",
        "/student/communication": "Communication",
        "/student/documents": "Documents",
        "/student/achievements": "Achievements",
        "/student/calendar": "Calendar",
        "/student/events": "Events",
        "/student/settings": "Settings",
        "/student": "Dashboard",
    },
};
