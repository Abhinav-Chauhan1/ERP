"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2,
  Share2, Download, Globe, Lock, CheckCircle2, XCircle,
  Clock4, AlertCircle, MoreVertical, UserPlus, Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchemaWithRefinement, type EventFormDataWithRefinement } from "@/lib/schemaValidation/eventSchemaValidation";
import {
  updateEvent, deleteEvent, updateEventStatus,
  addParticipant, removeParticipant, markAttendance, getEventParticipants,
} from "@/lib/actions/eventActions";
import { getUsersForDropdown } from "@/lib/actions/userActions";
import * as z from "zod";

const formatDate = (d: Date | string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const formatTime = (d: Date | string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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

const addParticipantSchema = z.object({
  userId: z.string({ required_error: "User is required" }),
  role: z.string().default("ATTENDEE"),
});

interface Props {
  event: any;
  initialParticipants: any[];
}

export function AdminEventDetailClient({ event: initialEvent, initialParticipants }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState<any>(initialEvent);
  const [participants, setParticipants] = useState<any[]>(initialParticipants);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);

  const dtValue = (v: any) => v instanceof Date ? v.toISOString().slice(0, 16) : v ? new Date(v).toISOString().slice(0, 16) : "";

  const editForm = useForm<EventFormDataWithRefinement>({
    resolver: zodResolver(eventSchemaWithRefinement),
    defaultValues: {
      title: event.title, description: event.description || "",
      startDate: new Date(event.startDate), endDate: new Date(event.endDate),
      location: event.location || "", organizer: event.organizer || "",
      type: event.type || undefined, status: event.status,
      maxParticipants: event.maxParticipants || undefined,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
      isPublic: event.isPublic, thumbnail: event.thumbnail || "",
    },
  });

  const participantForm = useForm<z.infer<typeof addParticipantSchema>>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: { role: "ATTENDEE" },
  });

  const refreshParticipants = () => {
    startTransition(async () => {
      const res = await getEventParticipants(event.id);
      if (res.success) setParticipants(res.data);
    });
  };

  const loadUsers = async () => {
    if (users.length > 0) return;
    setUsersLoading(true);
    const res = await getUsersForDropdown();
    if (res.success && res.data) setUsers(res.data);
    setUsersLoading(false);
  };

  const handleUpdate = async (data: EventFormDataWithRefinement) => {
    const res = await updateEvent(event.id, data);
    if (res.success && res.data) {
      toast.success("Event updated");
      setEvent(res.data);
      setEditOpen(false);
    } else {
      toast.error(res.error || "Failed to update event");
    }
  };

  const handleDelete = async () => {
    const res = await deleteEvent(event.id);
    if (res.success) { toast.success("Event deleted"); router.push("/admin/events"); }
    else { toast.error(res.error || "Failed to delete event"); setDeleteOpen(false); }
  };

  const handleStatusUpdate = async (status: string) => {
    const res = await updateEventStatus(event.id, status as any);
    if (res.success && res.data) { toast.success(`Status updated to ${status}`); setEvent({ ...event, status }); }
    else toast.error(res.error || "Failed to update status");
  };

  const handleAddParticipant = async (data: z.infer<typeof addParticipantSchema>) => {
    const res = await addParticipant({ eventId: event.id, userId: data.userId, role: data.role, attended: false });
    if (res.success) {
      toast.success("Participant added");
      setAddParticipantOpen(false);
      participantForm.reset();
      refreshParticipants();
    } else {
      toast.error(res.error || "Failed to add participant");
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    const res = await removeParticipant(event.id, userId);
    if (res.success) { toast.success("Participant removed"); refreshParticipants(); }
    else toast.error(res.error || "Failed to remove participant");
  };

  const handleMarkAttendance = async (userId: string, attended: boolean) => {
    const res = await markAttendance(event.id, userId, attended);
    if (res.success) { toast.success("Attendance recorded"); refreshParticipants(); }
    else toast.error(res.error || "Failed to record attendance");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const progress = () => {
    if (event.status !== "ONGOING") return 0;
    const start = new Date(event.startDate).getTime();
    const end = new Date(event.endDate).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/events"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <Badge className={STATUS_COLORS[event.status] || "bg-muted"}>{event.status}</Badge>
          {event.type && <Badge className={TYPE_COLORS[event.type] || "bg-muted"}>{event.type}</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}><Share2 className="h-4 w-4 mr-2" />Share</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setAddParticipantOpen(true); loadUsers(); }}><UserPlus className="h-4 w-4 mr-2" />Add Participant</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}><Download className="h-4 w-4 mr-2" />Print / Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              {["UPCOMING","ONGOING","COMPLETED","POSTPONED","CANCELLED"].filter(s => s !== event.status).map(s => (
                <DropdownMenuItem key={s} onClick={() => handleStatusUpdate(s)}>
                  Set as {s.charAt(0)+s.slice(1).toLowerCase()}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-2" />Delete Event</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Thumbnail */}
      {event.thumbnail && (
        <div className="h-48 sm:h-64 w-full relative rounded-lg overflow-hidden">
          <OptimizedImage src={event.thumbnail} alt={event.title} fill sizes="100vw" className="object-cover" qualityPreset="high" aboveFold />
        </div>
      )}

      {/* Progress for ongoing */}
      {event.status === "ONGOING" && (
        <div>
          <div className="flex justify-between text-sm mb-1"><span>Event Progress</span><span>{progress()}%</span></div>
          <Progress value={progress()} />
        </div>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">Participants ({event._count?.participants ?? participants.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Event Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div><p className="font-medium">Date</p><p className="text-sm text-muted-foreground">{formatDate(event.startDate)}{formatDate(event.startDate) !== formatDate(event.endDate) && ` – ${formatDate(event.endDate)}`}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div><p className="font-medium">Time</p><p className="text-sm text-muted-foreground">{formatTime(event.startDate)} – {formatTime(event.endDate)}</p></div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div><p className="font-medium">Location</p><p className="text-sm text-muted-foreground">{event.location}</p></div>
                  </div>
                )}
                {event.organizer && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div><p className="font-medium">Organizer</p><p className="text-sm text-muted-foreground">{event.organizer}</p></div>
                  </div>
                )}
                {event.description && (
                  <div className="pt-2 border-t">
                    <p className="font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quick Info</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Visibility</span>
                  <span className="flex items-center gap-1">{event.isPublic ? <><Globe className="h-3.5 w-3.5" />Public</> : <><Lock className="h-3.5 w-3.5" />Private</>}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Participants</span>
                  <span>{event._count?.participants ?? "—"}{event.maxParticipants ? ` / ${event.maxParticipants}` : ""}</span>
                </div>
                {event.registrationDeadline && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Reg. Deadline</span>
                    <span>{formatDate(event.registrationDeadline)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Participants</CardTitle>
              <Button size="sm" onClick={() => { setAddParticipantOpen(true); loadUsers(); }}><UserPlus className="h-4 w-4 mr-2" />Add</Button>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No participants yet</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Role</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Attended</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr></thead>
                    <tbody>
                      {participants.map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs">{p.user?.firstName?.[0]}{p.user?.lastName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{p.user?.firstName} {p.user?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4"><Badge variant="outline">{p.role}</Badge></td>
                          <td className="py-3 px-4">
                            <input type="checkbox" checked={p.attended} onChange={e => handleMarkAttendance(p.userId, e.target.checked)} className="h-4 w-4 cursor-pointer" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveParticipant(p.userId)}>Remove</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle><DialogDescription>Update event details.</DialogDescription></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>{["ACADEMIC","CULTURAL","SPORTS","ADMINISTRATIVE","HOLIDAY","OTHER"].map(t => <SelectItem key={t} value={t}>{t.charAt(0)+t.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><textarea className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Start*</FormLabel><FormControl><Input type="datetime-local" {...field} value={dtValue(field.value)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="endDate" render={({ field }) => (
                  <FormItem><FormLabel>End*</FormLabel><FormControl><Input type="datetime-local" {...field} value={dtValue(field.value)} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{["UPCOMING","ONGOING","COMPLETED","CANCELLED","POSTPONED"].map(s => <SelectItem key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="isPublic" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="h-4 w-4 mt-0.5" /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel>Public Event</FormLabel></div>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>{editForm.formState.isSubmitting ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
          <Form {...participantForm}>
            <form onSubmit={participantForm.handleSubmit(handleAddParticipant)} className="space-y-4">
              <FormField control={participantForm.control} name="userId" render={({ field }) => (
                <FormItem><FormLabel>User</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder={usersLoading ? "Loading..." : "Select user"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={participantForm.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["ATTENDEE","PARTICIPANT","VOLUNTEER","ORGANIZER"].map(r => <SelectItem key={r} value={r}>{r.charAt(0)+r.slice(1).toLowerCase()}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddParticipantOpen(false)}>Cancel</Button>
                <Button type="submit">Add Participant</Button>
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
            <DialogDescription>Are you sure you want to delete &quot;{event.title}&quot;? This cannot be undone.</DialogDescription>
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
