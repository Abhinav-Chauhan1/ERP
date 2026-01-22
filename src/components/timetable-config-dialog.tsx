"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  timetableConfigSchema,
  TimetableConfigFormValues,
  PeriodFormValues
} from "@/lib/schemaValidation/timetableConfigSchemaValidation";
import { getTimetableConfig, saveTimetableConfig } from "@/lib/actions/timetableConfigActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Settings } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

const DAY_OPTIONS: { value: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

export function TimetableConfigDialog({ onConfigChanged }: { onConfigChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create form with default values
  const form = useForm<TimetableConfigFormValues>({
    resolver: zodResolver(timetableConfigSchema),
    defaultValues: {
      name: "Default Configuration",
      daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      periods: [
        { name: "Period 1", startTime: "09:00", endTime: "09:45" },
      ],
    },
  });

  // Load current configuration
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTimetableConfig();
      if (result.success && result.data) {
        form.reset({
          id: result.data.id || undefined,
          name: result.data.name,
          daysOfWeek: result.data.daysOfWeek.filter((day): day is "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY" =>
            ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(day)
          ),
          periods: result.data.periods.map(p => ({
            id: p.id,
            name: p.name,
            startTime: p.startTime,
            endTime: p.endTime,
            order: p.order,
          }))
        });
      }
    } catch (error) {
      toast.error("Failed to load timetable configuration");
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open, loadConfig]);

  // Add a new period
  const addPeriod = () => {
    // Get current periods
    const currentPeriods = form.getValues("periods") || [];

    // Generate default values for the new period
    let defaultStartTime = "09:00";
    let defaultEndTime = "09:45";

    // If there are existing periods, set the new period to start after the last one
    if (currentPeriods.length > 0) {
      const lastPeriod = currentPeriods[currentPeriods.length - 1];
      defaultStartTime = lastPeriod.endTime;

      // Calculate end time (45 min after start)
      const [hours, minutes] = lastPeriod.endTime.split(":").map(Number);
      let endHour = hours;
      let endMinute = minutes + 45;

      if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
      }

      defaultEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    }

    // Add the new period
    const newPeriods = [
      ...currentPeriods,
      {
        id: uuidv4(),
        name: `Period ${currentPeriods.length + 1}`,
        startTime: defaultStartTime,
        endTime: defaultEndTime
      },
    ];
    form.setValue("periods", newPeriods);
  };

  // Remove a period
  const removePeriod = (index: number) => {
    const currentPeriods = form.getValues("periods") || [];
    const newPeriods = currentPeriods.filter((_, i) => i !== index);

    // Rename periods to maintain sequential order
    const renamedPeriods = newPeriods.map((period, i) => ({
      ...period,
      name: `Period ${i + 1}`
    }));

    form.setValue("periods", renamedPeriods);
  };

  // Direct save function that doesn't rely on form submission
  const saveConfig = async () => {
    try {
      setLoading(true);

      // Get current form values
      const values = form.getValues();

      // Clean up and validate data
      const cleanData: TimetableConfigFormValues = {
        ...values,
        name: values.name.trim() || "Default Configuration",
        daysOfWeek: (values.daysOfWeek.length > 0 ?
          values.daysOfWeek.filter((day): day is "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY" =>
            ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(day)
          ) : ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]) as ("MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY")[],
        periods: values.periods.map((period, index) => ({
          ...period,
          name: period.name.trim() || `Period ${index + 1}`,
          startTime: period.startTime || "08:00",
          endTime: period.endTime || "08:45",
          order: period.order || (index + 1)
        }))
      };

      // Call the server action directly
      const result = await saveTimetableConfig(cleanData);

      // Handle the result
      if (result.success) {
        toast.success("Timetable configuration saved successfully!");
        if (onConfigChanged) onConfigChanged();
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to save configuration");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Timetable Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timetable Configuration</DialogTitle>
          <DialogDescription>
            Configure the days and periods for your timetable
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Standard Schedule" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daysOfWeek"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>School Days</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {DAY_OPTIONS.map((day) => (
                      <FormItem key={day.value} className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={form.watch("daysOfWeek").includes(day.value as any)}
                            onCheckedChange={(checked) => {
                              const currentDays = form.getValues("daysOfWeek");
                              if (checked) {
                                form.setValue("daysOfWeek", [...currentDays, day.value as any]);
                              } else {
                                form.setValue(
                                  "daysOfWeek",
                                  currentDays.filter((d) => d !== day.value)
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">{day.label}</FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <FormLabel>Class Periods</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addPeriod}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto p-1">
                {form.watch("periods")?.map((period, index) => (
                  <div key={period.id || index} className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-3 border rounded-md bg-accent">
                    <FormField
                      control={form.control}
                      name={`periods.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1 w-full sm:w-auto">
                          <FormLabel className="text-xs">Period Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Period 1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`periods.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem className="flex-1 w-full sm:w-auto">
                          <FormLabel className="text-xs">Start Time</FormLabel>
                          <FormControl>
                            <TimePicker
                              date={field.value ? new Date(`2000-01-01T${field.value}:00`) : undefined}
                              setDate={(date) => {
                                field.onChange(date ? format(date, "HH:mm") : "");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`periods.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem className="flex-1 w-full sm:w-auto">
                          <FormLabel className="text-xs">End Time</FormLabel>
                          <FormControl>
                            <TimePicker
                              date={field.value ? new Date(`2000-01-01T${field.value}:00`) : undefined}
                              setDate={(date) => {
                                field.onChange(date ? format(date, "HH:mm") : "");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePeriod(index)}
                      disabled={form.watch("periods").length <= 1}
                      className="text-red-500 mt-5 sm:mt-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <FormMessage>{form.formState.errors.periods?.message}</FormMessage>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                disabled={loading}
                onClick={saveConfig}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
