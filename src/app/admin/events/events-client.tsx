"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { PlusCircle, Calendar as CalendarIcon, Search, Filter, Users, MapPin, Clock, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchemaWithRefinement, type EventFormDataWithRefinement, type EventFilterData } from "@/lib/schemaValidation/eventSchemaValidation";
import { getEventsPageData, createEvent, updateEvent, deleteEvent, updateEventStatus } from "@/lib/actions/eventActions";
import { ImageUpload } from "@/components/image-upload";

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-primary/10 text-primary",
  ONGOING: "bg-green-100 text-green-800",
  COMPLETED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-red-100 text-red-800",
  POSTPONED: "bg-amber-100 text-amber-800",
};
const TYPE_COLORS: Record<string, string> = {
  ACADEMIC: "bg-indigo-100 text-indigo-800",
  CULTURAL: "bg-pink-100 text-pink-800",
  SPORTS: "bg-emerald-100 text-emerald-800",
  ADMINISTRATIVE: "bg-slate-100 text-slate-800",
  HOLIDAY: "bg-orange-100 text-orange-800",
};

interface Props {
  initialEvents: any[];
  initialUpcomingEvents: any[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
}

export function AdminEventsClient({ initialEvents, initialUpcomingEvents, initialTotal, initialPage, pageSize }: Props) {
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [events, setEvents] = useState<any[]>(initialEvents);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>(initialUpcomingEvents);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const defaultValues: Partial<EventFormDataWithRefinement> = {
    title: "", description: "", startDate: new Date(),
    endDate: new Date(Date.now() + 7200000), isPublic: true, status: "UPCOMING",
  };
  const createForm = useForm<EventFormDataWithRefinement>({ resolver: zodResolver(eventSchemaWithRefinement), defaultValues: defaultValues as any });
  const editForm = useForm<EventFormDataWithRefinement>({ resolver: zodResolver(eventSchemaWithRefinement), defaultValues: defaultValues as any });

  const buildFilter = useCallback((pg = page): EventFilterData & { page: number } => {
    const f: any = { page: pg };
    if (search) f.searchTerm = search;
    if (typeFilter) f.type = typeFilter;
    if (statusFilter) f.status = statusFilter;
    if (activeTab === "upcoming") { f.status = "UPCOMING"; f.startDate = new Date(); }
    if (activeTab === "past") f.endDate = new Date();
    return f;
  }, [search, typeFilter, statusFilter, activeTab, page]);

  const refresh = useCallback((pg?: number) => {
    startTransition(async () => {
      const res = await getEventsPageData(buildFilter(pg ?? page));
      if (res.success) {
        setEvents(res.events);
        setUpcomingEvents(res.upcomingEvents);
        setTotal(res.total);
        if (pg !== undefined) setPage(pg);
      } else {
        toast.error(res.error || "Failed to load events");
      }
    });
  }, [buildFilter, page]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    startTransition(async () => {
      const f: any = { page: 1 };
      if (search) f.searchTerm = search;
      if (typeFilter) f.type = typeFilter;
      if (tab === "upcoming") { f.status = "UPCOMING"; f.startDate = new Date(); }
      else if (tab === "past") f.endDate = new Date();
      else if (statusFilter) f.status = statusFilter;
      const res = await getEventsPageData(f);
      if (res.success) { setEvents(res.events); setUpcomingEvents(res.upcomingEvents); setTotal(res.total); setPage(1); }
    });
  };

  const handleCreate = async (data: EventFormDataWithRefinement) => {
    const res = await createEvent(data);
    if (res.success) { toast.success("Event created"); setCreateOpen(false); createForm.reset(defaultValues as any); refresh(1); }
    else toast.error(res.error || "Failed to create event");
  };

  const handleUpdate = async (data: EventFormDataWithRefinement) => {
    if (!selected) return;
    const res = await updateEvent(selected.id, data);
    if (res.success) { toast.success("Event updated"); setEditOpen(false); setSelected(null); refresh(); }
    else toast.error(res.error || "Failed to update event");
  };

  const handleDelete = async () => {
    if (!selected) return;
    const res = await deleteEvent(selected.id);
    if (res.success) { toast.success("Event deleted"); setDeleteOpen(false); setSelected(null); refresh(); }
    else toast.error(res.error || "Failed to delete event");
  };

  const openEdit = (event: any) => {
    setSelected(event);
    editForm.reset({
      title: event.title, description: event.description || "",
      startDate: new Date(event.startDate), endDate: new Date(event.endDate),
      location: event.location || "", organizer: event.organizer || "",
      type: event.type || undefined, status: event.status,
      maxParticipants: event.maxParticipants || undefined,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
      isPublic: event.isPublic, thumbnail: event.thumbnail || "",
    });
    setEditOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);
  const now = new Date();
  const upcomingCount = events.filter(e => e.status === "UPCOMING" && new Date(e.startDate) > now && new Date(e.startDate) < new Date(now.getTime() + 30 * 86400000)).length;
  const ongoingCount = events.filter(e => e.status === "ONGOING").length;

  // Shared datetime input helper
  const dtValue = (v: any) => v instanceof Date ? v.toISOString().slice(0, 16) : v || "";

  // Shared form body used in both create and edit dialogs
  const FormBody = ({ form }: { form: any }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title*</FormLabel><FormControl><Input placeholder="Event title" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem><FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
              <SelectContent>
                {["ACADEMIC","CULTURAL","SPORTS","ADMINISTRATIVE","HOLIDAY","OTHER"].map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0)+t.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem><FormLabel>Description</FormLabel>
          <FormControl><Textarea placeholder="Event description" className="min-h-20" {...field} value={field.value || ""} /></FormControl>
          <FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="startDate" render={({ field }) => (
          <FormItem><FormLabel>Start*</FormLabel>
            <FormControl><Input type="datetime-local" {...field} value={dtValue(field.value)} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="endDate" render={({ field }) => (
          <FormItem><FormLabel>End*</FormLabel>
            <FormControl><Input type="datetime-local" {...field} value={dtValue(field.value)} /></FormControl>
            <FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem><FormLabel>Location</FormLabel>
            <FormControl><Input placeholder="Location" {...field} value={field.value || ""} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="organizer" render={({ field }) => (
          <FormItem><FormLabel>Organizer</FormLabel>
            <FormControl><Input placeholder="Organizer" {...field} value={field.value || ""} /></FormControl>
            <FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="maxParticipants" render={({ field }) => (
          <FormItem><FormLabel>Max Participants</FormLabel>
            <FormControl><Input type="number" placeholder="Unlimited" {...field} value={field.value || ""}
              onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))} /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="registrationDeadline" render={({ field }) => (
          <FormItem><FormLabel>Registration Deadline</FormLabel>
            <FormControl><Input type="datetime-local" {...field} value={dtValue(field.value)} /></FormControl>
            <FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="thumbnail" render={({ field }) => (
        <FormItem><FormLabel>Thumbnail</FormLabel>
          <FormControl><ImageUpload value={field.value || ""} onChange={field.onChange} folder="events/thumbnails" label="Upload thumbnail" /></FormControl>
          <FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="isPublic" render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>Public Event</FormLabel>
            <FormDescription>Visible to all users</FormDescription>
          </div>
        </FormItem>
      )} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Event Management</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Create Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Event</DialogTitle><DialogDescription>Add a new event for your school.</DialogDescription></DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormBody form={createForm} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createForm.formState.isSubmitting}>
                    {createForm.formState.isSubmitting ? "Creating..." : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Upcoming Events</CardTitle><CardDescription>Next 30 days</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{upcomingCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Active Events</CardTitle><CardDescription>Currently ongoing</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{ongoingCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Total Events</CardTitle><CardDescription>All time</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{total}</div></CardContent></Card>
      </div>

      {/* Upcoming event cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className={TYPE_COLORS[event.type] || "bg-muted text-gray-800"}>{event.type || "Other"}</Badge>
                <Badge className={STATUS_COLORS[event.status] || "bg-muted text-gray-800"}>{event.status}</Badge>
              </div>
              <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
              <CardDescription className="line-clamp-2">{event.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm"><CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />{formatDate(event.startDate)}</div>
              <div className="flex items-center text-sm"><Clock className="h-4 w-4 mr-2 text-muted-foreground" />{formatTime(event.startDate)} – {formatTime(event.endDate)}</div>
              {event.location && <div className="flex items-center text-sm"><MapPin className="h-4 w-4 mr-2 text-muted-foreground" />{event.location}</div>}
              <div className="flex items-center text-sm"><Users className="h-4 w-4 mr-2 text-muted-foreground" />
                {event._count.participants}{event.maxParticipants ? ` / ${event.maxParticipants}` : ""} participants
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Link href={`/admin/events/${event.id}`}>
                <Button variant="ghost" size="sm">View Details <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </Link>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(event)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { setSelected(event); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardFooter>
          </Card>
        )) : (
          <Card className="md:col-span-3">
            <CardHeader><CardTitle className="text-lg">No Upcoming Events</CardTitle><CardDescription>Create a new event to get started</CardDescription></CardHeader>
            <CardContent><Button variant="outline" className="w-full" onClick={() => setCreateOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Create Event</Button></CardContent>
          </Card>
        )}
      </div>

      {/* Events table with filters */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div><CardTitle className="text-xl">All Events</CardTitle><CardDescription>Create, edit, and manage events</CardDescription></div>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search events..." className="pl-9" value={search}
                  onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && refresh(1)} />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter || "ALL"} onValueChange={v => setTypeFilter(v === "ALL" ? undefined : v)}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {["ACADEMIC","CULTURAL","SPORTS","ADMINISTRATIVE","HOLIDAY","OTHER"].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0)+t.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter || "ALL"} onValueChange={v => setStatusFilter(v === "ALL" ? undefined : v)}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {["UPCOMING","ONGOING","COMPLETED","CANCELLED","POSTPONED"].map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => refresh(1)} disabled={isPending}><Filter className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>
            {["all","upcoming","ongoing","past"].map(tab => (
              <TabsContent key={tab} value={tab}>
                {isPending ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No events found</div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent border-b">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Event</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Type</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Participants</th>
                          <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(event => (
                          <tr key={event.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 align-middle font-medium">
                              <div>{event.title}</div>
                              {event.location && <div className="text-xs text-muted-foreground flex items-center mt-1"><MapPin className="h-3 w-3 mr-1" />{event.location}</div>}
                            </td>
                            <td className="py-3 px-4 align-middle">
                              {event.type && <Badge className={TYPE_COLORS[event.type] || "bg-muted text-gray-800"}>{event.type}</Badge>}
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div>{formatDate(event.startDate)}</div>
                              <div className="text-xs text-muted-foreground">{formatTime(event.startDate)}</div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <Badge className={STATUS_COLORS[event.status] || "bg-muted text-gray-800"}>{event.status}</Badge>
                            </td>
                            <td className="py-3 px-4 align-middle">{event._count.participants}{event.maxParticipants ? ` / ${event.maxParticipants}` : ""}</td>
                            <td className="py-3 px-4 align-middle text-right">
                              <div className="flex justify-end gap-1">
                                <Link href={`/admin/events/${event.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                                <Button variant="ghost" size="sm" onClick={() => openEdit(event)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => { setSelected(event); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => refresh(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => refresh(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle><DialogDescription>Update event details.</DialogDescription></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormBody form={editForm} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selected?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
