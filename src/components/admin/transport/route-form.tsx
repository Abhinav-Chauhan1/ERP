"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  createRoute,
  updateRoute,
} from "@/lib/actions/routeActions";
import {
  routeSchema,
  type RouteFormValues,
} from "@/lib/schemas/route-schemas";

interface RouteFormProps {
  vehicles: Array<{
    id: string;
    registrationNo: string;
    vehicleType: string;
    driver: { name: string } | null;
  }>;
  initialData?: {
    id: string;
    name: string;
    vehicleId: string;
    fee: number;
    status: string;
    stops: Array<{
      stopName: string;
      arrivalTime: string;
      sequence: number;
    }>;
  };
}

export function RouteForm({ vehicles, initialData }: RouteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          vehicleId: initialData.vehicleId,
          fee: initialData.fee,
          status: initialData.status as "ACTIVE" | "INACTIVE",
          stops: initialData.stops,
        }
      : {
          name: "",
          vehicleId: "",
          fee: 0,
          status: "ACTIVE",
          stops: [{ stopName: "", arrivalTime: "", sequence: 1 }],
        },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "stops",
  });

  const onSubmit = async (data: RouteFormValues) => {
    setIsSubmitting(true);
    try {
      const result = initialData
        ? await updateRoute(initialData.id, data)
        : await createRoute(data);

      if (result.success) {
        toast.success(`Route ${initialData ? "updated" : "created"} successfully`);
        router.push("/admin/transport/routes");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save route");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStop = () => {
    const nextSequence = fields.length + 1;
    append({ stopName: "", arrivalTime: "", sequence: nextSequence });
  };

  const removeStop = (index: number) => {
    remove(index);
    // Resequence remaining stops
    const currentStops = form.getValues("stops");
    currentStops.forEach((stop, idx) => {
      form.setValue(`stops.${idx}.sequence`, idx + 1);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Route Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Route A - North Zone" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for the route
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.registrationNo} - {vehicle.vehicleType}
                          {vehicle.driver && ` (${vehicle.driver.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the vehicle assigned to this route
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route Fee (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Monthly transport fee for this route
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Route Stops</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addStop}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stop
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2 pt-8">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`stops.${index}.stopName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Main Gate" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`stops.${index}.arrivalTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arrival Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              placeholder="HH:mm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`stops.${index}.sequence`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sequence</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8"
                      onClick={() => removeStop(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No stops added yet. Click "Add Stop" to create route stops.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update Route" : "Create Route"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
