"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, User, AlertCircle } from "lucide-react";
import { updateAccountSettings } from "@/lib/actions/student-settings-actions";
import { toast } from "react-hot-toast";

interface AccountSettingsProps {
  student: any;
  settings: any;
}

export function AccountSettings({ student, settings }: AccountSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: student.user.email || "",
    phone: student.phone || "",
    emergencyContact: student.emergencyContact || "",
    emergencyPhone: student.emergencyPhone || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateAccountSettings({
        studentId: student.id,
        ...formData
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={student.user.firstName || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Contact admin to change</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={student.user.lastName || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Contact admin to change</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-4">Emergency Contact</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      className="pl-10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Account Information
          </CardTitle>
          <CardDescription>
            View your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-gray-500">Student ID</span>
            <span className="text-sm font-medium">{student.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-gray-500">Date of Birth</span>
            <span className="text-sm font-medium">
              {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "Not set"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-gray-500">Gender</span>
            <span className="text-sm font-medium">{student.gender || "Not set"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Account Created</span>
            <span className="text-sm font-medium">
              {new Date(student.user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
