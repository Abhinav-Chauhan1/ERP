"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MessageType } from "@prisma/client";
import {
  createMessageTemplate,
  updateMessageTemplate,
  getAvailableTemplateVariables,
  renderTemplate,
} from "@/lib/actions/messageTemplateActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(MessageType),
  category: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // If type is EMAIL or BOTH, subject is required
  if ((data.type === "EMAIL" || data.type === "BOTH") && !data.subject) {
    return false;
  }
  return true;
}, {
  message: "Subject is required for email templates",
  path: ["subject"],
});

type FormValues = z.infer<typeof formSchema>;

interface MessageTemplateFormProps {
  template?: {
    id: string;
    name: string;
    description: string | null;
    type: MessageType;
    category: string | null;
    subject: string | null;
    body: string;
    variables: string[];
    isActive: boolean;
  };
}

export function MessageTemplateForm({ template }: MessageTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<any>({});
  const [selectedVariables, setSelectedVariables] = useState<string[]>(template?.variables || []);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      type: template?.type || "SMS",
      category: template?.category || "",
      subject: template?.subject || "",
      body: template?.body || "",
      isActive: template?.isActive ?? true,
    },
  });

  const watchType = form.watch("type");
  const watchBody = form.watch("body");
  const watchSubject = form.watch("subject");

  useEffect(() => {
    loadAvailableVariables();
  }, []);

  useEffect(() => {
    // Initialize preview data with sample values
    const sampleData: Record<string, string> = {};
    selectedVariables.forEach(variable => {
      sampleData[variable] = `[${variable}]`;
    });
    setPreviewData(sampleData);
  }, [selectedVariables]);

  async function loadAvailableVariables() {
    const result = await getAvailableTemplateVariables();
    if (result.success && result.data) {
      setAvailableVariables(result.data);
    }
  }

  function insertVariable(variable: string) {
    const currentBody = form.getValues("body");
    form.setValue("body", `${currentBody}{{${variable}}}`);
    
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables([...selectedVariables, variable]);
    }
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const data = {
        ...values,
        variables: selectedVariables,
      };

      const result = template
        ? await updateMessageTemplate(template.id, data)
        : await createMessageTemplate(data);

      if (result.success) {
        toast.success(template ? "Template updated successfully" : "Template created successfully");
        router.push("/admin/communication/templates");
      } else {
        toast.error(result.error || "Failed to save template");
      }
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  }

  const renderedBody = renderTemplate(watchBody || "", previewData);
  const renderedSubject = watchSubject ? renderTemplate(watchSubject, previewData) : "";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>Basic information about the template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fee Reminder" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of when to use this template"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SMS">SMS Only</SelectItem>
                          <SelectItem value="EMAIL">Email Only</SelectItem>
                          <SelectItem value="BOTH">Both SMS & Email</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fees, Attendance, Admission" {...field} />
                      </FormControl>
                      <FormDescription>
                        Helps organize templates by purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Make this template available for use
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Content</CardTitle>
                <CardDescription>
                  Use variables like {`{{studentName}}`} to personalize messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(watchType === "EMAIL" || watchType === "BOTH") && (
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Fee Payment Reminder" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Body</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your message here. Use {{variableName}} for dynamic content."
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Click on variables below to insert them
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedVariables.length > 0 && (
                  <div>
                    <FormLabel>Selected Variables</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedVariables.map((variable) => (
                        <Badge key={variable} variant="secondary">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Variables & Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Variables</CardTitle>
                <CardDescription>Click to insert into template</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="student">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="student">Student</TabsTrigger>
                    <TabsTrigger value="parent">Parent</TabsTrigger>
                    <TabsTrigger value="school">School</TabsTrigger>
                  </TabsList>
                  {Object.entries(availableVariables).map(([category, variables]: [string, any]) => (
                    <TabsContent key={category} value={category} className="space-y-2">
                      {variables.map((variable: any) => (
                        <Button
                          key={variable.name}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => insertVariable(variable.name)}
                        >
                          <span className="font-mono text-xs">{`{{${variable.name}}}`}</span>
                          <span className="ml-2 text-muted-foreground text-xs">
                            {variable.description}
                          </span>
                        </Button>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>How your message will look</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(watchType === "EMAIL" || watchType === "BOTH") && watchSubject && (
                  <div>
                    <p className="text-sm font-medium mb-2">Subject:</p>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{renderedSubject}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-2">Body:</p>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{renderedBody}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Variables are shown as [variableName]. They will be replaced with actual values when sending.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/communication/templates")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
