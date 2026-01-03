export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ArrowLeft, GraduationCap, Edit, Trash2, Power } from "lucide-react";
import { getCoScholasticActivities } from "@/lib/actions/coScholasticActions";
import { CoScholasticActivityDialog } from "@/components/admin/co-scholastic-activity-dialog";
import { DeleteCoScholasticActivityButton } from "@/components/admin/delete-co-scholastic-activity-button";
import { ToggleCoScholasticActivityButton } from "@/components/admin/toggle-co-scholastic-activity-button";

export default async function CoScholasticActivitiesPage() {
  const activitiesResult = await getCoScholasticActivities(true);
  const activities = activitiesResult.success ? activitiesResult.data : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/assessment">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Co-Scholastic Activities</h1>
          <p className="text-muted-foreground mt-1">
            Manage non-academic assessments like sports, art, music, and discipline
          </p>
        </div>
        <CoScholasticActivityDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </CoScholasticActivityDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/assessment/co-scholastic/grades">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Grade Entry
              </CardTitle>
              <CardDescription>
                Enter co-scholastic grades for students
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>
            Configure co-scholastic activities and their assessment types
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <GraduationCap className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No activities configured</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create your first co-scholastic activity to start tracking non-academic assessments.
              </p>
              <CoScholasticActivityDialog>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              </CoScholasticActivityDialog>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Activity Name</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Assessment Type</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Max Marks</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Grades Count</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity: any) => (
                      <tr key={activity.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{activity.name}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge variant={activity.assessmentType === "GRADE" ? "default" : "secondary"}>
                            {activity.assessmentType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {activity.maxMarks ? (
                            <Badge variant="outline">{activity.maxMarks}</Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge variant="outline">{activity._count?.grades || 0}</Badge>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge variant={activity.isActive ? "default" : "secondary"}>
                            {activity.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ToggleCoScholasticActivityButton
                              activityId={activity.id}
                              isActive={activity.isActive}
                            />
                            <CoScholasticActivityDialog activity={activity}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </CoScholasticActivityDialog>
                            <DeleteCoScholasticActivityButton
                              activityId={activity.id}
                              activityName={activity.name}
                              gradeCount={activity._count?.grades || 0}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
