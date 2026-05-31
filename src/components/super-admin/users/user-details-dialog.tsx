"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  School,
  Shield,
  Activity,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface UserDetailsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: () => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  onUserUpdate,
}: UserDetailsDialogProps) {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [editForm, setEditForm] = useState({
    name: "", firstName: "", lastName: "", email: "", mobile: "",
  });

  useEffect(() => {
    if (open && user) {
      fetchUserDetails();
      setIsEditing(false);
      setActiveTab("overview");
    }
  }, [open, user]);

  const fetchUserDetails = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`);
      const result = await response.json();
      
      if (result.success) {
        setUserDetails(result.data);
        setEditForm({
          name: result.data.name ?? "",
          firstName: result.data.firstName ?? "",
          lastName: result.data.lastName ?? "",
          email: result.data.email ?? "",
          mobile: result.data.mobile ?? "",
        });
      } else {
        toast.error("Failed to load user details");
      }
    } catch (error) {
      toast.error("Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name || undefined,
          firstName: editForm.firstName || undefined,
          lastName: editForm.lastName || undefined,
          email: editForm.email || undefined,
          mobile: editForm.mobile || undefined,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("User updated successfully");
        setIsEditing(false);
        fetchUserDetails();
        onUserUpdate();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserAction = async (action: string) => {
    if (!user) return;

    try {
      let response;
      
      switch (action) {
        case 'activate':
        case 'deactivate':
          response = await fetch(`/api/super-admin/users/${user.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isActive: action === 'activate',
            }),
          });
          break;
        
        case 'delete':
          response = await fetch(`/api/super-admin/users/${user.id}`, {
            method: 'DELETE',
          });
          break;
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        onUserUpdate();
        if (action === 'delete') {
          onOpenChange(false);
        } else {
          fetchUserDetails(); // Refresh details
        }
      } else {
        toast.error(result.error || `Failed to ${action} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details: {user.name}
          </DialogTitle>
          <DialogDescription>
            Comprehensive user information and management options
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : userDetails ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schools">Schools</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{userDetails.name}</span>
                    </div>
                    {userDetails.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{userDetails.email}</span>
                      </div>
                    )}
                    {userDetails.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{userDetails.mobile}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>{userDetails.hasPassword ? "Has password" : "No password set"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {new Date(userDetails.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Status & Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge variant={userDetails.isActive ? "default" : "secondary"}>
                        {userDetails.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Schools:</span>
                      <Badge variant="outline">{userDetails.totalSchools}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Login:</span>
                      <span className="text-sm text-muted-foreground">
                        {userDetails.lastLoginAt 
                          ? new Date(userDetails.lastLoginAt).toLocaleDateString()
                          : "Never"
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Updated:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(userDetails.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Role-Specific Data */}
              {userDetails.roleSpecificData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Role-Specific Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-3 rounded">
                      {JSON.stringify(userDetails.roleSpecificData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="schools" className="space-y-4">
              <div className="grid gap-4">
                {userDetails.schools.map((school: any) => (
                  <Card key={school.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <School className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{school.schoolName}</div>
                            <div className="text-sm text-muted-foreground">
                              {school.schoolCode}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{school.role}</Badge>
                          <Badge variant={school.isActive ? "default" : "secondary"}>
                            {school.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant={school.schoolStatus === 'ACTIVE' ? "default" : "destructive"}>
                            {school.schoolStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Joined: {new Date(school.joinedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetails.recentActivity && userDetails.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {userDetails.recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{activity.action}</div>
                            <div className="text-sm text-muted-foreground">
                              {activity.resource}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Edit User Information
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="Email address"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-firstname">First Name</Label>
                        <Input
                          id="edit-firstname"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-lastname">Last Name</Label>
                        <Input
                          id="edit-lastname"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-mobile">Mobile</Label>
                        <Input
                          id="edit-mobile"
                          value={editForm.mobile}
                          onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value }))}
                          placeholder="Mobile number"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveEdit} disabled={isSaving} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving…" : "Save Changes"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Management Actions</CardTitle>
                    <CardDescription>
                      Perform administrative actions on this user account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User Information
                      </Button>

                      {userDetails.isActive ? (
                        <Button
                          variant="outline"
                          className="justify-start text-orange-600 hover:text-orange-700"
                          onClick={() => handleUserAction('deactivate')}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Deactivate User
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="justify-start text-green-600 hover:text-green-700"
                          onClick={() => handleUserAction('activate')}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activate User
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => setActiveTab("schools")}
                      >
                        <School className="h-4 w-4 mr-2" />
                        Manage School Access
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start text-red-600 hover:text-red-700"
                        onClick={() => handleUserAction('delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load user details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}