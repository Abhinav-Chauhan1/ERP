import { Student, User, ClassEnrollment } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type StudentWithUser = Student & {
  user: User;
  enrollments: (ClassEnrollment & {
    class: { name: string };
    section: { name: string };
  })[];
};

interface StudentHeaderProps {
  student: Student | any;
}

export function StudentHeader({ student }: StudentHeaderProps) {
  const currentEnrollment = student.enrollments?.[0];
  const fullName = `${student.user?.firstName || ""} ${student.user?.lastName || ""}`;
  const initials = `${(student.user?.firstName?.[0] || "").toUpperCase()}${(student.user?.lastName?.[0] || "").toUpperCase()}`;

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={student.user?.avatar || ""} alt={fullName} />
          <AvatarFallback className="bg-blue-600 text-white text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-gray-600">
            <p>Admission ID: <span className="font-medium">{student.admissionId}</span></p>
            <p className="hidden sm:block">•</p>
            <p>Class: <span className="font-medium">{currentEnrollment?.class?.name || "N/A"} {currentEnrollment?.section?.name || ""}</span></p>
            <p className="hidden sm:block">•</p>
            <p>Roll Number: <span className="font-medium">{student.rollNumber || currentEnrollment?.rollNumber || "N/A"}</span></p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 self-stretch md:self-center">
        <div className="bg-blue-50 px-3 py-2 rounded-md flex flex-col items-center">
          <span className="text-xs text-blue-600 font-medium">Academic Year</span>
          <span className="font-semibold text-sm">2024-2025</span>
        </div>
        <div className="bg-green-50 px-3 py-2 rounded-md flex flex-col items-center">
          <span className="text-xs text-green-600 font-medium">Current Term</span>
          <span className="font-semibold text-sm">Fall Term</span>
        </div>
      </div>
    </div>
  );
}
