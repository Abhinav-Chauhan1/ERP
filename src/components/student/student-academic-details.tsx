import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StudentAcademicDetailsProps {
  student: any;
}

export function StudentAcademicDetails({ student }: StudentAcademicDetailsProps) {
  const currentEnrollment = student.enrollments?.[0];
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl">Current Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          {currentEnrollment ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-accent p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Class</p>
                <p className="text-lg font-bold">{currentEnrollment.class.name}</p>
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Section</p>
                <p className="text-lg font-bold">{currentEnrollment.section.name}</p>
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Roll Number</p>
                <p className="text-lg font-bold">{currentEnrollment.rollNumber || "Not assigned"}</p>
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Enrollment Date</p>
                <p className="text-lg font-bold">{format(new Date(currentEnrollment.enrollDate), "PPP")}</p>
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge 
                  className={
                    currentEnrollment.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : currentEnrollment.status === "GRADUATED"
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                  }
                >
                  {currentEnrollment.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="bg-accent p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Admission ID</p>
                <p className="text-lg font-bold">{student.admissionId}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No enrollment information available</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl">Academic Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent border-b">
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Academic Year</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Class</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Section</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Roll No.</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.enrollments && student.enrollments.length > 0 ? (
                    student.enrollments.map((enrollment: any) => (
                      <tr key={enrollment.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-4 align-middle">{enrollment.class.academicYear?.name || "2023-2024"}</td>
                        <td className="py-3 px-4 align-middle font-medium">{enrollment.class.name}</td>
                        <td className="py-3 px-4 align-middle">{enrollment.section.name}</td>
                        <td className="py-3 px-4 align-middle">{enrollment.rollNumber || "N/A"}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge 
                            variant="outline"
                            className={
                              enrollment.status === "ACTIVE"
                                ? "border-green-500 text-green-700"
                                : enrollment.status === "GRADUATED"
                                ? "border-blue-500 text-blue-700"
                                : "border-amber-500 text-amber-700"
                            }
                          >
                            {enrollment.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-8">
                        No academic records available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
