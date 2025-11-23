"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createVehicle, updateVehicle } from "@/lib/actions/vehicleActions";
import { vehicleSchema, type VehicleFormValues } from "@/lib/schemas/vehicle-schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Vehicle, Driver } from "@prisma/client";

interface VehicleFormProps {
  vehicle?: Vehicle & { driver: Driver | null };
  drivers: { id: string; name: string; licenseNo: string }[];
}

const VEHICLE_TYPES = ["Bus", "Van", "Car", "Mini Bus", "Other"];

export function VehicleForm({ vehicle, drivers }: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType,
          capacity: vehicle.capacity,
          driverId: vehicle.driverId || undefined,
          status: vehicle.status as "ACTIVE" | "INACTIVE" | "MAINTENANCE",
        }
      : {
          registrationNo: "",
          vehicleType: "",
          capacity: 1,
          driverId: undefined,
          status: "ACTIVE",
        },
  });

  const onSubmit = async (data: VehicleFormValues) => {
    setIsSubmitting(true);
    try {
      const result = vehicle
        ? await updateVehicle(vehicle.id, data)
        : await createVehicle(data);

      if (result.success) {
        toast.success(
          vehicle ? "Vehicle updated successfully" : "Vehicle created successfully"
        );
        router.push("/admin/transport/vehicles");
        router.refresh();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="registrationNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ABC-1234" {...field} />
                </FormControl>
                <FormDescription>
                  Unique vehicle registration number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Type of vehicle</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 40"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of passengers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Current vehicle status</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Driver</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No driver assigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.licenseNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Assign a driver to this vehicle (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {vehicle ? "Update Vehicle" : "Create Vehicle"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
