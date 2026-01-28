"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Users, 
  Ban, 
  AlertCircle, 
  RefreshCw,
  UserCheck,
  UserX,
  Trash2,
  School,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserDetailsDialog } from "./user-details-dialog";
import { CreateUserDialog } from "./create-user-dialog";
import { BulkActionsBar } from "./bulk-actions-bar";

interface User {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  hasPassword: boolean;
  schools: Array<{
    id: string;
    schoolId: string;
    schoolName: string;
    schoolCode: string;
    schoolStatus: string;
    role: string;
    isActive: boolean;
    joinedAt: Date;
  }>;
  totalSchools: number;
}

interface UserFilters {
  search?: string;
  role?: string;
  schoolId?: string;
  status?: string;
  hasMultipleSchools?: boolean;
}

interface UserManagementDashboardProps {
  initialUsers?: User[];
  schools?: Array<{
    id: string;
    name: string;
    schoolCode: string;
    status: string;
  }>;
}

export function UserManagementDashboard({ 
  initialUsers = [], 
  schools = [] 
}: UserManagementDashboardProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [multiSchoolFilter, setMultiSchoolFilter] = useState("ALL");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 20;

  const fetchUsers = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "ALL" && { role: roleFilter }),
        ...(schoolFilter !== "ALL" && { schoolId: schoolFilter }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(multiSchoolFilter !== "ALL" && { 
          hasMultipleSchools: multiSchoolFilter === "MULTIPLE" ? "true" : "false" 
        }),
      });

      const response = await fetch(`/api/super-admin/users?${params}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setUsers(result.data.users);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        setTotalUsers(result.data.pagination.total);
      } else {
        setError(result.error || "Failed to fetch users");
        toast.error("Failed to load users");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialUsers.length === 0) {
      fetchUsers(1);
    }
  }, [searchTerm, roleFilter, schoolFilter, statusFilter, multiSchoolFilter]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'role':
        setRoleFilter(value);
        break;
      case 'school':
        setSchoolFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'multiSchool':
        setMultiSchoolFilter(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleUserSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedUsers.length === 0) {
      toast.error("Please select users first");
      return;
    }

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          action,
          data,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        setSelectedUsers([]);
        fetchUsers(currentPage);
      } else {
        toast.error(result.error || `Failed to ${action} users`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} users`);
    }
  };

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      let response;
      
      switch (action) {
        case 'activate':
        case 'deactivate':
          response = await fetch(`/api/super-admin/users/${userId}`, {
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
          response = await fetch(`/api/super-admin/users/${userId}`, {
            method: 'DELETE',
          });
          break;
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchUsers(currentPage);
      } else {
        toast.error(result.error || `Failed to ${action} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case "SUPER_ADMIN":
        return "destructive";
      case "ADMIN":
        return "default";
      case "TEACHER":
        return "secondary";
      case "STUDENT":
        return "outline";
      case "PARENT":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatLastLogin = (lastLoginAt: Date | null) => {
    if (!lastLoginAt) return "Never";
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return new Date(lastLoginAt).toLocaleDateString();
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading users: {error}</span>
        </div>
        <Button onClick={() => fetchUsers(currentPage)} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts across all schools
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or mobile..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(value) => handleFilterChange('role', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="PARENT">Parent</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={schoolFilter} onValueChange={(value) => handleFilterChange('school', value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={multiSchoolFilter} onValueChange={(value) => handleFilterChange('multiSchool', value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Users</SelectItem>
                <SelectItem value="MULTIPLE">Multi-School</SelectItem>
                <SelectItem value="SINGLE">Single School</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedUsers.length}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedUsers([])}
          schools={schools}
        />
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({totalUsers})</CardTitle>
          <CardDescription>
            Manage user accounts across all schools in your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Schools</TableHead>
                    <TableHead>Primary Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => 
                            handleUserSelect(user.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              {user.hasPassword ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                              )}
                              {user.hasPassword ? "Has password" : "No password"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {user.email}
                            </div>
                          )}
                          {user.mobile && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {user.mobile}
                            </div>
                          )}
                          {!user.email && !user.mobile && (
                            <span className="text-sm text-muted-foreground">No contact info</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.totalSchools}</span>
                          {user.totalSchools > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Multi
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {user.schools.slice(0, 2).map(school => school.schoolCode).join(", ")}
                          {user.schools.length > 2 && ` +${user.schools.length - 2} more`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.schools[0]?.role || '') as any}>
                          {user.schools[0]?.role || 'No Role'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.isActive) as any}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatLastLogin(user.lastLoginAt)}
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
                            <DropdownMenuItem
                              onClick={() => setSelectedUserForDetails(user)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isActive ? (
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'deactivate')}
                                className="text-orange-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'activate')}
                                className="text-green-600"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user.id, 'delete')}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUserForDetails}
        open={!!selectedUserForDetails}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserForDetails(null);
          }
        }}
        onUserUpdate={() => {
          fetchUsers(currentPage);
        }}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        schools={schools}
        onUserCreated={() => {
          fetchUsers(currentPage);
        }}
      />
    </div>
  );
}