"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteVehicle } from "@/lib/actions/vehicleActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Bus,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Vehicle, Driver, Route } from "@prisma/client";

interface VehicleListProps {
  data: {
    vehicles: (Vehicle & {
      driver: Driver | null;
      routes: (Route & {
        _count: {
          students: number;
          stops: number;
        };
      })[];
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function VehicleList({ data }: VehicleListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "all"
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus);
    params.set("page", "1");
    router.push(`/admin/transport/vehicles?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    router.push("/admin/transport/vehicles");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/transport/vehicles?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteVehicle(vehicleToDelete);
      if (result.success) {
        toast.success("Vehicle deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete vehicle");
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by registration number or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
            {(searchTerm || selectedStatus) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Routes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Bus className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No vehicles found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicle.registrationNo}
                      </TableCell>
                      <TableCell>{vehicle.vehicleType}</TableCell>
                      <TableCell>{vehicle.capacity}</TableCell>
                      <TableCell>
                        {vehicle.driver ? (
                          <div>
                            <p className="font-medium">{vehicle.driver.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.driver.licenseNo}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vehicle.routes.length > 0 ? (
                          <div className="text-sm">
                            <p className="font-medium">
                              {vehicle.routes.length} route(s)
                            </p>
                            <p className="text-muted-foreground">
                              {vehicle.routes.reduce(
                                (sum, route) => sum + route._count.students,
                                0
                              )}{" "}
                              students
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No routes</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/transport/vehicles/${vehicle.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setVehicleToDelete(vehicle.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.limit + 1} to{" "}
            {Math.min(data.page * data.limit, data.total)} of {data.total} vehicles
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page === data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
