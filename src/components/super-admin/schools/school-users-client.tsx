'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ParentDetailsDialog } from "@/components/super-admin/schools/parent-details-dialog";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Edit,
  Trash,
  Shield,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SchoolUsersClientProps {
  school: {
    id: string;
    name: string;
    schoolCode: string;
    status: string;
    teachers: Array<{
      id: string;
      employeeId: string;
      createdAt: Date;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        isActive: boolean;
      };
    }>;
    students: Array<{
      id: string;
      rollNumber?: string | null;
      createdAt: Date;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        isActive: boolean;
      };
      enrollments: Array<{
        class: {
          name: string;
        };
      }>;
    }>;
    administrators: Array<{
      id: string;
      createdAt: Date;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        isActive: boolean;
      };
    }>;
    parents: Array<{
      id: string;
      occupation?: string | null;
      relation?: string | null;
      alternatePhone?: string | null;
      createdAt: Date;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        isActive: boolean;
      };
      children: Array<{
        student: {
          id: string;
          user: {
            firstName: string;
            lastName: string;
            name?: string | null;
          };
          enrollments: Array<{
            class: {
              name: string;
            };
          }>;
        };
      }>;
    }>;
    _count: {
      teachers: number;
      students: number;
      administrators: number;
      parents: number;
    };
  };
}

export function SchoolUsersClient({ school }: SchoolUsersClientProps) {
  const [selectedParent, setSelectedParent] = useState<typeof school.parents[0] | null>(null);
  const [parentDialogOpen, setParentDialogOpen] = useState(false);

  const handleParentClick = (parent: typeof school.parents[0]) => {
    setSelectedParent(parent);
    setParentDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/super-admin/schools/${school.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">{school.name} • {school.schoolCode}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={school.status === "ACTIVE" ? "default" : "destructive"}>
            {school.status}
          </Badge>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.students}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.teachers}</p>
                <p className="text-xs text-muted-foreground">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.administrators}</p>
                <p className="text-xs text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{school._count.parents}</p>
                <p className="text-xs text-muted-foreground">Parents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="administrators" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Administrators
          </TabsTrigger>
          <TabsTrigger value="parents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Parents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students ({school._count.students})
                  </CardTitle>
                  <CardDescription>
                    Manage student accounts and information
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search students..." className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-primary-foreground">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {school.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.user.name || `${student.user.firstName} ${student.user.lastName}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {student.user.email || "No email"}
                        </div>
                      </TableCell>
                      <TableCell>{student.enrollments[0]?.class?.name || "No class"}</TableCell>
                      <TableCell>
                        <Badge variant={student.user.isActive ? "default" : "secondary"}>
                          {student.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(student.id)}
                            >
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {school.students.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Teachers ({school._count.teachers})
                  </CardTitle>
                  <CardDescription>
                    Manage teacher accounts and information
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search teachers..." className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-primary-foreground">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Teacher
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {school.teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.user.name || `${teacher.user.firstName} ${teacher.user.lastName}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {teacher.user.email || "No email"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {teacher.user.phone || "No phone"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.user.isActive ? "default" : "secondary"}>
                          {teacher.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{teacher.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(teacher.id)}
                            >
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Teacher
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Teacher
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {school.teachers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No teachers found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="administrators" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Administrators ({school._count.administrators})
                  </CardTitle>
                  <CardDescription>
                    Manage administrator accounts and permissions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search administrators..." className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-primary-foreground">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Administrator
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {school.administrators.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.user.name || `${admin.user.firstName} ${admin.user.lastName}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {admin.user.email || "No email"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {admin.user.phone || "No phone"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.user.isActive ? "default" : "secondary"}>
                          {admin.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{admin.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(admin.id)}
                            >
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Administrator
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Administrator
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {school.administrators.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No administrators found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Parents ({school._count.parents})
                  </CardTitle>
                  <CardDescription>
                    Manage parent accounts and information
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search parents..." className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-primary-foreground">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Parent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Relation</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {school.parents.map((parent) => (
                    <TableRow
                      key={parent.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleParentClick(parent)}
                    >
                      <TableCell className="font-medium">
                        {parent.user.name || `${parent.user.firstName} ${parent.user.lastName}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {parent.user.email || "No email"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {parent.user.phone || parent.alternatePhone || "No phone"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {parent.relation || "Parent"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {parent.children.map((child) => (
                            <div key={child.student.id} className="text-sm">
                              <span className="font-medium">
                                {child.student.user.name || `${child.student.user.firstName} ${child.student.user.lastName}`}
                              </span>
                              {child.student.enrollments[0]?.class?.name && (
                                <span className="text-muted-foreground ml-2">
                                  ({child.student.enrollments[0].class.name})
                                </span>
                              )}
                            </div>
                          ))}
                          {parent.children.length === 0 && (
                            <span className="text-muted-foreground text-sm">No children linked</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={parent.user.isActive ? "default" : "secondary"}>
                          {parent.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{parent.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(parent.id);
                              }}
                            >
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleParentClick(parent);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Parent
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Parent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {school.parents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No parents found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ParentDetailsDialog
        parent={selectedParent}
        open={parentDialogOpen}
        onOpenChange={setParentDialogOpen}
      />
    </div>
  );
}