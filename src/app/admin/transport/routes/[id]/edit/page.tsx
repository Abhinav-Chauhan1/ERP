import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RouteForm } from "@/components/admin/transport/route-form";
import { getRouteById, getAvailableVehicles } from "@/lib/actions/routeActions";

export const metadata = {
  title: "Edit Route | Transport Management",
  description: "Edit transport route details",
};

export default async function EditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let route;
  try {
    route = await getRouteById(id);
  } catch (error) {
    notFound();
  }

  const vehicles = await getAvailableVehicles();

  // Format route data for the form
  const initialData = {
    id: route.id,
    name: route.name,
    vehicleId: route.vehicleId,
    fee: route.fee,
    status: route.status,
    stops: route.stops.map((stop) => ({
      stopName: stop.stopName,
      arrivalTime: stop.arrivalTime,
      sequence: stop.sequence,
    })),
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href={`/admin/transport/routes/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Route Details
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Route</h1>
        <p className="text-muted-foreground">Update route information and stops</p>
      </div>

      <RouteForm vehicles={vehicles} initialData={initialData} />
    </div>
  );
}
