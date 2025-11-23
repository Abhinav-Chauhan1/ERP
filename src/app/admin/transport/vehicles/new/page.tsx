export const dynamic = 'force-dynamic';

import { VehicleForm } from "@/components/admin/transport/vehicle-form";
import { getAllDriversSimple } from "@/lib/actions/driverActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Add Vehicle | Transport Management",
  description: "Add a new vehicle to the fleet",
};

export default async function NewVehiclePage() {
  const drivers = await getAllDriversSimple();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/transport/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Vehicle</h1>
          <p className="text-muted-foreground">
            Add a new vehicle to your transport fleet
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
          <CardDescription>
            Enter the details of the new vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm drivers={drivers} />
        </CardContent>
      </Card>
    </div>
  );
}
