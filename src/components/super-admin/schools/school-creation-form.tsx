"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Building2, CreditCard, Users, Check, Shield, Key } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SchoolCreationData {
  // Basic Information
  schoolName: string;
  subdomain: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  
  // Subscription & Billing
  subscriptionPlan: string;
  billingCycle: string;
  
  // Initial Configuration
  extraStudents: number;
  schoolType: string;
  
  // Authentication Configuration (new for unified auth system)
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  enableOTPForAdmins: boolean;
  authenticationMethod: 'password' | 'otp' | 'both';
  
  // Subdomain Configuration
  enableSubdomain: boolean;
}

const SCHOOL_TYPES = [
  "Primary School",
  "Secondary School",
  "High School",
  "College",
  "University",
  "Vocational Institute",
  "Other",
];

export function SchoolCreationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [formData, setFormData] = useState<SchoolCreationData>({
    schoolName: "",
    subdomain: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    subscriptionPlan: "GROWTH",
    billingCycle: "monthly",
    extraStudents: 0,
    schoolType: "",
    // Authentication defaults for unified auth system
    adminEmail: "",
    adminName: "",
    adminPassword: "",
    enableOTPForAdmins: false,
    authenticationMethod: "password",
    // Subdomain configuration
    enableSubdomain: true,
  });

  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  useEffect(() => {
    fetchAvailablePlans();
  }, []);

  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch("/api/super-admin/plans");
      if (response.ok) {
        const data = await response.json();
        const monthlyPlans = data.plans.filter((plan: any) => plan.interval === 'monthly' && plan.isActive);
        setAvailablePlans(monthlyPlans);
        if (monthlyPlans.length > 0) {
          // Set default to Growth plan or first available plan
          const growthPlan = monthlyPlans.find((plan: any) => plan.name.toLowerCase().includes('growth'));
          setFormData(prev => ({ 
            ...prev, 
            subscriptionPlan: growthPlan?.id || monthlyPlans[0]?.id 
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const handleInputChange = (field: keyof SchoolCreationData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset subdomain availability when subdomain changes
    if (field === "subdomain") {
      setSubdomainAvailable(null);
    }
    
    // Clear subdomain when disabled
    if (field === "enableSubdomain" && !value) {
      setFormData(prev => ({ ...prev, subdomain: "" }));
      setSubdomainAvailable(null);
    }
    
    // Auto-populate admin email with contact email if not set
    if (field === "contactEmail" && !formData.adminEmail) {
      setFormData(prev => ({ ...prev, adminEmail: value as string }));
    }
  };

  const checkSubdomainAvailability = async () => {
    if (!formData.subdomain || !formData.enableSubdomain) return;
    
    setCheckingSubdomain(true);
    try {
      const response = await fetch("/api/super-admin/schools/check-subdomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: formData.subdomain }),
      });

      const result = await response.json();
      setSubdomainAvailable(result.available);
      
      if (!result.available) {
        toast.error(result.message);
      }
    } catch (error) {
      setSubdomainAvailable(false);
      toast.error("Failed to check subdomain availability");
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare form data with proper subdomain handling
      const submitData = {
        ...formData,
        // Ensure subdomain is empty string when disabled, not undefined
        subdomain: formData.enableSubdomain ? formData.subdomain : "",
      };

      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create school");
      }

      toast.success("School created successfully!");
      
      // Redirect to setup wizard with school ID
      router.push(result.setupUrl);
    } catch (error: any) {
      toast.error(error.message || "Failed to create school");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = availablePlans.find(plan => plan.id === formData.subscriptionPlan);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/super-admin/schools">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schools
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create New School</h1>
          <p className="text-sm text-gray-600">Set up a new educational institution on the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Building2 className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the basic details for the new school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange("schoolName", e.target.value)}
                  placeholder="Enter school name"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableSubdomain">Enable Custom Subdomain</Label>
                  <Switch
                    id="enableSubdomain"
                    checked={formData.enableSubdomain}
                    onCheckedChange={(checked) => handleInputChange("enableSubdomain", checked)}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enable to create a custom subdomain for this school
                </p>
              </div>
            </div>

            {formData.enableSubdomain && (
              <div className="space-y-2">
                <Label htmlFor="subdomain">Custom Subdomain *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => handleInputChange("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="school-name"
                    required={formData.enableSubdomain}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={checkSubdomainAvailability}
                    disabled={!formData.subdomain || checkingSubdomain}
                  >
                    {checkingSubdomain ? "Checking..." : "Check"}
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  https://{formData.subdomain || "subdomain"}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}
                </div>
                {subdomainAvailable === true && (
                  <div className="flex items-center text-green-600 text-sm">
                    <Check className="h-4 w-4 mr-1" />
                    Subdomain available
                  </div>
                )}
                {subdomainAvailable === false && (
                  <div className="text-red-600 text-sm">
                    Subdomain not available
                  </div>
                )}
              </div>
            )}

            {!formData.enableSubdomain && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">No Custom Subdomain</p>
                    <p className="text-blue-700 mt-1">
                      This school will be accessible through the main platform without a custom subdomain. 
                      Users will access it via the main domain with school selection.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  placeholder="admin@school.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of the school..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2" />
              Subscription Plan
            </CardTitle>
            <CardDescription>
              Choose the appropriate plan for this school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.subscriptionPlan === plan.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleInputChange("subscriptionPlan", plan.id)}
                >
                  {plan.name.toLowerCase().includes('growth') && (
                    <Badge className="absolute -top-2 left-4 bg-blue-600">
                      Recommended
                    </Badge>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-medium">{plan.name}</h3>
                    <div className="text-2xl font-bold">
                      ₹{plan.amount.toLocaleString('en-IN')}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        {plan.features.maxStudents === -1 ? 'Unlimited' : plan.features.maxStudents} students
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        {plan.features.storageGB}GB storage
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        {plan.features.emailSupport ? 'Email support' : 'Basic support'}
                      </li>
                      {plan.features.pricePerExtraStudent && (
                        <li className="flex items-center text-blue-600">
                          <Check className="h-3 w-3 mr-2 text-blue-500" />
                          +₹{plan.features.pricePerExtraStudent}/extra student
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value) => handleInputChange("billingCycle", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly (2 months free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2" />
              Initial Configuration
            </CardTitle>
            <CardDescription>
              Additional settings for the school setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolType">School Type</Label>
                <Select
                  value={formData.schoolType}
                  onValueChange={(value) => handleInputChange("schoolType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extraStudents">Extra Students</Label>
                <Input
                  id="extraStudents"
                  type="number"
                  min="0"
                  value={formData.extraStudents}
                  onChange={(e) => handleInputChange("extraStudents", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">
                  Additional students beyond the plan limit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="h-5 w-5 mr-2" />
              Authentication Configuration
            </CardTitle>
            <CardDescription>
              Set up the unified authentication system for this school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">School Admin Name *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange("adminName", e.target.value)}
                  placeholder="Enter admin full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">School Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                  placeholder="admin@school.com"
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be the primary admin account for the school
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Initial Admin Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                placeholder="Enter secure password (min 8 characters)"
                minLength={8}
              />
              <p className="text-xs text-gray-500">
                Leave empty to require password setup during onboarding
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authenticationMethod">Authentication Method</Label>
                <Select
                  value={formData.authenticationMethod}
                  onValueChange={(value: 'password' | 'otp' | 'both') => handleInputChange("authenticationMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Password Only</SelectItem>
                    <SelectItem value="otp">OTP Only</SelectItem>
                    <SelectItem value="both">Password + Optional OTP</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  How school admins will authenticate (students/parents always use OTP)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableOTPForAdmins"
                  checked={formData.enableOTPForAdmins}
                  onCheckedChange={(checked) => handleInputChange("enableOTPForAdmins", checked)}
                />
                <Label htmlFor="enableOTPForAdmins" className="text-sm">
                  Enable OTP for Admin Login
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Require OTP verification for enhanced admin security
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Key className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Unified Authentication System</p>
                  <p className="text-blue-700 mt-1">
                    This school will use the new unified authentication system with role-based access control, 
                    multi-school support, and comprehensive audit logging.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>School Name:</span>
                  <span className="font-medium">{formData.schoolName || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subdomain:</span>
                  <span className="font-medium">
                    {formData.enableSubdomain 
                      ? (formData.subdomain ? `${formData.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}` : "Not specified")
                      : "No custom subdomain (Main platform access)"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin User:</span>
                  <span className="font-medium">{formData.adminName || "Not specified"} ({formData.adminEmail || "No email"})</span>
                </div>
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <span className="font-medium">
                    {formData.authenticationMethod === 'password' ? 'Password' : 
                     formData.authenticationMethod === 'otp' ? 'OTP Only' : 'Password + OTP'}
                    {formData.enableOTPForAdmins ? ' (Enhanced Security)' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span className="font-medium">
                    ₹{selectedPlan?.amount?.toLocaleString('en-IN') || 0}/{formData.billingCycle === "yearly" ? "month (billed yearly)" : "month"}
                  </span>
                </div>
                {formData.extraStudents > 0 && selectedPlan.features?.pricePerExtraStudent && (
                  <div className="flex justify-between">
                    <span>Extra Students ({formData.extraStudents}):</span>
                    <span className="font-medium">
                      ₹{(formData.extraStudents * selectedPlan.features.pricePerExtraStudent).toLocaleString('en-IN')}/month
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>
                    ₹{(() => {
                      const basePrice = selectedPlan?.amount || 0;
                      const extraStudentsCost = formData.extraStudents > 0 && selectedPlan.features?.pricePerExtraStudent 
                        ? formData.extraStudents * selectedPlan.features.pricePerExtraStudent 
                        : 0;
                      const totalMonthly = basePrice + extraStudentsCost;
                      const total = formData.billingCycle === "yearly" ? totalMonthly * 10 : totalMonthly;
                      return total.toLocaleString('en-IN');
                    })()}
                    /{formData.billingCycle === "yearly" ? "year" : "month"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/super-admin/schools">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.schoolName || (formData.enableSubdomain && !formData.subdomain) || !formData.contactEmail || !formData.adminName || !formData.adminEmail}
          >
            {isLoading ? "Creating..." : "Create School & Launch Setup"}
          </Button>
        </div>
      </form>
    </div>
  );
}