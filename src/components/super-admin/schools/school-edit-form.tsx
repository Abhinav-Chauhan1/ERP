"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  AlertCircle,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Palette,
  Settings,
  CreditCard,
  Users,
  Shield,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resetSchoolData, deleteSchool } from "@/lib/actions/school-management-actions";

interface School {
  id: string;
  name: string;
  schoolCode: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  domain: string | null;
  subdomain: string | null;
  plan: 'STARTER' | 'GROWTH' | 'DOMINATE';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  isOnboarded: boolean;
  onboardingStep: number;
  tagline: string | null;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  razorpayCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SchoolEditFormProps {
  school: School;
}

export function SchoolEditForm({ school }: SchoolEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: school.name,
    schoolCode: school.schoolCode,
    email: school.email || "",
    phone: school.phone || "",
    address: school.address || "",
    domain: school.domain || "",
    subdomain: school.subdomain || "",
    plan: school.plan,
    status: school.status,
    isOnboarded: school.isOnboarded,
    tagline: school.tagline || "",
    logo: school.logo || "",
    favicon: school.favicon || "",
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    razorpayCustomerId: school.razorpayCustomerId || "",
  });

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/super-admin/schools/${school.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update school');
      }

      toast.success('School updated successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update school');
      console.error('Error updating school:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/super-admin/schools/${school.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update school status');
      }

      setFormData(prev => ({ ...prev, status: newStatus }));
      toast.success(`School status updated to ${newStatus}`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to update school status');
      console.error('Error updating school status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSchool = async () => {
    if (confirmationInput !== "RESET") {
      toast.error("Please type 'RESET' to confirm.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await resetSchoolData(school.id);
      if (result.success) {
        toast.success(result.message);
        setShowResetDialog(false);
        setConfirmationInput("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (confirmationInput !== school.name) {
      toast.error("Please type the school name to confirm.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await deleteSchool(school.id);
      if (result.success) {
        toast.success(result.message);
        setShowDeleteDialog(false);
        router.push("/super-admin/schools");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Core school details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">School Code *</Label>
                  <Input
                    id="schoolCode"
                    value={formData.schoolCode}
                    onChange={(e) => handleInputChange('schoolCode', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="School motto or tagline"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">School Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Control school access and functionality
                    </p>
                  </div>
                  <Badge variant={
                    formData.status === 'ACTIVE' ? 'default' :
                      formData.status === 'SUSPENDED' ? 'destructive' : 'secondary'
                  }>
                    {formData.status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.status === 'ACTIVE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={isLoading}
                  >
                    Activate
                  </Button>
                  <Button
                    type="button"
                    variant={formData.status === 'SUSPENDED' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('SUSPENDED')}
                    disabled={isLoading}
                  >
                    Suspend
                  </Button>
                  <Button
                    type="button"
                    variant={formData.status === 'INACTIVE' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('INACTIVE')}
                    disabled={isLoading}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Onboarding Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark school as fully onboarded
                  </p>
                </div>
                <Switch
                  checked={formData.isOnboarded}
                  onCheckedChange={(checked) => handleInputChange('isOnboarded', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                School contact details and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="school@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Complete school address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="school.edu.in"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange('subdomain', e.target.value)}
                    placeholder="myschool"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding & Appearance
              </CardTitle>
              <CardDescription>
                Customize school branding and visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon URL</Label>
                  <Input
                    id="favicon"
                    value={formData.favicon}
                    onChange={(e) => handleInputChange('favicon', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      placeholder="#14b8a6"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="flex items-center gap-4">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: formData.secondaryColor }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Color scheme preview
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration and system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      System Information
                    </p>
                    <div className="text-yellow-700 dark:text-yellow-200 mt-2 space-y-1">
                      <p>School ID: {school.id}</p>
                      <p>Created: {school.createdAt.toLocaleString()}</p>
                      <p>Last Updated: {school.updatedAt.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Danger Zone
                    </p>
                    <p className="text-red-700 dark:text-red-200 mt-1">
                      Permanent actions that cannot be undone. Use with extreme caution.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setConfirmationInput("");
                          setShowResetDialog(true);
                        }}
                      >
                        Reset School Data
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setConfirmationInput("");
                          setShowDeleteDialog(true);
                        }}
                      >
                        Delete School
                      </Button>
                    </div>

                    {/* Reset Dialog */}
                    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                              <p>
                                This action will <strong>PERMANENTLY DELETE</strong> all operational data
                                including students, teachers, classes, and financial records.
                              </p>
                              <p className="font-medium text-red-600">
                                Only the School Record and Administrators will be preserved.
                              </p>
                              <div className="space-y-1">
                                <Label className="text-xs">Type "RESET" to confirm</Label>
                                <Input
                                  value={confirmationInput}
                                  onChange={(e) => setConfirmationInput(e.target.value)}
                                  placeholder="RESET"
                                  className="border-red-200 focus-visible:ring-red-500"
                                />
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            disabled={isProcessing || confirmationInput !== "RESET"}
                            onClick={(e) => {
                              e.preventDefault();
                              handleResetSchool();
                            }}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                              </>
                            ) : (
                              "Reset Data"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete Dialog */}
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                              <p>
                                This action will <strong>PERMANENTLY DELETE</strong> the school
                                and <strong>ALL</strong> associated data including administrators.
                              </p>
                              <p className="font-medium text-red-600">
                                This action cannot be undone.
                              </p>
                              <div className="space-y-1">
                                <Label className="text-xs">Type <strong>{school.name}</strong> to confirm</Label>
                                <Input
                                  value={confirmationInput}
                                  onChange={(e) => setConfirmationInput(e.target.value)}
                                  placeholder={school.name}
                                  className="border-red-200 focus-visible:ring-red-500"
                                />
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            disabled={isProcessing || confirmationInput !== school.name}
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteSchool();
                            }}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete School"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}