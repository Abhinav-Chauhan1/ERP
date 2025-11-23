"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, PlusCircle, Search, Megaphone,
  Eye, Edit, Trash2, CheckCircle, XCircle, Loader2, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format } from "date-fns";

// Import server actions
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  getAnnouncementStats,
} from "@/lib/actions/announcementActions";

// Import validation schema
import {
  announcementSchema,
  AnnouncementFormValues,
} from "@/lib/schemaValidation/announcementSchemaValidation";

// Target audience options
const audienceOptions = [
  { value: "STUDENT" as const, label: "Students" },
  { value: "TEACHER" as const, label: "Teachers" },
  { value: "PARENT" as const, label: "Parents" },
  { value: "ADMIN" as const, label: "Administrators" },
];

export default function AnnouncementsPage() {
  // State management
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  // Initialize form
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      targetAudience: [],
      startDate: new Date(),
      endDate: undefined,
      isActive: true,
      attachments: "",
    },
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [announcementsResult, statsResult] = await Promise.all([
        getAnnouncements({ limit: 100 }),
        getAnnouncementStats(),
      ]);

      if (announcementsResult.success) setAnnouncements(announcementsResult.data || []);
      if (statsResult.success) setStats(statsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && announcement.isActive) ||
      (activeTab === "archived" && !announcement.isActive);

    return matchesSearch && matchesTab;
  });

  // Handle create announcement
  function handleCreateAnnouncement() {
    form.reset({
      title: "",
      content: "",
      targetAudience: [],
      startDate: new Date(),
      endDate: undefined,
      isActive: true,
      attachments: "",
    });
    setSelectedAnnouncementId(null);
    setCreateDialogOpen(true);
  }

  // Handle edit announcement
  function handleEditAnnouncement(announcement: any) {
    setSelectedAnnouncementId(announcement.id);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      startDate: new Date(announcement.startDate),
      endDate: announcement.endDate ? new Date(announcement.endDate) : undefined,
      isActive: announcement.isActive,
      attachments: announcement.attachments || "",
    });
    setEditDialogOpen(true);
  }

  // Handle view announcement
  function handleViewAnnouncement(announcement: any) {
    setSelectedAnnouncement(announcement);
    setViewDialogOpen(true);
  }

  // Handle delete announcement
  function handleDeleteAnnouncement(id: string) {
    setSelectedAnnouncementId(id);
    setDeleteDialogOpen(true);
  }

  // Handle toggle status
  async function handleToggleStatus(id: string) {
    try {
      const result = await toggleAnnouncementStatus(id);

      if (result.success) {
        toast.success("Announcement status updated");
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Submit announcement form
  async function onSubmitAnnouncement(values: AnnouncementFormValues) {
    try {
      let result;
      if (selectedAnnouncementId) {
        result = await updateAnnouncement(selectedAnnouncementId, values);
      } else {
        result = await createAnnouncement(values);
      }

      if (result.success) {
        toast.success(
          `Announcement ${selectedAnnouncementId ? "updated" : "created"} successfully`
        );
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        form.reset();
        setSelectedAnnouncementId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting announcement:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Confirm delete announcement
  async function confirmDeleteAnnouncement() {
    if (!selectedAnnouncementId) return;

    try {
      const result = await deleteAnnouncement(selectedAnnouncementId);

      if (result.success) {
        toast.success("Announcement deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedAnnouncementId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to delete announcement");
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("An unexpected error occurred");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/communication">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Communication
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        </div>
        <Button onClick={handleCreateAnnouncement}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Announcements</p>
                  <p className="text-2xl font-bold">{stats.totalAnnouncements}</p>
                </div>
                <Megaphone className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.activeAnnouncements}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                  <p className="text-2xl font-bold">{stats.archivedAnnouncements}</p>
                </div>
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs and Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Manage Announcements</CardTitle>
              <CardDescription>
                Create and manage school-wide announcements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Tabs */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search announcements..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Announcements List */}
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-10">
              <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No announcements found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || activeTab !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first announcement to get started"}
              </p>
              <Button onClick={handleCreateAnnouncement}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base">{announcement.title}</CardTitle>
                          <Badge variant={announcement.isActive ? "default" : "secondary"}>
                            {announcement.isActive ? "Active" : "Archived"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {announcement.publisher?.user?.firstName?.[0]}
                                {announcement.publisher?.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {announcement.publisher?.user?.firstName}{" "}
                              {announcement.publisher?.user?.lastName}
                            </span>
                          </div>
                          <span>•</span>
                          <span>{format(new Date(announcement.createdAt), "MMM dd, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {announcement.content}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {announcement.targetAudience.map((audience: string) => (
                        <Badge key={audience} variant="outline">
                          {audienceOptions.find((a) => a.value === audience)?.label || audience}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <div className="flex border-t">
                    <Link href={`/admin/communication/announcements/${announcement.id}`} className="flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-none"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 rounded-none border-l"
                      onClick={() => handleEditAnnouncement(announcement)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 rounded-none border-l"
                      onClick={() => handleToggleStatus(announcement.id)}
                    >
                      {announcement.isActive ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Archive
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 rounded-none border-l text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Announcement Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          setEditDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAnnouncementId ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription>
              {selectedAnnouncementId
                ? "Update announcement details"
                : "Create a new announcement for your school community"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAnnouncement)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Announcement title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Announcement content"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAudience"
                render={() => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormDescription>
                      Select who should see this announcement
                    </FormDescription>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {audienceOptions.map((option) => (
                        <FormField
                          key={option.value}
                          control={form.control}
                          name="targetAudience"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, option.value]);
                                    } else {
                                      field.onChange(
                                        current.filter((val) => val !== option.value)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={format(field.value, "yyyy-MM-dd")}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? new Date(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Make this announcement visible immediately
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedAnnouncementId ? "Update Announcement" : "Create Announcement"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedAnnouncement.publisher?.user?.firstName?.[0]}
                      {selectedAnnouncement.publisher?.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedAnnouncement.publisher?.user?.firstName}{" "}
                      {selectedAnnouncement.publisher?.user?.lastName}
                    </p>
                    <p className="text-xs">
                      {format(new Date(selectedAnnouncement.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Target Audience:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAnnouncement.targetAudience.map((audience: string) => (
                    <Badge key={audience} variant="outline">
                      {audienceOptions.find((a) => a.value === audience)?.label || audience}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedAnnouncement.startDate), "MMM dd, yyyy")}
                  </p>
                </div>
                {selectedAnnouncement.endDate && (
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedAnnouncement.endDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedAnnouncement) {
                handleEditAnnouncement(selectedAnnouncement);
              }
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAnnouncement}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

