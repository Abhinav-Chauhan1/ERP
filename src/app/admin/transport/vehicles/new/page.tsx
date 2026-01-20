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
            Enter the details of the new vehicle
          </CardDescription >
        </CardHeader >
  <CardContent>
    <VehicleForm drivers={drivers} />
  </CardContent>
      </Card >
    </div >
  );
}
