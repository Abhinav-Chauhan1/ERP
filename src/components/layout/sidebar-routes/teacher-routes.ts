import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    FileText,
    MessageSquare,
    Settings,
    Video,
    FolderOpen,
    Award,
    CalendarDays,
} from "lucide-react";
import { RouteItem, SidebarConfig, HeaderConfig } from "./types";
import { PERMISSIONS } from "@/lib/constants/permissions";

export const teacherRoutes: RouteItem[] = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/teacher",
    },
    {
        label: "Teaching",
        icon: BookOpen,
        submenu: [
            { label: "Subjects", href: "/teacher/teaching/subjects" },
            { label: "Classes", href: "/teacher/teaching/classes" },
            { label: "Lessons", href: "/teacher/teaching/lessons" },
            { label: "Timetable", href: "/teacher/teaching/timetable" },
            { label: "Syllabus", href: "/teacher/teaching/syllabus" },
        ],
        permissions: [PERMISSIONS.READ_CLASS, PERMISSIONS.READ_SUBJECT],
    },
    {
        label: "Courses",
        icon: Video,
        href: "/teacher/courses",
        // Optional: PERMISSIONS.READ_SUBJECT
    },
    {
        label: "Assessments",
        icon: FileText,
        submenu: [
            { label: "Assignments", href: "/teacher/assessments/assignments" },
            { label: "Exams", href: "/teacher/assessments/exams" },
            { label: "Online Exams", href: "/teacher/assessments/online-exams" },
            { label: "Question Bank", href: "/teacher/assessments/question-bank" },
            { label: "Results", href: "/teacher/assessments/results" },
        ],
        permissions: [PERMISSIONS.READ_EXAM, PERMISSIONS.READ_ASSIGNMENT],
    },
    {
        label: "Attendance",
        icon: ClipboardCheck,
        submenu: [
            { label: "Overview", href: "/teacher/attendance" },
            { label: "Mark Attendance", href: "/teacher/attendance/mark" },
            { label: "Reports", href: "/teacher/attendance/reports" },
        ],
        permissions: [PERMISSIONS.READ_ATTENDANCE],
    },
    {
        label: "Students",
        icon: GraduationCap,
        submenu: [
            { label: "Student List", href: "/teacher/students" },
            { label: "Performance", href: "/teacher/students/performance" },
        ],
        permissions: [PERMISSIONS.READ_STUDENT],
    },
    {
        label: "Documents",
        icon: FolderOpen,
        href: "/teacher/documents",
        permissions: [PERMISSIONS.READ_DOCUMENT],
    },
    {
        label: "Calendar",
        icon: CalendarDays,
        href: "/teacher/calendar",
        permissions: [PERMISSIONS.READ_CALENDAR],
    },
    {
        label: "Achievements",
        icon: Award,
        href: "/teacher/achievements",
    },
    {
        label: "Communication",
        icon: MessageSquare,
        submenu: [
            { label: "Messages", href: "/teacher/communication/messages" },
            { label: "Announcements", href: "/teacher/communication/announcements" },
        ],
        permissions: [PERMISSIONS.READ_MESSAGE, PERMISSIONS.READ_ANNOUNCEMENT],
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/teacher/settings",
    },
];

export const teacherSidebarConfig: SidebarConfig = {
    routes: teacherRoutes,
    portalLabel: "Teacher Portal",
    dashboardHref: "/teacher",
    accountLabel: "Teacher Account",
};

export const teacherHeaderConfig: HeaderConfig = {
    dashboardHref: "/teacher",
    pageTitleMappings: {
        "/teacher/teaching": "Teaching",
        "/teacher/courses": "Courses",
        "/teacher/assessments": "Assessments",
        "/teacher/attendance": "Attendance",
        "/teacher/students": "Students",
        "/teacher/documents": "Documents",
        "/teacher/calendar": "Calendar",
        "/teacher/achievements": "Achievements",
        "/teacher/communication": "Communication",
        "/teacher/settings": "Settings",
        "/teacher": "Dashboard",
    },
};
