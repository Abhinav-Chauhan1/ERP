"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  IndianRupee,
  Users,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  razorpayPlanId: string | null;
  amount: number;
  currency: string;
  interval: string;
  features: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    subscriptions: number;
  };
}

interface PlanFormData {
  name: string;
  description: string;
  amount: number;
  interval: string;
  features: {
    maxStudents: number;
    maxTeachers: number;
    maxAdmins: number;
    storageGB: number;
    whatsappMessages: number;
    smsMessages: number;
    pricePerExtraStudent: number;
    emailSupport: boolean;
    phoneSupport: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    advancedReports: boolean;
    multipleSchools: boolean;
    backupFrequency: string;
  };
  isActive: boolean;
}

const defaultFormData: PlanFormData = {
  name: "",
  description: "",
  amount: 0,
  interval: "monthly",
  features: {
    maxStudents: 100,
    maxTeachers: 10,
    maxAdmins: 2,
    storageGB: 5,
    whatsappMessages: 1000,
    smsMessages: 500,
    pricePerExtraStudent: 50,
    emailSupport: true,
    phoneSupport: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
    advancedReports: false,
    multipleSchools: false,
    backupFrequency: "weekly",
  },
  isActive: true,
};

export function SubscriptionPlansManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Ensure form data is properly initialized
  useEffect(() => {
    if (!isDialogOpen && !editingPlan) {
      setFormData(defaultFormData);
    }
  }, [isDialogOpen, editingPlan]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/super-admin/plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        toast.error("Failed to fetch plans");
      }
    } catch (error) {
      toast.error("Failed to fetch plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormData({ ...defaultFormData });
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || "",
      description: plan.description || "",
      amount: plan.amount || 0,
      interval: plan.interval || "monthly",
      features: {
        maxStudents: plan.features?.maxStudents || 0,
        maxTeachers: plan.features?.maxTeachers || 0,
        maxAdmins: plan.features?.maxAdmins || 0,
        storageGB: plan.features?.storageGB || 0,
        whatsappMessages: plan.features?.whatsappMessages || 0,
        smsMessages: plan.features?.smsMessages || 0,
        pricePerExtraStudent: plan.features?.pricePerExtraStudent || 0,
        emailSupport: plan.features?.emailSupport || false,
        phoneSupport: plan.features?.phoneSupport || false,
        prioritySupport: plan.features?.prioritySupport || false,
        customBranding: plan.features?.customBranding || false,
        apiAccess: plan.features?.apiAccess || false,
        advancedReports: plan.features?.advancedReports || false,
        multipleSchools: plan.features?.multipleSchools || false,
        backupFrequency: plan.features?.backupFrequency || "weekly",
      },
      isActive: plan.isActive || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingPlan 
        ? `/api/super-admin/plans/${editingPlan.id}`
        : "/api/super-admin/plans";
      
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingPlan ? "Plan updated successfully" : "Plan created successfully");
        setIsDialogOpen(false);
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save plan");
      }
    } catch (error) {
      toast.error("Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/plans/${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Plan deleted successfully");
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete plan");
      }
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const handleToggleActive = async (planId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast.success(`Plan ${isActive ? "activated" : "deactivated"} successfully`);
        fetchPlans();
      } else {
        toast.error("Failed to update plan status");
      }
    } catch (error) {
      toast.error("Failed to update plan status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const updateFormData = (field: string, value: any) => {
    if (field.startsWith('features.')) {
      const featureKey = field.replace('features.', '');
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureKey]: value ?? (typeof prev.features[featureKey as keyof typeof prev.features] === 'boolean' ? false : 0),
        },
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value ?? (field === 'name' || field === 'description' || field === 'interval' ? '' : 0)
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          <p className="text-sm text-gray-600">
            Manage pricing plans and features for schools
          </p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Plans ({plans.length})</CardTitle>
          <CardDescription>
            Manage subscription plans and their features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading plans...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscriptions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-500">{plan.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {formatCurrency(plan.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.interval}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Students: {plan.features?.maxStudents === -1 ? 'Unlimited' : plan.features?.maxStudents || 0}</div>
                        <div>Teachers: {plan.features?.maxTeachers === -1 ? 'Unlimited' : plan.features?.maxTeachers || 0}</div>
                        <div>Storage: {plan.features?.storageGB || 0}GB</div>
                        {plan.features?.pricePerExtraStudent && (
                          <div className="text-xs text-blue-600">
                            +₹{plan.features.pricePerExtraStudent}/extra student
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Switch
                          checked={plan.isActive}
                          onCheckedChange={(checked) => handleToggleActive(plan.id, checked)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {plan._count?.subscriptions || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(plan.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update the subscription plan details" : "Create a new subscription plan for schools"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="e.g., Starter, Growth, Enterprise"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Price (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount || 0}
                      onChange={(e) => updateFormData("amount", parseInt(e.target.value) || 0)}
                      placeholder="2999"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interval">Billing Interval *</Label>
                    <Select
                      value={formData.interval || "monthly"}
                      onValueChange={(value) => updateFormData("interval", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive || false}
                        onCheckedChange={(checked) => updateFormData("isActive", checked)}
                      />
                      <Label htmlFor="isActive">
                        {formData.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Brief description of the plan..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">Max Students</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      value={formData.features.maxStudents || 0}
                      onChange={(e) => updateFormData("features.maxStudents", parseInt(e.target.value) || 0)}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTeachers">Max Teachers</Label>
                    <Input
                      id="maxTeachers"
                      type="number"
                      value={formData.features.maxTeachers || 0}
                      onChange={(e) => updateFormData("features.maxTeachers", parseInt(e.target.value) || 0)}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAdmins">Max Admins</Label>
                    <Input
                      id="maxAdmins"
                      type="number"
                      value={formData.features.maxAdmins || 0}
                      onChange={(e) => updateFormData("features.maxAdmins", parseInt(e.target.value) || 0)}
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storageGB">Storage (GB)</Label>
                    <Input
                      id="storageGB"
                      type="number"
                      value={formData.features.storageGB || 0}
                      onChange={(e) => updateFormData("features.storageGB", parseInt(e.target.value) || 0)}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappMessages">WhatsApp Messages/Month</Label>
                    <Input
                      id="whatsappMessages"
                      type="number"
                      value={formData.features.whatsappMessages || 0}
                      onChange={(e) => updateFormData("features.whatsappMessages", parseInt(e.target.value) || 0)}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smsMessages">SMS Messages/Month</Label>
                    <Input
                      id="smsMessages"
                      type="number"
                      value={formData.features.smsMessages || 0}
                      onChange={(e) => updateFormData("features.smsMessages", parseInt(e.target.value) || 0)}
                      placeholder="500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerExtraStudent">Price Per Extra Student (₹/month)</Label>
                  <Input
                    id="pricePerExtraStudent"
                    type="number"
                    value={formData.features.pricePerExtraStudent || 0}
                    onChange={(e) => updateFormData("features.pricePerExtraStudent", parseInt(e.target.value) || 0)}
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-500">
                    Additional cost per student beyond the plan's included limit
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Email Support</Label>
                      <p className="text-sm text-gray-500">Basic email support</p>
                    </div>
                    <Switch
                      checked={formData.features.emailSupport || false}
                      onCheckedChange={(checked) => updateFormData("features.emailSupport", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Phone Support</Label>
                      <p className="text-sm text-gray-500">Phone support during business hours</p>
                    </div>
                    <Switch
                      checked={formData.features.phoneSupport || false}
                      onCheckedChange={(checked) => updateFormData("features.phoneSupport", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Priority Support</Label>
                      <p className="text-sm text-gray-500">24/7 priority support</p>
                    </div>
                    <Switch
                      checked={formData.features.prioritySupport || false}
                      onCheckedChange={(checked) => updateFormData("features.prioritySupport", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Custom Branding</Label>
                      <p className="text-sm text-gray-500">Custom logo and colors</p>
                    </div>
                    <Switch
                      checked={formData.features.customBranding || false}
                      onCheckedChange={(checked) => updateFormData("features.customBranding", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>API Access</Label>
                      <p className="text-sm text-gray-500">REST API access</p>
                    </div>
                    <Switch
                      checked={formData.features.apiAccess || false}
                      onCheckedChange={(checked) => updateFormData("features.apiAccess", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label>Advanced Reports</Label>
                      <p className="text-sm text-gray-500">Advanced analytics and reports</p>
                    </div>
                    <Switch
                      checked={formData.features.advancedReports || false}
                      onCheckedChange={(checked) => updateFormData("features.advancedReports", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={formData.features.backupFrequency || "weekly"}
                    onValueChange={(value) => updateFormData("features.backupFrequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (editingPlan ? "Update Plan" : "Create Plan")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}