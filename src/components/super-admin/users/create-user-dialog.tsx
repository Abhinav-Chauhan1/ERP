"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schools: Array<{
    id: string;
    name: string;
    schoolCode: string;
    status: string;
  }>;
  onUserCreated: () => void;
}

interface UserFormData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId: string;
  isActive: boolean;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  schools,
  onUserCreated,
}: CreateUserDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    mobile: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '',
    schoolId: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeSchools = schools.filter(school => school.status === 'ACTIVE');

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email && !formData.mobile) {
      newErrors.contact = 'Either email or mobile number is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.mobile && !/^\+?[\d\s-()]+$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number format';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.schoolId) {
      newErrors.schoolId = 'School is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        onUserCreated();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(result.error || 'Failed to create user');
        if (result.details) {
          // Handle validation errors from server
          const serverErrors: Record<string, string> = {};
          result.details.forEach((error: any) => {
            serverErrors[error.path[0]] = error.message;
          });
          setErrors(serverErrors);
        }
      }
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      password: '',
      firstName: '',
      lastName: '',
      role: '',
      schoolId: '',
      isActive: true,
    });
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account and associate them with a school
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Enter the user's basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password (optional)"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>
                At least one contact method is required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="Enter mobile number"
                  />
                  {errors.mobile && (
                    <p className="text-sm text-red-600 mt-1">{errors.mobile}</p>
                  )}
                </div>
              </div>
              {errors.contact && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.contact}
                </div>
              )}
            </CardContent>
          </Card>

          {/* School Association */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">School Association</CardTitle>
              <CardDescription>
                Associate the user with a school and assign their role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school">School *</Label>
                  <Select value={formData.schoolId} onValueChange={(value) => handleInputChange('schoolId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name} ({school.schoolCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.schoolId && (
                    <p className="text-sm text-red-600 mt-1">{errors.schoolId}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="PARENT">Parent</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-600 mt-1">{errors.role}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
                />
                <Label htmlFor="isActive">User is active</Label>
              </div>
            </CardContent>
          </Card>

          {activeSchools.length === 0 && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">No Active Schools</p>
                <p className="text-sm text-yellow-700">
                  There are no active schools available. Please activate at least one school before creating users.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || activeSchools.length === 0}
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}