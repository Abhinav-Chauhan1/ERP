"use client";


import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Edit, Trash2, PlusCircle,
  Calendar, Clock, BookOpen, User,
  Building, ArrowLeft, ArrowRight, MoreVertical,
  Copy, Download, Printer, RefreshCw, Search,
  Loader2, AlertCircle, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse, setHours, setMinutes } from "date-fns";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import toast from "react-hot-toast";

// Import schema validation and server actions
import {
  timetableSchema,
  timetableSlotSchema,
  TimetableFormValues
} from "@/lib/schemaValidation/timetableSchemaValidation";
import {
  getClassesForTimetable,
  getRoomsForTimetable,
  getSubjectTeachersForTimetable,
  getTimetableSlotsByClass,
  getTimetableSlotsByTeacher,
  getTimetableSlotsByRoom,
  getTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot
} from "@/lib/actions/timetableActions";
import { getTopicsForSubject } from "@/lib/actions/timetableTopicActions";

// Import formatters from the utils file directly
import { formatTimeForDisplay, formatDayForDisplay } from "@/lib/utils/formatters";

// Import the configuration dialog
import { TimetableConfigDialog } from "@/components/timetable-config-dialog";
import { getTimetableConfig } from "@/lib/actions/timetableConfigActions";

// Define a more precise interface for the timetable slot form values
interface TimetableSlotFormValues {
  timetableId: string;
  classId: string;
  sectionId?: string | undefined;
  roomId?: string | undefined;
  topicId?: string | undefined; // Optional syllabus topic for this slot
  subjectTeacherId: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  startTime: Date;
  endTime: Date;
}

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);

  const [slots, setSlots] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("MONDAY");
  const [selectedTimetable, setSelectedTimetable] = useState<string>("");
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTimetableDialogOpen, setDeleteTimetableDialogOpen] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [roomFilter, setRoomFilter] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replace the static periods with state from configuration
  const [periods, setPeriods] = useState<any[]>([]);
  const [weekDays, setWeekDays] = useState<string[]>([]);

  // State for syllabus topics (for topic selector in slot form)
  const [availableTopics, setAvailableTopics] = useState<{ id: string; title: string; chapterNumber: number; moduleTitle: string }[]>([]);

  // Form handling for timetable
  const timetableForm = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
      name: "",
      description: "",
      effectiveFrom: new Date(),
      isActive: true,
    },
  });

  // Form handling for timetable slot
  const slotForm = useForm<TimetableSlotFormValues>({
    resolver: zodResolver(timetableSlotSchema),
    defaultValues: {
      timetableId: selectedTimetable,
      classId: "",
      sectionId: undefined,
      roomId: undefined,
      topicId: undefined,
      day: "MONDAY",
      subjectTeacherId: "",
      startTime: new Date(),
      endTime: new Date(),
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch timetables
      const timetablesResult = await getTimetables();
      if (timetablesResult.success && timetablesResult.data) {
        setTimetables(timetablesResult.data || []);
      } else {
        toast.error(timetablesResult.error || "Failed to fetch timetables");
      }

      // Fetch classes
      const classesResult = await getClassesForTimetable();
      if (classesResult.success) {
        setClasses(classesResult.data || []);
      } else {
        toast.error(classesResult.error || "Failed to fetch classes");
      }

      // Fetch rooms
      const roomsResult = await getRoomsForTimetable();
      if (roomsResult.success) {
        setRooms(roomsResult.data || []);
      } else {
        toast.error(roomsResult.error || "Failed to fetch rooms");
      }

      // Fetch subject-teachers
      const subjectTeachersResult = await getSubjectTeachersForTimetable();
      if (subjectTeachersResult.success) {
        setSubjectTeachers(subjectTeachersResult.data || []);

        // Extract unique teachers for the filter
        const uniqueTeachers = Array.from(
          new Map(
            (subjectTeachersResult.data || []).map(st => [
              st.teacherId,
              {
                id: st.teacherId,
                name: st.teacherName
              }
            ])
          ).values()
        );
        setTeachers(uniqueTeachers);
      } else {
        toast.error(subjectTeachersResult.error || "Failed to fetch subject-teachers");
      }
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTimetableConfig = useCallback(async () => {
    try {
      const result = await getTimetableConfig();
      if (result.success && result.data) {
        setPeriods(result.data.periods.map(p => ({
          id: `p${p.order}`,
          time: `${p.startTime} - ${p.endTime}`,
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime
        })));
        setWeekDays(result.data.daysOfWeek);
      }
    } catch (err) {
      console.error("Error loading timetable configuration:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    loadTimetableConfig();
  }, [fetchData, loadTimetableConfig]);

  useEffect(() => {
    if (selectedTimetable && selectedClass) {
      fetchSlotsForClass(selectedClass, selectedTimetable);
    }
  }, [selectedClass, selectedTimetable]);

  // Effects to set defaults
  useEffect(() => {
    if (timetables.length > 0 && !selectedTimetable) {
      const activeTimetable = timetables.find(t => t.isActive);
      if (activeTimetable) {
        setSelectedTimetable(activeTimetable.id);
      } else {
        setSelectedTimetable(timetables[0].id);
      }
    }
  }, [timetables, selectedTimetable]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (weekDays.length > 0 && !selectedDay) {
      setSelectedDay(weekDays[0]);
    }
  }, [weekDays, selectedDay]);

  // Fetch topics when subject changes in the slot form
  const watchSubjectTeacherId = slotForm.watch("subjectTeacherId");
  useEffect(() => {
    const fetchTopics = async () => {
      if (!watchSubjectTeacherId) {
        setAvailableTopics([]);
        return;
      }
      // Get subject ID from the selected subject-teacher
      const selectedST = subjectTeachers.find(st => st.id === watchSubjectTeacherId);
      if (!selectedST) {
        setAvailableTopics([]);
        return;
      }
      const result = await getTopicsForSubject(selectedST.subjectId);
      if (result.success && result.data) {
        setAvailableTopics(result.data);
      } else {
        setAvailableTopics([]);
      }
    };
    fetchTopics();
  }, [watchSubjectTeacherId, subjectTeachers]);

  async function fetchSlotsForClass(classId: string, timetableId: string) {
    try {
      setLoading(true);
      const result = await getTimetableSlotsByClass(classId, false);

      if (result.success && result.data) {
        // Filter slots for the selected timetable
        const filteredSlots = result.data.filter(slot => slot.timetable.id === timetableId);
        setSlots(filteredSlots || []);
      } else {
        toast.error(result.error || "Failed to fetch timetable slots");
      }
    } catch (err) {
      toast.error("Failed to fetch timetable slots");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlotsForTeacher(teacherId: string) {
    try {
      setLoading(true);
      const result = await getTimetableSlotsByTeacher(teacherId);

      if (result.success) {
        setSlots(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch teacher's timetable");
      }
    } catch (err) {
      toast.error("Failed to fetch teacher's timetable");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlotsForRoom(roomId: string) {
    try {
      setLoading(true);
      const result = await getTimetableSlotsByRoom(roomId);

      if (result.success) {
        setSlots(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch room's timetable");
      }
    } catch (err) {
      toast.error("Failed to fetch room's timetable");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Navigate to previous or next day
  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = weekDays.indexOf(selectedDay);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDay(weekDays[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < weekDays.length - 1) {
      setSelectedDay(weekDays[currentIndex + 1]);
    }
  };

  async function onSubmitTimetable(values: TimetableFormValues) {
    try {
      let result;

      if (editingEntry) {
        // Update existing timetable
        result = await updateTimetable({
          ...values,
          id: editingEntry.id
        });
      } else {
        // Create new timetable
        result = await createTimetable(values);
      }

      if (result.success) {
        toast.success(editingEntry ? "Timetable updated successfully" : "Timetable created successfully");
        setTimetableDialogOpen(false);
        timetableForm.reset();
        setEditingEntry(null);
        fetchData();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  async function onSubmitSlot(values: TimetableSlotFormValues) {
    try {
      let result;

      if (editingEntry) {
        // Update existing slot
        result = await updateTimetableSlot({
          ...values,
          id: editingEntry.id
        });
      } else {
        // Create new slot
        result = await createTimetableSlot(values);
      }

      if (result.success) {
        toast.success(editingEntry ? "Schedule updated successfully" : "Schedule created successfully");
        setSlotDialogOpen(false);
        slotForm.reset({
          timetableId: selectedTimetable,
          classId: selectedClass,
          day: selectedDay as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
        });
        setEditingEntry(null);

        // Refresh data
        if (selectedClass && selectedTimetable) {
          fetchSlotsForClass(selectedClass, selectedTimetable);
        } else if (teacherFilter) {
          fetchSlotsForTeacher(teacherFilter);
        } else if (roomFilter) {
          fetchSlotsForRoom(roomFilter);
        }
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  }

  function handleEditTimetable(timetable: any) {
    timetableForm.reset({
      name: timetable.name,
      description: timetable.description || "",
      effectiveFrom: new Date(timetable.effectiveFrom),
      effectiveTo: timetable.effectiveTo ? new Date(timetable.effectiveTo) : undefined,
      isActive: timetable.isActive,
    });

    setEditingEntry(timetable);
    setTimetableDialogOpen(true);
  }

  function handleAddTimetable() {
    timetableForm.reset({
      name: "",
      description: "",
      effectiveFrom: new Date(),
      isActive: true,
    });

    setEditingEntry(null);
    setTimetableDialogOpen(true);
  }

  function handleEditSlot(entry: any) {
    // Convert times to Date objects for form
    const startTime = new Date(entry.startTime);
    const endTime = new Date(entry.endTime);

    slotForm.reset({
      timetableId: entry.timetable.id,
      classId: entry.class.id,
      sectionId: entry.section?.id,
      day: entry.day,
      startTime,
      endTime,
      subjectTeacherId: subjectTeachers.find(st =>
        st.subjectId === entry.subject.id &&
        st.teacherId === entry.teacher.id
      )?.id || "",
      roomId: entry.room?.id,
    });

    setEditingEntry(entry);
    setSlotDialogOpen(true);
  }

  function handleAddSlot(periodId: string) {
    // Parse the period time to set default start and end times
    const periodInfo = periods.find(p => p.id === periodId);
    let startTime = new Date();
    let endTime = new Date();

    if (periodInfo) {
      const [startHour, startMinute] = periodInfo.startTime.split(':').map(Number);
      const [endHour, endMinute] = periodInfo.endTime.split(':').map(Number);

      startTime = setMinutes(setHours(new Date(), startHour), startMinute);
      endTime = setMinutes(setHours(new Date(), endHour), endMinute);
    }

    slotForm.reset({
      timetableId: selectedTimetable,
      classId: selectedClass,
      day: selectedDay as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
      startTime,
      endTime,
    });

    setEditingEntry(null);
    setSlotDialogOpen(true);
  }

  async function handleDeleteSlot(entry: any) {
    setEditingEntry(entry);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteTimetable(timetable: any) {
    setEditingEntry(timetable);
    setDeleteTimetableDialogOpen(true);
  }

  async function confirmDeleteSlot() {
    if (editingEntry) {
      try {
        const result = await deleteTimetableSlot(editingEntry.id);

        if (result.success) {
          toast.success("Schedule entry deleted successfully");
          setDeleteDialogOpen(false);
          setEditingEntry(null);

          // Refresh data
          if (selectedClass && selectedTimetable) {
            fetchSlotsForClass(selectedClass, selectedTimetable);
          } else if (teacherFilter) {
            fetchSlotsForTeacher(teacherFilter);
          } else if (roomFilter) {
            fetchSlotsForRoom(roomFilter);
          }
        } else {
          toast.error(result.error || "Failed to delete schedule entry");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  async function confirmDeleteTimetable() {
    if (editingEntry) {
      try {
        const result = await deleteTimetable(editingEntry.id);

        if (result.success) {
          toast.success("Timetable deleted successfully");
          setDeleteTimetableDialogOpen(false);
          setEditingEntry(null);

          // Refresh data and reset selection if current timetable was deleted
          if (selectedTimetable === editingEntry.id) {
            setSelectedTimetable("");
          }
          fetchData();
        } else {
          toast.error(result.error || "Failed to delete timetable");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
      }
    }
  }

  // Handle configuration changes
  function handleConfigChanged() {
    loadTimetableConfig();
  }

  // Get slots for the selected class and day
  const getSlotsForSelectedClassAndDay = () => {
    return slots.filter(slot =>
      slot.class.id === selectedClass &&
      slot.day === selectedDay
    ).sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  };

  // Get slots for the selected teacher
  const getSlotsForSelectedTeacher = () => {
    if (!teacherFilter) return [];
    return slots.filter(slot => slot.teacher.id === teacherFilter);
  };

  // Get slots for the selected room
  const getSlotsForSelectedRoom = () => {
    if (!roomFilter) return [];
    return slots.filter(slot => slot.room?.id === roomFilter);
  };

  // Get weekly schedule for the selected class
  const getWeeklyScheduleForClass = () => {
    return slots.filter(slot => slot.class.id === selectedClass);
  };

  // Get a period's slot for the selected class and day
  const getSlotForPeriod = (periodId: string) => {
    const periodInfo = periods.find(p => p.id === periodId);
    if (!periodInfo) return null;

    const [startHour, startMinute] = periodInfo.startTime.split(':').map(Number);
    const [endHour, endMinute] = periodInfo.endTime.split(':').map(Number);

    const periodStartTime = setMinutes(setHours(new Date(), startHour), startMinute);
    const periodEndTime = setMinutes(setHours(new Date(), endHour), endMinute);

    // Find a slot that overlaps with this period
    return getSlotsForSelectedClassAndDay().find(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);

      // Check if the slot overlaps with the period
      return (
        (slotStart <= periodStartTime && slotEnd > periodStartTime) ||
        (slotStart < periodEndTime && slotEnd >= periodEndTime) ||
        (slotStart >= periodStartTime && slotEnd <= periodEndTime)
      );
    });
  };

  if (loading && (!timetables.length || !classes.length)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/teaching">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Timetable Management</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <TimetableConfigDialog onConfigChanged={handleConfigChanged} />
          <Dialog open={timetableDialogOpen} onOpenChange={setTimetableDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddTimetable} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> New Timetable
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit Timetable" : "Create New Timetable"}</DialogTitle>
                <DialogDescription>
                  {editingEntry
                    ? "Update the details of this timetable"
                    : "Create a new timetable for your institution"}
                </DialogDescription>
              </DialogHeader>
              <Form {...timetableForm}>
                <form onSubmit={timetableForm.handleSubmit(onSubmitTimetable)} className="space-y-4">
                  <FormField<TimetableFormValues>
                    control={timetableForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timetable Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Spring Semester 2023"
                            {...field}
                            value={field.value?.toString() || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField<TimetableFormValues>
                    control={timetableForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description" {...field} value={typeof field.value === 'string' ? field.value : ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField<TimetableFormValues>
                      control={timetableForm.control}
                      name="effectiveFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective From</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value instanceof Date ? field.value : undefined}
                              onSelect={field.onChange}
                              placeholder="Select date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField<TimetableFormValues>
                      control={timetableForm.control}
                      name="effectiveTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective To (Optional)</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value instanceof Date ? field.value : undefined}
                              onSelect={field.onChange}
                              placeholder="Select date"
                              disabled={(date) => {
                                const effectiveFrom = timetableForm.getValues("effectiveFrom");
                                return effectiveFrom ? date < effectiveFrom : false;
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField<TimetableFormValues>
                    control={timetableForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Set as active timetable
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            This will make this timetable the active one. Only one timetable can be active at a time.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {editingEntry ? "Update Timetable" : "Create Timetable"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-1">Timetable</label>
              <Select value={selectedTimetable} onValueChange={setSelectedTimetable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timetable" />
                </SelectTrigger>
                <SelectContent>
                  {timetables.map(timetable => (
                    <SelectItem key={timetable.id} value={timetable.id}>
                      {timetable.name} {timetable.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTimetable && timetables.find(t => t.id === selectedTimetable) && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTimetable(timetables.find(t => t.id === selectedTimetable))}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Timetable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500"
                  onClick={() => handleDeleteTimetable(timetables.find(t => t.id === selectedTimetable))}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Timetable
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTimetable ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="md:w-1/2">
              <div className="mb-1 text-sm font-medium">Class</div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-1/2 flex items-center gap-2">
              <div className="mb-1 text-sm font-medium">Day</div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay('prev')}
                disabled={weekDays.indexOf(selectedDay) === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map(day => (
                    <SelectItem key={day} value={day}>
                      {formatDayForDisplay(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay('next')}
                disabled={weekDays.indexOf(selectedDay) === weekDays.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {classes.find(cls => cls.id === selectedClass)?.name || "No Class Selected"} - {formatDayForDisplay(selectedDay)} Schedule
                  </CardTitle>
                  <CardDescription>
                    Manage class timetable for the selected day
                  </CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                  {getSlotsForSelectedClassAndDay().length || 0} Periods
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : getSlotsForSelectedClassAndDay().length > 0 ? (
                <div className="space-y-4">
                  {periods.map(period => {
                    const entry = getSlotForPeriod(period.id);

                    return (
                      <div key={period.id} className="border rounded-md">
                        <div className="flex items-center justify-between bg-accent p-3 border-b">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{period.time}</span>
                          </div>
                          {!entry && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddSlot(period.id)}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Add Class
                            </Button>
                          )}
                        </div>
                        {entry ? (
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                                    <BookOpen className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{entry.subject.name}</p>
                                    <p className="text-xs text-muted-foreground">{entry.subject.code}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{entry.teacher.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{entry.room?.name || "No Room"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 md:self-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSlot(entry)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => handleDeleteSlot(entry)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 flex justify-center items-center text-muted-foreground h-24">
                            <p className="text-sm">No class scheduled for this period</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No Classes Scheduled</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    There are no classes scheduled for {classes.find(cls => cls.id === selectedClass)?.name || "this class"} on {formatDayForDisplay(selectedDay)}.
                  </p>
                  <Button onClick={() => handleAddSlot("p1")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Schedule
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Last updated: {format(new Date(), 'MMMM d, yyyy')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Tabs defaultValue="weekly" className="mt-4">
            <TabsList>
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
              <TabsTrigger value="teachers">Teachers Timetable</TabsTrigger>
              <TabsTrigger value="rooms">Rooms Occupancy</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Schedule Overview</CardTitle>
                  <CardDescription>
                    Complete weekly schedule for {classes.find(cls => cls.id === selectedClass)?.name || "selected class"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-accent">
                            <th className="border p-3 text-left">Time</th>
                            {weekDays.map(day => (
                              <th key={day} className="border p-3 text-left">{formatDayForDisplay(day)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {periods.map(period => (
                            <tr key={period.id}>
                              <td className="border p-3 text-sm font-medium">{period.time}</td>
                              {weekDays.map(day => {
                                // Filter slots for this class, day, and period
                                const weeklySlots = getWeeklyScheduleForClass();
                                const slot = weeklySlots.find(s => {
                                  if (s.day !== day) return false;

                                  const [startHour, startMinute] = period.startTime.split(':').map(Number);
                                  const [endHour, endMinute] = period.endTime.split(':').map(Number);

                                  const periodStartTime = setMinutes(setHours(new Date(), startHour), startMinute);
                                  const periodEndTime = setMinutes(setHours(new Date(), endHour), endMinute);

                                  const slotStart = new Date(s.startTime);
                                  const slotEnd = new Date(s.endTime);

                                  // Check for overlap
                                  return (
                                    (slotStart <= periodStartTime && slotEnd > periodStartTime) ||
                                    (slotStart < periodEndTime && slotEnd >= periodEndTime) ||
                                    (slotStart >= periodStartTime && slotEnd <= periodEndTime)
                                  );
                                });

                                return (
                                  <td key={day} className="border p-3">
                                    {slot ? (
                                      <div className="text-xs">
                                        <div className="font-medium">{slot.subject.name}</div>
                                        <div className="text-muted-foreground mt-1 flex flex-col gap-1">
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {slot.teacher.name}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Building className="h-3 w-3" />
                                            {slot.room?.name || "No Room"}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground text-center">-</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teachers" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Teachers' Schedules</CardTitle>
                      <CardDescription>View timetables by teacher</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Select Teacher</label>
                      <Select value={teacherFilter} onValueChange={(value) => {
                        setTeacherFilter(value);
                        if (value) fetchSlotsForTeacher(value);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {teacherFilter ? (
                      loading ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : getSlotsForSelectedTeacher().length > 0 ? (
                        <div className="rounded-md border overflow-hidden">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-accent">
                                <th className="border p-3 text-left">Day</th>
                                <th className="border p-3 text-left">Time</th>
                                <th className="border p-3 text-left">Class</th>
                                <th className="border p-3 text-left">Subject</th>
                                <th className="border p-3 text-left">Room</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getSlotsForSelectedTeacher().sort((a, b) => {
                                // Sort by day then by time
                                const dayOrder = weekDays.indexOf(a.day) - weekDays.indexOf(b.day);
                                if (dayOrder !== 0) return dayOrder;
                                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                              }).map(slot => (
                                <tr key={slot.id} className="border-b">
                                  <td className="border p-3">{formatDayForDisplay(slot.day)}</td>
                                  <td className="border p-3">
                                    {formatTimeForDisplay(new Date(slot.startTime))} - {formatTimeForDisplay(new Date(slot.endTime))}
                                  </td>
                                  <td className="border p-3">
                                    {slot.class.name} {slot.section && `(${slot.section.name})`}
                                  </td>
                                  <td className="border p-3">
                                    <div className="font-medium">{slot.subject.name}</div>
                                    <div className="text-xs text-muted-foreground">{slot.subject.code}</div>
                                  </td>
                                  <td className="border p-3">{slot.room?.name || "No Room"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No schedule found for this teacher.</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Please select a teacher to view their schedule.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rooms" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Room Occupancy</CardTitle>
                      <CardDescription>View schedules by room</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Select Room</label>
                      <Select value={roomFilter} onValueChange={(value) => {
                        setRoomFilter(value);
                        if (value) fetchSlotsForRoom(value);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map(room => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {roomFilter ? (
                      loading ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : getSlotsForSelectedRoom().length > 0 ? (
                        <div className="rounded-md border overflow-hidden">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-accent">
                                <th className="border p-3 text-left">Day</th>
                                <th className="border p-3 text-left">Time</th>
                                <th className="border p-3 text-left">Class</th>
                                <th className="border p-3 text-left">Subject</th>
                                <th className="border p-3 text-left">Teacher</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getSlotsForSelectedRoom().sort((a, b) => {
                                // Sort by day then by time
                                const dayOrder = weekDays.indexOf(a.day) - weekDays.indexOf(b.day);
                                if (dayOrder !== 0) return dayOrder;
                                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                              }).map(slot => (
                                <tr key={slot.id} className="border-b">
                                  <td className="border p-3">{formatDayForDisplay(slot.day)}</td>
                                  <td className="border p-3">
                                    {formatTimeForDisplay(new Date(slot.startTime))} - {formatTimeForDisplay(new Date(slot.endTime))}
                                  </td>
                                  <td className="border p-3">
                                    {slot.class.name} {slot.section && `(${slot.section.name})`}
                                  </td>
                                  <td className="border p-3">
                                    <div className="font-medium">{slot.subject.name}</div>
                                    <div className="text-xs text-muted-foreground">{slot.subject.code}</div>
                                  </td>
                                  <td className="border p-3">{slot.teacher.name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No schedule found for this room.</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Please select a room to view its schedule.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Timetable Selected</h3>
          <p className="text-sm mb-4">
            {timetables.length === 0
              ? "No timetables have been created yet. Create your first timetable to get started."
              : "Please select a timetable from the dropdown above."}
          </p>
          <Button onClick={handleAddTimetable}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Timetable
          </Button>
        </div>
      )}

      {/* Slot Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the details of this schedule entry"
                : "Create a new schedule entry for the selected class"}
            </DialogDescription>
          </DialogHeader>
          <Form {...slotForm}>
            <form onSubmit={slotForm.handleSubmit(onSubmitSlot)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField<TimetableSlotFormValues>
                  control={slotForm.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={typeof field.value === 'string' ? field.value : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weekDays.map(day => (
                            <SelectItem key={day} value={day}>
                              {formatDayForDisplay(day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<TimetableSlotFormValues>
                  control={slotForm.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField<TimetableSlotFormValues>
                control={slotForm.control}
                name="sectionId"
                render={({ field }) => {
                  const selectedClassObj = classes.find(c => c.id === slotForm.watch("classId"));
                  const sections = selectedClassObj?.sections || [];

                  return (
                    <FormItem>
                      <FormLabel>Section (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString() || "none"}
                        disabled={sections.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={sections.length > 0 ? "Select section" : "No sections available"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Entire Class (No specific section)</SelectItem>
                          {sections.map((section: any) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField<TimetableSlotFormValues>
                  control={slotForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <TimePicker
                          date={typeof field.value === 'string' ? new Date(field.value) : field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<TimetableSlotFormValues>
                  control={slotForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <TimePicker
                          date={typeof field.value === 'string' ? new Date(field.value) : field.value}
                          setDate={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField<TimetableSlotFormValues>
                control={slotForm.control}
                name="subjectTeacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject & Teacher</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={typeof field.value === 'string' ? field.value : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject and teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectTeachers.map(st => (
                          <SelectItem key={st.id} value={st.id}>
                            {st.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<TimetableSlotFormValues>
                control={slotForm.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={typeof field.value === 'string' ? field.value : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Room Assignment</SelectItem>
                        {rooms.map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} {room.capacity && `(Capacity: ${room.capacity})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<TimetableSlotFormValues>
                control={slotForm.control}
                name="topicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Syllabus Topic (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={typeof field.value === 'string' ? field.value : "none"}
                      disabled={availableTopics.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={availableTopics.length > 0 ? "Select topic to teach" : "Select subject first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Topic Assigned</SelectItem>
                        {availableTopics.map(topic => (
                          <SelectItem key={topic.id} value={topic.id}>
                            Ch{topic.chapterNumber}: {topic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<TimetableSlotFormValues>
                control={slotForm.control}
                name="timetableId"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormLabel>Timetable</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value?.toString() || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  {editingEntry ? "Update Schedule" : "Add Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Slot Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSlot}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Timetable Confirmation Dialog */}
      <Dialog open={deleteTimetableDialogOpen} onOpenChange={setDeleteTimetableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Timetable</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this timetable? This action cannot be undone and will remove all associated schedule entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTimetableDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTimetable}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

