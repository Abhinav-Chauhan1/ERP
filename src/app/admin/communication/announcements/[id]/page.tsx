"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { format } from "date-fns";

// Import server actions
import {
  getAnnouncementById,
  deleteAnnouncement,
  toggleAnnouncementStatus,
} from "@/lib/actions/announcementActions";

// Target audience options
const audienceOptions = [
  { value: "STUDENT", label: "Students" },
  { value: "TEACHER", label: "Teachers" },
  { value: "PARENT", label: "Parents" },
  { value: "ADMIN", label: "Administrators" },
];

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, [announcementId]);

  async function fetchAnnouncement() {
    setLoading(true);
    try {
      const result = await getAnnouncementById(announcementId);

      if (result.success && result.data) {
        setAnnouncement(result.data);
      } else {
        toast.error(result.error || "Announcement not found");
        router.push("/admin/communication/announcements");
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
      toast.error("Failed to load announcement");
      router.push("/admin/communication/announcements");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    try {
      const result = await toggleAnnouncementStatus(announcementId);

      if (result.success) {
        toast.success("Announcement status updated");
        fetchAnnouncement();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleDelete() {
    try {
      const result = await deleteAnnouncement(announcementId);

      if (result.success) {
        toast.success("Announcement deleted successfully");
        router.push("/admin/communication/announcements");
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

  if (!announcement) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg text-muted-foreground mb-4">Announcement not found</p>
        <Link href="/admin/communication/announcements">
          <Button>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Announcements
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/communication/announcements">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Announcements
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
          >
            {announcement.isActive ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Archive
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Link href={`/admin/communication/announcements/${announcementId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <CardTitle className="text-2xl">{announcement.title}</CardTitle>
                <Badge variant={announcement.isActive ? "default" : "secondary"}>
                  {announcement.isActive ? "Active" : "Archived"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {announcement.publisher?.user?.firstName?.[0]}
                      {announcement.publisher?.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {announcement.publisher?.user?.firstName}{" "}
                      {announcement.publisher?.user?.lastName}
                    </p>
                    <p className="text-xs">
                      Published on{" "}
                      {format(new Date(announcement.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Content</h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground">
                {announcement.content}
              </p>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Target Audience
            </h3>
            <div className="flex flex-wrap gap-2">
              {announcement.targetAudience.map((audience: string) => (
                <Badge key={audience} variant="outline">
                  {audienceOptions.find((a) => a.value === audience)?.label || audience}
                </Badge>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(announcement.startDate), "MMMM dd, yyyy")}
              </p>
            </div>
            {announcement.endDate && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(announcement.endDate), "MMMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {announcement.attachments && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Attachments</h3>
              <p className="text-sm text-muted-foreground">{announcement.attachments}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(announcement.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(announcement.updatedAt), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
