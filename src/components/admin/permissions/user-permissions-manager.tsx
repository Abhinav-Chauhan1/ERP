"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, UserCog, Plus, Trash2, Search } from "lucide-react";
import {
  getUsersForPermissionManagement,
  getUserPermissions,
  assignPermissionToUser,
  removePermissionFromUser,
} from "@/lib/actions/permissionActions";
import toast from "react-hot-toast";

interface UserPermissionsManagerProps {
  permissions: Record<string, any[]>;
}

export function UserPermissionsManager({ permissions }: UserPermissionsManagerProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsersForPermissionManagement();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        toast.error(result.error || "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      const result = await getUserPermissions(userId);
      if (result.success && result.data) {
        setUserPermissions(result.data);
      } else {
        toast.error(result.error || "Failed to load user permissions");
      }
    } catch (error) {
      console.error("Error loading user permissions:", error);
      toast.error("Failed to load user permissions");
    }
  };

  const handleAddPermission = async () => {
    if (!selectedUser || !selectedPermission) {
      toast.error("Please select a permission");
      return;
    }

    setAdding(true);
    try {
      const result = await assignPermissionToUser(
        selectedUser.id,
        selectedPermission,
        expiresAt ? new Date(expiresAt) : undefined
      );
      if (result.success) {
        toast.success(result.message || "Permission added successfully");
        setDialogOpen(false);
        setSelectedPermission("");
        setExpiresAt("");
        loadUserPermissions(selectedUser.id);
      } else {
        toast.error(result.error || "Failed to add permission");
      }
    } catch (error) {
      console.error("Error adding permission:", error);
      toast.error("Failed to add permission");
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!selectedUser) return;

    try {
      const result = await removePermissionFromUser(selectedUser.id, permissionId);
      if (result.success) {
        toast.success(result.message || "Permission removed successfully");
        loadUserPermissions(selectedUser.id);
      } else {
        toast.error(result.error || "Failed to remove permission");
      }
    } catch (error) {
      console.error("Error removing permission:", error);
      toast.error("Failed to remove permission");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allPermissions = Object.values(permissions).flat();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Users
          </CardTitle>
          <CardDescription>Select a user to manage their permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* User List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedUser?.id === user.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm opacity-80">{user.email}</div>
                  <Badge
                    variant={selectedUser?.id === user.id ? "secondary" : "outline"}
                    className="mt-1"
                  >
                    {user.role}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Permissions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Permissions</CardTitle>
              <CardDescription>
                {selectedUser
                  ? `Manage custom permissions for ${selectedUser.firstName} ${selectedUser.lastName}`
                  : "Select a user to view their custom permissions"}
              </CardDescription>
            </div>
            {selectedUser && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Permission
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Custom Permission</DialogTitle>
                    <DialogDescription>
                      Grant a custom permission to {selectedUser.firstName} {selectedUser.lastName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="permission">Permission</Label>
                      <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a permission" />
                        </SelectTrigger>
                        <SelectContent>
                          {permissions && Object.entries(permissions).map(([category, categoryPermissions]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {category.replace(/_/g, " ")}
                              </div>
                              {categoryPermissions.map((permission: any) => (
                                <SelectItem key={permission.id} value={permission.id}>
                                  {permission.name} - {permission.description}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expires">Expires At (Optional)</Label>
                      <Input
                        id="expires"
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for permanent permission
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddPermission} disabled={adding}>
                      {adding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Permission"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedUser ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a user from the list to manage their custom permissions
            </div>
          ) : userPermissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No custom permissions assigned to this user
            </div>
          ) : (
            <div className="space-y-3">
              {userPermissions.map((up: any) => (
                <div
                  key={up.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium">{up.permission.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {up.permission.description}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{up.permission.resource}</Badge>
                      <Badge variant="outline">{up.permission.action}</Badge>
                      {up.expiresAt && (
                        <Badge variant="secondary">
                          Expires: {new Date(up.expiresAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePermission(up.permissionId)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
