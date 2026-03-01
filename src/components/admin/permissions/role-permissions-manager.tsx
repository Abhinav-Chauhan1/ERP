"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Shield } from "lucide-react";
import {
  getRolePermissions,
  bulkAssignPermissionsToRole,
} from "@/lib/actions/permissionActions";
import toast from "react-hot-toast";

interface RolePermissionsManagerProps {
  permissions: Record<string, any[]>;
}

export function RolePermissionsManager({ permissions }: RolePermissionsManagerProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRolePermissions(selectedRole);
  }, [selectedRole]);

  const loadRolePermissions = async (role: UserRole) => {
    setLoading(true);
    try {
      const result = await getRolePermissions(role);
      if (result.success && result.data) {
        const permissionIds = new Set(result.data.map((rp: any) => rp.permissionId));
        setRolePermissions(permissionIds);
      } else {
        toast.error(result.error || "Failed to load role permissions");
      }
    } catch (error) {
      console.error("Error loading role permissions:", error);
      toast.error("Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = new Set(rolePermissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setRolePermissions(newPermissions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await bulkAssignPermissionsToRole(
        selectedRole,
        Array.from(rolePermissions)
      );
      if (result.success) {
        toast.success(result.message || "Permissions updated successfully");
      } else {
        toast.error(result.error || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-500";
      case UserRole.TEACHER:
        return "bg-blue-500";
      case UserRole.STUDENT:
        return "bg-green-500";
      case UserRole.PARENT:
        return "bg-teal-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Permissions
        </CardTitle>
        <CardDescription>
          Manage permissions for each role. Changes apply to all users with the selected role.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selector */}
        <div className="flex gap-2">
          {Object.values(UserRole).map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => setSelectedRole(role)}
              className="flex items-center gap-2"
            >
              <Badge className={getRoleBadgeColor(role)} variant="secondary">
                {role}
              </Badge>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Permissions by Category */}
            <div className="space-y-6">
              {permissions && Object.entries(permissions).map(([category, categoryPermissions]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {category.replace(/_/g, " ")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryPermissions.map((permission: any) => (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          id={`${selectedRole}-${permission.id}`}
                          checked={rolePermissions.has(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`${selectedRole}-${permission.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {permission.resource}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
