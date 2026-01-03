"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Eye, EyeOff } from "lucide-react";
import {
  createReportCardTemplate,
  updateReportCardTemplate,
  type ReportCardTemplateInput,
  type TemplateSectionConfig,
  type TemplateStyles,
} from "@/lib/actions/reportCardTemplateActions";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { TemplatePreview } from "./template-preview";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["CBSE", "STATE_BOARD", "CUSTOM"]),
  pageSize: z.string().default("A4"),
  orientation: z.string().default("PORTRAIT"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateEditorFormProps {
  template?: any;
  mode: "create" | "edit";
}

const DEFAULT_SECTIONS: TemplateSectionConfig[] = [
  {
    id: "student-info",
    name: "Student Information",
    enabled: true,
    order: 1,
    fields: ["name", "rollNumber", "class", "section"],
  },
  {
    id: "academic-performance",
    name: "Academic Performance",
    enabled: true,
    order: 2,
    fields: ["subjects", "marks", "grades", "percentage"],
  },
  {
    id: "attendance",
    name: "Attendance",
    enabled: true,
    order: 3,
    fields: ["percentage", "daysPresent", "totalDays"],
  },
  {
    id: "co-scholastic",
    name: "Co-Scholastic Activities",
    enabled: false,
    order: 4,
    fields: ["activities", "grades"],
  },
  {
    id: "remarks",
    name: "Remarks",
    enabled: true,
    order: 5,
    fields: ["teacherRemarks", "principalRemarks"],
  },
];

const DEFAULT_STYLING: TemplateStyles = {
  primaryColor: "#1e40af",
  secondaryColor: "#64748b",
  fontFamily: "Arial",
  fontSize: 12,
  headerHeight: 100,
  footerHeight: 50,
};

// Color presets for quick selection
const COLOR_PRESETS = [
  { name: "Professional Blue", primary: "#1e40af", secondary: "#64748b" },
  { name: "Academic Green", primary: "#166534", secondary: "#4b5563" },
  { name: "Classic Red", primary: "#991b1b", secondary: "#6b7280" },
  { name: "Royal Purple", primary: "#6b21a8", secondary: "#71717a" },
  { name: "Ocean Teal", primary: "#0d9488", secondary: "#52525b" },
  { name: "Warm Orange", primary: "#c2410c", secondary: "#78716c" },
];

export function TemplateEditorForm({ template, mode }: TemplateEditorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<TemplateSectionConfig[]>(
    template?.sections || DEFAULT_SECTIONS
  );
  const [styling, setStyling] = useState<TemplateStyles>(
    template?.styling || DEFAULT_STYLING
  );
  const [headerImage, setHeaderImage] = useState<string | undefined>(template?.headerImage);
  const [footerImage, setFooterImage] = useState<string | undefined>(template?.footerImage);
  const [schoolLogo, setSchoolLogo] = useState<string | undefined>(template?.schoolLogo);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      type: template?.type || "CUSTOM",
      pageSize: template?.pageSize || "A4",
      orientation: template?.orientation || "PORTRAIT",
      isActive: template?.isActive ?? true,
      isDefault: template?.isDefault ?? false,
    },
  });

  const handleImageUpload = async (
    file: File,
    type: "header" | "footer" | "logo"
  ) => {
    setUploadingImage(type);
    try {
      const result = await uploadToCloudinary(file, {
        folder: "report-card-templates",
        resource_type: "image",
      });

      if (type === "header") {
        setHeaderImage(result.secure_url);
      } else if (type === "footer") {
        setFooterImage(result.secure_url);
      } else {
        setSchoolLogo(result.secure_url);
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled }
          : section
      )
    );
  };

  const onSubmit = async (values: TemplateFormValues) => {
    setIsLoading(true);
    try {
      const input: ReportCardTemplateInput = {
        ...values,
        sections,
        styling,
        headerImage,
        footerImage,
        schoolLogo,
      };

      const result =
        mode === "create"
          ? await createReportCardTemplate(input)
          : await updateReportCardTemplate(template.id, input);

      if (result.success) {
        toast({
          title: "Success",
          description: `Template ${mode === "create" ? "created" : "updated"} successfully`,
        });
        router.push("/admin/assessment/report-cards/templates");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${mode} template`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {/* Preview Toggle Button */}
      <div className="flex justify-end mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr,380px]' : ''}`}>
        {/* Form Section */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic details of the report card template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CBSE Standard Template" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the template"
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
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="STATE_BOARD">State Board</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pageSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select page size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="LETTER">Letter</SelectItem>
                          <SelectItem value="LEGAL">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orientation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select orientation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PORTRAIT">Portrait</SelectItem>
                          <SelectItem value="LANDSCAPE">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Active</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Set as Default</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Branding Assets</CardTitle>
              <CardDescription>
                Upload images for header, footer, and school logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Header Image */}
                <div className="space-y-2">
                  <Label>Header Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {headerImage ? (
                      <div className="relative h-24 w-full">
                        <Image
                          src={headerImage}
                          alt="Header"
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setHeaderImage(undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "header");
                          }}
                          disabled={uploadingImage === "header"}
                        />
                        {uploadingImage === "header" && (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Image */}
                <div className="space-y-2">
                  <Label>Footer Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {footerImage ? (
                      <div className="relative h-24 w-full">
                        <Image
                          src={footerImage}
                          alt="Footer"
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setFooterImage(undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "footer");
                          }}
                          disabled={uploadingImage === "footer"}
                        />
                        {uploadingImage === "footer" && (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* School Logo */}
                <div className="space-y-2">
                  <Label>School Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {schoolLogo ? (
                      <div className="relative h-24 w-full">
                        <Image
                          src={schoolLogo}
                          alt="Logo"
                          fill
                          className="object-contain rounded"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setSchoolLogo(undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "logo");
                          }}
                          disabled={uploadingImage === "logo"}
                        />
                        {uploadingImage === "logo" && (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Section Configuration</CardTitle>
              <CardDescription>
                Enable or disable sections to include in the report card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all ${section.enabled
                      ? 'border-primary/50 bg-primary/5'
                      : 'opacity-60 border-muted'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={section.enabled}
                        onCheckedChange={() => handleSectionToggle(section.id)}
                      />
                      <div>
                        <Label className={`font-medium ${section.enabled ? '' : 'text-muted-foreground'}`}>
                          {section.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {section.fields.join(", ")}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${section.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                      {section.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Styling Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Styling Configuration</CardTitle>
              <CardDescription>
                Customize colors, fonts, and spacing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Presets */}
              <div className="space-y-2">
                <Label>Quick Color Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-2"
                      onClick={() =>
                        setStyling({
                          ...styling,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                        })
                      }
                    >
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />

              {/* Advanced Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">General Colors</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.primaryColor} onChange={(e) => setStyling({ ...styling, primaryColor: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.primaryColor} onChange={(e) => setStyling({ ...styling, primaryColor: e.target.value })} className="h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.secondaryColor} onChange={(e) => setStyling({ ...styling, secondaryColor: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.secondaryColor} onChange={(e) => setStyling({ ...styling, secondaryColor: e.target.value })} className="h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.textColor || '#000000'} onChange={(e) => setStyling({ ...styling, textColor: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.textColor || '#000000'} onChange={(e) => setStyling({ ...styling, textColor: e.target.value })} className="h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Section Title Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.sectionTitleColor || styling.primaryColor} onChange={(e) => setStyling({ ...styling, sectionTitleColor: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.sectionTitleColor || styling.primaryColor} onChange={(e) => setStyling({ ...styling, sectionTitleColor: e.target.value })} className="h-8" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Table Styling</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Header Background</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.tableHeaderBg || styling.primaryColor} onChange={(e) => setStyling({ ...styling, tableHeaderBg: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.tableHeaderBg || styling.primaryColor} onChange={(e) => setStyling({ ...styling, tableHeaderBg: e.target.value })} className="h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Header Text</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.tableHeaderText || '#FFFFFF'} onChange={(e) => setStyling({ ...styling, tableHeaderText: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.tableHeaderText || '#FFFFFF'} onChange={(e) => setStyling({ ...styling, tableHeaderText: e.target.value })} className="h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Border Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.tableBorderColor || '#e2e8f0'} onChange={(e) => setStyling({ ...styling, tableBorderColor: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.tableBorderColor || '#e2e8f0'} onChange={(e) => setStyling({ ...styling, tableBorderColor: e.target.value })} className="h-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Alt. Row Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={styling.alternateRowColor || '#f8fafc'} onChange={(e) => setStyling({ ...styling, alternateRowColor: e.target.value })} className="w-12 h-8 p-1" />
                        <Input value={styling.alternateRowColor || '#f8fafc'} onChange={(e) => setStyling({ ...styling, alternateRowColor: e.target.value })} className="h-8" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Layout Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Style</Label>
                  <Select
                    value={styling.headerStyle || 'classic'}
                    onValueChange={(value: any) =>
                      setStyling({ ...styling, headerStyle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic (Centered)</SelectItem>
                      <SelectItem value="modern">Modern (Colored Bar)</SelectItem>
                      <SelectItem value="minimal">Minimal (Clean)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Student Info Style</Label>
                  <Select
                    value={styling.studentInfoStyle || 'list'}
                    onValueChange={(value: any) =>
                      setStyling({ ...styling, studentInfoStyle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">Simple List</SelectItem>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                      <SelectItem value="boxed">Boxed Container</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Typography & Spacing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={styling.fontFamily}
                    onValueChange={(value) =>
                      setStyling({ ...styling, fontFamily: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Courier">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size (px)</Label>
                  <Input
                    type="number"
                    value={styling.fontSize}
                    onChange={(e) =>
                      setStyling({ ...styling, fontSize: parseInt(e.target.value) })
                    }
                    min={8}
                    max={24}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Height (px)</Label>
                  <Input
                    type="number"
                    value={styling.headerHeight}
                    onChange={(e) =>
                      setStyling({ ...styling, headerHeight: parseInt(e.target.value) })
                    }
                    min={50}
                    max={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Footer Height (px)</Label>
                  <Input
                    type="number"
                    value={styling.footerHeight}
                    onChange={(e) =>
                      setStyling({ ...styling, footerHeight: parseInt(e.target.value) })
                    }
                    min={30}
                    max={150}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Template" : "Update Template"}
            </Button>
          </div>
        </form>

        {/* Preview Panel */}
        {showPreview && (
          <div className="hidden lg:block">
            <TemplatePreview
              name={form.watch("name")}
              type={form.watch("type")}
              pageSize={form.watch("pageSize")}
              orientation={form.watch("orientation")}
              sections={sections}
              styling={styling}
              headerImage={headerImage}
              footerImage={footerImage}
              schoolLogo={schoolLogo}
            />
          </div>
        )}
      </div>
    </Form>
  );
}
