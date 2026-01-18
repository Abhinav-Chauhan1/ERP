"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Bus } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import Link from "next/link";
import type { Vehicle, Driver, Route } from "@prisma/client";

interface VehicleWithDetails extends Vehicle {
    driver: Driver | null;
    routes: (Route & {
        _count: {
            students: number;
            stops: number;
        };
    })[];
}

interface VehiclesTableProps {
    vehicles: VehicleWithDetails[];
    onDelete: (id: string) => void;
    emptyMessage?: string;
}

export function VehiclesTable({ vehicles, onDelete, emptyMessage }: VehiclesTableProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case "INACTIVE":
                return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
            case "MAINTENANCE":
                return <Badge className="bg-red-100 text-red-800">Maintenance</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const columns = [
        {
            key: "registration",
            label: "Registration No.",
            isHeader: true,
            render: (vehicle: VehicleWithDetails) => (
                <span className="font-medium">{vehicle.registrationNo}</span>
            ),
            mobileRender: (vehicle: VehicleWithDetails) => (
                <div className="flex justify-between items-center w-full">
                    <span className="font-medium text-sm">{vehicle.registrationNo}</span>
                    {getStatusBadge(vehicle.status)}
                </div>
            )
        },
        {
            key: "type",
            label: "Type",
            mobilePriority: "low" as const,
            render: (vehicle: VehicleWithDetails) => vehicle.vehicleType,
        },
        {
            key: "capacity",
            label: "Capacity",
            mobilePriority: "low" as const,
            render: (vehicle: VehicleWithDetails) => vehicle.capacity,
        },
        {
            key: "driver",
            label: "Driver",
            render: (vehicle: VehicleWithDetails) => (
                vehicle.driver ? (
                    <div>
                        <p className="font-medium">{vehicle.driver.name}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.driver.licenseNo}</p>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Not assigned</span>
                )
            ),
            mobileRender: (vehicle: VehicleWithDetails) => (
                <div className="mt-1">
                    <div className="text-xs text-muted-foreground">Driver: {vehicle.driver ? vehicle.driver.name : "Not assigned"}</div>
                </div>
            )
        },
        {
            key: "routes",
            label: "Routes",
            mobilePriority: "low" as const,
            render: (vehicle: VehicleWithDetails) => (
                vehicle.routes.length > 0 ? (
                    <div className="text-sm">
                        <p className="font-medium">
                            {vehicle.routes.length} route(s)
                        </p>
                        <p className="text-muted-foreground">
                            {vehicle.routes.reduce(
                                (sum, route) => sum + route._count.students,
                                0
                            )} students
                        </p>
                    </div>
                ) : (
                    <span className="text-muted-foreground">No routes</span>
                )
            ),
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const, // Shown in mobile header
            render: (vehicle: VehicleWithDetails) => getStatusBadge(vehicle.status),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (vehicle: VehicleWithDetails) => (
                <div className="flex justify-end gap-2">
                    <Link href={`/admin/transport/vehicles/${vehicle.id}`}>
                        <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(vehicle.id)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ),
            mobileRender: (vehicle: VehicleWithDetails) => (
                <div className="flex gap-2 mt-2">
                    <Link href={`/admin/transport/vehicles/${vehicle.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                            Edit
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-red-600 border-red-200" onClick={() => onDelete(vehicle.id)}>
                        Delete
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ResponsiveTable
            data={vehicles}
            columns={columns}
            keyExtractor={(item) => item.id}
            emptyState={
                <div className="flex flex-col items-center gap-2 py-8">
                    <Bus className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">{emptyMessage || "No vehicles found"}</p>
                </div>
            }
        />
    );
}
