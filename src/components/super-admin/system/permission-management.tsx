"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Users, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Key,
  Lock,
  Unlock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

// Static permission definitions (these are capability labels, not DB rows)
const STATIC_PERMISSIONS: Permission[] = [
  { id: "SUPER_ADMIN", name: "super_admin.all", description: "Full super-admin access", category: "Platform", resource: "platform", action: "all", isActive: true },
  { id: "ADMIN", name: "school.admin", description: "School admin access", category: "School Management", resource: "school", action: "manage", isActive: true },
  { id: "TEACHER", name: "school.teacher", description: "Teacher access", category: "School", resource: "school", action: "teach", isActive: true },
  { id: "STUDENT", name: "school.student", description: "Student access", category: "School", resource: "school", action: "learn", isActive: true },
  { id: "PARENT", name: "school.parent", description: "Parent access", category: "School", resource: "school", action: "view", isActive: true },
];

export function PermissionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const permissions = STATIC_PERMISSIONS;

  // Derive roles from unique role values in the real user list
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetch("/api/super-admin/users?limit=200")
      .then(r => r.ok ? r.json() : null)
      .then((res: { data?: any[] } | null) => {
        const list: any[] = res?.data ?? [];
        setUsers(list.map(u => ({
          id: u.id,
          name: u.name ?? "Unknown",
          email: u.email ?? "",
          role: u.role ?? "UNKNOWN",
          permissions: [],
          isActive: u.isActive ?? true,
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
          createdAt: new Date(u.createdAt),
        })));
        // Derive role summary from users
        const roleCounts: Record<string, number> = {};
        list.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1; });
        setRoles(Object.entries(roleCounts).map(([name, count]) => ({
          id: name,
          name,
          description: `${name} role`,
          permissions: permissions.filter(p => p.id === name).map(p => p.id),
          userCount: count,
          isSystem: ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT", "PARENT"].includes(name),
          createdAt: new Date(),
          updatedAt: new Date(),
        })));
      })
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, []);

  const getRoleName = (roleId: string) => roleId;

  const getUserPermissions = (user: User) => {
    return permissions.filter(p => p.id === user.role).map(p => p.id);
  };

  const getPermissionName = (permissionId: string) => {
    return permissions.find(p => p.id === permissionId)?.name || permissionId;
  };

  const handleCreateUser = async (userData: any) => {
    setIsLoading(true);
    try {
      await fetch("/api/super-admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userData) });
    } finally {
      setIsLoading(false);
      setShowUserDialog(false);
    }
  };

  const handleCreateRole = async (roleData: any) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setShowRoleDialog(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && user.isActive) ||
      (statusFilter === "INACTIVE" && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const permissionStats = {
    totalPermissions: permissions.length,
    activePermissions: permissions.filter(p => p.isActive).length,
    totalRoles: roles.length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
  };

  if (isFetching) return <div className="flex items-center justify-center h-48 text-muted-foreground">Loading users…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Permission Management</h2>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and access control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowRoleDialog(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Create Role
          </Button>
          <Button onClick={() => setShowUserDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Permission Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissionStats.totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              {permissionStats.activePermissions} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissionStats.totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => !r.isSystem).length} custom roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissionStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {permissionStats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Lock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96%</div>
            <p className="text-xs text-muted-foreground">
              Permission compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* User Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleName(user.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getUserPermissions(user).slice(0, 2).map(permId => (
                            <Badge key={permId} variant="secondary" className="text-xs">
                              {getPermissionName(permId)}
                            </Badge>
                          ))}
                          {getUserPermissions(user).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{getUserPermissions(user).length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          <div className="text-sm">
                            <div>{user.lastLoginAt.toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              {user.lastLoginAt.toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="h-4 w-4 mr-2" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={user.isActive ? "text-red-600" : "text-green-600"}
                            >
                              {user.isActive ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Deactivate User
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles ({roles.length})</CardTitle>
              <CardDescription>Manage user roles and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map(permId => (
                            <Badge key={permId} variant="secondary" className="text-xs">
                              {getPermissionName(permId)}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{role.userCount} users</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isSystem ? "default" : "secondary"}>
                          {role.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{role.createdAt.toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="h-4 w-4 mr-2" />
                              Manage Permissions
                            </DropdownMenuItem>
                            {!role.isSystem && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Role
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions ({permissions.length})</CardTitle>
              <CardDescription>System permissions and access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium font-mono">{permission.name}</div>
                          <div className="text-sm text-muted-foreground">{permission.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{permission.resource}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{permission.action}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={permission.isActive ? "default" : "secondary"}>
                          {permission.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Permission
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={permission.isActive ? "text-red-600" : "text-green-600"}
                            >
                              {permission.isActive ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" placeholder="Enter user name" />
            </div>
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" placeholder="Enter email address" />
            </div>
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="user-active" defaultChecked />
              <Label htmlFor="user-active">Active user</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateUser({})}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input id="role-name" placeholder="Enter role name" />
            </div>
            <div>
              <Label htmlFor="role-description">Description</Label>
              <Textarea id="role-description" placeholder="Describe the role's purpose" />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox id={`perm-${permission.id}`} />
                    <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                      <span className="font-mono">{permission.name}</span>
                      <span className="text-muted-foreground ml-2">- {permission.description}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateRole({})}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}