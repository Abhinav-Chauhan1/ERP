"use client";

/**
 * Alumni Communication Page
 * 
 * This page allows administrators to send messages to alumni groups with:
 * - Recipient selection with filters
 * - Message composer
 * - Channel selection (email, SMS, WhatsApp)
 * - Preview and send functionality
 * - Delivery status tracking
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Send,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import toast from "react-hot-toast";

// Import server actions
import {
  getAlumniForCommunication,
  sendAlumniMessage,
} from "@/lib/actions/alumniActions";

// Types
type AlumniRecipient = {
  id: string;
  studentName: string;
  admissionId: string;
  graduationDate: Date;
  finalClass: string;
  currentEmail?: string;
  currentPhone?: string;
  allowCommunication: boolean;
  communicationEmail?: string;
};

type CommunicationChannel = "email" | "sms" | "whatsapp";

type DeliveryResult = {
  alumniId: string;
  alumniName: string;
  success: boolean;
  error?: string;
};

export default function AlumniCommunicationPage() {
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alumni, setAlumni] = useState<AlumniRecipient[]>([]);
  const [selectedAlumniIds, setSelectedAlumniIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [graduationYearFrom, setGraduationYearFrom] = useState<string>("");
  const [graduationYearTo, setGraduationYearTo] = useState<string>("");
  const [finalClass, setFinalClass] = useState<string>("");
  const [currentCity, setCurrentCity] = useState<string>("");
  const [allowCommunicationOnly, setAllowCommunicationOnly] = useState(true);

  // Message state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Set<CommunicationChannel>>(
    new Set(["email"])
  );

  // Dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [deliveryResults, setDeliveryResults] = useState<DeliveryResult[]>([]);

  // Fetch alumni on component mount and when filters change
  useEffect(() => {
    fetchAlumni();
  }, [graduationYearFrom, graduationYearTo, finalClass, currentCity, allowCommunicationOnly]);

  async function fetchAlumni() {
    setLoading(true);
    try {
      const result = await getAlumniForCommunication({
        graduationYearFrom: graduationYearFrom ? parseInt(graduationYearFrom) : undefined,
        graduationYearTo: graduationYearTo ? parseInt(graduationYearTo) : undefined,
        finalClass: finalClass || undefined,
        currentCity: currentCity || undefined,
        allowCommunicationOnly,
      });

      if (result.success && result.data) {
        // Transform the data to match AlumniRecipient type
        const transformedAlumni = result.data.alumni.map((a: any) => ({
          ...a,
          currentPhone: a.currentPhone ?? undefined,
        }));
        setAlumni(transformedAlumni);
      } else {
        toast.error(result.error || "Failed to load alumni");
      }
    } catch (error) {
      console.error("Error fetching alumni:", error);
      toast.error("Failed to load alumni");
    } finally {
      setLoading(false);
    }
  }

  // Filter alumni by search term
  const filteredAlumni = alumni.filter((alumnus) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      alumnus.studentName.toLowerCase().includes(searchLower) ||
      alumnus.admissionId.toLowerCase().includes(searchLower) ||
      alumnus.finalClass.toLowerCase().includes(searchLower)
    );
  });

  // Get selected alumni
  const selectedAlumni = filteredAlumni.filter((alumnus) =>
    selectedAlumniIds.has(alumnus.id)
  );

  // Handle select all
  function handleSelectAll() {
    if (selectedAlumniIds.size === filteredAlumni.length) {
      setSelectedAlumniIds(new Set());
    } else {
      setSelectedAlumniIds(new Set(filteredAlumni.map((a) => a.id)));
    }
  }

  // Handle select individual
  function handleSelectAlumni(id: string) {
    const newSelected = new Set(selectedAlumniIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAlumniIds(newSelected);
  }

  // Handle channel toggle
  function handleChannelToggle(channel: CommunicationChannel) {
    const newChannels = new Set(selectedChannels);
    if (newChannels.has(channel)) {
      newChannels.delete(channel);
    } else {
      newChannels.add(channel);
    }
    setSelectedChannels(newChannels);
  }

  // Validate form
  function validateForm(): string | null {
    if (selectedAlumniIds.size === 0) {
      return "Please select at least one recipient";
    }
    if (!subject.trim()) {
      return "Please enter a subject";
    }
    if (!message.trim()) {
      return "Please enter a message";
    }
    if (selectedChannels.size === 0) {
      return "Please select at least one communication channel";
    }
    return null;
  }

  // Handle preview
  function handlePreview() {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    setPreviewDialogOpen(true);
  }

  // Handle send
  async function handleSend() {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSending(true);
    setPreviewDialogOpen(false);

    try {
      const result = await sendAlumniMessage({
        alumniIds: Array.from(selectedAlumniIds),
        subject,
        message,
        channels: Array.from(selectedChannels),
      });

      if (result.success && result.data) {
        setDeliveryResults(result.data.results);
        setResultsDialogOpen(true);

        // Show success toast
        if (result.data.successCount > 0) {
          toast.success(
            `Message sent successfully to ${result.data.successCount} recipient(s)`
          );
        }

        // Show warning if some failed
        if (result.data.failureCount > 0) {
          toast.error(
            `Failed to send to ${result.data.failureCount} recipient(s)`
          );
        }

        // Reset form on success
        if (result.data.successCount > 0) {
          setSubject("");
          setMessage("");
          setSelectedAlumniIds(new Set());
        }
      } else {
        toast.error(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSending(false);
    }
  }

  // Get unique classes for filter
  const uniqueClasses = Array.from(new Set(alumni.map((a) => a.finalClass))).sort();

  // Get unique cities for filter
  const uniqueCities = Array.from(
    new Set(alumni.map((a) => a.currentEmail).filter(Boolean))
  ).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Link href="/admin/alumni">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Alumni
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alumni Communication</h1>
            <p className="text-sm text-muted-foreground">
              Send messages to alumni groups via email, SMS, or WhatsApp
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Recipient Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Recipients</CardTitle>
                  <CardDescription>
                    Filter and select alumni to send messages to
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              {showFilters && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="filters">
                    <AccordionTrigger>Filter Options</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 md:grid-cols-2 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="graduationYearFrom">
                            Graduation Year From
                          </Label>
                          <Input
                            id="graduationYearFrom"
                            type="number"
                            placeholder="e.g., 2020"
                            value={graduationYearFrom}
                            onChange={(e) => setGraduationYearFrom(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="graduationYearTo">
                            Graduation Year To
                          </Label>
                          <Input
                            id="graduationYearTo"
                            type="number"
                            placeholder="e.g., 2024"
                            value={graduationYearTo}
                            onChange={(e) => setGraduationYearTo(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="finalClass">Final Class</Label>
                          <Select value={finalClass} onValueChange={setFinalClass}>
                            <SelectTrigger id="finalClass">
                              <SelectValue placeholder="All classes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All classes</SelectItem>
                              {uniqueClasses.map((cls) => (
                                <SelectItem key={cls} value={cls}>
                                  {cls}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currentCity">Current City</Label>
                          <Input
                            id="currentCity"
                            placeholder="e.g., Mumbai"
                            value={currentCity}
                            onChange={(e) => setCurrentCity(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2 md:col-span-2">
                          <Checkbox
                            id="allowCommunicationOnly"
                            checked={allowCommunicationOnly}
                            onCheckedChange={(checked) =>
                              setAllowCommunicationOnly(checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="allowCommunicationOnly"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Only show alumni who opted in for communications
                          </Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, admission ID, or class..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Selection Summary */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedAlumniIds.size} of {filteredAlumni.length} selected
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredAlumni.length === 0}
                >
                  {selectedAlumniIds.size === filteredAlumni.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              <Separator />

              {/* Alumni List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredAlumni.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No alumni found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or search criteria
                    </p>
                  </div>
                ) : (
                  filteredAlumni.map((alumnus) => (
                    <div
                      key={alumnus.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${selectedAlumniIds.has(alumnus.id)
                          ? "bg-primary/10 border-primary/30"
                          : ""
                        }`}
                      onClick={() => handleSelectAlumni(alumnus.id)}
                    >
                      <Checkbox
                        checked={selectedAlumniIds.has(alumnus.id)}
                        onCheckedChange={() => handleSelectAlumni(alumnus.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {alumnus.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{alumnus.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {alumnus.admissionId} • {alumnus.finalClass}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Graduated:{" "}
                          {new Date(alumnus.graduationDate).getFullYear()}
                        </p>
                      </div>
                      {!alumnus.allowCommunication && (
                        <Badge variant="secondary" className="text-xs">
                          Opted Out
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Message Composer */}
        <div className="space-y-6">
          {/* Message Card */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>
                Write your message and select delivery channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Message subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  className="min-h-[200px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length} characters
                </p>
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <Label>Communication Channels *</Label>
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${selectedChannels.has("email")
                        ? "bg-primary/10 border-primary/30"
                        : ""
                      }`}
                    onClick={() => handleChannelToggle("email")}
                  >
                    <Checkbox
                      checked={selectedChannels.has("email")}
                      onCheckedChange={() => handleChannelToggle("email")}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-muted-foreground">
                        Send via email
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${selectedChannels.has("sms")
                        ? "bg-primary/10 border-primary/30"
                        : ""
                      }`}
                    onClick={() => handleChannelToggle("sms")}
                  >
                    <Checkbox
                      checked={selectedChannels.has("sms")}
                      onCheckedChange={() => handleChannelToggle("sms")}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">SMS</p>
                      <p className="text-xs text-muted-foreground">
                        Send via text message
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${selectedChannels.has("whatsapp")
                        ? "bg-primary/10 border-primary/30"
                        : ""
                      }`}
                    onClick={() => handleChannelToggle("whatsapp")}
                  >
                    <Checkbox
                      checked={selectedChannels.has("whatsapp")}
                      onCheckedChange={() => handleChannelToggle("whatsapp")}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        Send via WhatsApp
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  className="w-full"
                  disabled={sending}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Message
                </Button>
                <Button
                  onClick={handleSend}
                  className="w-full"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Message</DialogTitle>
            <DialogDescription>
              Review your message before sending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <Label className="text-sm font-medium">Recipients</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  {selectedAlumni.length} alumni selected
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedAlumni.slice(0, 5).map((alumnus) => (
                    <Badge key={alumnus.id} variant="secondary">
                      {alumnus.studentName}
                    </Badge>
                  ))}
                  {selectedAlumni.length > 5 && (
                    <Badge variant="secondary">
                      +{selectedAlumni.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Channels */}
            <div>
              <Label className="text-sm font-medium">Channels</Label>
              <div className="mt-2 flex gap-2">
                {Array.from(selectedChannels).map((channel) => (
                  <Badge key={channel} variant="outline">
                    {channel === "email" && <Mail className="h-3 w-3 mr-1" />}
                    {channel === "sms" && <Phone className="h-3 w-3 mr-1" />}
                    {channel === "whatsapp" && (
                      <MessageSquare className="h-3 w-3 mr-1" />
                    )}
                    {channel.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label className="text-sm font-medium">Subject</Label>
              <p className="mt-2 p-3 bg-muted rounded-lg text-sm">{subject}</p>
            </div>

            {/* Message */}
            <div>
              <Label className="text-sm font-medium">Message</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Edit
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Status</DialogTitle>
            <DialogDescription>
              Message delivery results for all recipients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Success
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {deliveryResults.filter((r) => r.success).length}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    Failed
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {deliveryResults.filter((r) => !r.success).length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Total
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {deliveryResults.length}
                </p>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {deliveryResults.map((result) => (
                <div
                  key={result.alumniId}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                    }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{result.alumniName}</p>
                    {result.error && (
                      <p className="text-xs text-red-700 mt-1">
                        {result.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setResultsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
