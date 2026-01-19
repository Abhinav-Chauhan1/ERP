import {
    Users, UserCheck, Calendar,
    BarChart2, Clock, DollarSign, MessageSquare,
    FolderOpen, Settings, CalendarCheck,
    BookOpen, CalendarDays
} from "lucide-react";
import { RouteItem, SidebarConfig, HeaderConfig } from "./types";

export const parentRoutes: RouteItem[] = [
    {
        label: "Dashboard",
        icon: Users,
        href: "/parent",
    },
    {
        label: "My Children",
        icon: UserCheck,
        submenu: [
            { label: "Overview", href: "/parent/children" },
            { label: "Academic Progress", href: "/parent/children/progress" },
            { label: "Attendance", href: "/parent/children/attendance" },
        ]
    },
    {
        label: "Academics",
        icon: BookOpen,
        submenu: [
            { label: "Overview", href: "/parent/academics" },
            { label: "Class Schedule", href: "/parent/academics/schedule" },
            { label: "Subjects", href: "/parent/academics/subjects" },
            { label: "Homework", href: "/parent/academics/homework" },
        ]
    },
    {
        label: "Performance",
        icon: BarChart2,
        submenu: [
            { label: "Overview", href: "/parent/performance" },
            { label: "Exam Results", href: "/parent/performance/results" },
            { label: "Progress Reports", href: "/parent/performance/reports" },
            { label: "Report Cards", href: "/parent/performance/report-cards" },
        ]
    },
    {
        label: "Attendance",
        icon: Clock,
        href: "/parent/attendance",
    },
    {
        label: "Fees & Payments",
        icon: DollarSign,
        submenu: [
            { label: "Overview", href: "/parent/fees" },
            { label: "Payment History", href: "/parent/fees/history" },
            { label: "Make Payment", href: "/parent/fees/payment" },
        ]
    },
    {
        label: "Communication",
        icon: MessageSquare,
        submenu: [
            { label: "Overview", href: "/parent/communication" },
            { label: "Messages", href: "/parent/communication/messages" },
            { label: "Announcements", href: "/parent/communication/announcements" },
            { label: "Notifications", href: "/parent/communication/notifications" },
        ]
    },
    {
        label: "Meetings",
        icon: CalendarCheck,
        submenu: [
            { label: "Overview", href: "/parent/meetings" },
            { label: "Schedule Meeting", href: "/parent/meetings/schedule" },
            { label: "Upcoming Meetings", href: "/parent/meetings/upcoming" },
            { label: "Past Meetings", href: "/parent/meetings/history" },
        ]
    },
    {
        label: "Documents",
        icon: FolderOpen,
        href: "/parent/documents",
    },
    {
        label: "Calendar",
        icon: CalendarDays,
        href: "/parent/calendar",
    },
    {
        label: "Events",
        icon: Calendar,
        href: "/parent/events",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/parent/settings",
    },
];

export const parentSidebarConfig: SidebarConfig = {
    routes: parentRoutes,
    portalLabel: "Parent Portal",
    dashboardHref: "/parent",
    accountLabel: "Parent Account",
};

export const parentHeaderConfig: HeaderConfig = {
    dashboardHref: "/parent",
    pageTitleMappings: {
        "/parent/children": "My Children",
        "/parent/academics": "Academics",
        "/parent/performance": "Performance",
        "/parent/attendance": "Attendance",
        "/parent/fees": "Fees & Payments",
        "/parent/communication": "Communication",
        "/parent/meetings": "Meetings",
        "/parent/documents": "Documents",
        "/parent/calendar": "Calendar",
        "/parent/events": "Events",
        "/parent/settings": "Settings",
        "/parent": "Dashboard",
    },
};
