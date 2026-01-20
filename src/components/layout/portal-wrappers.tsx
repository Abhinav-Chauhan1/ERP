"use client";

import { UnifiedSidebar } from "./unified-sidebar";
import { UnifiedHeader } from "./unified-header";
import {
    adminSidebarConfig, adminHeaderConfig,
    teacherSidebarConfig, teacherHeaderConfig,
    studentSidebarConfig, studentHeaderConfig
} from "./sidebar-routes";

interface PortalWrapperProps {
    userPermissions?: string[];
}

// Admin Wrappers
export function AdminSidebar({ userPermissions }: PortalWrapperProps) {
    return <UnifiedSidebar config={adminSidebarConfig} userPermissions={userPermissions} />;
}

export function AdminHeader({ userPermissions }: PortalWrapperProps) {
    return <UnifiedHeader headerConfig={adminHeaderConfig} sidebarConfig={adminSidebarConfig} userPermissions={userPermissions} />;
}

// Teacher Wrappers
export function TeacherSidebar({ userPermissions }: PortalWrapperProps) {
    return <UnifiedSidebar config={teacherSidebarConfig} userPermissions={userPermissions} />;
}

export function TeacherHeader({ userPermissions }: PortalWrapperProps) {
    return <UnifiedHeader headerConfig={teacherHeaderConfig} sidebarConfig={teacherSidebarConfig} userPermissions={userPermissions} />;
}

// Student Wrappers
export function StudentSidebar({ userPermissions }: PortalWrapperProps) {
    return <UnifiedSidebar config={studentSidebarConfig} userPermissions={userPermissions} />;
}

export function StudentHeader({ userPermissions }: PortalWrapperProps) {
    return <UnifiedHeader headerConfig={studentHeaderConfig} sidebarConfig={studentSidebarConfig} userPermissions={userPermissions} />;
}
