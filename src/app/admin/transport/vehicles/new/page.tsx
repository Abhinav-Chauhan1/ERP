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
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <Link href="/admin/transport/vehicles">
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Add New Vehicle</h1>
            <p className="text-muted-foreground">Add a new vehicle to the fleet</p>
          </div>
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
