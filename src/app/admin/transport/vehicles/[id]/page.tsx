import { VehicleForm } from "@/components/admin/transport/vehicle-form";
import { getVehicleById } from "@/lib/actions/vehicleActions";
import { getAllDriversSimple } from "@/lib/actions/driverActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Vehicle | Transport Management",
  description: "Edit vehicle details",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditVehiclePage({ params }: PageProps) {
  const { id } = await params;
  try {
    const [vehicle, drivers] = await Promise.all([
      getVehicleById(id),
      getAllDriversSimple(),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link href="/admin/transport/vehicles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
            <p className="text-muted-foreground">
              Update vehicle details - {vehicle.registrationNo}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>
              Update the vehicle information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleForm vehicle={vehicle} drivers={drivers} />
          </CardContent>
        </Card>

        {vehicle.routes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Routes</CardTitle>
              <CardDescription>
                Routes currently using this vehicle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vehicle.routes.map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{route.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {route._count.students} students • {route._count.stops} stops
                      </p>
                    </div>
                    <div className="text-sm">
                      <span
                        className={`px-2 py-1 rounded-full ${route.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {route.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    notFound();
  }
}
