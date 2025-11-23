"use client";

/**
 * Bulk Message Composer Component
 * 
 * Interface for composing and sending bulk messages (SMS and Email).
 * Supports recipient selection by class, role, and custom groups.
 * Shows preview of recipients before sending.
 * 
 * Requirements: 11.4 - Bulk Messaging Interface
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// ScrollArea not available, using div with overflow
import {
  sendBulkMessage,
  previewRecipients,
  getAvailableClasses,
  getBulkMessagingStats,
  type BulkMessageInput,
  type BulkMessageRecipient,
} from "@/lib/actions/bulkMessagingActions";
import { getMessageTemplates } from "@/lib/actions/messageTemplateActions";
import { Send, Users, Eye, AlertCircle, CheckCircle, Loader2, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export function BulkMessageComposer() {
  const [messageType, setMessageType] = useState<"SMS" | "EMAIL" | "BOTH">("EMAIL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState<"MANUAL" | "CLASS" | "ROLE" | "ALL_PARENTS" | "ALL_TEACHERS" | "ALL_STUDENTS">("ALL_PARENTS");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  const [classes, setClasses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recipients, setRecipients] = useState<BulkMessageRecipient[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadClasses();
    loadTemplates();
    loadStats();
  }, []);

  const loadClasses = async () => {
    const result = await getAvailableClasses();
    if (result.success && result.data) {
      setClasses(result.data);
    }
  };

  const loadTemplates = async () => {
    const result = await getMessageTemplates({ isActive: true });
    if (result.success && result.data) {
      setTemplates(result.data);
    }
  };

  const loadStats = async () => {
    const result = await getBulkMessagingStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  };

  const handlePreviewRecipients = async () => {
    setLoading(true);
    try {
      const selection: BulkMessageInput["recipientSelection"] = {
        type: recipientType,
        classIds: recipientType === "CLASS" ? selectedClasses : undefined,
        roles: recipientType === "ROLE" ? selectedRoles : undefined,
      };

      const result = await previewRecipients(selection);
      if (result.success && result.data) {
        setRecipients(result.data);
        setShowPreview(true);
      } else {
        toast.error(result.error || "Failed to preview recipients");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to preview recipients");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    // Validate
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }

    if ((messageType === "EMAIL" || messageType === "BOTH") && !subject.trim()) {
      toast.error("Subject is required for email messages");
      return;
    }

    if (recipientType === "CLASS" && selectedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    if (recipientType === "ROLE" && selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const input: BulkMessageInput = {
        messageType,
        subject: subject.trim() || undefined,
        body: body.trim(),
        templateId: selectedTemplate || undefined,
        recipientSelection: {
          type: recipientType,
          classIds: recipientType === "CLASS" ? selectedClasses : undefined,
          roles: recipientType === "ROLE" ? selectedRoles : undefined,
        },
      };

      const result = await sendBulkMessage(input);
      
      if (result.success && result.data) {
        setSendResult(result.data);
        toast.success("Messages sent successfully!");
        
        // Reset form
        setBody("");
        setSubject("");
        setSelectedTemplate("");
        setRecipients([]);
      } else {
        toast.error(('error' in result ? result.error : 'Failed to send messages') || "Failed to send messages");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send messages");
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setBody(template.body);
      if (template.subject) {
        setSubject(template.subject);
      }
      if (template.type === "SMS") {
        setMessageType("SMS");
      } else if (template.type === "EMAIL") {
        setMessageType("EMAIL");
      } else {
        setMessageType("BOTH");
      }
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Parents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send Result */}
      {sendResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Messages sent successfully!</p>
              <div className="grid gap-2 text-sm">
                {sendResult.sms && sendResult.sms.sent > 0 && (
                  <div>
                    <strong>SMS:</strong> {sendResult.sms.sent} sent, {sendResult.sms.failed} failed
                  </div>
                )}
                {sendResult.email && sendResult.email.sent > 0 && (
                  <div>
                    <strong>Email:</strong> {sendResult.email.sent} sent, {sendResult.email.failed} failed
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Bulk Message</CardTitle>
          <CardDescription>
            Send messages to multiple recipients at once. Messages are sent in batches with automatic retry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Type */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Only
                  </div>
                </SelectItem>
                <SelectItem value="SMS">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS Only
                  </div>
                </SelectItem>
                <SelectItem value="BOTH">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <MessageSquare className="h-4 w-4" />
                    Both (Email + SMS)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Use Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Template</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject (for email) */}
          {(messageType === "EMAIL" || messageType === "BOTH") && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
          )}

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message..."
              rows={8}
            />
            <p className="text-sm text-muted-foreground">
              Use template variables like {"{{"} studentName {"}}"}, {"{{"} className {"}}"}, etc.
            </p>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-4">
            <Label>Select Recipients</Label>
            
            <Tabs value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ALL_PARENTS">All Parents</TabsTrigger>
                <TabsTrigger value="ALL_TEACHERS">All Teachers</TabsTrigger>
                <TabsTrigger value="ALL_STUDENTS">All Students</TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-2 mt-2">
                <TabsTrigger value="CLASS">By Class</TabsTrigger>
                <TabsTrigger value="ROLE">By Role</TabsTrigger>
              </TabsList>

              <TabsContent value="ALL_PARENTS" className="space-y-2">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Message will be sent to all parents ({stats?.totalParents || 0} recipients)
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="ALL_TEACHERS" className="space-y-2">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Message will be sent to all teachers ({stats?.totalTeachers || 0} recipients)
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="ALL_STUDENTS" className="space-y-2">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Message will be sent to all students ({stats?.totalStudents || 0} recipients)
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="CLASS" className="space-y-2">
                <div className="grid gap-2">
                  {classes.map(cls => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`class-${cls.id}`}
                        checked={selectedClasses.includes(cls.id)}
                        onCheckedChange={() => toggleClass(cls.id)}
                      />
                      <Label htmlFor={`class-${cls.id}`} className="cursor-pointer">
                        {cls.name} (Grade {cls.grade})
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedClasses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedClasses.map(classId => {
                      const cls = classes.find(c => c.id === classId);
                      return cls ? (
                        <Badge key={classId} variant="secondary">
                          {cls.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ROLE" className="space-y-2">
                <div className="grid gap-2">
                  {["PARENT", "TEACHER", "STUDENT"].map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={() => toggleRole(role)}
                      />
                      <Label htmlFor={`role-${role}`} className="cursor-pointer">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoles.map(role => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handlePreviewRecipients}
              variant="outline"
              disabled={loading || sending}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Recipients
                </>
              )}
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={loading || sending || !body.trim()}
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

      {/* Recipients Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recipients Preview</DialogTitle>
            <DialogDescription>
              {recipients.length} recipient(s) will receive this message
            </DialogDescription>
          </DialogHeader>
          <div className="h-[400px] overflow-y-auto pr-4">
            <div className="space-y-2">
              {recipients.map(recipient => (
                <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{recipient.name}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      {recipient.email && <span>{recipient.email}</span>}
                      {recipient.phone && <span>{recipient.phone}</span>}
                    </div>
                  </div>
                  <Badge variant="outline">{recipient.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
