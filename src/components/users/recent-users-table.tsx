"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface RecentUser {
    id: string;
    name: string;
    email: string | null;
    role: string;
    date: string;
    status: string;
    href?: string;
}

interface RecentUsersTableProps {
    users: RecentUser[];
}

export function RecentUsersTable({ users }: RecentUsersTableProps) {
    const columns = [
        {
            key: "name",
            label: "Name",
            isHeader: true,
            render: (user: RecentUser) => (
                <div className="font-medium">{user.name}</div>
            ),
            mobileRender: (user: RecentUser) => (
                <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm truncate">{user.name}</div>
                    <Badge variant="outline" className="capitalize text-xs">
                        {user.role.toLowerCase()}
                    </Badge>
                </div>
            ),
        },
        {
            key: "email",
            label: "Email",
            render: (user: RecentUser) => user.email || "N/A",
            mobileRender: (user: RecentUser) => (
                <span className="truncate max-w-[150px] inline-block">{user.email || "N/A"}</span>
            ),
        },
        {
            key: "role",
            label: "Role",
            mobilePriority: "low" as const, // Already shown in header on mobile
            render: (user: RecentUser) => (
                <Badge variant="outline" className="capitalize">
                    {user.role.toLowerCase()}
                </Badge>
            ),
        },
        {
            key: "date",
            label: "Added",
            mobileLabel: "Added",
            mobilePriority: "low" as const,
            render: (user: RecentUser) => user.date,
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const,
            render: (user: RecentUser) => (
                <Badge
                    className={
                        user.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }
                >
                    {user.status}
                </Badge>
            ),
            mobileRender: (user: RecentUser) => (
                <Badge
                    className={
                        user.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs"
                    }
                >
                    {user.status}
                </Badge>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (user: RecentUser) => (
                <>
                    {user.href ? (
                        <>
                            <Link href={user.href}>
                                <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Link href={`${user.href}/edit`}>
                                <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </>
                    )}
                </>
            ),
            mobileRender: (user: RecentUser) => (
                <>
                    {user.href ? (
                        <>
                            <Link href={user.href}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                            </Link>
                            <Link href={`${user.href}/edit`}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
                        </>
                    )}
                </>
            ),
        },
    ];

    if (users.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No recent users found
            </div>
        );
    }

    return (
        <ResponsiveTable
            data={users}
            columns={columns}
            keyExtractor={(user) => user.id}
        />
    );
}
