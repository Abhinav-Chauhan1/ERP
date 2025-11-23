export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getVehicles, getVehicleStats } from "@/lib/actions/vehicleActions";
import { VehicleList } from "@/components/admin/transport/vehicle-list";
import { VehicleListSkeleton } from "@/components/admin/transport/vehicle-list-skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, AlertTriangle, Wrench } from "lucide-react";

export const metadata = {
  title: "Vehicles | Transport Management",
  description: "Manage school transport vehicles",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    vehicleType?: string;
  }>;
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const status = params.status || "";
  const vehicleType = params.vehicleType || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your school transport fleet
          </p>
        </div>
        <Link href="/admin/transport/vehicles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<VehicleListSkeleton />}>
        <VehicleListContent
          page={page}
          search={search}
          status={status}
          vehicleType={vehicleType}
        />
      </Suspense>
    </div>
  );
}

async function StatsCards() {
  const stats = await getVehicleStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Bus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <Bus className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inactive}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          <Wrench className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.maintenance}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function VehicleListContent({
  page,
  search,
  status,
  vehicleType,
}: {
  page: number;
  search: string;
  status: string;
  vehicleType: string;
}) {
  const vehiclesData = await getVehicles({ page, search, status, vehicleType });

  return <VehicleList data={vehiclesData} />;
}
