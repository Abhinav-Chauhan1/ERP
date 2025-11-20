import { User } from "@prisma/client";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentHeaderProps {
  student: any;
}

export function StudentHeader({ student }: StudentHeaderProps) {
  // Get current enrollment
  const currentEnrollment = student.enrollments[0];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={student.user?.avatar || ""} alt={student.user?.firstName} />
            <AvatarFallback className="text-lg">
              {student.user?.firstName?.charAt(0)}{student.user?.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">
              {student.user?.firstName} {student.user?.lastName}
            </h2>
            
            <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium">ID:</span> 
                <span>{student.admissionId}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Class:</span> 
                <span>{currentEnrollment?.class?.name} {currentEnrollment?.section?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Roll No:</span>
                <span>{currentEnrollment?.rollNumber || student.rollNumber}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Admission:</span> 
                <span>{format(new Date(student.admissionDate), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
