import { ArrowLeft, Edit, Trash2, MapPin, Users, DollarSign, Bus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRouteById } from "@/lib/actions/routeActions";
import { DeleteRouteButton } from "@/components/admin/transport/delete-route-button";
import { AssignStudentToRouteDialog } from "@/components/admin/transport/assign-student-to-route-dialog";
import { StudentRouteList } from "@/components/admin/transport/student-route-list";

export const metadata = {
  title: "Route Details | Transport Management",
  description: "View and manage route details",
};

export default async function RouteDetailPage({
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <Link href="/admin/transport/routes" className="mt-1">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-3xl font-bold">{route.name}</h1>
              <Badge variant={route.status === "ACTIVE" ? "default" : "secondary"}>
                {route.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {route.vehicle.registrationNo} - {route.vehicle.vehicleType}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto pl-16 sm:pl-0">
          <Link href={`/admin/transport/routes/${route.id}/edit`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Edit Route
            </Button>
          </Link>
          <div className="w-full sm:w-auto">
            <DeleteRouteButton routeId={route.id} routeName={route.name} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stops</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{route.stops.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{route._count.students}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{route.fee.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicle Capacity</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{route.vehicle.capacity}</div>
            <p className="text-xs text-muted-foreground">seats</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Registration Number</p>
              <p className="font-medium">{route.vehicle.registrationNo}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Vehicle Type</p>
              <p className="font-medium">{route.vehicle.vehicleType}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="font-medium">{route.vehicle.capacity} seats</p>
            </div>
            {route.vehicle.driver && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-medium">{route.vehicle.driver.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {route.vehicle.driver.phone}
                  </p>
                </div>
              </>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Vehicle Status</p>
              <Badge variant={route.vehicle.status === "ACTIVE" ? "default" : "secondary"}>
                {route.vehicle.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Stops</CardTitle>
          </CardHeader>
          <CardContent>
            {route.stops.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stops defined for this route</p>
            ) : (
              <div className="space-y-4">
                {route.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {stop.sequence}
                      </div>
                      {index < route.stops.length - 1 && (
                        <div className="h-full w-0.5 bg-border my-1" style={{ minHeight: "20px" }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{stop.stopName}</p>
                      <p className="text-sm text-muted-foreground">
                        Arrival: {stop.arrivalTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Assigned Students ({route.students.length})</CardTitle>
          <AssignStudentToRouteDialog
            routeId={route.id}
            routeStops={route.stops}
          />
        </CardHeader>
        <CardContent>
          <StudentRouteList students={route.students} routeFee={route.fee} />
        </CardContent>
      </Card>
    </div>
  );
}
