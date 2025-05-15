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
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Current Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          {currentEnrollment ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-gray-500">Class</p>
                <p className="text-lg font-bold">{currentEnrollment.class.name}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-gray-500">Section</p>
                <p className="text-lg font-bold">{currentEnrollment.section.name}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-gray-500">Roll Number</p>
                <p className="text-lg font-bold">{currentEnrollment.rollNumber || "Not assigned"}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-gray-500">Enrollment Date</p>
                <p className="text-lg font-bold">{format(new Date(currentEnrollment.enrollDate), "PPP")}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-gray-500">Status</p>
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
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-gray-500">Admission ID</p>
                <p className="text-lg font-bold">{student.admissionId}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No enrollment information available</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle>Academic Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-100 p-3">
              <div className="col-span-3 font-semibold">Academic Year</div>
              <div className="col-span-2 font-semibold">Class</div>
              <div className="col-span-2 font-semibold">Section</div>
              <div className="col-span-2 font-semibold">Roll No.</div>
              <div className="col-span-3 font-semibold">Status</div>
            </div>
            
            {student.enrollments && student.enrollments.length > 0 ? (
              student.enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="grid grid-cols-12 p-3 border-t">
                  <div className="col-span-3">{enrollment.class.academicYear?.name || "2023-2024"}</div>
                  <div className="col-span-2">{enrollment.class.name}</div>
                  <div className="col-span-2">{enrollment.section.name}</div>
                  <div className="col-span-2">{enrollment.rollNumber || "N/A"}</div>
                  <div className="col-span-3">
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
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 p-4">No academic records available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
