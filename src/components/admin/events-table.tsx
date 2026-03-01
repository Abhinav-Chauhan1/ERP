"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, MapPin, Users, Calendar as CalendarIcon, Clock } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface EventData {
    id: string;
    title: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
    location?: string | null;
    type?: string | null;
    status: string;
    _count?: {
        participants: number;
    };
    maxParticipants?: number | null;
}

interface EventsTableProps {
    events: EventData[];
    onEdit?: (event: EventData) => void;
    onDelete?: (event: EventData) => void;
    emptyMessage?: string;
}

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case "UPCOMING":
            return "bg-primary/10 text-primary";
        case "ONGOING":
            return "bg-green-100 text-green-800";
        case "COMPLETED":
            return "bg-teal-100 text-teal-800";
        case "CANCELLED":
            return "bg-red-100 text-red-800";
        case "POSTPONED":
            return "bg-amber-100 text-amber-800";
        default:
            return "bg-muted text-gray-800";
    }
};

const getTypeBadgeClass = (type: string) => {
    switch (type) {
        case "ACADEMIC":
            return "bg-indigo-100 text-indigo-800";
        case "CULTURAL":
            return "bg-pink-100 text-pink-800";
        case "SPORTS":
            return "bg-emerald-100 text-emerald-800";
        case "ADMINISTRATIVE":
            return "bg-slate-100 text-slate-800";
        case "HOLIDAY":
            return "bg-orange-100 text-orange-800";
        default:
            return "bg-muted text-gray-800";
    }
};

export function EventsTable({ events, onEdit, onDelete, emptyMessage }: EventsTableProps) {
    const columns = [
        {
            key: "title",
            label: "Event",
            isHeader: true,
            render: (event: EventData) => (
                <div>
                    <div className="font-medium">{event.title}</div>
                    {event.location && (
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                        </div>
                    )}
                </div>
            ),
            mobileRender: (event: EventData) => (
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        {event.location && (
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                                <MapPin className="h-3 w-3 mr-1 shrink-0" />
                                <span className="truncate">{event.location}</span>
                            </div>
                        )}
                    </div>
                    <Badge className={`${getStatusBadgeClass(event.status)} text-xs shrink-0`}>
                        {event.status}
                    </Badge>
                </div>
            ),
        },
        {
            key: "type",
            label: "Type",
            render: (event: EventData) => (
                <Badge className={getTypeBadgeClass(event.type || "OTHER")}>
                    {event.type || "Other"}
                </Badge>
            ),
            mobileRender: (event: EventData) => (
                <Badge className={`${getTypeBadgeClass(event.type || "OTHER")} text-xs`}>
                    {event.type || "Other"}
                </Badge>
            ),
        },
        {
            key: "date",
            label: "Date",
            render: (event: EventData) => formatDate(event.startDate),
            mobileRender: (event: EventData) => (
                <span className="text-xs">{formatDate(event.startDate)}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const, // Already in header on mobile
            render: (event: EventData) => (
                <Badge className={getStatusBadgeClass(event.status)}>
                    {event.status}
                </Badge>
            ),
        },
        {
            key: "participants",
            label: "Participants",
            mobilePriority: "low" as const,
            render: (event: EventData) => (
                <span>
                    {event._count?.participants || 0}
                    {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (event: EventData) => (
                <>
                    <Link href={`/admin/events/${event.id}`}>
                        <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                    </Link>
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(event)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </>
            ),
            mobileRender: (event: EventData) => (
                <>
                    <Link href={`/admin/events/${event.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            View
                        </Button>
                    </Link>
                    {onEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onEdit(event)}
                        >
                            Edit
                        </Button>
                    )}
                </>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={events}
            columns={columns}
            keyExtractor={(event) => event.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No events found"}
                </div>
            }
        />
    );
}
