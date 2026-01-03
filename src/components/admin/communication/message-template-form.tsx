"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MessageType, WhatsAppTemplateStatus } from "@prisma/client";
import {
  createMessageTemplate,
  updateMessageTemplate,
  getAvailableTemplateVariables,
  renderTemplate,
} from "@/lib/actions/messageTemplateActions";
import {
  validateWhatsAppTemplate,
  convertToWhatsAppFormat,
  renderWhatsAppTemplate,
  extractWhatsAppVariables,
} from "@/lib/utils/whatsapp-template-validation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, AlertTriangle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(MessageType),
  category: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  isActive: z.boolean().default(true),
  // WhatsApp fields
  whatsappTemplateName: z.string().optional(),
  whatsappTemplateId: z.string().optional(),
  whatsappLanguage: z.string().optional(),
  whatsappStatus: z.nativeEnum(WhatsAppTemplateStatus).optional(),
  // SMS fields
  dltTemplateId: z.string().optional(),
}).refine((data) => {
  // If type is EMAIL or BOTH, subject is required
  if ((data.type === "EMAIL" || data.type === "BOTH") && !data.subject) {
    return false;
  }
  return true;
}, {
  message: "Subject is required for email templates",
  path: ["subject"],
}).refine((data) => {
  // If type is WHATSAPP, WhatsApp template name is required
  if (data.type === "WHATSAPP" && !data.whatsappTemplateName) {
    return false;
  }
  return true;
}, {
  message: "WhatsApp template name is required for WhatsApp templates",
  path: ["whatsappTemplateName"],
}).refine((data) => {
  // If type is SMS, DLT template ID is recommended
  // This is a soft validation - we'll show a warning but not block
  return true;
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
    whatsappTemplateName: string | null;
    whatsappTemplateId: string | null;
    whatsappLanguage: string | null;
    whatsappStatus: WhatsAppTemplateStatus | null;
    dltTemplateId: string | null;
  };
}

interface TemplateVariable {
  name: string;
  description: string;
}

interface TemplateVariables {
  [category: string]: TemplateVariable[];
}

export function MessageTemplateForm({ template }: MessageTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<TemplateVariables>({});
  const [selectedVariables, setSelectedVariables] = useState<string[]>(template?.variables || []);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [whatsappValidation, setWhatsappValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    variables: string[];
  } | null>(null);
  const [showWhatsAppConverter, setShowWhatsAppConverter] = useState(false);

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
      whatsappTemplateName: template?.whatsappTemplateName || "",
      whatsappTemplateId: template?.whatsappTemplateId || "",
      whatsappLanguage: template?.whatsappLanguage || "en",
      whatsappStatus: template?.whatsappStatus || undefined,
      dltTemplateId: template?.dltTemplateId || "",
    },
  });

  const watchType = form.watch("type");
  const watchBody = form.watch("body");
  const watchSubject = form.watch("subject");
  const watchWhatsAppTemplateName = form.watch("whatsappTemplateName");
  const watchWhatsAppLanguage = form.watch("whatsappLanguage");

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

  // Validate WhatsApp template when relevant fields change
  useEffect(() => {
    if (watchType === "WHATSAPP" && watchBody && watchWhatsAppTemplateName && watchWhatsAppLanguage) {
      const validation = validateWhatsAppTemplate({
        name: watchWhatsAppTemplateName,
        body: watchBody,
        language: watchWhatsAppLanguage,
      });
      setWhatsappValidation(validation);
    } else {
      setWhatsappValidation(null);
    }
  }, [watchType, watchBody, watchWhatsAppTemplateName, watchWhatsAppLanguage]);

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

  function convertTemplateToWhatsAppFormat() {
    const currentBody = form.getValues("body");
    const conversion = convertToWhatsAppFormat(currentBody, selectedVariables);

    if (conversion.success) {
      form.setValue("body", conversion.convertedTemplate);
      toast.success("Template converted to WhatsApp format");

      // Show mapping to user
      const mappingText = Object.entries(conversion.variableMapping)
        .map(([name, pos]) => `{{${name}}} → {{${pos}}}`)
        .join(', ');

      if (mappingText) {
        toast.info(`Variable mapping: ${mappingText}`);
      }
    } else {
      toast.error(conversion.error || "Failed to convert template");
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

  const renderedBody = watchType === "WHATSAPP" && watchBody
    ? renderWhatsAppTemplate(
      watchBody,
      extractWhatsAppVariables(watchBody).reduce((acc, v) => {
        acc[v.position] = `[param${v.position}]`;
        return acc;
      }, {} as Record<number, string>)
    )
    : renderTemplate(watchBody || "", previewData);
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
                          <SelectItem value="WHATSAPP">WhatsApp Only</SelectItem>
                          <SelectItem value="BOTH">Both SMS & Email</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the communication channel for this template
                      </FormDescription>
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

            {/* WhatsApp Template Fields */}
            {watchType === "WHATSAPP" && (
              <Card>
                <CardHeader>
                  <CardTitle>WhatsApp Template Settings</CardTitle>
                  <CardDescription>
                    Configure WhatsApp Business API template details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="whatsappTemplateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Template Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., attendance_alert_v1"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The template name registered in WhatsApp Business Manager (lowercase, underscores only)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Template ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Template ID from WhatsApp"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The template ID assigned by WhatsApp after approval (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                            <SelectItem value="en_US">English (US)</SelectItem>
                            <SelectItem value="en_GB">English (UK)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Language code for the WhatsApp template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approval Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending Approval</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Current approval status from WhatsApp Business API
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status Badge Display */}
                  {form.watch("whatsappStatus") && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      {form.watch("whatsappStatus") === "APPROVED" && (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            Template Approved - Ready to use
                          </span>
                        </>
                      )}
                      {form.watch("whatsappStatus") === "PENDING" && (
                        <>
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-600">
                            Awaiting WhatsApp Approval
                          </span>
                        </>
                      )}
                      {form.watch("whatsappStatus") === "REJECTED" && (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-600">
                            Template Rejected - Review and resubmit
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      WhatsApp templates must be pre-approved by WhatsApp Business API.
                      Submit your template through WhatsApp Business Manager for approval before using it.
                    </AlertDescription>
                  </Alert>

                  {/* WhatsApp Template Validation Results */}
                  {whatsappValidation && (
                    <div className="space-y-2">
                      {whatsappValidation.errors.length > 0 && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-semibold mb-1">Validation Errors:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {whatsappValidation.errors.map((error, idx) => (
                                <li key={idx} className="text-sm">{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {whatsappValidation.warnings.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-semibold mb-1">Warnings:</div>
                            <ul className="list-disc list-inside space-y-1">
                              {whatsappValidation.warnings.map((warning, idx) => (
                                <li key={idx} className="text-sm">{warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {whatsappValidation.isValid && whatsappValidation.errors.length === 0 && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Template format is valid for WhatsApp Business API
                            {whatsappValidation.variables.length > 0 && (
                              <div className="mt-1">
                                Variables detected: {whatsappValidation.variables.join(', ')}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Template Converter */}
                  {watchBody && watchBody.includes('{{') && !watchBody.match(/\{\{\d+\}\}/) && (
                    <div className="space-y-2">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your template uses named variables. WhatsApp requires numbered variables like {`{{1}}, {{2}}`}, etc.
                        </AlertDescription>
                      </Alert>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={convertTemplateToWhatsAppFormat}
                        className="w-full"
                      >
                        Convert to WhatsApp Format
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SMS/DLT Template Fields */}
            {(watchType === "SMS" || watchType === "BOTH") && (
              <Card>
                <CardHeader>
                  <CardTitle>SMS Template Settings</CardTitle>
                  <CardDescription>
                    Configure MSG91 and DLT compliance details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dltTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DLT Template ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 1207168296355812345"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Distributed Ledger Technology (DLT) template ID for SMS compliance in India
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!form.watch("dltTemplateId") && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        DLT Template ID is required for sending SMS in India.
                        Register your template with TRAI DLT platform and obtain the template ID.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
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
                  {Object.entries(availableVariables).map(([category, variables]) => (
                    <TabsContent key={category} value={category} className="space-y-2">
                      {variables.map((variable) => (
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
                <CardDescription>
                  {watchType === "WHATSAPP"
                    ? "How your WhatsApp message will look"
                    : "How your message will look"}
                </CardDescription>
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
                {watchType === "WHATSAPP" && whatsappValidation?.variables && whatsappValidation.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">WhatsApp Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {whatsappValidation.variables.map((variable, idx) => (
                        <Badge key={idx} variant="outline">
                          {variable} = [param{idx + 1}]
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {watchType === "WHATSAPP"
                    ? "Variables are shown as [param1], [param2], etc. They will be replaced with actual values when sending."
                    : "Variables are shown as [variableName]. They will be replaced with actual values when sending."}
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
