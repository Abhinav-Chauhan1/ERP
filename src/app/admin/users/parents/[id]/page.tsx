import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { db } from "@/lib/db";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Phone, Mail, Briefcase, Users } from "lucide-react";
import { ParentStudentAssociationDialog } from "@/components/admin/parent-student-association-dialog";
import { removeStudentFromParent } from "@/lib/actions/parent-student-actions";

// For App Router, we no longer declare params as a TypeScript type
// but let Next.js handle the parameter extraction
export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Access the id directly - Next.js handles this correctly at runtime
  const param = await params;
  const id = param.id;

  // CRITICAL: Add school isolation
  const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
  const schoolId = await getRequiredSchoolId();

  // Get parent data with children and meetings - CRITICAL: Filter by schoolId
  const parent = await db.parent.findFirst({
    where: { 
      id,
      schoolId, // CRITICAL: Ensure parent belongs to current school
    },
    select: {
      id: true,
      schoolId: true,
      occupation: true,
      alternatePhone: true,
      relation: true,
      createdAt: true,
      updatedAt: true,
      user: true,
      children: {
        include: {
          student: {
            include: {
              user: true,
              enrollments: {
                include: {
                  class: true,
                  section: true,
                },
                where: {
                  status: "ACTIVE",
                  schoolId, // CRITICAL: Filter enrollments by school
                },
                take: 1
              }
            }
          }
        }
      },
      meetings: {
        include: {
          teacher: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          scheduledDate: 'desc'
        },
        take: 3
      }
    },
  });

  if (!parent) {
    notFound();
  }

  // CRITICAL: Add school isolation - Get all students from the same school
  const unassociatedStudents = await db.student.findMany({
    where: {
      schoolId: parent.schoolId, // CRITICAL: Only students from same school
      NOT: {
        parents: {
          some: {
            parentId: id
          }
        }
      }
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      enrollments: {
        take: 1,
        orderBy: {
          enrollDate: 'desc'
        },
        include: {
          class: true
        }
      }
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/users/parents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Parents
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold tracking-tight">
          {parent.user.firstName} {parent.user.lastName}
        </h1>
        <div className="flex gap-2">
          <Link href={`/admin/users/parents/${parent.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Parent Information</CardTitle>
            <CardDescription>Contact and personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {parent.user.firstName} {parent.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{parent.user.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{parent.user.phone || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alternate Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{parent.alternatePhone || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relation</p>
                <p className="font-medium capitalize">{parent.relation?.toLowerCase() || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupation</p>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{parent.occupation || "Not specified"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={parent.user.active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                >
                  {parent.user.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Added on</p>
                <p className="font-medium">{formatDate(parent.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Children</CardTitle>
              <ParentStudentAssociationDialog
                parentId={parent.id}
                schoolId={parent.schoolId}
                students={unassociatedStudents}
              />
            </div>
          </CardHeader>
          <CardContent>
            {parent.children.length > 0 ? (
              <div className="space-y-3">
                {parent.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div className="flex items-center gap-3">
                      {child.student.user.avatar ? (
                        <OptimizedImage
                          src={child.student.user.avatar}
                          alt={`${child.student.user.firstName} ${child.student.user.lastName}`}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                          qualityPreset="medium"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          {(child.student.user.firstName || 'A')[0]}
                          {(child.student.user.lastName || 'A')[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{child.student.user.firstName || ''} {child.student.user.lastName || ''}</p>
                          {child.isPrimary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {child.student.enrollments.length > 0
                            ? `${child.student.enrollments[0].class.name} - ${child.student.enrollments[0].section.name}`
                            : "Not enrolled"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/users/students/${child.student.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <form action={removeStudentFromParent}>
                        <input type="hidden" name="parentId" value={parent.id} />
                        <input type="hidden" name="studentId" value={child.student.id} />
                        <Button variant="ghost" size="sm" className="text-red-500">Remove</Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No children associated with this parent</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
            <CardDescription>Parent-teacher meetings and conferences</CardDescription>
          </CardHeader>
          <CardContent>
            {parent.meetings.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent border-b">
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Title</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Teacher</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date & Time</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 text-left font-medium text-muted-foreground">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parent.meetings.map((meeting) => (
                        <tr key={meeting.id} className="border-b">
                          <td className="py-3 px-4 align-middle">{meeting.title}</td>
                          <td className="py-3 px-4 align-middle">{meeting.teacher.user.firstName} {meeting.teacher.user.lastName}</td>
                          <td className="py-3 px-4 align-middle">{formatDate(meeting.scheduledDate)}</td>
                          <td className="py-3 px-4 align-middle">
                            <Badge
                              className={
                                meeting.status === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  meeting.status === 'SCHEDULED' ? 'bg-primary/10 text-primary hover:bg-primary/10' :
                                    meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                      'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                              }
                            >
                              {meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 align-middle">{meeting.location || "Not specified"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground">No meetings recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
