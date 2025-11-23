export const dynamic = 'force-dynamic';

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteForm } from "@/components/admin/transport/route-form";
import { getAvailableVehicles } from "@/lib/actions/routeActions";

export const metadata = {
  title: "Add New Route | Transport Management",
  description: "Create a new transport route",
};

export default async function NewRoutePage() {
  const vehicles = await getAvailableVehicles();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/admin/transport/routes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Routes
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Route</h1>
        <p className="text-muted-foreground">Create a new transport route with stops</p>
      </div>

      <RouteForm vehicles={vehicles} />
    </div>
  );
}
